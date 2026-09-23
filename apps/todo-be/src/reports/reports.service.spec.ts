import { Types } from 'mongoose';
import { Todo } from '../app/models/todo.model';
import { Todolist } from '../app/models/todoList.model';
import { Report } from '../app/models/report.model';
import { UserModel } from '../app/models/user.model';
import { AgentService } from '../agent/agent.service';
import { ReportsService } from './reports.service';

const seedUser = (timezone = 'UTC') =>
  UserModel.create({
    firebaseUid: `uid-${Math.random()}`,
    email: `${Math.random()}@example.com`,
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    preferences: { timezone },
  });

describe('ReportsService.generate', () => {
  const service = new ReportsService(
    Report,
    Todo,
    Todolist,
    UserModel,
    {} as AgentService
  );
  // A Wednesday well inside a single ISO week, month, quarter, and year.
  const referenceDate = new Date('2026-03-25T10:00:00.000Z');

  it('returns neutral metrics for a period with nothing due or completed', async () => {
    const user = await seedUser();

    const report = await service.generate(
      user._id.toString(),
      'weekly',
      referenceDate
    );

    expect(report.metrics).toEqual({
      dueCount: 0,
      completedCount: 0,
      createdCount: 0,
      overdueCount: 0,
      completionRatio: null,
      onTimeRate: null,
      proactivityScore: null,
    });
  });

  it('aggregates due, completed, created, and overdue counts for a normal period', async () => {
    const user = await seedUser();
    const userId = user._id.toString();

    // Due in-period, completed on time.
    await Todo.create({
      name: 'On time',
      userId,
      status: 'successful',
      dueDate: new Date('2026-03-24T09:00:00.000Z'),
      completedAt: new Date('2026-03-24T08:00:00.000Z'),
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });
    // Due in-period, completed late (still counts toward completionRatio,
    // not onTimeRate).
    await Todo.create({
      name: 'Late',
      userId,
      status: 'successful',
      dueDate: new Date('2026-03-24T09:00:00.000Z'),
      completedAt: new Date('2026-03-26T09:00:00.000Z'),
      createdAt: new Date('2026-03-20T00:00:00.000Z'),
    });
    // Due in-period, never completed.
    await Todo.create({
      name: 'Missed',
      userId,
      status: 'pending',
      dueDate: new Date('2026-03-26T09:00:00.000Z'),
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });
    // Created in-period but due outside it - counts toward createdCount only.
    await Todo.create({
      name: 'Created only',
      userId,
      status: 'pending',
      dueDate: new Date('2026-04-10T09:00:00.000Z'),
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
    });
    // Outside the period entirely.
    await Todo.create({
      name: 'Unrelated',
      userId,
      status: 'successful',
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const report = await service.generate(userId, 'weekly', referenceDate);

    expect(report.metrics).toEqual({
      dueCount: 3,
      completedCount: 2,
      createdCount: 3,
      overdueCount: 2,
      completionRatio: 2 / 3,
      onTimeRate: 1 / 3,
      proactivityScore: Math.round(100 * (0.6 * (1 / 3) + 0.4 * (2 / 3))),
    });
  });

  it('upserts in place rather than duplicating on a second call for the same period', async () => {
    const user = await seedUser();
    const userId = user._id.toString();
    await Todo.create({
      name: 'Task',
      userId,
      status: 'successful',
      dueDate: new Date('2026-03-24T09:00:00.000Z'),
      completedAt: new Date('2026-03-24T08:00:00.000Z'),
    });

    const first = await service.generate(userId, 'weekly', referenceDate);
    const second = await service.generate(userId, 'weekly', referenceDate);

    expect(second.id).toBe(first.id);
    const count = await Report.countDocuments({
      userId: new Types.ObjectId(userId),
      period: 'weekly',
    });
    expect(count).toBe(1);
  });

  it('computes period boundaries in the user preferred timezone', async () => {
    const user = await seedUser('Asia/Tokyo');
    const userId = user._id.toString();

    const report = await service.generate(userId, 'monthly', referenceDate);

    expect(report.periodStart).toBe('2026-02-28T15:00:00.000Z');
    expect(report.periodEnd).toBe('2026-03-31T14:59:59.999Z');
  });

  it('derives a human-readable name from the period and range', async () => {
    const user = await seedUser();

    const weekly = await service.generate(
      user._id.toString(),
      'weekly',
      referenceDate
    );
    const monthly = await service.generate(
      user._id.toString(),
      'monthly',
      referenceDate
    );
    const yearly = await service.generate(
      user._id.toString(),
      'yearly',
      referenceDate
    );

    expect(weekly.name).toBe('Weekly report — Mar 23 – Mar 29, 2026');
    expect(monthly.name).toBe('Monthly report — March 2026');
    expect(yearly.name).toBe('Yearly report — 2026');
  });

  it('freezes a task snapshot that is unaffected by later edits or deletion', async () => {
    const user = await seedUser();
    const userId = user._id.toString();
    const list = await Todolist.create({
      name: 'Home list',
      userId,
      category: 'home',
    });
    const todo = await Todo.create({
      name: 'Original name',
      userId,
      todolistId: list._id,
      status: 'successful',
      priority: 'high',
      dueDate: new Date('2026-03-24T09:00:00.000Z'),
      completedAt: new Date('2026-03-24T08:00:00.000Z'),
    });

    const report = await service.generate(userId, 'weekly', referenceDate);

    expect(report.taskSnapshot).toHaveLength(1);
    expect(report.taskSnapshot[0]).toMatchObject({
      name: 'Original name',
      status: 'successful',
      category: 'home',
      priority: 'high',
    });

    // Editing and then deleting the source task must not change the frozen
    // report - the whole point of the snapshot.
    await Todo.findByIdAndUpdate(todo._id, { name: 'Edited name' });
    await Todo.findByIdAndDelete(todo._id);

    const reread = await service.list(userId, 'weekly', { limit: 1 });
    expect(reread.items[0].taskSnapshot[0].name).toBe('Original name');
  });
});

describe('ReportsService.list', () => {
  const service = new ReportsService(
    Report,
    Todo,
    Todolist,
    UserModel,
    {} as AgentService
  );

  it('paginates newest period first, returning a nextCursor while more remain', async () => {
    const user = await seedUser();
    const userId = user._id.toString();
    await service.generate(
      userId,
      'weekly',
      new Date('2026-03-04T10:00:00.000Z')
    );
    await service.generate(
      userId,
      'weekly',
      new Date('2026-03-11T10:00:00.000Z')
    );
    await service.generate(
      userId,
      'weekly',
      new Date('2026-03-18T10:00:00.000Z')
    );

    const firstPage = await service.list(userId, 'weekly', { limit: 2 });

    expect(firstPage.items.map((r) => r.periodStart)).toEqual([
      '2026-03-16T00:00:00.000Z',
      '2026-03-09T00:00:00.000Z',
    ]);
    expect(firstPage.nextCursor).toBe('2026-03-09T00:00:00.000Z');

    const secondPage = await service.list(userId, 'weekly', {
      limit: 2,
      before: new Date(firstPage.nextCursor as string),
    });

    expect(secondPage.items.map((r) => r.periodStart)).toEqual([
      '2026-03-02T00:00:00.000Z',
    ]);
    expect(secondPage.nextCursor).toBeNull();
  });

  it('sorts oldest-first when asked', async () => {
    const user = await seedUser();
    const userId = user._id.toString();
    await service.generate(
      userId,
      'weekly',
      new Date('2026-03-04T10:00:00.000Z')
    );
    await service.generate(
      userId,
      'weekly',
      new Date('2026-03-18T10:00:00.000Z')
    );

    const page = await service.list(userId, 'weekly', {
      limit: 10,
      sort: 'asc',
    });

    expect(page.items.map((r) => r.periodStart)).toEqual([
      '2026-03-02T00:00:00.000Z',
      '2026-03-16T00:00:00.000Z',
    ]);
  });
});

describe('ReportsService.findById', () => {
  const service = new ReportsService(
    Report,
    Todo,
    Todolist,
    UserModel,
    {} as AgentService
  );
  const referenceDate = new Date('2026-03-25T10:00:00.000Z');

  it('returns the report when the requester owns it', async () => {
    const user = await seedUser();
    const created = await service.generate(
      user._id.toString(),
      'weekly',
      referenceDate
    );

    const found = await service.findById(user._id.toString(), created.id);

    expect(found?.id).toBe(created.id);
  });

  it('returns null for another user’s report', async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const created = await service.generate(
      owner._id.toString(),
      'weekly',
      referenceDate
    );

    const found = await service.findById(stranger._id.toString(), created.id);

    expect(found).toBeNull();
  });

  it('returns null for an id that does not exist', async () => {
    const user = await seedUser();

    const found = await service.findById(
      user._id.toString(),
      new Types.ObjectId().toString()
    );

    expect(found).toBeNull();
  });
});
