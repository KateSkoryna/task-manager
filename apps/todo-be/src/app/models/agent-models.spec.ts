import { AgentSession } from './agent-session.model';
import { Report } from './report.model';
import { UserModel } from './user.model';
import { DEFAULT_USER_PREFERENCES, userPreferencesSchema } from '@shared/types';
import { Types } from 'mongoose';

const seedUser = (overrides: Record<string, unknown> = {}) =>
  UserModel.create({
    firebaseUid: `uid-${Math.random()}`,
    email: `${Math.random()}@example.com`,
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  });

const metrics = {
  dueCount: 2,
  completedCount: 1,
  createdCount: 3,
  overdueCount: 0,
  completionRatio: 0.5,
  onTimeRate: 1,
  proactivityScore: 60,
};

describe('User model', () => {
  it('gives a new user the default preferences', async () => {
    const user = await seedUser();

    expect(user.preferences.timezone).toBe('UTC');
    expect(user.preferences.reportCadence).toBe('off');
    expect(user.preferences.aiConsent).toBe(false);
  });

  it('serialises preferences and a linked flag, never the chat id', async () => {
    const user = await seedUser({
      telegram: { chatId: '123456', linkedAt: new Date(), username: 'kate' },
    });

    const json = JSON.stringify(user.toJSON());

    expect(user.toJSON()).toMatchObject({ telegramLinked: true });
    expect(json).not.toContain('123456');
    expect(json).not.toContain('chatId');
  });

  it('reports an unlinked user as not linked', async () => {
    const user = await seedUser();

    expect(user.toJSON()).toMatchObject({ telegramLinked: false });
  });

  it('accepts the stored preferences shape through the shared schema', async () => {
    const user = await seedUser();

    const parsed = userPreferencesSchema.parse(user.toJSON().preferences);

    expect(parsed).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('lets many users exist with no telegram subdocument', async () => {
    await UserModel.init();

    await expect(
      Promise.all([seedUser(), seedUser(), seedUser()])
    ).resolves.toHaveLength(3);
  });

  it('refuses to bind one chat to two accounts', async () => {
    await UserModel.init();
    await seedUser({ telegram: { chatId: 'shared-chat' } });

    await expect(
      seedUser({ telegram: { chatId: 'shared-chat' } })
    ).rejects.toMatchObject({ code: 11000 });
  });
});

describe('AgentSession model', () => {
  it('expires documents through a TTL index on expiresAt', async () => {
    await AgentSession.init();

    const indexes = await AgentSession.collection.indexes();
    const ttl = indexes.find((index) => index.key?.expiresAt === 1);

    expect(ttl).toBeDefined();
    expect(ttl?.expireAfterSeconds).toBe(0);
  });

  it('allows only one session per chat per user', async () => {
    await AgentSession.init();
    const userId = new Types.ObjectId();

    await AgentSession.create({
      userId,
      chatId: 'chat-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      AgentSession.create({
        userId,
        chatId: 'chat-1',
        expiresAt: new Date(Date.now() + 60_000),
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('defaults the collections and version so a fresh session is usable', async () => {
    const session = await AgentSession.create({
      userId: new Types.ObjectId(),
      chatId: 'chat-2',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(session.turns).toEqual([]);
    expect(session.pendingClarifications).toEqual([]);
    expect(session.lastTaskIds).toEqual([]);
    expect(session.version).toBe(0);
  });
});

describe('Report model', () => {
  it('rejects a duplicate report for the same user, period, and start', async () => {
    await Report.init();
    const userId = new Types.ObjectId();
    const periodStart = new Date('2026-08-20T00:00:00.000Z');

    await Report.create({
      userId,
      period: 'daily',
      periodStart,
      periodEnd: new Date('2026-08-20T23:59:59.999Z'),
      metrics,
    });

    await expect(
      Report.create({
        userId,
        period: 'daily',
        periodStart,
        periodEnd: new Date('2026-08-20T23:59:59.999Z'),
        metrics,
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('allows the same period start for different cadences', async () => {
    await Report.init();
    const userId = new Types.ObjectId();
    const periodStart = new Date('2026-08-17T00:00:00.000Z');

    await Report.create({
      userId,
      period: 'daily',
      periodStart,
      periodEnd: periodStart,
      metrics,
    });

    await expect(
      Report.create({
        userId,
        period: 'weekly',
        periodStart,
        periodEnd: periodStart,
        metrics,
      })
    ).resolves.toBeDefined();
  });

  it('starts undelivered', async () => {
    const report = await Report.create({
      userId: new Types.ObjectId(),
      period: 'monthly',
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-31T23:59:59.999Z'),
      metrics,
    });

    expect(report.deliveredAt).toBeNull();
  });
});
