import { ParsedTask } from '@shared/types';
import { environment } from '../../environments/environment';
import { auth } from '../lib/firebase';
import apiClient from '../lib/apiClient';

export const parseTodoFetcher = async (text: string): Promise<ParsedTask> => {
  const { data } = await apiClient.post<ParsedTask>('/agent/parse-todo', {
    text,
  });
  return data;
};

export type AgentSseEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; name: string; input: unknown }
  | {
      type: 'tool_result';
      name: string;
      result: { ok: boolean; data?: unknown; reason?: string };
    }
  | {
      type: 'proposal';
      proposal: { toolName: string; input: unknown; token: string };
    }
  | { type: 'done'; text: string; cappedOut: boolean }
  | { type: 'error'; message: string };

/**
 * Reads `/agent/message`'s SSE stream frame by frame. `EventSource` can't
 * POST or set an `Authorization` header, so the stream is read from `fetch`
 * directly — each frame is `event: <name>\ndata: <json>\n\n`, and a frame can
 * arrive split across chunk boundaries, hence the buffer.
 */
export async function* streamAgentMessage(
  chatId: string,
  text: string,
  options: { signal?: AbortSignal } = {}
): AsyncGenerator<AgentSseEvent> {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${environment.apiUrl}/agent/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ chatId, text }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Agent request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const frame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const dataLine = frame
        .split('\n')
        .find((line) => line.startsWith('data: '));
      if (dataLine) {
        yield JSON.parse(dataLine.slice('data: '.length)) as AgentSseEvent;
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }
}
