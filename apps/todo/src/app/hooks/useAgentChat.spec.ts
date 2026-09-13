import { createElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAgentChat } from './useAgentChat';
import { useAuthStore } from '../store/authStore';

jest.mock('../lib/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => 'test-id-token' } },
}));
jest.mock('firebase/auth', () => ({ signOut: jest.fn() }));

const sseFrame = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

const encoder = new TextEncoder();

/**
 * A minimal stand-in for a `fetch` Response body. jsdom's test environment
 * has no native `fetch`/`ReadableStream` (confirmed empirically — both are
 * `undefined` here), so `streamAgentMessage`'s `response.body.getReader()`
 * call is satisfied directly rather than pulling in a real stream: only
 * `{ done, value }` reads are ever consumed.
 */
const bodyFromChunks = (chunks: string[]) => {
  const queue = chunks.map((chunk) => encoder.encode(chunk));
  return {
    getReader: () => ({
      read: async () => {
        const value = queue.shift();
        return value
          ? { done: false, value }
          : { done: true, value: undefined };
      },
    }),
  };
};

/** A body whose chunks arrive on our own schedule via `push`/`end`. */
const controlledBody = () => {
  const pending: string[] = [];
  const waiter: { resolve: (() => void) | null } = { resolve: null };
  let ended = false;
  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (pending.length === 0 && !ended) {
            await new Promise<void>((resolve) => {
              waiter.resolve = resolve;
            });
          }
          if (pending.length > 0) {
            return { done: false, value: encoder.encode(pending.shift()) };
          }
          return { done: true, value: undefined };
        },
      }),
    },
    push: (chunk: string) => {
      pending.push(chunk);
      waiter.resolve?.();
      waiter.resolve = null;
    },
    end: () => {
      ended = true;
      waiter.resolve?.();
      waiter.resolve = null;
    },
  };
};

const mockFetchOnce = (chunks: string[]) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    body: bodyFromChunks(chunks),
  });
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
};

describe('useAgentChat', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        firebaseUid: 'firebase-1',
        email: 'a@example.com',
        displayName: 'A',
        firstName: 'A',
        lastName: 'A',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        preferences: {
          timezone: 'UTC',
          locale: 'en',
          reportCadence: 'off',
          deliveryHour: 9,
          tone: 'neutral',
          aiConsent: true,
        },
        telegramLinked: false,
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null, isLoading: true });
    });
    jest.restoreAllMocks();
  });

  it('streams tokens into an assistant message and finalizes on done', async () => {
    mockFetchOnce([
      sseFrame('token', { type: 'token', text: 'Hi ' }),
      sseFrame('token', { type: 'token', text: 'there' }),
      sseFrame('done', { type: 'done', text: 'Hi there', cappedOut: false }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('hello');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.messages).toEqual([
      expect.objectContaining({ role: 'user', text: 'hello' }),
      expect.objectContaining({ role: 'assistant', text: 'Hi there' }),
    ]);
    expect(result.current.error).toBeNull();
  });

  it('parses an SSE frame whose JSON is split mid-frame across two chunks', async () => {
    const { body, push, end } = controlledBody();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, body });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('add milk');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    const fullFrame = sseFrame('done', {
      type: 'done',
      text: 'Added milk',
      cappedOut: false,
    });
    // Split inside the JSON payload, not on a frame boundary — the exact
    // failure mode a naive line-by-line parser gets wrong.
    const splitPoint = fullFrame.indexOf('"Added') + 3;

    await act(async () => {
      push(fullFrame.slice(0, splitPoint));
    });
    await act(async () => {
      push(fullFrame.slice(splitPoint));
      end();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.messages[1]).toEqual(
      expect.objectContaining({ role: 'assistant', text: 'Added milk' })
    );
  });

  it('invalidates the todo caches on a successful tool result', async () => {
    mockFetchOnce([
      sseFrame('tool_call', {
        type: 'tool_call',
        name: 'create_tasks',
        input: { tasks: [{ name: 'Buy milk' }] },
      }),
      sseFrame('tool_result', {
        type: 'tool_result',
        name: 'create_tasks',
        result: { ok: true, data: {} },
      }),
      sseFrame('done', { type: 'done', text: 'Done', cappedOut: false }),
    ]);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('add a task');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['todoLists', 'user-1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['inboxTodos', 'user-1'],
    });
    expect(result.current.messages[1].toolCalls).toEqual([
      {
        name: 'create_tasks',
        input: { tasks: [{ name: 'Buy milk' }] },
        result: { ok: true, data: {} },
      },
    ]);
  });

  it('does not invalidate caches on a failed tool result', async () => {
    mockFetchOnce([
      sseFrame('tool_result', {
        type: 'tool_result',
        name: 'delete_task',
        result: { ok: false, reason: 'not_found' },
      }),
      sseFrame('done', { type: 'done', text: 'Not found', cappedOut: false }),
    ]);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete something');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('surfaces a proposal and sends a fixed confirmation reply on confirm', async () => {
    mockFetchOnce([
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-1',
        },
      }),
      sseFrame('done', { type: 'done', text: '', cappedOut: false }),
    ]);
    mockFetchOnce([
      sseFrame('done', { type: 'done', text: 'Deleted.', cappedOut: false }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });

    await waitFor(() =>
      expect(result.current.pendingProposal).toEqual({
        toolName: 'delete_task',
        input: { id: 't1' },
        token: 'tok-1',
      })
    );

    act(() => {
      result.current.confirm();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.pendingProposal).toBeNull();

    const secondCallBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body
    );
    expect(secondCallBody).toEqual({
      chatId: 'chat-1',
      text: 'Yes, go ahead.',
    });
  });

  it('holds a proposal back until its explanatory text is fully in, not the moment it arrives', async () => {
    // The backend emits `proposal` right after the tool call resolves to
    // confirmation_required, but the model's "Are you sure?" text only
    // comes from a later, separate turn's `token`/`done` events — so the
    // box must not appear before that sentence does.
    const { body, push, end } = controlledBody();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, body });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });

    await act(async () => {
      push(
        sseFrame('proposal', {
          type: 'proposal',
          proposal: {
            toolName: 'delete_task',
            input: { id: 't1' },
            token: 'tok-1',
          },
        })
      );
    });
    expect(result.current.pendingProposal).toBeNull();

    await act(async () => {
      push(sseFrame('token', { type: 'token', text: 'Are you sure?' }));
    });
    expect(result.current.pendingProposal).toBeNull();
    expect(result.current.messages[1]).toEqual(
      expect.objectContaining({ role: 'assistant', text: 'Are you sure?' })
    );

    await act(async () => {
      push(
        sseFrame('done', {
          type: 'done',
          text: 'Are you sure?',
          cappedOut: false,
        })
      );
      end();
    });

    await waitFor(() =>
      expect(result.current.pendingProposal).toEqual({
        toolName: 'delete_task',
        input: { id: 't1' },
        token: 'tok-1',
      })
    );
  });

  it('clears a stale proposal once the same stream goes on to complete the action', async () => {
    // A fresh request has no way to carry a prior request's confirmation
    // token (the backend rebuilds `contents` from plain-text turns each
    // time), so after the user confirms, the model typically has to ask
    // again, get the new token, and immediately re-call the tool with it —
    // all inside this one stream. Without clearing `pendingProposal` here,
    // the UI would keep offering to delete a task that's already gone.
    mockFetchOnce([
      sseFrame('tool_call', {
        type: 'tool_call',
        name: 'delete_task',
        input: { id: 't1' },
      }),
      sseFrame('tool_result', {
        type: 'tool_result',
        name: 'delete_task',
        result: { ok: false, reason: 'confirmation_required' },
      }),
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-2',
        },
      }),
      sseFrame('tool_call', {
        type: 'tool_call',
        name: 'delete_task',
        input: { id: 't1', confirmationToken: 'tok-2' },
      }),
      sseFrame('tool_result', {
        type: 'tool_result',
        name: 'delete_task',
        result: { ok: true, data: { id: 't1' } },
      }),
      sseFrame('done', { type: 'done', text: 'Deleted.', cappedOut: false }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('Yes, go ahead.');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.pendingProposal).toBeNull();
  });

  it('suppresses the interim re-ask proposal during a confirm reply, so it never flashes a second box', async () => {
    mockFetchOnce([
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-1',
        },
      }),
      sseFrame('done', { type: 'done', text: '', cappedOut: false }),
    ]);
    const { body, push, end } = controlledBody();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, body });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });
    await waitFor(() => expect(result.current.pendingProposal).not.toBeNull());

    act(() => {
      result.current.confirm();
    });

    // The confirm-reply stream re-asks (interim, held back) then re-confirms
    // itself with the fresh token — pendingProposal must stay null through
    // every step of that, not just at the very end.
    await act(async () => {
      push(
        sseFrame('tool_call', {
          type: 'tool_call',
          name: 'delete_task',
          input: { id: 't1' },
        })
      );
    });
    expect(result.current.pendingProposal).toBeNull();

    await act(async () => {
      push(
        sseFrame('tool_result', {
          type: 'tool_result',
          name: 'delete_task',
          result: { ok: false, reason: 'confirmation_required' },
        })
      );
    });
    expect(result.current.pendingProposal).toBeNull();

    await act(async () => {
      push(
        sseFrame('proposal', {
          type: 'proposal',
          proposal: {
            toolName: 'delete_task',
            input: { id: 't1' },
            token: 'tok-2',
          },
        })
      );
    });
    // This is the exact moment that used to flash a second ProposalCard.
    expect(result.current.pendingProposal).toBeNull();

    await act(async () => {
      push(
        sseFrame('tool_call', {
          type: 'tool_call',
          name: 'delete_task',
          input: { id: 't1', confirmationToken: 'tok-2' },
        })
      );
      push(
        sseFrame('tool_result', {
          type: 'tool_result',
          name: 'delete_task',
          result: { ok: true, data: { id: 't1' } },
        })
      );
      push(
        sseFrame('done', { type: 'done', text: 'Deleted.', cappedOut: false })
      );
      end();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.pendingProposal).toBeNull();
  });

  it('reveals the interim proposal as a fallback if a confirm reply ends without ever resolving it', async () => {
    mockFetchOnce([
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-1',
        },
      }),
      sseFrame('done', { type: 'done', text: '', cappedOut: false }),
    ]);
    // A degenerate confirm reply that only re-asks and then gives up
    // (e.g. hit the iteration cap) instead of re-confirming itself.
    mockFetchOnce([
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-2',
        },
      }),
      sseFrame('done', {
        type: 'done',
        text: 'Sorry, could you confirm again?',
        cappedOut: true,
      }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });
    await waitFor(() => expect(result.current.pendingProposal).not.toBeNull());

    act(() => {
      result.current.confirm();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    // Never resolved within the stream — must not be lost.
    expect(result.current.pendingProposal).toEqual({
      toolName: 'delete_task',
      input: { id: 't1' },
      token: 'tok-2',
    });
  });

  it('queues a confirm clicked while the proposal turn is still streaming, and sends it once that stream ends', async () => {
    // Revealing the proposal (at `done`) doesn't by itself end the HTTP
    // stream — that only happens once the reader reports its final chunk,
    // which in this fake transport is a separate, later `end()` call.
    // Clicking Confirm in that window must not be dropped just because
    // `send` refuses to start a second stream while one is in flight.
    const { body, push, end } = controlledBody();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, body });
    mockFetchOnce([
      sseFrame('done', { type: 'done', text: 'Deleted.', cappedOut: false }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });

    await act(async () => {
      push(
        sseFrame('proposal', {
          type: 'proposal',
          proposal: {
            toolName: 'delete_task',
            input: { id: 't1' },
            token: 'tok-1',
          },
        })
      );
      push(
        sseFrame('done', {
          type: 'done',
          text: 'Are you sure?',
          cappedOut: false,
        })
      );
    });
    await waitFor(() => expect(result.current.pendingProposal).not.toBeNull());
    // The reader hasn't reported completion yet (no `end()` call below), so
    // the stream is still open — confirming now must not be a no-op.
    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.confirm();
    });
    expect(result.current.pendingProposal).toBeNull();
    // Only one fetch so far: the queued reply hasn't been sent yet because
    // the first stream hasn't finished.
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      end();
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const secondCallBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body
    );
    expect(secondCallBody).toEqual({
      chatId: 'chat-1',
      text: 'Yes, go ahead.',
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
  });

  it('sends a fixed decline reply on cancel', async () => {
    mockFetchOnce([
      sseFrame('proposal', {
        type: 'proposal',
        proposal: {
          toolName: 'delete_task',
          input: { id: 't1' },
          token: 'tok-1',
        },
      }),
      sseFrame('done', { type: 'done', text: '', cappedOut: false }),
    ]);
    mockFetchOnce([
      sseFrame('done', { type: 'done', text: 'Kept it.', cappedOut: false }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('delete task t1');
    });
    await waitFor(() => expect(result.current.pendingProposal).not.toBeNull());

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.pendingProposal).toBeNull();

    const secondCallBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body
    );
    expect(secondCallBody).toEqual({
      chatId: 'chat-1',
      text: "No, don't do that.",
    });
  });

  it('sets error on a stream error event', async () => {
    mockFetchOnce([
      sseFrame('error', { type: 'error', message: 'The agent broke.' }),
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('hello');
    });

    await waitFor(() => expect(result.current.error).toBe('The agent broke.'));
  });

  it('sets error when the request itself fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      body: null,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentChat('chat-1'), { wrapper });

    act(() => {
      result.current.send('hello');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.error).toContain('500');
  });
});
