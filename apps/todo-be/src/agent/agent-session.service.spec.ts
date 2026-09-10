import { Types } from 'mongoose';
import { AgentSession } from '../app/models/agent-session.model';
import { AgentSessionService } from './agent-session.service';

const seedSession = (overrides: Record<string, unknown> = {}) =>
  AgentSession.create({
    userId: new Types.ObjectId(),
    chatId: 'chat-1',
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });

describe('AgentSessionService', () => {
  const service = new AgentSessionService(AgentSession);

  it('issues a token and stores it on the session', async () => {
    const session = await seedSession();

    const token = await service.createConfirmation(
      session.userId.toString(),
      session.chatId,
      'delete_task',
      { id: 'todo-1' }
    );

    const reloaded = await AgentSession.findById(session._id);
    expect(reloaded?.pendingConfirmation?.token).toBe(token);
    expect(reloaded?.pendingConfirmation?.toolName).toBe('delete_task');
    expect(reloaded?.version).toBe(1);
  });

  it('throws when no session exists for the user and chat', async () => {
    await expect(
      service.createConfirmation(
        new Types.ObjectId().toString(),
        'no-such-chat',
        'delete_task',
        { id: 'todo-1' }
      )
    ).rejects.toThrow();
  });

  it('consumes a valid token exactly once and refuses replay', async () => {
    const session = await seedSession();
    const userId = session.userId.toString();
    const token = await service.createConfirmation(
      userId,
      session.chatId,
      'delete_task',
      { id: 'todo-1' }
    );

    const firstAttempt = await service.consumeConfirmation(
      userId,
      session.chatId,
      token,
      'delete_task',
      { id: 'todo-1' }
    );
    const replay = await service.consumeConfirmation(
      userId,
      session.chatId,
      token,
      'delete_task',
      { id: 'todo-1' }
    );

    expect(firstAttempt).toBe(true);
    expect(replay).toBe(false);

    const reloaded = await AgentSession.findById(session._id);
    expect(reloaded?.pendingConfirmation).toBeNull();
  });

  it('refuses a token that does not match the tool it was issued for', async () => {
    const session = await seedSession();
    const userId = session.userId.toString();
    const token = await service.createConfirmation(
      userId,
      session.chatId,
      'delete_task',
      { id: 'todo-1' }
    );

    const confirmed = await service.consumeConfirmation(
      userId,
      session.chatId,
      token,
      'update_task',
      { id: 'todo-1' }
    );

    expect(confirmed).toBe(false);
  });

  it('refuses a token whose stored input does not match the call being confirmed', async () => {
    const session = await seedSession();
    const userId = session.userId.toString();
    const token = await service.createConfirmation(
      userId,
      session.chatId,
      'delete_task',
      { id: 'todo-1' }
    );

    const confirmed = await service.consumeConfirmation(
      userId,
      session.chatId,
      token,
      'delete_task',
      { id: 'todo-2' }
    );

    expect(confirmed).toBe(false);
    const reloaded = await AgentSession.findById(session._id);
    expect(reloaded?.pendingConfirmation).toBeNull();
  });

  it('refuses an expired token', async () => {
    const session = await seedSession({
      pendingConfirmation: {
        token: 'expired-token',
        toolName: 'delete_task',
        input: { id: 'todo-1' },
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const confirmed = await service.consumeConfirmation(
      session.userId.toString(),
      session.chatId,
      'expired-token',
      'delete_task',
      { id: 'todo-1' }
    );

    expect(confirmed).toBe(false);
  });

  it('refuses an unknown token', async () => {
    const session = await seedSession();

    const confirmed = await service.consumeConfirmation(
      session.userId.toString(),
      session.chatId,
      'never-issued',
      'delete_task',
      { id: 'todo-1' }
    );

    expect(confirmed).toBe(false);
  });

  describe('getOrCreateSession', () => {
    it('creates a fresh session with empty defaults when none exists', async () => {
      const userId = new Types.ObjectId().toString();

      const session = await service.getOrCreateSession(userId, 'new-chat');

      expect(session.turns).toEqual([]);
      expect(session.pendingClarifications).toEqual([]);
      expect(session.pendingConfirmation).toBeNull();
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns the existing session and refreshes its expiry', async () => {
      const original = await seedSession({
        expiresAt: new Date(Date.now() + 1000),
      });

      const session = await service.getOrCreateSession(
        original.userId.toString(),
        original.chatId
      );

      expect(session._id.toString()).toBe(original._id.toString());
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 1000);
    });
  });

  describe('appendTurns', () => {
    it('appends turns to the rolling window', async () => {
      const session = await seedSession();

      await service.appendTurns(session.userId.toString(), session.chatId, [
        { role: 'user', text: 'hello', at: new Date().toISOString() },
        { role: 'assistant', text: 'hi there', at: new Date().toISOString() },
      ]);

      const reloaded = await AgentSession.findById(session._id);
      expect(reloaded?.turns).toHaveLength(2);
      expect(reloaded?.turns[0].text).toBe('hello');
      expect(reloaded?.turns[1].text).toBe('hi there');
    });

    it('trims the window to the most recent turns', async () => {
      const session = await seedSession();
      const firstBatch = Array.from({ length: 20 }, (_, i) => ({
        role: 'user' as const,
        text: `turn-${i}`,
        at: new Date().toISOString(),
      }));
      await service.appendTurns(
        session.userId.toString(),
        session.chatId,
        firstBatch
      );

      await service.appendTurns(session.userId.toString(), session.chatId, [
        { role: 'user', text: 'newest', at: new Date().toISOString() },
      ]);

      const reloaded = await AgentSession.findById(session._id);
      expect(reloaded?.turns).toHaveLength(20);
      expect(reloaded?.turns.at(-1)?.text).toBe('newest');
      expect(reloaded?.turns[0].text).toBe('turn-1');
    });
  });
});
