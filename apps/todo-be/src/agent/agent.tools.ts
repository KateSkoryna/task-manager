import { FunctionDeclaration, Schema, Type } from '@google/genai';
import { z, ZodType } from 'zod';
import {
  completeTaskInput,
  createTasksInput,
  deleteTaskInput,
  findTasksInput,
  listTasksInput,
  ToolName,
  updateTaskInput,
} from '@shared/types';

/**
 * Gemini's `Schema` type is a restricted subset of JSON Schema (OpenAPI
 * 3.0-flavoured, uppercase `type` values, no `$ref`, no `additionalProperties`,
 * no `type` arrays for nullability). `z.toJSONSchema()` produces standard JSON
 * Schema, so its output is walked here into the shape Gemini accepts.
 */
const JSON_SCHEMA_TYPE_TO_GEMINI_TYPE: Record<string, Type> = {
  string: Type.STRING,
  number: Type.NUMBER,
  integer: Type.INTEGER,
  boolean: Type.BOOLEAN,
  object: Type.OBJECT,
  array: Type.ARRAY,
  null: Type.NULL,
};

const UNSUPPORTED_KEYS = new Set([
  '$schema',
  '$id',
  '$ref',
  '$defs',
  'definitions',
  'additionalProperties',
  'default',
]);

/**
 * `Schema` encodes these as proto int64-style strings, not JSON numbers —
 * `maxLength?: string` etc. in `@google/genai`'s type definitions.
 */
const STRING_ENCODED_NUMERIC_KEYS = new Set([
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'minProperties',
  'maxProperties',
]);

const toGeminiType = (jsonSchemaType: string): Type => {
  const type = JSON_SCHEMA_TYPE_TO_GEMINI_TYPE[jsonSchemaType];
  if (!type) {
    throw new Error(
      `Unsupported JSON Schema type for Gemini: ${jsonSchemaType}`
    );
  }
  return type;
};

/**
 * Walks JSON Schema output (generated with `target: 'openapi-3.0'`, so
 * `nullable` is already a sibling flag rather than a `type` array or a
 * null-branch `anyOf`) into the fields Gemini's `Schema` type accepts.
 */
const convertNode = (
  node: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_KEYS.has(key) || key === 'type') {
      continue;
    }
    if (key === 'properties' && value && typeof value === 'object') {
      result['properties'] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          convertNode(v as Record<string, unknown>),
        ])
      );
      continue;
    }
    if (key === 'items' && value && typeof value === 'object') {
      result['items'] = convertNode(value as Record<string, unknown>);
      continue;
    }
    if (key === 'anyOf' && Array.isArray(value)) {
      const branches = value.map((branch) =>
        convertNode(branch as Record<string, unknown>)
      );
      // A `z.union([..., z.literal('')])` field (used for "clearable" inputs
      // like an optional dueDate/notes) degenerates, once its empty-string
      // enum member is stripped below, to a branch identical to the plain
      // string branch already in the union — drop the duplicate rather than
      // sending Gemini a redundant `anyOf` entry.
      const seen = new Set<string>();
      result['anyOf'] = branches.filter((branch) => {
        const serialized = JSON.stringify(branch);
        if (seen.has(serialized)) return false;
        seen.add(serialized);
        return true;
      });
      continue;
    }
    if (STRING_ENCODED_NUMERIC_KEYS.has(key) && typeof value === 'number') {
      result[key] = String(value);
      continue;
    }
    result[key] = value;
  }

  const type = node['type'];
  if (typeof type === 'string') {
    result['type'] = toGeminiType(type);
  }

  // Gemini rejects an empty string as an enum member outright ("enum[0]:
  // cannot be empty") — `z.literal('')`, used by this project's "clearable"
  // optional-string schemas, produces exactly that. Strip it; if nothing is
  // left, the field reverts to an unconstrained string rather than a bad
  // enum.
  if (Array.isArray(result['enum'])) {
    const nonEmpty = (result['enum'] as unknown[]).filter((v) => v !== '');
    if (nonEmpty.length === 0) {
      delete result['enum'];
    } else {
      result['enum'] = nonEmpty;
    }
  }

  // Gemini requires `format: "enum"` alongside `enum` to actually constrain
  // the model's output to the listed values.
  if (result['enum'] !== undefined) {
    result['format'] = 'enum';
  }

  return result;
};

export const zodToGeminiSchema = (schema: ZodType): Schema => {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    reused: 'inline',
    io: 'input',
  }) as Record<string, unknown>;
  return convertNode(jsonSchema) as Schema;
};

interface ToolRegistryEntry {
  name: ToolName;
  description: string;
  schema: ZodType;
  /**
   * Whether a given call needs a confirmation round-trip before it executes.
   * Takes the call's input because destructiveness can depend on it (e.g. a
   * batch update affecting more than one task) even when the tool itself is
   * usually safe.
   */
  requiresConfirmation: (input: unknown) => boolean;
  declaration: FunctionDeclaration;
}

const buildDeclaration = (
  name: ToolName,
  description: string,
  schema: ZodType
): FunctionDeclaration => ({
  name,
  description,
  parameters: zodToGeminiSchema(schema),
});

const TOOL_DEFINITIONS: Array<
  Pick<
    ToolRegistryEntry,
    'name' | 'description' | 'schema' | 'requiresConfirmation'
  >
> = [
  {
    name: 'create_tasks',
    description:
      'Create one or more new tasks. Extract the due date and priority only ' +
      'when the user actually stated them; leave them null rather than ' +
      'guessing. When the text clearly describes more than one task, set ' +
      '`ambiguous` on the affected task instead of inventing a split.',
    schema: createTasksInput,
    requiresConfirmation: () => false,
  },
  {
    name: 'update_task',
    description:
      'Change one or more fields on an existing task identified by id. Only ' +
      'include fields the user asked to change.',
    schema: updateTaskInput,
    // `updateTaskInput` only ever addresses one task by id, so this can
    // never be true today. Kept as a predicate so a future batch update
    // (affecting more than one task) has somewhere to plug in without
    // changing the registry's shape.
    requiresConfirmation: () => false,
  },
  {
    name: 'complete_task',
    description: 'Mark an existing task, identified by id, as complete.',
    schema: completeTaskInput,
    requiresConfirmation: () => false,
  },
  {
    name: 'delete_task',
    description:
      'Permanently delete an existing task identified by id. Destructive — ' +
      'only call this when the user clearly asked to remove the task.',
    schema: deleteTaskInput,
    requiresConfirmation: () => true,
  },
  {
    name: 'list_tasks',
    description:
      "List the user's tasks, optionally filtered to one list. Pass " +
      '`todolistId: null` for the Inbox.',
    schema: listTasksInput,
    requiresConfirmation: () => false,
  },
  {
    name: 'find_tasks',
    description:
      "Retrieve the user's tasks so you can reason about which ones match a " +
      'natural-language description. This does not search or filter itself — ' +
      'it hands you the candidate tasks and you decide which, if any, match ' +
      'the query. Use it for vague or indirect references (e.g. a query about ' +
      '"my t-shirt" that should surface a "do laundry" task).',
    schema: findTasksInput,
    requiresConfirmation: () => false,
  },
];

export const TOOL_REGISTRY: ToolRegistryEntry[] = TOOL_DEFINITIONS.map(
  (definition) => ({
    ...definition,
    declaration: buildDeclaration(
      definition.name,
      definition.description,
      definition.schema
    ),
  })
);
