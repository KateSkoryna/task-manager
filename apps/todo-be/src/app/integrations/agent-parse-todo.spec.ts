import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AgentService } from '../../agent/agent.service';
import { UserModel } from '../models/user.model';
import { createNestTestApplication } from '../nest-test-app';

const auth = (token = 'token-a') => ({ Authorization: `Bearer ${token}` });

describe('Agent parse-todo endpoint', () => {
  let app: INestApplication;
  let parseTodoMock: jest.Mock;

  beforeAll(async () => {
    parseTodoMock = jest.fn();
    app = await createNestTestApplication((builder) =>
      builder
        .overrideProvider(AgentService)
        .useValue({ parseTodo: parseTodoMock })
    );
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    parseTodoMock.mockClear();
    await UserModel.create({
      firebaseUid: 'firebase-a',
      email: 'a@example.com',
      displayName: 'User A',
      firstName: 'User',
      lastName: 'A',
      preferences: { aiConsent: true },
    });
  });

  it('returns the parsed task on success', async () => {
    parseTodoMock.mockResolvedValue({
      name: 'Buy milk',
      dueDate: '2026-09-11',
      priority: 'high',
      notes: null,
      ambiguous: false,
    });

    const response = await request(app.getHttpServer())
      .post('/api/agent/parse-todo')
      .set(auth())
      .send({ text: 'buy milk friday high prio' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: 'Buy milk',
      dueDate: '2026-09-11',
      priority: 'high',
      notes: null,
      ambiguous: false,
    });
  });

  it('rejects a request with no text before reaching the agent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/parse-todo')
      .set(auth())
      .send({ text: '' });

    expect(response.status).toBe(400);
    expect(parseTodoMock).not.toHaveBeenCalled();
  });

  it('rejects with 403 when the user has not enabled AI consent', async () => {
    await UserModel.findOneAndUpdate(
      { firebaseUid: 'firebase-a' },
      { $set: { 'preferences.aiConsent': false } }
    );

    const response = await request(app.getHttpServer())
      .post('/api/agent/parse-todo')
      .set(auth())
      .send({ text: 'buy milk' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ai_consent_required');
    expect(parseTodoMock).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/parse-todo')
      .send({ text: 'buy milk' });

    expect(response.status).toBe(401);
  });
});
