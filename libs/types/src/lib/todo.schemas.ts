import { z } from 'zod';

import { TodoStatus } from './todo.types';
import { dateFieldSchema, optionalTextSchema } from './common.schemas';

const MAX_LOCATION_LENGTH = 200;
const MAX_NOTES_LENGTH = 2000;
const MAX_IMAGE_LENGTH = 7_000_000;

const optionalImage = z
  .union([z.string().max(MAX_IMAGE_LENGTH), z.literal('')])
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));

const todoFields = {
  name: z.string().trim().min(1, 'Name is required'),
  status: z.enum(['pending', 'successful', 'failed'] as [TodoStatus, ...TodoStatus[]]).optional(),
  dueDate: dateFieldSchema,
  location: optionalTextSchema(MAX_LOCATION_LENGTH),
  notes: optionalTextSchema(MAX_NOTES_LENGTH),
  completedAt: dateFieldSchema,
  image: optionalImage,
};

const addCompletionRules = (
  data: { status?: TodoStatus; completedAt?: string | null },
  context: z.RefinementCtx,
  requireStatus: boolean
) => {
  if (data.status === 'successful' && data.completedAt == null && requireStatus) {
    context.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Completed todos require a completion date',
    });
  }

  if (
    data.completedAt != null &&
    (requireStatus ? data.status !== 'successful' : data.status != null && data.status !== 'successful')
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
