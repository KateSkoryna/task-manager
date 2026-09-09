import { z } from 'zod';

import { parsedTaskSchema } from './agent.schemas';
import { TODO_PRIORITIES } from './todo.schemas';
import { TodoPriority } from './todo.types';
import { dateFieldSchema, optionalTextSchema } from './common.schemas';

const MAX_NOTES_LENGTH = 2000;
const MAX_TASKS_PER_CALL = 20;

const priorityField = z
  .enum(TODO_PRIORITIES as unknown as [TodoPriority, ...TodoPriority[]])
  .optional();

/**
 * Creates one or more tasks from already-parsed fields, reusing
 * `parsedTaskSchema` so the agent's notion of a task never drifts from
 * quick-capture's.
 */
export const createTasksInput = z
  .object({
    tasks: z.array(parsedTaskSchema).min(1).max(MAX_TASKS_PER_CALL),
  })
  .strict();

export const updateTaskInput = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1).optional(),
    dueDate: dateFieldSchema,
    priority: priorityField,
    notes: optionalTextSchema(MAX_NOTES_LENGTH),
    todolistId: z.string().nullable().optional(),
  })
  .strict()
  .superRefine((data, context) => {
    const { id: _id, ...updates } = data;
    if (Object.values(updates).every((value) => value === undefined)) {
      context.addIssue({
        code: 'custom',
        path: [],
        message: 'At least one field to update is required',
      });
    }
  });

export const completeTaskInput = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export const deleteTaskInput = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export const listTasksInput = z
  .object({
    todolistId: z.string().nullable().optional(),
  })
  .strict();

export const agentToolCallSchema = z.discriminatedUnion('name', [
  z
    .object({ name: z.literal('create_tasks'), input: createTasksInput })
    .strict(),
  z.object({ name: z.literal('update_task'), input: updateTaskInput }).strict(),
  z
    .object({ name: z.literal('complete_task'), input: completeTaskInput })
    .strict(),
  z.object({ name: z.literal('delete_task'), input: deleteTaskInput }).strict(),
  z.object({ name: z.literal('list_tasks'), input: listTasksInput }).strict(),
]);

export type AgentToolCall = z.infer<typeof agentToolCallSchema>;
export type ToolName = AgentToolCall['name'];

/**
 * Derived from the union itself so a newly added tool only needs to be
 * listed once, in `agentToolCallSchema` above.
 */
export const TOOL_NAMES = agentToolCallSchema.options.map(
  (option) => option.shape.name.value
) as [ToolName, ...ToolName[]];

export type CreateTasksInput = z.infer<typeof createTasksInput>;
export type UpdateTaskInput = z.infer<typeof updateTaskInput>;
export type CompleteTaskInput = z.infer<typeof completeTaskInput>;
export type DeleteTaskInput = z.infer<typeof deleteTaskInput>;
export type ListTasksInput = z.infer<typeof listTasksInput>;
