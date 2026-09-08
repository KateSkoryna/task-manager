#!/usr/bin/env node
/**
 * Prints the indexes that actually exist on the collections the agent will
 * query. Read-only: it never creates, drops, or writes anything.
 *
 * A `schema.index(...)` declaration in Mongoose is a build instruction, not an
 * index — it only takes effect on connect, and only while `autoIndex` is on.
 * This script reports what the database has, so the index migration is written
 * against reality rather than against the models.
 *
 *   node scripts/list-indexes.js --database todo_dev
 *
 * Credentials come from `MONGODB_URI` in `.env`; `--database` chooses which
 * database on that cluster to target, so no connection string is ever typed at
 * a shell prompt.
 */
const { config: loadEnv } = require('dotenv');
const { MongoClient } = require('mongodb');

const { redactCredentials, resolveTarget } = require('./mongo-uri');

const COLLECTIONS = ['todos', 'todolists', 'users', 'agentsessions'];

/**
 * Indexes for one collection, or `null` when the collection does not exist
 * yet — an absent `agentsessions` is expected before the agent has ever run,
 * and is not the same finding as a collection with only `_id_`.
 */
const getIndexes = async (db, name) => {
  const [existing] = await db.listCollections({ name }).toArray();
  if (!existing) return null;
  return db.collection(name).indexes();
};

const listIndexes = async (uri) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const report = { database: db.databaseName, collections: {} };

    for (const name of COLLECTIONS) {
      report.collections[name] = await getIndexes(db, name);
    }

    return report;
  } finally {
    await client.close();
  }
};

const main = async () => {
  loadEnv();

  const { database, uri } = resolveTarget(process.argv);

  console.log(`Target: ${database}  (read-only)`);

  const report = await listIndexes(uri);

  for (const name of COLLECTIONS) {
    const indexes = report.collections[name];
    console.log(`\n${name}`);

    if (indexes === null) {
      console.log('  (collection does not exist)');
      continue;
    }

    for (const index of indexes) {
      // unique/sparse/partial change what an index is usable for, so they
      // belong in the audit output, not just the key spec.
      const options = ['unique', 'sparse']
        .filter((option) => index[option])
        .concat(index.partialFilterExpression ? 'partial' : []);

      console.log(
        `  ${index.name}  ${JSON.stringify(index.key)}${
          options.length ? `  [${options.join(', ')}]` : ''
        }`
      );
    }
  }
};

main().catch((error) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error('Listing indexes failed:', redactCredentials(message));
  process.exit(1);
});
