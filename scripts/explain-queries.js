#!/usr/bin/env node
/**
 * Runs `explain('executionStats')` for the four query shapes the agent will
 * issue, and reports whether the planner actually *chose* an index for each.
 * Read-only: it plans and executes reads, and writes nothing.
 *
 * An index that exists but is not selected is worse than no index — you pay
 * the write cost and get nothing back. `explain` is the only way to know.
 *
 *   node scripts/explain-queries.js --database todo_dev
 *
 * Credentials come from `MONGODB_URI` in `.env`; `--database` chooses the
 * target, so no connection string is ever typed at a shell prompt.
 */
const { config: loadEnv } = require('dotenv');
const { MongoClient } = require('mongodb');
const { redactCredentials, resolveTarget } = require('./mongo-uri');

/**
 * The four shapes, built from a real userId in the target database. A filter
 * with a made-up id would be planned the same way but would return nothing,
 * making nReturned useless for spotting a query that scans to find nothing.
 */
const queryShapes = (userId, listId) => [
  {
    label: '{ userId }',
    collection: 'todos',
    filter: { userId },
    serves: 'every user-scoped todo read',
  },
  {
    label: '{ userId, todolistId: null }',
    collection: 'todos',
    filter: { userId, todolistId: null },
    serves: 'the inbox',
  },
  {
    label: '{ userId, dueDate: { $lte } }',
    collection: 'todos',
    filter: { userId, dueDate: { $lte: new Date() } },
    serves: 'statistics, "what is due this week"',
  },
  {
    label: '{ _id, todolistId }',
    collection: 'todos',
    filter: { _id: listId?.todoId ?? null, todolistId: listId?.listId ?? null },
    serves: 'a single todo scoped to its list',
  },
];

/** Every stage name in a winning plan, outermost first. */
const stages = (plan) => {
  // MongoDB 8 wraps the classic plan in `queryPlan` when the SBE engine runs.
  let node = plan?.queryPlan ?? plan;
  const found = [];

  while (node) {
    if (node.stage) found.push(node.stage);
    node = node.inputStage ?? node.inputStages?.[0];
  }

  return found;
};

const explainShapes = async (uri) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // A real owner and a real todo, so the filters match something.
    const sample = await db.collection('todos').findOne({});
    const userId = sample?.userId ?? null;
    const listId = sample
      ? { todoId: sample._id, listId: sample.todolistId ?? null }
      : null;

    const results = [];

    for (const shape of queryShapes(userId, listId)) {
      const explained = await db
        .collection(shape.collection)
        .find(shape.filter)
        .explain('executionStats');

      const planStages = stages(explained.queryPlanner?.winningPlan);
      const stats = explained.executionStats ?? {};

      results.push({
        label: shape.label,
        collection: shape.collection,
        serves: shape.serves,
        stages: planStages,
        indexed: planStages.includes('IXSCAN'),
        indexName: explained.queryPlanner?.winningPlan
          ? findIndexName(explained.queryPlanner.winningPlan)
          : undefined,
        totalDocsExamined: stats.totalDocsExamined,
        nReturned: stats.nReturned,
      });
    }

    return { database: db.databaseName, sampled: Boolean(sample), results };
  } finally {
    await client.close();
  }
};

/** The name of the index the winning plan scans, if it scans one. */
const findIndexName = (plan) => {
  let node = plan?.queryPlan ?? plan;

  while (node) {
    if (node.stage === 'IXSCAN') return node.indexName;
    node = node.inputStage ?? node.inputStages?.[0];
  }

  return undefined;
};

const main = async () => {
  loadEnv();

  const { database, uri } = resolveTarget(process.argv);

  console.log(`Target: ${database}  (read-only)`);

  const report = await explainShapes(uri);

  if (!report.sampled) {
    console.log('\nNo todos in this database — filters would match nothing.');
  }

  for (const result of report.results) {
    console.log(`\n${result.label}  (${result.collection})`);
    console.log(`  serves            ${result.serves}`);
    console.log(
      `  winningPlan       ${result.stages.join(' → ') || 'unknown'}`
    );
    console.log(`  index             ${result.indexName ?? 'none (COLLSCAN)'}`);
    console.log(`  totalDocsExamined ${result.totalDocsExamined}`);
    console.log(`  nReturned         ${result.nReturned}`);
  }

  const scans = report.results.filter((result) => !result.indexed);
  if (scans.length) {
    console.log(
      `\n${scans.length} of ${report.results.length} shape(s) chose a COLLSCAN. ` +
        'At small document counts the planner may prefer one because the ' +
        'collection fits in a page or two — that is not proof the index is ' +
        'broken. Re-check at realistic volume before changing anything.'
    );
  }
};

main().catch((error) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error('Explain failed:', redactCredentials(message));
  process.exit(1);
});
