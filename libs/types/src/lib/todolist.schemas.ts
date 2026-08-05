import { z } from 'zod';
import {
  dateFieldSchema,
  optionalEnumSchema,
  optionalTextSchema,
} from './common.schemas';

const todolistFields = {
  name: z.string().trim().min(1, 'Name is required'),
  priority: optionalEnumSchema(['low', 'medium', 'high'] as const),
  category: optionalEnumSchema(['home', 'education', 'work', 'family', 'health'] as const),
  dueDate: dateFieldSchema,
  notes: optionalTextSchema(2000),
};

export const todolistCreateSchema = z.object(todolistFields);

export const todolistUpdateSchema = z
  .object(todolistFields)
  .partial()
  .superRefine((data, context) => {
    if (Object.keys(data).length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'At least one field is required',
      });
    }
  });

export type TodolistCreateInput = z.infer<typeof todolistCreateSchema>;
export type TodolistUpdateInput = z.infer<typeof todolistUpdateSchema>;
