import { TFunction } from 'i18next';
import { AgentToolCallSummary } from '../../hooks/useAgentChat';

/**
 * `input` arrives from `useAgentChat`'s SSE parsing as `unknown` — it's
 * already passed the backend's Zod validation before the tool ran, so a
 * light shape check here (rather than re-importing every tool's schema) is
 * enough to read a task count without trusting the model's JSON blindly.
 */
const taskCount = (input: unknown): number | null => {
  const tasks = (input as { tasks?: unknown } | null)?.tasks;
  return Array.isArray(tasks) ? tasks.length : null;
};

/**
 * Human-readable summary for a tool-call chip, e.g. "Created 3 tasks".
 * Returns `null` when nothing should render: a `confirmation_required`
 * failure is the backend asking a question the `ProposalCard` already
 * shows, not an outcome — the same destructive call typically appears
 * twice in one stream (asked, then immediately re-confirmed once it holds
 * the fresh token; see `useAgentChat`'s `tool_result` handling), and
 * labelling the first half "Deleted task" would claim a delete that
 * hasn't happened yet.
 */
export const toolCallLabel = (
  t: TFunction,
  { name, input, result }: AgentToolCallSummary
): string | null => {
  if (result && !result.ok) {
    if (result.reason === 'confirmation_required') return null;
    return t('agent.tool.failed');
  }

  switch (name) {
    case 'create_tasks': {
      const count = taskCount(input) ?? 1;
      return count === 1
        ? t('agent.tool.createTask')
        : t('agent.tool.createTasks', { count });
    }
    case 'update_task':
      return t('agent.tool.updateTask');
    case 'complete_task':
      return t('agent.tool.completeTask');
    case 'delete_task':
      return t('agent.tool.deleteTask');
    case 'list_tasks':
      return t('agent.tool.listTasks');
    case 'find_tasks':
      return t('agent.tool.findTasks');
    default:
      return t('agent.tool.generic');
  }
};

export interface LinkableTask {
  id: string;
  name: string;
  todolistId: string | null;
}

const isTaskShaped = (value: unknown): value is LinkableTask =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as { id?: unknown }).id === 'string' &&
  typeof (value as { name?: unknown }).name === 'string';

const toLinkableTask = (value: unknown): LinkableTask | null =>
  isTaskShaped(value)
    ? {
        id: value.id,
        name: value.name,
        todolistId:
          (value as { todolistId?: string | null }).todolistId ?? null,
      }
    : null;

/**
 * The task(s) a successful `create_tasks`/`update_task`/`complete_task` call
 * actually touched, straight from the backend's response — so a chat chip
 * can link to the real task instead of just announcing that something
 * happened. Read-only tools (`list_tasks`, `find_tasks`) and `delete_task`
 * (nothing left to navigate to) never produce a link.
 */
export const extractLinkableTasks = (
  toolCall: AgentToolCallSummary
): LinkableTask[] => {
  if (!toolCall.result?.ok) return [];
  const data = toolCall.result.data;

  if (toolCall.name === 'create_tasks' && Array.isArray(data)) {
    return data
      .map(toLinkableTask)
      .filter((task): task is LinkableTask => !!task);
  }
  if (toolCall.name === 'update_task' || toolCall.name === 'complete_task') {
    const task = toLinkableTask(data);
    return task ? [task] : [];
  }
  return [];
};
