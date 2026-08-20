import { z } from 'zod';

import { TODO_PRIORITIES } from './todo.schemas';
import { TodoPriority } from './todo.types';

export const AGENT_TURN_ROLES = ['user', 'assistant'] as const;
export type AgentTurnRole = (typeof AGENT_TURN_ROLES)[number];

export const MAX_TURN_TEXT_LENGTH = 4000;

/**
 * One message in a conversation. Sessions keep a bounded rolling window of
 * these; the full history is never sent to the model.
 */
export const agentTurnSchema = z.object({
  role: z.enum(AGENT_TURN_ROLES),
  text: z.string().trim().min(1).max(MAX_TURN_TEXT_LENGTH),
  at: z.string().datetime(),
});

/**
 * A question the bot asked and is still waiting on, so that a bare reply like
 * "Friday" resolves to the task it was asked about.
 */
export const pendingClarificationSchema = z.object({
  todoId: z.string(),
  field: z.enum(['dueDate', 'priority', 'todolistId']),
  question: z.string().trim().min(1),
  askedAt: z.string().datetime(),
});

export const agentSessionSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  turns: z.array(agentTurnSchema),
  pendingClarifications: z.array(pendingClarificationSchema),
  lastTaskIds: z.array(z.string()),
  expiresAt: z.string().datetime(),
});

/**
 * A single task as parsed out of a free-text message. Validated before any
 * write, so unparseable model output never reaches the database.
 */
export const parsedTaskSchema = z
  .object({
    name: z.string().trim().min(1),
    dueDate: z.string().date().nullable().default(null),
    priority: z
      .enum(TODO_PRIORITIES as unknown as [TodoPriority, ...TodoPriority[]])
      .default('medium'),
    notes: z.string().trim().max(2000).nullable().default(null),
    /** Set when the model could not resolve a field on its own. */
    ambiguous: z.boolean().default(false),
  })
  .strict();

export const parsedTaskBatchSchema = z.object({
  tasks: z.array(parsedTaskSchema),
});

export type AgentTurn = z.infer<typeof agentTurnSchema>;
export type PendingClarification = z.infer<typeof pendingClarificationSchema>;
export type AgentSession = z.infer<typeof agentSessionSchema>;
export type ParsedTask = z.infer<typeof parsedTaskSchema>;
export type ParsedTaskBatch = z.infer<typeof parsedTaskBatchSchema>;
