import { ZodError } from 'zod';

export interface FieldError {
  field: string;
  value: string;
}

export interface ValidationError {
  fields: FieldError[];
}

export const createValidationError = (errors: { field: string; value: unknown }[]): ValidationError => {
  return {
    fields: errors.map(err => ({
      field: err.field,
      value: String(err.value ?? '')
    }))
  };
};

const valueAtPath = (input: unknown, path: PropertyKey[]): unknown => {
  return path.reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in value) {
      return (value as Record<PropertyKey, unknown>)[key];
    }
    return undefined;
  }, input);
};

export const createValidationErrorFromZod = (
  error: ZodError,
  input: unknown
): ValidationError =>
  createValidationError(
    error.issues.map((issue) => {
      const value = issue.path.length === 0 ? '' : valueAtPath(input, issue.path);
      return {
        field: issue.path.join('.'),
        value:
          typeof value === 'string' && value.length > 200
            ? '[too large]'
            : value ?? '',
      };
    })
  );
