import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI } from '@google/genai';
import { AgentTurn, TodoItem } from '@shared/types';
import { AgentService, CAPPED_OUT_MESSAGE } from './agent.service';
import { AgentToolsService } from './agent-tools.service';

const makeTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'todo-1',
  name: 'Buy milk',
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  ...overrides,
});

const textResponse = (text: string) => ({
  candidates: [{ content: { role: 'model', parts: [{ text }] } }],
  text,
});

const functionCallResponse = (
  name: string,
  args: Record<string, unknown>,
  thoughtSignature = 'sig-abc'
) => ({
  candidates: [
    {
      content: {
        role: 'model',
        parts: [
          { functionCall: { id: 'call-1', name, args }, thoughtSignature },
        ],
      },
    },
  ],
  functionCalls: [{ id: 'call-1', name, args }],
});

const textAndFunctionCallResponse = (
  leadingText: string,
  name: string,
  args: Record<string, unknown>,
  thoughtSignature = 'sig-abc'
) => ({
  candidates: [
    {
      content: {
        role: 'model',
        parts: [
          { text: leadingText },
          { functionCall: { id: 'call-1', name, args }, thoughtSignature },
        ],
      },
    },
  ],
  functionCalls: [{ id: 'call-1', name, args }],
});

const turns: AgentTurn[] = [
  { role: 'user', text: 'complete buy milk', at: new Date().toISOString() },
];

const asAsyncIterable = <T>(items: T[]) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const item of items) yield item;
  },
});

const textChunk = (text: string) => ({
  candidates: [{ content: { role: 'model', parts: [{ text }] } }],
  text,
});

const functionCallChunk = (
  name: string,
  args: Record<string, unknown>,
  thoughtSignature = 'sig-abc'
) => ({
  candidates: [
    {
      content: {
        role: 'model',
        parts: [
          { functionCall: { id: 'call-1', name, args }, thoughtSignature },
        ],
      },
    },
  ],
  text: undefined,
});

const textAndFunctionCallChunk = (
  leadingText: string,
  name: string,
  args: Record<string, unknown>,
  thoughtSignature = 'sig-abc'
) => ({
  candidates: [
    {
      content: {
        role: 'model',
        parts: [
          { text: leadingText },
          { functionCall: { id: 'call-1', name, args }, thoughtSignature },
        ],
      },
    },
  ],
  text: leadingText,
});

const collect = async <T>(gen: AsyncGenerator<T>): Promise<T[]> => {
  const events: T[] = [];
  for await (const event of gen) events.push(event);
  return events;
};

describe('AgentService', () => {
  let generateContent: jest.Mock;
  let generateContentStream: jest.Mock;
  let client: jest.Mocked<GoogleGenAI>;
  let agentToolsService: jest.Mocked<AgentToolsService>;
  let service: AgentService;

  beforeEach(() => {
    generateContent = jest.fn();
    generateContentStream = jest.fn();
    client = {
      models: { generateContent, generateContentStream },
    } as unknown as jest.Mocked<GoogleGenAI>;
    agentToolsService = {
      createTasks: jest.fn(),
      updateTask: jest.fn(),
      completeTask: jest.fn(),
      deleteTask: jest.fn(),
      listTasks: jest.fn(),
    } as unknown as jest.Mocked<AgentToolsService>;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'GEMINI_RETRY_BASE_MS') return 1;
        if (key === 'GEMINI_TIMEOUT_MS') return 50;
        return undefined;
      }),
    } as unknown as ConfigService;
    service = new AgentService(client, agentToolsService, configService);
  });

  const context = { today: '2026-09-10', timezone: 'UTC' };

  it('returns text directly when the model makes no tool calls', async () => {
    generateContent.mockResolvedValue(textResponse('Hello!'));

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(result).toEqual({ text: 'Hello!', toolCalls: [], cappedOut: false });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('executes a tool call, feeds the result back, and preserves thoughtSignature', async () => {
    const completed = makeTodo({ status: 'successful' });
    generateContent
      .mockResolvedValueOnce(
        functionCallResponse('complete_task', { id: 'todo-1' }, 'the-signature')
      )
      .mockResolvedValueOnce(textResponse('Marked it complete.'));
    agentToolsService.completeTask.mockResolvedValue({
      ok: true,
      data: completed,
    });

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(agentToolsService.completeTask).toHaveBeenCalledWith('user-1', {
      id: 'todo-1',
    });
    expect(result).toEqual({
      text: 'Marked it complete.',
      toolCalls: [
        {
          name: 'complete_task',
          input: { id: 'todo-1' },
          result: { ok: true, data: completed },
        },
      ],
      cappedOut: false,
    });

    const secondCallContents = generateContent.mock.calls[1][0].contents;
    const modelTurn = secondCallContents.find(
      (c: { role: string }) => c.role === 'model' && c !== secondCallContents[0]
    );
    expect(modelTurn.parts[0].thoughtSignature).toBe('the-signature');
    const userToolResultTurn = secondCallContents.at(-1);
    expect(userToolResultTurn.parts[0].functionResponse).toEqual({
      id: 'call-1',
      name: 'complete_task',
      response: { result: { ok: true, data: completed } },
    });
  });

  it('keeps a text part alongside a function call in the model turn it feeds back', async () => {
    generateContent
      .mockResolvedValueOnce(
        textAndFunctionCallResponse(
          'Let me check your tasks.',
          'list_tasks',
          {}
        )
      )
      .mockResolvedValueOnce(textResponse('Here they are.'));
    agentToolsService.listTasks.mockResolvedValue({ ok: true, data: [] });

    await service.reply('user-1', 'chat-1', turns, context);

    const secondCallContents = generateContent.mock.calls[1][0].contents;
    const modelTurn = secondCallContents.find(
      (c: { role: string }) => c.role === 'model' && c !== secondCallContents[0]
    );
    expect(modelTurn.parts).toEqual([
      { text: 'Let me check your tasks.' },
      {
        functionCall: { id: 'call-1', name: 'list_tasks', args: {} },
        thoughtSignature: 'sig-abc',
      },
    ]);
  });

  it('reports invalid_tool_call for a malformed call without executing it', async () => {
    generateContent
      .mockResolvedValueOnce(functionCallResponse('complete_task', {}))
      .mockResolvedValueOnce(textResponse('Something went wrong.'));

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(agentToolsService.completeTask).not.toHaveBeenCalled();
    expect(result.toolCalls).toEqual([
      {
        name: 'complete_task',
        input: {},
        result: { ok: false, reason: 'invalid_tool_call' },
      },
    ]);
  });

  it('reports invalid_tool_call for an unknown tool name without executing anything', async () => {
    generateContent
      .mockResolvedValueOnce(
        functionCallResponse('wipe_database', { id: 'todo-1' })
      )
      .mockResolvedValueOnce(textResponse('Something went wrong.'));

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(agentToolsService.deleteTask).not.toHaveBeenCalled();
    expect(agentToolsService.completeTask).not.toHaveBeenCalled();
    expect(result.toolCalls).toEqual([
      {
        name: 'wipe_database',
        input: { id: 'todo-1' },
        result: { ok: false, reason: 'invalid_tool_call' },
      },
    ]);
  });

  it('stops at the iteration cap rather than looping forever', async () => {
    generateContent.mockResolvedValue(
      functionCallResponse('complete_task', { id: 'todo-1' })
    );
    agentToolsService.completeTask.mockResolvedValue({
      ok: true,
      data: makeTodo(),
    });

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(generateContent).toHaveBeenCalledTimes(5);
    expect(result.cappedOut).toBe(true);
    expect(result.text).toBe(CAPPED_OUT_MESSAGE);
    expect(result.toolCalls).toHaveLength(5);
  });

  it('never logs message text, tool arguments, or model output, even in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const secretText = 'SECRET_TASK_TEXT_do_not_log_me';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    try {
      generateContent
        .mockResolvedValueOnce(
          functionCallResponse('complete_task', { id: secretText })
        )
        .mockResolvedValueOnce(textResponse(`Reply mentioning ${secretText}`));
      agentToolsService.completeTask.mockResolvedValue({
        ok: true,
        data: makeTodo({ id: secretText }),
      });

      await service.reply(
        'user-1',
        'chat-1',
        [{ role: 'user', text: secretText, at: new Date().toISOString() }],
        context
      );

      const loggedPayloads = logSpy.mock.calls.map((call) =>
        JSON.stringify(call)
      );
      expect(loggedPayloads.some((entry) => entry.includes(secretText))).toBe(
        false
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'completed',
          model: expect.any(String),
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      logSpy.mockRestore();
    }
  });

  it('retries once on a 429 and succeeds on the following attempt', async () => {
    generateContent
      .mockRejectedValueOnce(
        new ApiError({ message: 'rate limited', status: 429 })
      )
      .mockResolvedValueOnce(textResponse('Hello after retry.'));

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Hello after retry.');
  });

  it('retries a 503 the same way it retries a 429', async () => {
    generateContent
      .mockRejectedValueOnce(
        new ApiError({ message: 'unavailable', status: 503 })
      )
      .mockResolvedValueOnce(textResponse('Back up.'));

    const result = await service.reply('user-1', 'chat-1', turns, context);

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Back up.');
  });

  it('never retries a 400 — the request is wrong and will stay wrong', async () => {
    generateContent.mockRejectedValueOnce(
      new ApiError({ message: 'bad request', status: 400 })
    );

    await expect(
      service.reply('user-1', 'chat-1', turns, context)
    ).rejects.toThrow('bad request');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('gives up after exhausting retries on a persistent 429', async () => {
    generateContent.mockRejectedValue(
      new ApiError({ message: 'still rate limited', status: 429 })
    );

    await expect(
      service.reply('user-1', 'chat-1', turns, context)
    ).rejects.toThrow('still rate limited');
    // 1 initial attempt + DEFAULT_MAX_RETRIES(2) retries = 3 calls total.
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('aborts a call that runs past the configured timeout', async () => {
    generateContent.mockImplementation(
      ({ config }: { config: { abortSignal: AbortSignal } }) =>
        new Promise((_resolve, reject) => {
          config.abortSignal.addEventListener('abort', () => {
            reject(new Error('The operation was aborted'));
          });
        })
    );

    await expect(
      service.reply('user-1', 'chat-1', turns, context)
    ).rejects.toThrow('aborted');
  });

  describe('replyStream', () => {
    it('streams tokens and ends with done when the model answers directly', async () => {
      generateContentStream.mockResolvedValue(
        asAsyncIterable([textChunk('Hel'), textChunk('lo!')])
      );

      const events = await collect(
        service.replyStream('user-1', 'chat-1', turns, context)
      );

      expect(events).toEqual([
        { type: 'token', text: 'Hel' },
        { type: 'token', text: 'lo!' },
        { type: 'done', text: 'Hello!', cappedOut: false },
      ]);
    });

    it('emits tool_call and tool_result, and preserves thoughtSignature into the next call', async () => {
      const completed = makeTodo({ status: 'successful' });
      generateContentStream
        .mockResolvedValueOnce(
          asAsyncIterable([
            functionCallChunk(
              'complete_task',
              { id: 'todo-1' },
              'the-signature'
            ),
          ])
        )
        .mockResolvedValueOnce(asAsyncIterable([textChunk('Done.')]));
      agentToolsService.completeTask.mockResolvedValue({
        ok: true,
        data: completed,
      });

      const events = await collect(
        service.replyStream('user-1', 'chat-1', turns, context)
      );

      expect(events).toEqual([
        { type: 'tool_call', name: 'complete_task', input: { id: 'todo-1' } },
        {
          type: 'tool_result',
          name: 'complete_task',
          result: { ok: true, data: completed },
        },
        { type: 'token', text: 'Done.' },
        { type: 'done', text: 'Done.', cappedOut: false },
      ]);

      const secondCallContents =
        generateContentStream.mock.calls[1][0].contents;
      const modelTurn = secondCallContents[1];
      expect(modelTurn.parts[0].thoughtSignature).toBe('the-signature');
    });

    it('keeps a text part alongside a function call in the model turn it feeds back', async () => {
      generateContentStream
        .mockResolvedValueOnce(
          asAsyncIterable([
            textAndFunctionCallChunk(
              'Let me check your tasks.',
              'list_tasks',
              {}
            ),
          ])
        )
        .mockResolvedValueOnce(asAsyncIterable([textChunk('Here they are.')]));
      agentToolsService.listTasks.mockResolvedValue({ ok: true, data: [] });

      await collect(service.replyStream('user-1', 'chat-1', turns, context));

      const secondCallContents =
        generateContentStream.mock.calls[1][0].contents;
      const modelTurn = secondCallContents[1];
      expect(modelTurn.parts).toEqual([
        { text: 'Let me check your tasks.' },
        {
          functionCall: { id: 'call-1', name: 'list_tasks', args: {} },
          thoughtSignature: 'sig-abc',
        },
      ]);
    });

    it('emits a proposal event when a tool call requires confirmation', async () => {
      generateContentStream
        .mockResolvedValueOnce(
          asAsyncIterable([functionCallChunk('delete_task', { id: 'todo-1' })])
        )
        .mockResolvedValueOnce(asAsyncIterable([textChunk('Please confirm.')]));
      agentToolsService.deleteTask.mockResolvedValue({
        ok: false,
        reason: 'confirmation_required',
        proposal: {
          toolName: 'delete_task',
          input: { id: 'todo-1' },
          token: 'token-abc',
        },
      });

      const events = await collect(
        service.replyStream('user-1', 'chat-1', turns, context)
      );

      expect(events).toContainEqual({
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 'todo-1' },
          token: 'token-abc',
        },
      });
    });

    it('stops at the iteration cap rather than looping forever', async () => {
      generateContentStream.mockResolvedValue(
        asAsyncIterable([functionCallChunk('complete_task', { id: 'todo-1' })])
      );
      agentToolsService.completeTask.mockResolvedValue({
        ok: true,
        data: makeTodo(),
      });

      const events = await collect(
        service.replyStream('user-1', 'chat-1', turns, context)
      );

      expect(generateContentStream).toHaveBeenCalledTimes(5);
      expect(events.at(-1)).toEqual({
        type: 'done',
        text: CAPPED_OUT_MESSAGE,
        cappedOut: true,
      });
    });
  });
});
