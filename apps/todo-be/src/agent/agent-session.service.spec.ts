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
});
