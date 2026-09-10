import { Injectable } from '@nestjs/common';
import {
  CompleteTaskInput,
  CreateTasksInput,
  DeleteTaskInput,
  ListTasksInput,
  TodoItem,
  UpdateTaskInput,
} from '@shared/types';
import { TodoService } from '../todo/todo.service';
import { AgentSessionService } from './agent-session.service';
import { TOOL_REGISTRY } from './agent.tools';

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
}
