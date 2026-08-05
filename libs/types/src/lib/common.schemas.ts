import { z } from 'zod';

const isValidDate = (value: string): boolean => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }

  return !Number.isNaN(Date.parse(value));
};

export const dateFieldSchema = z
  .union([
    z.string().refine(isValidDate, 'Must be a valid date'),
    z.literal(''),
  ])
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));

export const optionalTextSchema = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal('')])
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value));

export const optionalEnumSchema = <T extends string>(
  values: readonly [T, ...T[]]
) =>
  z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value));
