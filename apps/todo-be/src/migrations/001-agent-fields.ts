/**
 * Backfills the fields the Telegram agent depends on.
 *
 * Idempotent and safe to run twice. Run it against every database before
 * deploying the statistics change, which matches `userId` on the todo directly
 * and therefore cannot see documents created before that field existed:
 *
 *   MONGODB_URI="mongodb+srv://.../todo" npx ts-node -P apps/todo-be/tsconfig.app.json \
 *     apps/todo-be/src/migrations/001-agent-fields.ts --dry-run
 *
 * Drop --dry-run to write. Repeat for todo_dev. This is a one-time script, so
 * it deliberately has no npm alias.
 */
import { MongoClient, ObjectId } from 'mongodb';

interface MigrationReport {
  database: string;
  dryRun: boolean;
  todosBackfilledUserId: number;
  todosMissingUserIdUnresolved: number;
  todosGivenPriority: number;
  todosGivenSource: number;
  usersGivenPreferences: number;
}

const DEFAULT_PREFERENCES = {
  timezone: 'UTC',
  locale: 'en',
  reportCadence: 'off',
  deliveryHour: 9,
  tone: 'neutral',
  aiConsent: false,
};

export const runMigration = async (
  uri: string,
  dryRun = false
): Promise<MigrationReport> => {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();
    const todos = db.collection('todos');
    const todolists = db.collection('todolists');
    const users = db.collection('users');

    const report: MigrationReport = {
      database: db.databaseName,
      dryRun,
      todosBackfilledUserId: 0,
      todosMissingUserIdUnresolved: 0,
      todosGivenPriority: 0,
      todosGivenSource: 0,
      usersGivenPreferences: 0,
    };

    // 1. Resolve ownership for todos that predate the userId field, using the
    //    parent list. Anything whose list is also gone cannot be attributed to
    //    a user and is reported rather than deleted or guessed at.
    const orphanFilter = {
      $or: [{ userId: { $exists: false } }, { userId: null }],
    };

    for await (const todo of todos.find(orphanFilter)) {
      const listId = todo.todolistId as ObjectId | null | undefined;
      const list = listId ? await todolists.findOne({ _id: listId }) : null;

      if (!list?.userId) {
        report.todosMissingUserIdUnresolved += 1;
        continue;
      }

      if (!dryRun) {
        await todos.updateOne(
          { _id: todo._id },
          { $set: { userId: list.userId } }
        );
      }
      report.todosBackfilledUserId += 1;
    }

    // 2. Defaults for the new todo fields.
    const priorityFilter = { priority: { $exists: false } };
    const sourceFilter = { source: { $exists: false } };

    report.todosGivenPriority = await todos.countDocuments(priorityFilter);
    report.todosGivenSource = await todos.countDocuments(sourceFilter);

    if (!dryRun) {
      await todos.updateMany(priorityFilter, { $set: { priority: 'medium' } });
      await todos.updateMany(sourceFilter, { $set: { source: 'web' } });
    }

    // 3. Preferences for users who predate them. Existing values are never
    //    overwritten, which is what makes a second run a no-op.
    const preferencesFilter = { preferences: { $exists: false } };
    report.usersGivenPreferences = await users.countDocuments(
      preferencesFilter
    );

    if (!dryRun) {
      await users.updateMany(preferencesFilter, {
        $set: {
          preferences: DEFAULT_PREFERENCES,
          timezone: DEFAULT_PREFERENCES.timezone,
          locale: DEFAULT_PREFERENCES.locale,
        },
      });
    }

    return report;
  } finally {
    await client.close();
  }
};

const isEntryPoint = require.main === module;

if (isEntryPoint) {
  const uri = process.env.MONGODB_URI;
  const dryRun = process.argv.includes('--dry-run');

  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  runMigration(uri, dryRun)
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.todosMissingUserIdUnresolved > 0) {
        console.warn(
          `\n${report.todosMissingUserIdUnresolved} todo(s) have no userId and no surviving list. ` +
            'They are unreachable in the application. Decide explicitly whether to delete them; ' +
            'this migration will not.'
        );
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
