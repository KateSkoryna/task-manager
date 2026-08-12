import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createNestTestApplication } from '../nest-test-app';

describe('API hardening', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestTestApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets baseline security headers on every response', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/live');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('attaches a stable request id to the response header and error body', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/user');
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });

  it('attaches a request id to health checks too', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/live');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('exposes liveness and readiness checks excluded from Swagger', async () => {
    const live = await request(app.getHttpServer()).get('/api/health/live');
    expect(live.status).toBe(200);
    expect(live.body).toEqual({ status: 'ok' });

    const ready = await request(app.getHttpServer()).get('/api/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body).toEqual({ status: 'ok', mongo: 'connected' });
  });

  it('returns 429 once the auth route throttle limit is exceeded', async () => {
    const responses = [];
    for (let i = 0; i < 11; i += 1) {
      responses.push(await request(app.getHttpServer()).get('/api/auth/user'));
    }
    const throttled = responses.filter((response) => response.status === 429);
    expect(throttled.length).toBeGreaterThan(0);
    expect(throttled[0].body.requestId).toBeDefined();
  });
});
