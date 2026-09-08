import mongoose from 'mongoose';
import {
  PLANNED_INDEXES,
  redactCredentials,
  runMigration,
  withDatabase,
} from '../migrations/002-indexes';

describe('migration 002 — indexes', () => {
  const uri = () => process.env.MONGODB_URI as string;

  const collectionNames = [
    ...new Set(PLANNED_INDEXES.map((index) => index.collection)),
  ];

  // The shared test setup only empties collections; it leaves indexes behind,
  // and registering a Mongoose model builds them. Dropping the collections
  // outright is what guarantees the migration starts from nothing.
  beforeEach(async () => {
    for (const name of collectionNames) {
      await mongoose.connection
        .collection(name)
        .drop()
        .catch(() => undefined);
    }
  });

  const indexNames = async (collection: string) => {
    const indexes = await mongoose.connection
      .collection(collection)
      .indexes()
      .catch(() => []);
    return (indexes as { name: string }[]).map((index) => index.name);
  };

  it('reports every missing index in dry-run mode without creating any', async () => {
    const report = await runMigration(uri(), true);

    expect(report.dryRun).toBe(true);
    expect(report.missing).toBe(PLANNED_INDEXES.length);
    expect(report.created).toBe(0);
    expect(report.indexes.map((index) => index.name)).toEqual(
      PLANNED_INDEXES.map((index) => index.name)
    );

    for (const collection of collectionNames) {
      expect(await indexNames(collection)).not.toContain(
        PLANNED_INDEXES.find((index) => index.collection === collection)?.name
      );
    }
  });

  it('creates every planned index', async () => {
    const report = await runMigration(uri());

    expect(report.created).toBe(PLANNED_INDEXES.length);
    expect(report.missing).toBe(0);

    for (const planned of PLANNED_INDEXES) {
      expect(await indexNames(planned.collection)).toContain(planned.name);
    }
  });

  it('is a no-op on a second run', async () => {
    await runMigration(uri());
    const second = await runMigration(uri());

    expect(second.alreadyPresent).toBe(PLANNED_INDEXES.length);
    expect(second.created).toBe(0);
  });

  it('reports already-present indexes in a dry run', async () => {
    await runMigration(uri());
    const report = await runMigration(uri(), true);

    expect(report.alreadyPresent).toBe(PLANNED_INDEXES.length);
    expect(report.missing).toBe(0);
  });

  it('creates the session TTL index as expire-at-stored-time', async () => {
    await runMigration(uri());

    const indexes = (await mongoose.connection
      .collection('agentsessions')
      .indexes()) as { name: string; expireAfterSeconds?: number }[];
    const ttl = indexes.find((index) => index.name === 'expiresAt_1');

    // 0 means "expire at the time in expiresAt", not "expire immediately".
    expect(ttl?.expireAfterSeconds).toBe(0);
  });

  it('creates the session lookup index as unique', async () => {
    await runMigration(uri());

    const indexes = (await mongoose.connection
      .collection('agentsessions')
      .indexes()) as { name: string; unique?: boolean }[];
    const lookup = indexes.find((index) => index.name === 'userId_1_chatId_1');

    expect(lookup?.unique).toBe(true);
  });

  // Production already carries several of these under MongoDB's derived names,
  // built by autoIndex. A different explicit name for the same keys would make
  // createIndex conflict instead of no-op, so the two must stay equal.
  it('names each index exactly as MongoDB would derive it from the keys', () => {
    for (const planned of PLANNED_INDEXES) {
      const derived = Object.entries(planned.key as Record<string, number>)
        .map(([field, direction]) => `${field}_${direction}`)
        .join('_');
      expect(planned.name).toBe(derived);
    }
  });
});

/**
 * Obviously-synthetic credentials against `example.invalid`, a domain IANA
 * reserves so it can never resolve. Realistic-looking values here trip GitHub
 * secret scanning on a public repository.
 */
const PLACEHOLDER_CREDENTIALS = 'placeholder-user:placeholder-value';

describe('002 withDatabase', () => {
  it('swaps the database while preserving credentials and options', () => {
    expect(
      withDatabase(
        `mongodb+srv://${PLACEHOLDER_CREDENTIALS}@cluster.example.invalid/todo_dev?w=1`,
        'todo'
      )
    ).toBe(
      `mongodb+srv://${PLACEHOLDER_CREDENTIALS}@cluster.example.invalid/todo?w=1`
    );
  });

  it('keeps the host when the URI has no database path', () => {
    expect(withDatabase('mongodb://localhost:27017', 'todo')).toBe(
      'mongodb://localhost:27017/todo'
    );
  });
});

describe('002 redactCredentials', () => {
  it('removes credentials with or without a password', () => {
    expect(
      redactCredentials(
        `mongodb+srv://${PLACEHOLDER_CREDENTIALS}@cluster.example.invalid/todo`
      )
    ).toBe('mongodb+srv://<redacted>@cluster.example.invalid/todo');
    expect(
      redactCredentials(
        'mongodb://placeholder-user@cluster.example.invalid/todo'
      )
    ).toBe('mongodb://<redacted>@cluster.example.invalid/todo');
  });

  it('leaves a credential-free string untouched', () => {
    const text = 'querySrv EBADNAME _mongodb._tcp.cluster.example.invalid';
    expect(redactCredentials(text)).toBe(text);
  });
});
