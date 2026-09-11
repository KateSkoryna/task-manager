import { TOOL_NAMES, updateTaskInput } from '@shared/types';
import { TOOL_REGISTRY, zodToGeminiSchema } from './agent.tools';
import { z } from 'zod';
import { Type } from '@google/genai';

/** Recursively collects every `enum` array anywhere in a converted schema. */
const collectEnums = (node: unknown, found: unknown[][] = []): unknown[][] => {
  if (!node || typeof node !== 'object') return found;
  const record = node as Record<string, unknown>;
  if (Array.isArray(record['enum'])) found.push(record['enum']);
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectEnums(item, found));
    } else if (value && typeof value === 'object') {
      collectEnums(value, found);
    }
  }
  return found;
};

describe('TOOL_REGISTRY', () => {
  it('has exactly one entry per declared tool name', () => {
    const names = TOOL_REGISTRY.map((entry) => entry.name).sort();
    expect(names).toEqual([...TOOL_NAMES].sort());
  });

  it('produces a FunctionDeclaration for every entry', () => {
    for (const entry of TOOL_REGISTRY) {
      expect(entry.declaration.name).toBe(entry.name);
      expect(typeof entry.declaration.description).toBe('string');
      expect(entry.declaration.description!.length).toBeGreaterThan(0);
      expect(entry.declaration.parameters).toBeDefined();
      expect(entry.declaration.parameters!.type).toBe(Type.OBJECT);
    }
  });

  it('round-trips: every property in the declaration matches a key the zod schema accepts', () => {
    for (const entry of TOOL_REGISTRY) {
      const declaredProperties = Object.keys(
        entry.declaration.parameters!.properties ?? {}
      );
      const shape = (entry.schema as z.ZodObject<z.ZodRawShape>).shape;
      expect(declaredProperties.sort()).toEqual(Object.keys(shape).sort());
    }
  });
});

describe('zodToGeminiSchema', () => {
  it('strips unsupported JSON Schema keywords', () => {
    const schema = z.object({ name: z.string() }).strict();
    const result = zodToGeminiSchema(schema);
    expect(result).not.toHaveProperty('$schema');
    expect(result).not.toHaveProperty('additionalProperties');
  });

  it('converts JSON Schema types to Gemini uppercase Type enum values', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      done: z.boolean(),
    });
    const result = zodToGeminiSchema(schema);
    expect(result.type).toBe(Type.OBJECT);
    expect(result.properties!['name'].type).toBe(Type.STRING);
    expect(result.properties!['age'].type).toBe(Type.NUMBER);
    expect(result.properties!['done'].type).toBe(Type.BOOLEAN);
  });

  it('collapses a nullable field to a base type plus nullable: true', () => {
    const schema = z.object({ dueDate: z.string().nullable() });
    const result = zodToGeminiSchema(schema);
    const dueDate = result.properties!['dueDate'];
    expect(dueDate.nullable).toBe(true);
    expect(dueDate.type).toBe(Type.STRING);
  });

  it('marks required fields', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string().optional(),
    });
    const result = zodToGeminiSchema(schema);
    expect(result.required).toEqual(['id']);
  });

  it('encodes length/size bounds as strings, per the Schema type', () => {
    const schema = z.object({
      name: z.string().min(1).max(50),
      tasks: z.array(z.string()).min(1).max(20),
    });
    const result = zodToGeminiSchema(schema);
    expect(result.properties!['name'].minLength).toBe('1');
    expect(result.properties!['name'].maxLength).toBe('50');
    expect(result.properties!['tasks'].minItems).toBe('1');
    expect(result.properties!['tasks'].maxItems).toBe('20');
  });

  it("strips the empty-string enum member a `z.literal('')` \"clearable\" field produces, since Gemini rejects `enum: ['']` outright", () => {
    const schema = z
      .union([z.string(), z.literal('')])
      .nullable()
      .optional();
    const result = zodToGeminiSchema(z.object({ dueDate: schema }));
    const enums = collectEnums(result);
    expect(enums.every((values) => !values.includes(''))).toBe(true);
  });

  it('produces no empty-string enum anywhere in a real tool schema (updateTaskInput has this exact shape on dueDate/notes)', () => {
    const result = zodToGeminiSchema(updateTaskInput);
    const enums = collectEnums(result);
    expect(enums.every((values) => !values.includes(''))).toBe(true);
  });

  it('sets format: "enum" alongside an enum field', () => {
    const schema = z.object({ priority: z.enum(['low', 'medium', 'high']) });
    const result = zodToGeminiSchema(schema);
    expect(result.properties!['priority'].enum).toEqual([
      'low',
      'medium',
      'high',
    ]);
    expect(result.properties!['priority'].format).toBe('enum');
  });
});
