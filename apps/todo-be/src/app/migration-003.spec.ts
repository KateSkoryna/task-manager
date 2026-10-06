import { Todolist } from './models/todoList.model';
import { UserModel } from './models/user.model';
import { runMigration } from '../migrations/003-default-lists';

describe('migration 003 — default lists', () => {
  const uri = () => process.env.MONGODB_URI as string;

  const seedUser = () =>
    UserModel.create({
      firebaseUid: 'firebase-migration-003',
      email: 'migration003@example.com',
      displayName: 'Migration User',
      firstName: 'Migration',
      lastName: 'User',
    });

  it('creates the five default lists for a user who has none', async () => {
    const user = await seedUser();

    const report = await runMigration(uri());
    expect(report.listsCreated).toBe(5);

    const lists = await Todolist.find({ userId: user._id });
    expect(lists.every((l) => l.isDefault)).toBe(true);
    expect(lists.map((l) => l.category).sort()).toEqual([
      'education',
      'family',
      'health',
      'home',
      'work',
    ]);
  });

  it('skips default lists the user already has by name and is safe to run twice', async () => {
    const user = await seedUser();
    await Todolist.create([
      { name: 'Work', userId: user._id, category: 'work' },
      // Same category as a default, different name: the default still gets added.
      { name: 'Home Chores', userId: user._id, category: 'home' },
    ]);

    expect((await runMigration(uri())).listsCreated).toBe(4);
    expect((await runMigration(uri())).listsCreated).toBe(0);

    expect(await Todolist.countDocuments({ userId: user._id })).toBe(6);
  });

  it('writes nothing on a dry run', async () => {
    const user = await seedUser();

    const report = await runMigration(uri(), true);
    expect(report.listsCreated).toBe(5);
    expect(await Todolist.countDocuments({ userId: user._id })).toBe(0);
  });
});
