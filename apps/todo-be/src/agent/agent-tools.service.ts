import { Injectable, Logger } from '@nestjs/common';
import {
  CompleteTaskInput,
  CreateTasksInput,
  DeleteTaskInput,
  FindTasksInput,
  ListTasksInput,
  TodoItem,
  UpdateTaskInput,
} from '@shared/types';
import { TodoService } from '../todo/todo.service';
import { AgentSessionService } from './agent-session.service';
import { TOOL_REGISTRY } from './agent.tools';

export interface FindTasksCandidate {
  id: string;
  name: string;
  dueDate: string | null;
  priority: TodoItem['priority'];
  status: TodoItem['status'];
  todolistId: string | null;
}

export interface FindTasksResult {
  tasks: FindTasksCandidate[];
  truncated: boolean;
}

const MAX_FIND_TASKS_RESULTS = 500;

/**
 * `find_tasks` is the only place that knows the real payload size, so the
 * Phase 10 "should we build semantic search" trigger is measured here rather
 * than remembered — see PLAN.md Phase 10.
 */
export const PHASE_10_TOKEN_THRESHOLD = 15_000;
export const PHASE_10_TASK_THRESHOLD = 2_000;

const PHASE_10_WARNING_THROTTLE_MS = 60 * 60 * 1000;

// A rough chars-per-token heuristic (~4 chars/token), good enough to decide
// whether a threshold was crossed without depending on the Gemini SDK's
// tokenizer for a one-line log line.
const estimateTokens = (payload: unknown): number =>
  Math.ceil(JSON.stringify(payload).length / 4);

export interface ToolFailure {
  ok: false;
  reason: string;
  proposal?: { toolName: string; input: unknown; token: string };
}

/**
 * Never a thrown exception for an expected outcome like "task not found" —
 * that is conversational, not exceptional, and the caller (eventually the
 * model) needs to be told, not crashed on.
 */
export type ToolResult<T> = { ok: true; data: T } | ToolFailure;

/**
 * This project doesn't run with `strictNullChecks`, so `!result.ok` alone
 * doesn't narrow a discriminated union the way it would in strict mode —
 * an explicit type guard is what actually gets `result.proposal` to
 * typecheck at call sites.
 */
export const isToolFailure = <T>(
  result: ToolResult<T>
): result is ToolFailure => result.ok === false;

const ok = <T>(data: T): ToolResult<T> => ({ ok: true, data });
const notFound = (): ToolResult<never> => ({ ok: false, reason: 'not_found' });
const todolistNotFound = (): ToolResult<never> => ({
  ok: false,
  reason: 'todolist_not_found',
});

const requiresConfirmation = (toolName: string, input: unknown): boolean =>
  Boolean(
    TOOL_REGISTRY.find((tool) => tool.name === toolName)?.requiresConfirmation(
      input
    )
  );

@Injectable()
export class AgentToolsService {
  private readonly logger = new Logger(AgentToolsService.name);
  private lastPhase10WarningAt = 0;

  constructor(
    private readonly todoService: TodoService,
    private readonly agentSessionService: AgentSessionService
  ) {}

  async createTasks(
    userId: string,
    input: CreateTasksInput
  ): Promise<ToolResult<TodoItem[]>> {
    const created = await Promise.all(
      input.tasks.map(({ name, dueDate, notes, priority }) =>
        this.todoService.create(
          null,
          { name, dueDate, notes, priority },
          userId
        )
      )
    );
    return ok(created);
  }

  async updateTask(
    userId: string,
    { id, ...updates }: UpdateTaskInput
  ): Promise<ToolResult<TodoItem>> {
    if (
      updates.todolistId != null &&
      !(await this.todoService.listExists(updates.todolistId, userId))
    ) {
      return todolistNotFound();
    }

    const updated = await this.todoService.updateOwned(id, userId, updates);
    return updated ? ok(updated) : notFound();
  }

  async completeTask(
    userId: string,
    { id }: CompleteTaskInput
  ): Promise<ToolResult<TodoItem>> {
    const updated = await this.todoService.updateOwned(id, userId, {
      status: 'successful',
      completedAt: new Date().toISOString(),
    });
    return updated ? ok(updated) : notFound();
  }

  async deleteTask(
    userId: string,
    chatId: string,
    { id, confirmationToken }: DeleteTaskInput
  ): Promise<ToolResult<TodoItem>> {
    if (requiresConfirmation('delete_task', { id })) {
      const confirmed =
        confirmationToken != null &&
        (await this.agentSessionService.consumeConfirmation(
          userId,
          chatId,
          confirmationToken,
          'delete_task',
          { id }
        ));

      if (!confirmed) {
        const token = await this.agentSessionService.createConfirmation(
          userId,
          chatId,
          'delete_task',
          { id }
        );
        return {
          ok: false,
          reason: 'confirmation_required',
          proposal: { toolName: 'delete_task', input: { id }, token },
        };
      }
    }

    const deleted = await this.todoService.deleteOwned(id, userId);
    return deleted ? ok(deleted) : notFound();
  }

  async listTasks(
    userId: string,
    { todolistId }: ListTasksInput
  ): Promise<ToolResult<TodoItem[]>> {
    return ok(await this.todoService.findAllOwned(userId, todolistId));
  }

  /**
   * Hands the model the user's candidate tasks so it can reason over which
   * ones match a natural-language query — retrieval by reasoning rather than
   * by distance (PLAN.md Phase 6). Deliberately field-limited: this payload
   * goes to Google, so `notes`, `location`, and `image` never leave the
   * server, and only this user's own tasks are ever included.
   */
  async findTasks(
    userId: string,
    _input: FindTasksInput
  ): Promise<ToolResult<FindTasksResult>> {
    const all = await this.todoService.findAllOwned(userId);
    const truncated = all.length > MAX_FIND_TASKS_RESULTS;
    const tasks: FindTasksCandidate[] = all
      .slice(0, MAX_FIND_TASKS_RESULTS)
      .map(({ id, name, dueDate, priority, status, todolistId }) => ({
        id,
        name,
        dueDate: dueDate ?? null,
        priority,
        status,
        todolistId,
      }));

    this.warnIfPhase10TriggerReached(tasks, all.length);

    return ok({ tasks, truncated });
  }

  private warnIfPhase10TriggerReached(
    tasks: FindTasksCandidate[],
    totalTaskCount: number
  ): void {
    const tokens = estimateTokens(tasks);
    const overTokenThreshold = tokens > PHASE_10_TOKEN_THRESHOLD;
    const overTaskThreshold = totalTaskCount > PHASE_10_TASK_THRESHOLD;
    if (!overTokenThreshold && !overTaskThreshold) return;

    const now = Date.now();
    if (now - this.lastPhase10WarningAt < PHASE_10_WARNING_THROTTLE_MS) return;
    this.lastPhase10WarningAt = now;

    // Never log task names or the query — same rule as Step 4.4's log
    // hygiene, applied here because this line is the Phase 10 trigger record.
    this.logger.warn(
      `find_tasks payload ${tokens} tokens / ${totalTaskCount} tasks — PLAN.md Phase 10 trigger reached`
    );
  }
}
