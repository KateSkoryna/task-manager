import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { Todo } from '../models/todo.model';
import { Todolist } from '../models/todoList.model';
import { UserModel } from '../models/user.model';
import { createNestTestApplication } from '../nest-test-app';

describe('Nest API parity', () => {
  let app: INestApplication;
  let userAId: string;
  let userBId: string;
  let listAId: string;
  let listBId: string;

  const auth = (token = 'token-a') => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createNestTestApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const [userA, userB] = await UserModel.create([
      {
        firebaseUid: 'firebase-a',
        email: 'a@example.com',
        displayName: 'User A',
        firstName: 'User',
        lastName: 'A',
      },
      {
        firebaseUid: 'firebase-b',
        email: 'b@example.com',
        displayName: 'User B',
        firstName: 'User',
        lastName: 'B',
      },
    ]);
    userAId = userA._id.toString();
    userBId = userB._id.toString();
    const [listA, listB] = await Todolist.create([
      { name: 'List A', userId: userAId },
      { name: 'List B', userId: userBId },
    ]);
    listAId = listA._id.toString();
    listBId = listB._id.toString();
  });

  it('preserves authentication and provisioning behavior', async () => {
    expect(
      (await request(app.getHttpServer()).get('/api/auth/user')).body
    ).toEqual({
      message: 'Authorization token required',
    });
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/auth/user')
          .set(auth('invalid'))
      ).body
    ).toEqual({ message: 'Invalid or expired token' });
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/auth/user')
          .set(auth('token-new'))
      ).body
    ).toEqual({ message: 'User profile not found' });

    const profile = await request(app.getHttpServer())
      .get('/api/auth/user')
      .set(auth());
    expect(profile.status).toBe(200);
    expect(profile.body.id).toBe(userAId);

    const provisioned = await request(app.getHttpServer())
      .post('/api/auth/provision')
      .set(auth('token-new'))
      .send({ firstName: 'New', lastName: 'User' });
    expect(provisioned.status).toBe(201);
    expect(provisioned.body).toMatchObject({
      firebaseUid: 'firebase-new',
      email: 'new@example.com',
      displayName: 'New User',
    });
  });

  it('enforces path identity and user-scoped list reads and mutations', async () => {
    const mismatch = await request(app.getHttpServer())
      .get(`/api/users/${userBId}/todolists`)
      .set(auth());
    expect(mismatch.status).toBe(403);
    expect(mismatch.body).toEqual({ message: 'Forbidden' });

    const lists = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/todolists`)
      .set(auth());
    expect(lists.status).toBe(200);
    expect(lists.body.map((list: { id: string }) => list.id)).toEqual([
      listAId,
    ]);

    const foreignUpdate = await request(app.getHttpServer())
      .put(`/api/users/${userAId}/todolists/${listBId}`)
      .set(auth())
      .send({ name: 'Stolen' });
    expect(foreignUpdate.status).toBe(404);
    expect(foreignUpdate.body).toEqual({ message: 'Todolist not found' });
    expect((await Todolist.findById(listBId))?.name).toBe('List B');
  });

  it('preserves list CRUD, validation, population, and deletion bodies', async () => {
    const invalid = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/todolists`)
      .set(auth())
      .send({});
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ fields: [{ field: 'name', value: '' }] });

    const created = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/todolists`)
      .set(auth())
      .send({ name: 'Created', notes: '' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Created', userId: userAId });

    await Todo.create({ name: 'Nested', todolistId: created.body.id });
    const lists = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/todolists`)
      .set(auth());
    expect(
      lists.body.find((list: { id: string }) => list.id === created.body.id)
        .todos
    ).toHaveLength(1);

    const removed = await request(app.getHttpServer())
      .delete(`/api/users/${userAId}/todolists/${created.body.id}`)
      .set(auth());
    expect(removed.status).toBe(204);
    expect(removed.text).toBe('');
  });

  it('scopes nested todo mutations to the owned list', async () => {
    const foreignTodo = await Todo.create({
      name: 'Foreign',
      todolistId: listBId,
    });
    const update = await request(app.getHttpServer())
      .put(
        `/api/users/${userAId}/todolists/${listAId}/todos/${foreignTodo._id}`
      )
      .set(auth())
      .send({ name: 'Stolen' });
    expect(update.status).toBe(404);
    expect(update.body).toEqual({ message: 'Todo not found' });
    expect((await Todo.findById(foreignTodo._id))?.name).toBe('Foreign');

    const deletion = await request(app.getHttpServer())
      .delete(
        `/api/users/${userAId}/todolists/${listAId}/todos/${foreignTodo._id}`
      )
      .set(auth());
    expect(deletion.status).toBe(404);
    expect(await Todo.findById(foreignTodo._id)).not.toBeNull();
  });

  it('preserves todo CRUD, defaults, shared validation, and empty 204', async () => {
    const invalid = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/todolists/${listAId}/todos`)
      .set(auth())
      .send({});
    expect(invalid.body).toEqual({ fields: [{ field: 'name', value: '' }] });

    const created = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/todolists/${listAId}/todos`)
      .set(auth())
      .send({ name: 'Todo' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      status: 'pending',
      dueDate: null,
      location: null,
      notes: null,
      completedAt: null,
      image: null,
    });

    const updated = await request(app.getHttpServer())
      .put(
        `/api/users/${userAId}/todolists/${listAId}/todos/${created.body.id}`
      )
      .set(auth())
      .send({ status: 'successful', completedAt: new Date().toISOString() });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('successful');

    const removed = await request(app.getHttpServer())
      .delete(
        `/api/users/${userAId}/todolists/${listAId}/todos/${created.body.id}`
      )
      .set(auth());
    expect(removed.status).toBe(204);
    expect(removed.text).toBe('');
  });

  it('preserves statistics and excludes another user data', async () => {
    await Todo.create([
      { name: 'Pending', todolistId: listAId },
      { name: 'Done', todolistId: listAId, status: 'successful' },
      { name: 'Foreign', todolistId: listBId, status: 'failed' },
    ]);
    const response = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/stats`)
      .set(auth());
    expect(response.body).toEqual({
      total: 2,
      successful: 1,
      failed: 0,
      pending: 1,
      completionRate: 50,
    });

    const invalid = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/stats?period=invalid`)
      .set(auth());
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toContain('Invalid period');

    for (const period of ['day', 'week', 'month', 'year']) {
      const valid = await request(app.getHttpServer())
        .get(`/api/users/${userAId}/stats?period=${period}`)
        .set(auth());
      expect(valid.status).toBe(200);
    }
  });

  it('keeps validation and operation failures in the established shapes', async () => {
    const invalidId = await request(app.getHttpServer())
      .delete(`/api/users/${userAId}/todolists/not-an-id`)
      .set(auth());
    expect(invalidId.body).toEqual({
      fields: [{ field: 'id', value: 'not-an-id' }],
    });

    const oversized = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/todolists`)
      .set(auth())
      .send({ name: 'List', notes: 'x'.repeat(2001) });
    expect(oversized.body.fields[0].value).toBe('[too large]');

    jest.spyOn(mongoose.Model, 'find').mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });
    const failure = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/todolists`)
      .set(auth());
    expect(failure.status).toBe(500);
    expect(failure.body).toEqual({
      message: 'Error fetching todolists',
      error: 'database unavailable',
    });
    jest.restoreAllMocks();
  });
});
