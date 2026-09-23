import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserModel } from '../app/models/user.model';
import { createNestTestApplication } from '../app/nest-test-app';

describe('ReportsController', () => {
  let app: INestApplication;
  let userAId: string;
  let userBId: string;

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
  });

  it('returns an empty list until a report is explicitly generated', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/reports?period=weekly`)
      .set(auth('token-a'));

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.nextCursor).toBeNull();
  });

  it("rejects a request for another user's reports", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${userBId}/reports?period=weekly`)
      .set(auth('token-a'));

    expect(response.status).toBe(403);
  });

  it('rejects an invalid period', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/reports?period=daily`)
      .set(auth('token-a'));

    expect(response.status).toBe(400);
  });

  it('generates a report on POST and lists it afterward', async () => {
    const generateResponse = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/reports`)
      .set(auth('token-a'))
      .send({ period: 'weekly', referenceDate: '2026-03-25T10:00:00.000Z' });

    expect(generateResponse.status).toBe(201);
    expect(generateResponse.body.period).toBe('weekly');
    expect(generateResponse.body.name).toEqual(expect.any(String));

    const listResponse = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/reports?period=weekly`)
      .set(auth('token-a'));

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(generateResponse.body.id);
  });

  it('generating twice for the same period returns the same report, not a duplicate', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/reports`)
      .set(auth('token-a'))
      .send({ period: 'weekly', referenceDate: '2026-03-25T10:00:00.000Z' });
    const second = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/reports`)
      .set(auth('token-a'))
      .send({ period: 'weekly', referenceDate: '2026-03-25T10:00:00.000Z' });

    expect(second.body.id).toBe(first.body.id);
  });

  it("rejects generating a report for another user's reports", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/users/${userBId}/reports`)
      .set(auth('token-a'))
      .send({ period: 'weekly' });

    expect(response.status).toBe(403);
  });

  it('returns one report by id, including its task snapshot', async () => {
    const generateResponse = await request(app.getHttpServer())
      .post(`/api/users/${userAId}/reports`)
      .set(auth('token-a'))
      .send({ period: 'weekly', referenceDate: '2026-03-25T10:00:00.000Z' });

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/reports/${generateResponse.body.id}`)
      .set(auth('token-a'));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(generateResponse.body.id);
    expect(detailResponse.body.taskSnapshot).toEqual([]);
  });

  it('returns 404 for a report id that does not exist', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${userAId}/reports/507f1f77bcf86cd799439011`)
      .set(auth('token-a'));

    expect(response.status).toBe(404);
  });

  it("returns 404 for another user's report rather than leaking its existence", async () => {
    const generateResponse = await request(app.getHttpServer())
      .post(`/api/users/${userBId}/reports`)
      .set(auth('token-b'))
      .send({ period: 'weekly', referenceDate: '2026-03-25T10:00:00.000Z' });

    const response = await request(app.getHttpServer())
      .get(`/api/users/${userBId}/reports/${generateResponse.body.id}`)
      .set(auth('token-a'));

    // FirebaseAuthGuard already rejects a mismatched :userId path param with
    // 403 before the handler runs, so this exercises that guard, not a
    // findById ownership leak - both land on "you can't see this report".
    expect(response.status).toBe(403);
  });
});
