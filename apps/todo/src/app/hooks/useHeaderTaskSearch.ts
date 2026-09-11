import { useEffect, useRef, useState } from 'react';
import { streamAgentMessage } from '../fetchers/agent';

export interface TaskSearchMatch {
  id: string;
  name: string;
  todolistId: string | null;
}

interface FindTasksResultData {
  tasks: TaskSearchMatch[];
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

// PLAN.md's Phase 6 draft suggested 400ms ("roughly one word of typing"),
// but that's shorter than a lot of people's natural pause between words —
// live testing showed a single short phrase like "buy flowers" firing 4-5
// separate searches. The shared agent throttle is only 3 requests/60s
// project-wide (`AGENT_THROTTLE_LIMIT`), so a debounce that fires mid-phrase
// burns through it before the user is even done typing. 800ms tolerates a
// normal thinking pause between words without waiting so long the box feels
// unresponsive.
const DEBOUNCE_MS = 800;

// `crypto.randomUUID` isn't implemented by every `crypto` (notably jsdom's),
// so fall back to a non-cryptographic id — this only needs to be unique
// enough to keep two search sessions from colliding, not secure.
const generateChatId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `search-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * The agent's system prompt (`agent.prompt.ts`) is written for a general
 * task-management conversation — "you help the user create, update,
 * complete, delete, and find their tasks." Sent a bare query like "buy
 * flowers", the model reasonably reads that as "create a task called buy
 * flowers" (confirmed live) rather than a lookup, since that's the more
 * common thing to say to a todo assistant. Framing the request explicitly as
 * a read-only lookup — rather than changing the shared system prompt, which
 * Phase 7's chat panel will also use — reliably steers the model to
 * `find_tasks` instead.
 */
const buildSearchMessage = (query: string): string =>
  'Look up my existing tasks using find_tasks — do not create, update, ' +
  `complete, or delete anything — and tell me which ones match: "${query}"`;

/**
 * The header search box. Debounced (see `DEBOUNCE_MS`) so every keystroke,
 * or every brief pause mid-phrase, isn't a paid model call. Sends the query
 * through the same conversational agent that
 * Phase 7's chat panel will use.
 *
 * Each search gets its own fresh chat id rather than one shared id: a header
 * search is a one-off lookup, not a conversation, and `AgentSessionService`
 * replays up to 20 prior turns as context for a given `(userId, chatId)` —
 * reusing one id would let an earlier unrelated query/answer bias later
 * search results. The abandoned sessions expire via the `agentsessions` TTL
 * index (PLAN.md Step 1.3).
 *
 * There is no dedicated "search" endpoint: the agent's `find_tasks` tool
 * hands the model the candidate tasks, and the model's own answer names the
 * ones that match (PLAN.md Phase 6 — "why no embeddings"). The final answer
 * text is matched back against the candidate set by task name to recover
 * clickable, navigable results.
 */
export const useHeaderTaskSearch = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [matches, setMatches] = useState<TaskSearchMatch[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  /**
   * The full candidate set from the last successful `find_tasks` call.
   * `find_tasks` always hands the model the user's *whole* task list, not a
   * query-filtered slice — the model does the filtering — so this cache is
   * valid for any later query, not just a refinement of the one that fetched
   * it, until the user's tasks actually change.
   */
  const candidatesRef = useRef<TaskSearchMatch[] | null>(null);

  const runSearch = async (searchText: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');

    try {
      let answerText = '';
      let candidates: TaskSearchMatch[] | null = null;

      for await (const event of streamAgentMessage(
        generateChatId(),
        buildSearchMessage(searchText),
        { signal: controller.signal }
      )) {
        if (
          event.type === 'tool_result' &&
          event.name === 'find_tasks' &&
          event.result.ok
        ) {
          candidates = (event.result.data as FindTasksResultData).tasks;
        } else if (event.type === 'done') {
          answerText = event.text;
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      }

      if (candidates) candidatesRef.current = candidates;

      const lowerAnswer = answerText.toLowerCase();
      const found = (candidates ?? []).filter((task) =>
        lowerAnswer.includes(task.name.toLowerCase())
      );
      setMatches(found);
      setStatus('success');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMatches([]);
      setStatus('error');
    }
  };

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    const trimmed = query.trim();

    if (!trimmed) {
      abortRef.current?.abort();
      setStatus('idle');
      setMatches([]);
      return;
    }

    // Try a literal, local narrowing of the last fetched task list before
    // paying for another model round trip — e.g. "buy" then "buy flowers"
    // shouldn't need to ask the model twice when "buy flowers" is right
    // there in the cached list. This can only ever shrink a set the model
    // already reasoned over, so it's safe whenever it finds something. If it
    // finds nothing, that's not proof of no match — the query might need
    // reasoning a literal substring can't do (e.g. "t-shirt" → "do
    // laundry") — so fall through to a real search rather than reporting a
    // false empty result.
    const cached = candidatesRef.current;
    if (cached) {
      const lowerQuery = trimmed.toLowerCase();
      const localMatches = cached.filter((task) =>
        task.name.toLowerCase().includes(lowerQuery)
      );
      if (localMatches.length > 0) {
        abortRef.current?.abort();
        setStatus('success');
        setMatches(localMatches);
        return;
      }
    }

    timeoutRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const clear = () => {
    abortRef.current?.abort();
    setQuery('');
    setStatus('idle');
    setMatches([]);
  };

  return { query, setQuery, status, matches, clear };
};
