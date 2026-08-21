import { INestApplication } from '@nestjs/common';
import { createOpenApiDocument } from './bootstrap';
import { createNestTestApplication } from './app/nest-test-app';

const EXPECTED = [
  'GET /api/auth/user',
  'POST /api/auth/provision',
  'GET /api/users/{userId}/preferences',
  'PATCH /api/users/{userId}/preferences',
  'GET /api/users/{userId}/stats',
  'GET /api/users/{userId}/todolists',
  'POST /api/users/{userId}/todolists',
  'PUT /api/users/{userId}/todolists/{todolistId}',
  'DELETE /api/users/{userId}/todolists/{todolistId}',
  'POST /api/users/{userId}/todolists/{todolistId}/todos',
  'PUT /api/users/{userId}/todolists/{todolistId}/todos/{id}',
  'DELETE /api/users/{userId}/todolists/{todolistId}/todos/{id}',
  'GET /api/users/{userId}/todos/inbox',
  'POST /api/users/{userId}/todos',
  'PUT /api/users/{userId}/todos/{id}',
  'DELETE /api/users/{userId}/todos/{id}',
].sort();

describe('generated OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestTestApplication();
  });

  afterAll(async () => app.close());

  it('documents exactly the sixteen authoritative operations with bearer security', () => {
    const document = createOpenApiDocument(app);
    const operations = Object.entries(document.paths)
      .flatMap(([path, item]) =>
        Object.keys(item || {}).map(
          (method) => `${method.toUpperCase()} ${path}`
        )
      )
      .sort();
    expect(operations).toEqual(EXPECTED);
    for (const item of Object.values(document.paths)) {
      for (const operation of Object.values(item || {})) {
        expect(operation).toEqual(
          expect.objectContaining({
            security: [{ bearer: [] }],
            responses: expect.any(Object),
          })
        );
      }
    }
  });

  it('derives request-body schemas from the shared Zod schemas rather than hand-written duplicates', () => {
    const document = createOpenApiDocument(app);
    const createTodolist =
      document.paths['/api/users/{userId}/todolists']?.post;
    const requestBody = createTodolist?.requestBody as {
      content?: Record<
        string,
        {
          schema?: {
            required?: string[];
            properties?: Record<string, unknown>;
          };
        }
      >;
    };
    const bodySchema = requestBody?.content?.['application/json']?.schema;
    expect(bodySchema?.required).toEqual(['name']);
    expect(Object.keys(bodySchema?.properties ?? {}).sort()).toEqual(
      ['category', 'dueDate', 'name', 'notes', 'priority'].sort()
    );
  });
});
