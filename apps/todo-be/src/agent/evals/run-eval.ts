import 'reflect-metadata';
import 'dotenv/config';

// Must run before `nest-test-app` (and therefore `AppModule`) is imported —
// its providers read these once, at module construction time. Mirrors
// `test-env-setup.ts`/`test-setup.ts`, which do the same for the Jest suite.
process.env.AGENT_THROTTLE_LIMIT = process.env.AGENT_THROTTLE_LIMIT || '1000';

import { INestApplication } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createNestTestApplication } from '../../app/nest-test-app';
import { UserModel } from '../../app/models/user.model';
import { DEFAULT_GEMINI_MODEL } from '../agent.service';
import { PROMPT_VERSION } from '../agent.prompt';
import { loadCases } from './load-cases';
import { parseSseFrames } from './sse';
import { scoreCase } from './score-case';
import { EvalCase, EvalCaseResult } from './types';

const EVAL_AUTH_TOKEN = 'token-a';
const EVAL_FIREBASE_UID = 'firebase-a';

// The Gemini free-tier project quota is 15 requests/minute *per model*
// (confirmed live via a 429 RESOURCE_EXHAUSTED response naming that exact
// figure) — comfortably above the 3-6s each real call already takes on its
// own, but 20 cases fired back-to-back with no gap between them still adds
// up to more than 15 within a minute. This spaces every case (including the
// handful that never reach the model at all) so the run never bursts past
// that budget, rather than only pacing the calls that need it.
const MIN_GAP_BETWEEN_CASES_MS = 5_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function resetDatabase(): Promise<void> {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

async function seedEvalUser(): Promise<string> {
  const user = await UserModel.create({
    firebaseUid: EVAL_FIREBASE_UID,
    email: 'eval@example.com',
    displayName: 'Eval User',
    firstName: 'Eval',
    lastName: 'User',
    preferences: { aiConsent: true, timezone: 'UTC' },
  });
  return user._id.toString();
}

async function seedTodos(
  app: INestApplication,
  userId: string,
  names: string[]
): Promise<void> {
  for (const name of names) {
    const res = await request(app.getHttpServer())
      .post(`/api/users/${userId}/todos`)
      .set({ Authorization: `Bearer ${EVAL_AUTH_TOKEN}` })
      .send({ name });
    if (res.status !== 201) {
      throw new Error(
        `Failed to seed todo "${name}": ${res.status} ${res.text}`
      );
    }
  }
}

async function runCase(
  app: INestApplication,
  evalCase: EvalCase
): Promise<EvalCaseResult> {
  await resetDatabase();
  const userId = await seedEvalUser();
  await seedTodos(app, userId, evalCase.seedTodos);

  const startedAt = Date.now();
  const response = await request(app.getHttpServer())
    .post('/api/agent/message')
    .set({ Authorization: `Bearer ${EVAL_AUTH_TOKEN}` })
    .send({ chatId: `eval-${evalCase.id}`, text: evalCase.message });
  const latencyMs = Date.now() - startedAt;

  const events = response.status === 200 ? parseSseFrames(response.text) : [];
  const { pass, reasons } = scoreCase(evalCase, response.status, events);

  return {
    id: evalCase.id,
    category: evalCase.category,
    pass,
    reasons,
    latencyMs,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1
  );
  return sorted[index];
}

function printReport(results: EvalCaseResult[]): void {
  const passed = results.filter((r) => r.pass);
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);

  console.log('\n=== Agent eval report ===');
  console.log(`Model: ${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}`);
  console.log(`Prompt version: ${PROMPT_VERSION}`);
  console.log(
    `Pass rate: ${passed.length}/${results.length} (${(
      (100 * passed.length) /
      results.length
    ).toFixed(1)}%)`
  );
  console.log(`p50 latency: ${percentile(latencies, 50)}ms`);
  console.log(`p95 latency: ${percentile(latencies, 95)}ms`);

  console.log('\nBy case:');
  for (const result of results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(
      `  [${status}] ${result.id} (${result.category}) — ${result.latencyMs}ms`
    );
    if (!result.pass) {
      for (const reason of result.reasons) console.log(`         - ${reason}`);
    }
  }
  console.log('');
}

async function main(): Promise<void> {
  const cases = loadCases();

  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(mongo.getUri());

  const app = await createNestTestApplication();

  const results: EvalCaseResult[] = [];
  try {
    // Sequential, not parallel — the Gemini free-tier project quota this
    // hits is shared and tight (see `AGENT_THROTTLE_LIMIT`'s doc comment in
    // `throttle.config.ts`); bursting 20 requests at once would just spend
    // the run's budget on 429s instead of real results.
    for (let i = 0; i < cases.length; i++) {
      if (i > 0) await sleep(MIN_GAP_BETWEEN_CASES_MS);
      results.push(await runCase(app, cases[i]));
    }
  } finally {
    await app.close();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  }

  printReport(results);

  const allPassed = results.every((r) => r.pass);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
