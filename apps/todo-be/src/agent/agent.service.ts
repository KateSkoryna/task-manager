import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, Content, GoogleGenAI, Part } from '@google/genai';
import { AgentToolCall, agentToolCallSchema, AgentTurn } from '@shared/types';
import {
  AgentToolsService,
  isToolFailure,
  ToolResult,
} from './agent-tools.service';
import {
  PROMPT_VERSION,
  PromptContext,
  buildSystemPrompt,
} from './agent.prompt';
import { TOOL_REGISTRY } from './agent.tools';

export const GEMINI_CLIENT = Symbol('GEMINI_CLIENT');
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

const MAX_ITERATIONS = 5;

// Only 429 (rate limited) and 503 (transiently unavailable) are worth
// retrying — a 400 means the request itself is wrong and will stay wrong.
const RETRYABLE_STATUSES = [429, 503];
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 500;

// Never persist an empty assistant turn: `agentTurnSchema` requires non-empty
// text, and Gemini rejects an empty text part in a later turn's `contents`
// with a non-retryable 400 — that would permanently break the chat session.
export const CAPPED_OUT_MESSAGE =
  "I wasn't able to finish that within my step limit. Could you try rephrasing or breaking it into smaller requests?";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// `AbortSignal.any` isn't in this project's pinned `@types/node` yet, even
// though it's supported at runtime — this is the same merge, written by hand.
const anySignal = (signals: AbortSignal[]): AbortSignal => {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), {
      once: true,
    });
  }
  return controller.signal;
};

export interface AgentToolCallRecord {
  name: string;
  input: unknown;
  result: ToolResult<unknown>;
}

export interface AgentReplyResult {
  text: string;
  toolCalls: AgentToolCallRecord[];
  /** True if the loop hit MAX_ITERATIONS without the model returning text. */
  cappedOut: boolean;
}

export type AgentStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; result: ToolResult<unknown> }
  | {
      type: 'proposal';
      proposal: { toolName: string; input: unknown; token: string };
    }
  | { type: 'done'; text: string; cappedOut: boolean };

const turnToContent = (turn: AgentTurn): Content => ({
  role: turn.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: turn.text }],
});

@Injectable()
export class AgentService {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly client: GoogleGenAI,
    private readonly agentToolsService: AgentToolsService,
    configService: ConfigService
  ) {
    this.model =
      configService.get<string>('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
    this.timeoutMs =
      Number(configService.get('GEMINI_TIMEOUT_MS')) || DEFAULT_TIMEOUT_MS;
    this.maxRetries =
      Number(configService.get('GEMINI_MAX_RETRIES')) || DEFAULT_MAX_RETRIES;
    this.retryBaseMs =
      Number(configService.get('GEMINI_RETRY_BASE_MS')) ||
      DEFAULT_RETRY_BASE_MS;
  }

  /**
   * Runs one Gemini call with a request timeout and bounded exponential
   * backoff on 429/503. Never retries anything else — a 400 means the
   * request is wrong and will stay wrong no matter how many times it's sent.
   * `externalSignal` (client disconnect) and the per-attempt timeout are
   * combined so either one aborts the in-flight request.
   */
  private async callGemini<T>(
    invoke: (signal: AbortSignal) => Promise<T>,
    externalSignal?: AbortSignal
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const timeoutController = new AbortController();
      const timeout = setTimeout(
        () => timeoutController.abort(),
        this.timeoutMs
      );
      const signal = externalSignal
        ? anySignal([externalSignal, timeoutController.signal])
        : timeoutController.signal;

      try {
        return await invoke(signal);
      } catch (error) {
        const status = error instanceof ApiError ? error.status : undefined;
        const retryable = RETRYABLE_STATUSES.includes(status as number);
        if (!retryable || attempt >= this.maxRetries) throw error;
        await sleep(this.retryBaseMs * 2 ** attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  /**
   * Logs enough to debug latency/cost without ever retaining user content:
   * no message text, tool arguments, or model output — by construction,
   * never assembled into this object in the first place.
   */
  private logCall(outcome: string, startedAt: number, totalTokens: number) {
    this.logger.log({
      promptVersion: PROMPT_VERSION,
      model: this.model,
      latencyMs: Date.now() - startedAt,
      totalTokens,
      outcome,
    });
  }

  /**
   * Runs the tool-calling loop for one user message: call the model, execute
   * any tool calls it returns, feed the results back, and repeat until it
   * answers with text or the iteration cap is hit. Non-streaming — Step 4.3
   * wraps this in SSE.
   */
  async reply(
    userId: string,
    chatId: string,
    turns: AgentTurn[],
    context: PromptContext
  ): Promise<AgentReplyResult> {
    const contents: Content[] = turns.map(turnToContent);
    const config = {
      systemInstruction: buildSystemPrompt(context),
      tools: [
        { functionDeclarations: TOOL_REGISTRY.map((t) => t.declaration) },
      ],
      thinkingConfig: { thinkingBudget: 0 },
    };

    const toolCalls: AgentToolCallRecord[] = [];
    const startedAt = Date.now();
    let totalTokens = 0;

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const response = await this.callGemini((signal) =>
          this.client.models.generateContent({
            model: this.model,
            contents,
            config: { ...config, abortSignal: signal },
          })
        );
        totalTokens = response.usageMetadata?.totalTokenCount ?? totalTokens;

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const functionCallParts = parts.filter(
          (
            part
          ): part is Part & {
            functionCall: NonNullable<Part['functionCall']>;
          } => part.functionCall != null
        );

        if (functionCallParts.length === 0) {
          this.logCall('completed', startedAt, totalTokens);
          return { text: response.text ?? '', toolCalls, cappedOut: false };
        }

        // Pushing every raw part (not just the function calls) preserves
        // `thoughtSignature` on the call — Gemini 3.x rejects the next turn
        // without it — and keeps any accompanying text (e.g. "Let me check
        // your tasks") in the model's own context for later iterations.
        contents.push({ role: 'model', parts });

        const responseParts: Part[] = [];
        for (const part of functionCallParts) {
          const { name, args, id } = part.functionCall;
          const parsed = agentToolCallSchema.safeParse({ name, input: args });

          let result: ToolResult<unknown>;
          if (parsed.success) {
            result = await this.dispatch(userId, chatId, parsed.data);
          } else {
            result = { ok: false, reason: 'invalid_tool_call' };
          }

          toolCalls.push({ name: name ?? 'unknown', input: args, result });
          responseParts.push({
            functionResponse: { id, name, response: { result } },
          });
        }

        contents.push({ role: 'user', parts: responseParts });
      }

      this.logCall('capped_out', startedAt, totalTokens);
      return { text: CAPPED_OUT_MESSAGE, toolCalls, cappedOut: true };
    } catch (error) {
      this.logCall('error', startedAt, totalTokens);
      throw error;
    }
  }

  /**
   * Same loop as `reply`, but streams the model's text as it arrives and
   * surfaces each tool call/result/proposal as its own event, for the SSE
   * controller to forward directly. Throws on an upstream error; the caller
   * is expected to catch it and end the stream with an `error` event.
   */
  async *replyStream(
    userId: string,
    chatId: string,
    turns: AgentTurn[],
    context: PromptContext,
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<AgentStreamEvent> {
    const contents: Content[] = turns.map(turnToContent);
    const config = {
      systemInstruction: buildSystemPrompt(context),
      tools: [
        { functionDeclarations: TOOL_REGISTRY.map((t) => t.declaration) },
      ],
      thinkingConfig: { thinkingBudget: 0 },
    };
    const startedAt = Date.now();
    let totalTokens = 0;

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const stream = await this.callGemini(
          (signal) =>
            this.client.models.generateContentStream({
              model: this.model,
              contents,
              config: { ...config, abortSignal: signal },
            }),
          options.signal
        );

        let text = '';
        const allParts: Part[] = [];
        const functionCallParts: Array<
          Part & { functionCall: NonNullable<Part['functionCall']> }
        > = [];
        for await (const chunk of stream) {
          if (chunk.text) {
            text += chunk.text;
            yield { type: 'token', text: chunk.text };
          }
          totalTokens = chunk.usageMetadata?.totalTokenCount ?? totalTokens;
          const parts = chunk.candidates?.[0]?.content?.parts ?? [];
          for (const part of parts) {
            allParts.push(part);
            if (part.functionCall != null) {
              functionCallParts.push(
                part as Part & {
                  functionCall: NonNullable<Part['functionCall']>;
                }
              );
            }
          }
        }

        if (functionCallParts.length === 0) {
          this.logCall('completed', startedAt, totalTokens);
          yield { type: 'done', text, cappedOut: false };
          return;
        }

        // Keep every part (not just the function calls) — this preserves
        // `thoughtSignature` on the call and keeps any accompanying text in
        // the model's own context for later iterations.
        contents.push({ role: 'model', parts: allParts });

        const responseParts: Part[] = [];
        for (const part of functionCallParts) {
          const { name, args, id } = part.functionCall;
          yield { type: 'tool_call', name: name ?? 'unknown', input: args };

          const parsed = agentToolCallSchema.safeParse({ name, input: args });
          let result: ToolResult<unknown>;
          if (parsed.success) {
            result = await this.dispatch(userId, chatId, parsed.data);
          } else {
            result = { ok: false, reason: 'invalid_tool_call' };
          }

          yield { type: 'tool_result', name: name ?? 'unknown', result };
          if (isToolFailure(result) && result.proposal) {
            yield { type: 'proposal', proposal: result.proposal };
          }

          responseParts.push({
            functionResponse: { id, name, response: { result } },
          });
        }

        contents.push({ role: 'user', parts: responseParts });
      }

      this.logCall('capped_out', startedAt, totalTokens);
      yield { type: 'done', text: CAPPED_OUT_MESSAGE, cappedOut: true };
    } catch (error) {
      this.logCall('error', startedAt, totalTokens);
      throw error;
    }
  }

  private dispatch(
    userId: string,
    chatId: string,
    call: AgentToolCall
  ): Promise<ToolResult<unknown>> {
    switch (call.name) {
      case 'create_tasks':
        return this.agentToolsService.createTasks(userId, call.input);
      case 'update_task':
        return this.agentToolsService.updateTask(userId, call.input);
      case 'complete_task':
        return this.agentToolsService.completeTask(userId, call.input);
      case 'delete_task':
        return this.agentToolsService.deleteTask(userId, chatId, call.input);
      case 'list_tasks':
        return this.agentToolsService.listTasks(userId, call.input);
    }
  }
}
