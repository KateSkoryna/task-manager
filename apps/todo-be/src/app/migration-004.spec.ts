import { Todolist } from './models/todoList.model';
import { UserModel } from './models/user.model';
import { runMigration } from '../migrations/004-default-list-flags';

describe('migration 004 — default list flags', () => {
  const uri = () => process.env.MONGODB_URI as string;

  const seedUser = () =>
    UserModel.create({
      firebaseUid: 'firebase-migration-004',
      email: 'migration004@example.com',
      displayName: 'Migration User',
      firstName: 'Migration',
      lastName: 'User',
    });

  it('flags lists whose name and category match a default, and nothing else', async () => {
    const user = await seedUser();
    await Todolist.create([
      { name: 'Work', userId: user._id, category: 'work' },
      { name: 'Home', userId: user._id, category: 'home' },
      // Right category, different name: the user's own list.
      { name: 'Home Chores', userId: user._id, category: 'home' },
      // Right name, different category.
      { name: 'Health', userId: user._id, category: 'work' },
      { name: 'No category', userId: user._id },
    ]);

    const report = await runMigration(uri());
    expect(report.listsFlagged).toBe(2);

    const flagged = await Todolist.find({ userId: user._id, isDefault: true });
    expect(flagged.map((l) => l.name).sort()).toEqual(['Home', 'Work']);
  });

  it('is safe to run twice', async () => {
    const user = await seedUser();
    await Todolist.create({
      name: 'Family',
      userId: user._id,
      category: 'family',
    });

    expect((await runMigration(uri())).listsFlagged).toBe(1);
    expect((await runMigration(uri())).listsFlagged).toBe(0);
  });

  it('writes nothing on a dry run', async () => {
    const user = await seedUser();
    await Todolist.create({ name: 'Work', userId: user._id, category: 'work' });

    expect((await runMigration(uri(), true)).listsFlagged).toBe(1);
    expect(
      await Todolist.countDocuments({ userId: user._id, isDefault: true })
    ).toBe(0);
  });
});
