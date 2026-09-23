import { act, renderHook, waitFor } from '@testing-library/react';
import { useHeaderTaskSearch } from './useHeaderTaskSearch';
import { AgentSseEvent, streamAgentMessage } from '../fetchers/agent';
import { useInboxTodosQuery, useTodoListsQuery } from '../fetchers/api';

jest.mock('../fetchers/agent', () => ({
  streamAgentMessage: jest.fn(),
}));

jest.mock('../fetchers/api', () => ({
  useTodoListsQuery: jest.fn(),
  useInboxTodosQuery: jest.fn(),
}));

const mockedStreamAgentMessage = streamAgentMessage as jest.MockedFunction<
  typeof streamAgentMessage
>;
const mockedUseTodoListsQuery = useTodoListsQuery as jest.MockedFunction<
  typeof useTodoListsQuery
>;
const mockedUseInboxTodosQuery = useInboxTodosQuery as jest.MockedFunction<
  typeof useInboxTodosQuery
>;

async function* fromEvents(events: AgentSseEvent[]) {
  for (const event of events) yield event;
}

describe('useHeaderTaskSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedStreamAgentMessage.mockReset();
    // No local React Query cache by default — matches the existing tests'
    // "nothing cached yet, everything goes through the agent" expectations.
    // The one test that cares about the local-cache seed sets these itself.
    mockedUseTodoListsQuery.mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useTodoListsQuery>);
    mockedUseInboxTodosQuery.mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useInboxTodosQuery>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces so a burst of keystrokes fires exactly one request', async () => {
    mockedStreamAgentMessage.mockReturnValue(fromEvents([]));
    const { result } = renderHook(() => useHeaderTaskSearch());

    act(() => result.current.setQuery('t'));
    act(() => jest.advanceTimersByTime(100));
    act(() => result.current.setQuery('t-'));
    act(() => jest.advanceTimersByTime(100));
    act(() => result.current.setQuery('t-shirt'));

    // No request yet — the debounce window keeps resetting.
    expect(mockedStreamAgentMessage).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(800);
      // Flush the microtask queue so the async generator can start.
      await Promise.resolve();
    });

    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(1);
    expect(mockedStreamAgentMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('t-shirt'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('tolerates a normal pause between words without firing early', async () => {
    mockedStreamAgentMessage.mockReturnValue(fromEvents([]));
    const { result } = renderHook(() => useHeaderTaskSearch());

    act(() => result.current.setQuery('buy'));
    // A pause here long enough to have fired the old 400ms debounce, but
    // short of a real "the user is done typing" signal — typing "buy
    // flowers" one word at a time regularly pauses this long between words.
    act(() => jest.advanceTimersByTime(500));
    expect(mockedStreamAgentMessage).not.toHaveBeenCalled();

    act(() => result.current.setQuery('buy flowers'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(1);
  });

  it('frames the query as a read-only lookup, so the model calls find_tasks instead of creating a task named after the query', async () => {
    mockedStreamAgentMessage.mockReturnValue(fromEvents([]));
    const { result } = renderHook(() => useHeaderTaskSearch());

    act(() => result.current.setQuery('buy flowers'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    const [, sentMessage] = mockedStreamAgentMessage.mock.calls[0];
    expect(sentMessage).toContain('find_tasks');
    expect(sentMessage).toMatch(/do not create/i);
    expect(sentMessage).toContain('buy flowers');
  });

  it("matches a find_tasks candidate named in the agent's answer text", async () => {
    mockedStreamAgentMessage.mockReturnValue(
      fromEvents([
        {
          type: 'tool_result',
          name: 'find_tasks',
          result: {
            ok: true,
            data: {
              tasks: [
                { id: 'todo-1', name: 'do laundry', todolistId: null },
                {
                  id: 'todo-2',
                  name: 'buy a birthday t-shirt',
                  todolistId: null,
                },
              ],
            },
          },
        },
        {
          type: 'done',
          text: 'I think you mean **do laundry**.',
          cappedOut: false,
        },
      ])
    );

    const { result } = renderHook(() => useHeaderTaskSearch());
    act(() => result.current.setQuery('t-shirt'));

    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    jest.useRealTimers();
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.matches).toEqual([
      { id: 'todo-1', name: 'do laundry', todolistId: null },
    ]);
  });

  it('narrows a cached candidate list locally instead of asking the model again', async () => {
    mockedStreamAgentMessage.mockReturnValueOnce(
      fromEvents([
        {
          type: 'tool_result',
          name: 'find_tasks',
          result: {
            ok: true,
            data: {
              tasks: [
                { id: 'todo-1', name: 'buy flowers', todolistId: null },
                { id: 'todo-2', name: 'buy tomato', todolistId: null },
                { id: 'todo-3', name: 'buy dolls', todolistId: null },
              ],
            },
          },
        },
        {
          type: 'done',
          text: 'You have 3 tasks starting with "buy": buy flowers, buy tomato, buy dolls.',
          cappedOut: false,
        },
      ])
    );

    const { result } = renderHook(() => useHeaderTaskSearch());
    act(() => result.current.setQuery('buy'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    jest.useRealTimers();
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.matches).toHaveLength(3);

    // Narrowing to "buy flowers" is a literal substring of a candidate
    // already fetched — this should resolve instantly, with no second call.
    act(() => result.current.setQuery('buy flowers'));

    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
    expect(result.current.matches).toEqual([
      { id: 'todo-1', name: 'buy flowers', todolistId: null },
    ]);
  });

  it('falls back to a real search when a refined query has no literal match in the cache', async () => {
    mockedStreamAgentMessage.mockReturnValueOnce(
      fromEvents([
        {
          type: 'tool_result',
          name: 'find_tasks',
          result: {
            ok: true,
            data: {
              tasks: [{ id: 'todo-1', name: 'do laundry', todolistId: null }],
            },
          },
        },
        { type: 'done', text: 'do laundry', cappedOut: false },
      ])
    );

    const { result } = renderHook(() => useHeaderTaskSearch());
    act(() => result.current.setQuery('laundry'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    jest.useRealTimers();
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(1);

    // "t-shirt" is not a literal substring of any cached candidate name
    // ("do laundry"), so the local shortcut must not report a false empty
    // result — it has to fall through to a real, reasoning-capable search.
    mockedStreamAgentMessage.mockReturnValueOnce(fromEvents([]));
    jest.useFakeTimers();
    act(() => result.current.setQuery('t-shirt'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(2);
  });

  it('uses a fresh chat id per search, so one lookup never carries context into the next', async () => {
    mockedStreamAgentMessage.mockReturnValue(fromEvents([]));
    const { result } = renderHook(() => useHeaderTaskSearch());

    act(() => result.current.setQuery('milk'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    act(() => result.current.setQuery('laundry'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    expect(mockedStreamAgentMessage).toHaveBeenCalledTimes(2);
    const firstChatId = mockedStreamAgentMessage.mock.calls[0][0];
    const secondChatId = mockedStreamAgentMessage.mock.calls[1][0];
    expect(firstChatId).not.toBe(secondChatId);
  });

  it('renders an instant local match from already-loaded task data, with no request yet, on the very first search of a session', async () => {
    mockedUseTodoListsQuery.mockReturnValue({
      data: [
        {
          id: 'list-1',
          name: 'Work',
          todos: [
            {
              id: 'todo-1',
              name: 'buy flowers',
              status: 'pending',
              todolistId: 'list-1',
              order: 0,
              priority: 'medium',
              source: 'web',
            },
          ],
        },
      ],
    } as unknown as ReturnType<typeof useTodoListsQuery>);
    mockedUseInboxTodosQuery.mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useInboxTodosQuery>);

    const { result, rerender } = renderHook(() => useHeaderTaskSearch());
    // Let the seeding effect (React Query data → local candidate cache) run.
    act(() => rerender());

    act(() => result.current.setQuery('flowers'));

    // No debounce wait, no agent call — this resolves from the already-
    // loaded todoLists/inboxTodos cache alone.
    expect(mockedStreamAgentMessage).not.toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current.matches).toEqual([
      { id: 'todo-1', name: 'buy flowers', todolistId: 'list-1' },
    ]);
  });

  it('clears results and aborts the in-flight request when the query is cleared', async () => {
    let aborted = false;
    mockedStreamAgentMessage.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async function* (_chatId, _text, options) {
        options?.signal?.addEventListener('abort', () => {
          aborted = true;
        });
        yield {
          type: 'done',
          text: 'never resolves in this test',
          cappedOut: false,
        };
      }
    );

    const { result } = renderHook(() => useHeaderTaskSearch());
    act(() => result.current.setQuery('t-shirt'));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    act(() => result.current.clear());

    expect(result.current.query).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.matches).toEqual([]);
    expect(aborted).toBe(true);
  });
});
