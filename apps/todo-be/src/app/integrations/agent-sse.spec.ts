import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AgentService } from '../../agent/agent.service';
import { UserModel } from '../models/user.model';
import { createNestTestApplication } from '../nest-test-app';

const auth = (token = 'token-a') => ({ Authorization: `Bearer ${token}` });

const streamOf = <T>(events: T[]) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const event of events) yield event;
  },
});

const streamThatThrows = <T>(events: T[], error: Error) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const event of events) yield event;
    throw error;
  },
});

describe('Agent SSE endpoint', () => {
  let app: INestApplication;
  let replyStreamMock: jest.Mock;

  beforeAll(async () => {
    replyStreamMock = jest.fn();
    app = await createNestTestApplication((builder) =>
      builder
        .overrideProvider(AgentService)
        .useValue({ replyStream: replyStreamMock })
    );
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    replyStreamMock.mockClear();
    await UserModel.create({
      firebaseUid: 'firebase-a',
      email: 'a@example.com',
      displayName: 'User A',
      firstName: 'User',
      lastName: 'A',
      preferences: { aiConsent: true },
    });
  });

  it('emits correctly framed SSE events and terminates on success', async () => {
    replyStreamMock.mockReturnValue(
      streamOf([
        { type: 'token', text: 'Hi' },
        { type: 'tool_call', name: 'list_tasks', input: {} },
        {
          type: 'tool_result',
          name: 'list_tasks',
          result: { ok: true, data: [] },
        },
        { type: 'done', text: 'Hi', cappedOut: false },
      ])
    );

    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .set(auth())
      .send({ chatId: 'chat-1', text: 'hello' });

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toContain('no-cache');
    expect(response.headers['x-accel-buffering']).toBe('no');

    const frames = response.text.trim().split('\n\n');
    expect(frames).toEqual([
      'event: token\ndata: {"type":"token","text":"Hi"}',
      'event: tool_call\ndata: {"type":"tool_call","name":"list_tasks","input":{}}',
      'event: tool_result\ndata: {"type":"tool_result","name":"list_tasks","result":{"ok":true,"data":[]}}',
      'event: done\ndata: {"type":"done","text":"Hi","cappedOut":false}',
    ]);
  });

  it('emits a proposal event when a tool call requires confirmation', async () => {
    replyStreamMock.mockReturnValue(
      streamOf([
        {
          type: 'proposal',
          proposal: {
            toolName: 'delete_task',
            input: { id: 't1' },
            token: 'tok',
          },
        },
        { type: 'done', text: '', cappedOut: false },
      ])
    );

    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .set(auth())
      .send({ chatId: 'chat-1', text: 'delete buy milk' });

    expect(response.text).toContain('event: proposal');
    expect(response.text).toContain('"token":"tok"');
  });

  it('emits an error event and still terminates the stream when the agent throws mid-stream', async () => {
    replyStreamMock.mockReturnValue(
      streamThatThrows(
        [{ type: 'token', text: 'Hi' }],
        new Error('upstream failure')
      )
    );

    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .set(auth())
      .send({ chatId: 'chat-1', text: 'hello' });

    const frames = response.text.trim().split('\n\n');
    expect(frames[0]).toBe('event: token\ndata: {"type":"token","text":"Hi"}');
    expect(frames[1]).toContain('event: error');
    expect(response.text.trimEnd().endsWith('}')).toBe(true);
  });

  it('rejects a request with no chatId or text before reaching the agent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .set(auth())
      .send({ chatId: '', text: '' });

    expect(response.status).toBe(400);
    expect(replyStreamMock).not.toHaveBeenCalled();
  });

  it('rejects with 403 when the user has not enabled AI consent', async () => {
    await UserModel.findOneAndUpdate(
      { firebaseUid: 'firebase-a' },
      { $set: { 'preferences.aiConsent': false } }
    );

    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .set(auth())
      .send({ chatId: 'chat-1', text: 'hello' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ai_consent_required');
    expect(replyStreamMock).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/message')
      .send({ chatId: 'chat-1', text: 'hello' });

    expect(response.status).toBe(401);
  });
});
