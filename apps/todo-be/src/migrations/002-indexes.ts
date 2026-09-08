/**
 * Creates the indexes every user-scoped and agent query depends on.
 *
 * Idempotent and safe to run twice. With `autoIndex` off in production (see
 * `app.module.ts`), this migration is what actually builds them — index
 * creation becomes a deliberate, auditable step instead of a side effect of a
 * deploy at 3am. Credentials come from `MONGODB_URI` in `.env`; `--database`
 * chooses which database on that cluster to target.
 *
 *   npx ts-node -P apps/todo-be/tsconfig.app.json \
 *     apps/todo-be/src/migrations/002-indexes.ts --database todo --dry-run
 *
 * Drop --dry-run to create. Run it before deploying anything that sets
 * NODE_ENV=production, because from that point nothing else builds indexes.
 */
import { config as loadEnv } from 'dotenv';
import { IndexSpecification, MongoClient, CreateIndexesOptions } from 'mongodb';

interface PlannedIndex {
  collection: string;
  /**
   * Explicit, and equal to the name MongoDB would derive from the key spec.
   * Explicit because an auto-named index silently becomes a *second* index if
   * the spec later changes, instead of a replacement. Equal to the derived
   * name because `autoIndex` already built several of these in production
   * under exactly those names — a different name for the same keys would make
   * `createIndex` conflict rather than no-op.
   */
  name: string;
  key: IndexSpecification;
  options?: CreateIndexesOptions;
  serves: string;
}

export const PLANNED_INDEXES: PlannedIndex[] = [
  {
    collection: 'todos',
    name: 'userId_1_todolistId_1',
    key: { userId: 1, todolistId: 1 },
    serves: 'list views, ownership checks, agent tools',
  },
  {
    collection: 'todos',
    name: 'userId_1_dueDate_1',
    key: { userId: 1, dueDate: 1 },
    serves: 'statistics, "what\'s due this week"',
  },
  {
    collection: 'todos',
    name: 'todolistId_1',
    key: { todolistId: 1 },
    serves: 'the todos virtual populate',
  },
  {
    collection: 'todolists',
    name: 'userId_1',
    key: { userId: 1 },
    serves: 'every authenticated list fetch',
  },
  {
    collection: 'agentsessions',
    name: 'userId_1_chatId_1',
    key: { userId: 1, chatId: 1 },
    options: { unique: true },
    serves: 'session lookup',
  },
  {
    collection: 'agentsessions',
    name: 'expiresAt_1',
    key: { expiresAt: 1 },
    // "Expire at the time stored in the field", not "expire immediately".
    // The TTL monitor runs about once a minute, so expiry is eventually
    // consistent: a session can outlive expiresAt by up to that long.
    options: { expireAfterSeconds: 0 },
    serves: 'session expiry',
  },
];

interface IndexResult {
  collection: string;
  name: string;
  serves: string;
  status: 'created' | 'already present' | 'missing (dry run)';
}

interface MigrationReport {
  database: string;
  dryRun: boolean;
  indexes: IndexResult[];
  created: number;
  alreadyPresent: number;
  missing: number;
}

export const runMigration = async (
  uri: string,
  dryRun = false
): Promise<MigrationReport> => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const report: MigrationReport = {
      database: db.databaseName,
      dryRun,
      indexes: [],
      created: 0,
      alreadyPresent: 0,
      missing: 0,
    };

    for (const planned of PLANNED_INDEXES) {
      const collection = db.collection(planned.collection);

      // An index cannot be present on a collection that does not exist yet;
      // `indexes()` throws in that case rather than returning nothing.
      const present = (await collection
        .indexExists(planned.name)
        .catch(() => false)) as boolean;

      const status: IndexResult['status'] = present
        ? 'already present'
        : dryRun
        ? 'missing (dry run)'
        : 'created';

      if (status === 'created') {
        // createIndex creates the collection if needed, and is a no-op for an
        // identical spec + name.
        await collection.createIndex(planned.key, {
          ...planned.options,
          name: planned.name,
        });
      }

      report.indexes.push({
        collection: planned.collection,
        name: planned.name,
        serves: planned.serves,
        status,
      });
    }

    report.created = report.indexes.filter(
      (index) => index.status === 'created'
    ).length;
    report.alreadyPresent = report.indexes.filter(
      (index) => index.status === 'already present'
    ).length;
    report.missing = report.indexes.filter(
      (index) => index.status === 'missing (dry run)'
    ).length;

    return report;
  } finally {
    await client.close();
  }
};

const isEntryPoint = require.main === module;

/**
 * Removes anything resembling `user:password@` from text before it is printed.
 * Driver errors occasionally echo the connection string, and this script exists
 * to be run against production by hand.
 */
export const redactCredentials = (text: string): string =>
  text.replace(/\/\/[^/@\s]*@/g, '//<redacted>@');

/**
 * Swaps the database name in a connection string, leaving credentials alone.
 * Only the path is replaced — a URI with no path at all (`mongodb://host:27017`)
 * keeps its host, which a "strip from the last slash" rule would eat.
 */
export const withDatabase = (uri: string, database: string): string => {
  const [base, query] = uri.split('?');
  const authority = base.replace(/^([^:]+:\/\/[^/]*)(\/.*)?$/, '$1');
  return `${authority}/${database}${query ? `?${query}` : ''}`;
};

if (isEntryPoint) {
  loadEnv();

  const dryRun = process.argv.includes('--dry-run');
  const databaseFlag = process.argv.indexOf('--database');
  const databaseArg =
    databaseFlag === -1 ? undefined : process.argv[databaseFlag + 1];
  // A following flag is a missing value, not a database called "--verbose".
  const database = databaseArg?.startsWith('--') ? undefined : databaseArg;
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

  const uri = withDatabase(baseUri, database);
  console.log(
    `Target: ${database}${
      dryRun ? '  (dry run, nothing will be created)' : '  (CREATING)'
    }`
  );

  runMigration(uri, dryRun)
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      console.error('Migration failed:', redactCredentials(message));
      process.exit(1);
    });
}
