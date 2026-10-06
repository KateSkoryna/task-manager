/**
 * Gives every existing user the default empty lists (Home, Education, Work,
 * Family, Health) that new users get on signup.
 *
 * Idempotent and safe to run twice: a user who already has a list with a
 * default's name is skipped for that list, so nothing is duplicated and nothing
 * the user renamed or deleted-and-recreated is touched. Credentials come from
 * `MONGODB_URI` in `.env`; `--database` chooses which database on that cluster
 * to target.
 *
 *   npx ts-node -P apps/todo-be/tsconfig.app.json \
 *     apps/todo-be/src/migrations/003-default-lists.ts --database todo --dry-run
 *
 * Drop --dry-run to write.
 */
import { config as loadEnv } from 'dotenv';
import { MongoClient } from 'mongodb';
import { DEFAULT_LISTS } from '../common/default-lists';
import { redactCredentials, withDatabase } from './001-agent-fields';

interface MigrationReport {
  database: string;
  dryRun: boolean;
  usersChecked: number;
  listsCreated: number;
}

export const runMigration = async (
  uri: string,
  dryRun = false
): Promise<MigrationReport> => {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();
    const users = db.collection('users');
    const todolists = db.collection('todolists');

    const report: MigrationReport = {
      database: db.databaseName,
      dryRun,
      usersChecked: 0,
      listsCreated: 0,
    };

    for await (const user of users.find({}, { projection: { _id: 1 } })) {
      report.usersChecked += 1;

      const existing = await todolists
        .find({ userId: user._id }, { projection: { name: 1 } })
        .toArray();
      const taken = new Set(existing.map((list) => list.name));
      const now = new Date();
      const missing = DEFAULT_LISTS.filter(({ name }) => !taken.has(name)).map(
        (list) => ({
          ...list,
          isDefault: true,
          userId: user._id,
          createdAt: now,
          updatedAt: now,
        })
      );

      report.listsCreated += missing.length;
      if (!dryRun && missing.length > 0) {
        await todolists.insertMany(missing);
      }
    }

    return report;
  } finally {
    await client.close();
  }
};

if (require.main === module) {
  loadEnv();

  const dryRun = process.argv.includes('--dry-run');
  const databaseFlag = process.argv.indexOf('--database');
  const database =
    databaseFlag === -1 ? undefined : process.argv[databaseFlag + 1];
  const baseUri = process.env.MONGODB_URI;

  if (!baseUri) {
    console.error('MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  if (!database) {
    console.error(
      'Pass --database <name>, for example --database todo or --database todo_dev.'
    );
    process.exit(1);
  }

  console.log(
    `Target: ${database}${
      dryRun ? '  (dry run, nothing will be written)' : '  (WRITING)'
    }`
  );

  runMigration(withDatabase(baseUri, database), dryRun)
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      console.error('Migration failed:', redactCredentials(message));
      process.exit(1);
    });
}
