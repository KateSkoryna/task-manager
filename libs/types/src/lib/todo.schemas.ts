import { z } from 'zod';

import { TodoPriority, TodoStatus } from './todo.types';
import { dateFieldSchema, optionalTextSchema } from './common.schemas';

export const TODO_PRIORITIES = ['low', 'medium', 'high'] as const;

const MAX_LOCATION_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;
const MAX_IMAGE_URL_LENGTH = 2048;
const FIREBASE_STORAGE_HOST = 'firebasestorage.googleapis.com';
const LOCAL_EMULATOR_HOSTS = new Set(['127.0.0.1', 'localhost']);

const isFirebaseStorageUrl = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hostname === FIREBASE_STORAGE_HOST) {
    return url.protocol === 'https:';
  }
  return (
    LOCAL_EMULATOR_HOSTS.has(url.hostname) &&
    (url.protocol === 'http:' || url.protocol === 'https:')
  );
};

const optionalImage = z
  .union([
    z.string().trim().max(MAX_IMAGE_URL_LENGTH).refine(isFirebaseStorageUrl, {
      message: 'Image must be a Firebase Storage URL, not raw image data',
    }),
    z.literal(''),
  ])
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));

const todoFields = {
  name: z.string().trim().min(1, 'Name is required'),
  status: z
    .enum(['pending', 'successful', 'failed'] as [TodoStatus, ...TodoStatus[]])
    .optional(),
  todolistId: z.string().nullable().optional(),
  dueDate: dateFieldSchema,
  location: optionalTextSchema(MAX_LOCATION_LENGTH),
  notes: optionalTextSchema(MAX_NOTES_LENGTH),
  completedAt: dateFieldSchema,
  image: optionalImage,
  order: z.number().optional(),
  priority: z
    .enum(TODO_PRIORITIES as unknown as [TodoPriority, ...TodoPriority[]])
    .optional(),
};

/**
 * `source` is deliberately absent from both input schemas. It records which
 * surface created the task and is set server-side from the route, so a web
 * client cannot claim a task arrived from Telegram.
 */

const addCompletionRules = (
  data: { status?: TodoStatus; completedAt?: string | null },
  context: z.RefinementCtx,
  requireStatus: boolean
) => {
  if (
    data.status === 'successful' &&
    data.completedAt == null &&
    requireStatus
  ) {
    context.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Completed todos require a completion date',
    });
  }

  if (
    data.completedAt != null &&
    (requireStatus
      ? data.status !== 'successful'
      : data.status != null && data.status !== 'successful')
  ) {
    context.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Completion date requires successful status',
    });
  }
};

export const todoCreateSchema = z
  .object(todoFields)
  .superRefine((data, context) => addCompletionRules(data, context, true));

export const todoUpdateSchema = z
  .object(todoFields)
  .partial()
  .superRefine((data, context) => {
    if (Object.keys(data).length === 0) {
      context.addIssue({
        code: 'custom',
        path: [],
        message: 'At least one field is required',
      });
    }
    addCompletionRules(data, context, false);
  });

export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
