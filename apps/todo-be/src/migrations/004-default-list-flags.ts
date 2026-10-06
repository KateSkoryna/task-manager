/**
 * Flags the default lists (Home, Education, Work, Family, Health) that
 * already exist, so their names are locked the same way as lists seeded from
 * now on.
 *
 * A list counts as default when its name AND category both match one of the
 * defaults, for example "Work" in the `work` category. Idempotent and safe to
 * run twice. Credentials come from `MONGODB_URI` in `.env`; `--database`
 * chooses which database on that cluster to target.
 *
 *   npx ts-node -P apps/todo-be/tsconfig.app.json \
 *     apps/todo-be/src/migrations/004-default-list-flags.ts --database todo --dry-run
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
  listsFlagged: number;
}

export const runMigration = async (
  uri: string,
  dryRun = false
): Promise<MigrationReport> => {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();
    const todolists = db.collection('todolists');
    const filter = {
      isDefault: { $ne: true },
      $or: DEFAULT_LISTS.map(({ name, category }) => ({ name, category })),
    };

    const report: MigrationReport = {
      database: db.databaseName,
      dryRun,
      listsFlagged: await todolists.countDocuments(filter),
    };

    if (!dryRun) {
      await todolists.updateMany(filter, { $set: { isDefault: true } });
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
