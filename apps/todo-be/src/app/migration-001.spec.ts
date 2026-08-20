import mongoose from 'mongoose';
import { Todo } from './models/todo.model';
import { Todolist } from './models/todoList.model';
import { UserModel } from './models/user.model';
import { runMigration } from '../migrations/001-agent-fields';

describe('migration 001 — agent fields', () => {
  const uri = () => process.env.MONGODB_URI as string;

  const seedUser = async () =>
    UserModel.create({
      firebaseUid: 'firebase-migration',
      email: 'migration@example.com',
      displayName: 'Migration User',
      firstName: 'Migration',
      lastName: 'User',
    });

  it('backfills userId from the parent list', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });

    // Bypass the schema so the document looks like one written before the
    // userId field existed.
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const report = await runMigration(uri());
    expect(report.todosBackfilledUserId).toBe(1);
    expect(report.todosMissingUserIdUnresolved).toBe(0);

    const migrated = await Todo.findById(inserted.insertedId);
    expect(migrated?.userId?.toString()).toBe(user._id.toString());
  });

  it('reports rather than deletes a todo whose list is gone', async () => {
    const inserted = await mongoose.connection.collection('todos').insertOne({
      name: 'Orphan',
      todolistId: new mongoose.Types.ObjectId(),
      status: 'pending',
    });

    const report = await runMigration(uri());
    expect(report.todosMissingUserIdUnresolved).toBe(1);
    expect(report.todosBackfilledUserId).toBe(0);

    // Still present: deleting user data is a decision, not a migration step.
    const survivor = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(survivor).not.toBeNull();
  });

  it('applies priority and source defaults', async () => {
    const user = await seedUser();
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Bare', todolistId: null, userId: user._id });

    await runMigration(uri());

    const migrated = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(migrated?.priority).toBe('medium');
    expect(migrated?.source).toBe('web');
  });

  it('gives existing users default preferences', async () => {
    const user = await seedUser();

    await runMigration(uri());

    const migrated = await mongoose.connection
      .collection('users')
      .findOne({ _id: user._id });
    expect(migrated?.preferences).toMatchObject({
      timezone: 'UTC',
      reportCadence: 'off',
      aiConsent: false,
    });
  });

  it('is a no-op on a second run', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });
    await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const first = await runMigration(uri());
    const second = await runMigration(uri());

    expect(first.todosBackfilledUserId).toBe(1);
    expect(second).toMatchObject({
      todosBackfilledUserId: 0,
      todosGivenPriority: 0,
      todosGivenSource: 0,
      usersGivenPreferences: 0,
    });
  });

  it('writes nothing in dry-run mode', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const report = await runMigration(uri(), true);
    expect(report.dryRun).toBe(true);
    expect(report.todosBackfilledUserId).toBe(1);

    const untouched = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(untouched?.userId).toBeUndefined();
  });
});
