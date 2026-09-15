import type { AgentStreamEvent } from '../agent.service';

/**
 * `AgentStreamEvent` (from `agent.service.ts`) covers what `AgentService`
 * itself yields — it has no `error` member because that frame is written
 * ad hoc by `agent.controller.ts`'s catch block, not by the service. The
 * eval harness needs to recognize it too (a Gemini failure or an exhausted
 * retry surfaces exactly this way), so it gets its own type here rather
 * than widening the service's public type for one caller's benefit.
 */
export type EvalStreamEvent =
  | AgentStreamEvent
  | { type: 'error'; message: string };

/**
 * Parses the raw `text/event-stream` body `agent.controller.ts` writes
 * (`writeEvent`) back into the typed events it came from. Mirrors the
 * inline parsing `agent-sse.spec.ts` does by hand, pulled out here because
 * the eval harness needs it for every one of its 20 cases.
 */
export function parseSseFrames(body: string): EvalStreamEvent[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  return trimmed.split('\n\n').map((frame) => {
    const dataLine = frame
      .split('\n')
      .find((line) => line.startsWith('data: '));
    if (!dataLine) {
      throw new Error(
        `SSE frame missing a data line: ${JSON.stringify(frame)}`
      );
    }
    return JSON.parse(dataLine.slice('data: '.length)) as EvalStreamEvent;
  });
}
