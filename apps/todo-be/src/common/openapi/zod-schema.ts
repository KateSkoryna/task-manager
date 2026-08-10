import { ZodType, z } from 'zod';

export function zodToApiSchema(schema: ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
  });
}
