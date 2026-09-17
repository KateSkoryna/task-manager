#!/usr/bin/env node
/**
 * Idempotent demo data: a login-ready reviewer account with sample todo
 * lists and todos, seeded via the local stack (MongoDB + the Firebase Auth
 * emulator). Safe to run repeatedly — every document is upserted by a
 * stable natural key rather than inserted fresh each time.
 *
 *   npm run seed:demo
 *
 * Then sign in at /login with the printed email/password.
 *
 * Refuses to run against anything but the Firebase Auth emulator: this
 * creates an account with a fixed, published password, which must never
 * exist against a real Firebase project.
 */
const { config: loadEnv } = require('dotenv');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'DemoPass123!';

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const getOrCreateFirebaseUser = async () => {
  try {
    return await admin.auth().getUserByEmail(DEMO_EMAIL);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    return admin.auth().createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: 'Demo Reviewer',
      emailVerified: true,
    });
  }
};

const upsertUser = async (db, firebaseUid) => {
  const now = new Date();
  const { value: user } = await db.collection('users').findOneAndUpdate(
    { firebaseUid },
    {
      $setOnInsert: {
        firebaseUid,
        email: DEMO_EMAIL,
        displayName: 'Demo Reviewer',
        firstName: 'Demo',
        lastName: 'Reviewer',
        username: 'demo-reviewer',
        // aiConsent: true so the agent chat panel and Inbox AI parsing are
        // explorable immediately, without a reviewer needing to find the
        // consent toggle first.
        preferences: {
          timezone: 'UTC',
          locale: 'en',
          reportCadence: 'weekly',
          deliveryHour: 9,
          tone: 'encouraging',
          aiConsent: true,
        },
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return user;
};

// dueDate/completedAt are computed relative to "now" but, like every other
// field here, only ever written on first insert (`$setOnInsert`) — re-running
// this script does not refresh them to stay relative on a later date.
const upsertList = async (db, userId, name, extra) => {
  const now = new Date();
  const { value: list } = await db
    .collection('todolists')
    .findOneAndUpdate(
      { userId, name },
      {
        $setOnInsert: { userId, name, ...extra, createdAt: now },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: 'after' }
    );
  return list;
};

const upsertTodo = async (db, userId, todolistId, name, extra) => {
  const now = new Date();
  await db.collection('todos').findOneAndUpdate(
    { userId, todolistId, name },
    {
      $setOnInsert: {
        userId,
        todolistId,
        name,
        status: 'pending',
        priority: 'medium',
        source: 'web',
        order: 0,
        dueDate: null,
        location: null,
        notes: null,
        completedAt: null,
        image: null,
        ...extra,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true }
  );
};

const seed = async (db, userId) => {
  await upsertTodo(db, userId, null, 'Reply to onboarding email', {
    priority: 'low',
  });
  await upsertTodo(db, userId, null, 'Book dentist appointment', {
    dueDate: daysFromNow(5),
  });

  const groceries = await upsertList(db, userId, 'Groceries', {
    category: 'home',
    priority: 'medium',
  });
  await upsertTodo(db, userId, groceries._id, 'Buy milk and eggs', {
    dueDate: daysFromNow(1),
  });
  await upsertTodo(db, userId, groceries._id, 'Pick up dry cleaning', {
    status: 'successful',
    completedAt: daysFromNow(-2),
  });
  await upsertTodo(db, userId, groceries._id, 'Order birthday cake', {
    priority: 'high',
    dueDate: daysFromNow(3),
  });

  const sprint = await upsertList(db, userId, 'Work Sprint', {
    category: 'work',
    priority: 'high',
  });
  await upsertTodo(db, userId, sprint._id, 'Review pull request #482', {
    priority: 'high',
    dueDate: daysFromNow(-1),
  });
  await upsertTodo(db, userId, sprint._id, 'Write sprint retro notes', {
    dueDate: daysFromNow(2),
  });
  await upsertTodo(db, userId, sprint._id, 'Deploy staging build', {
    status: 'successful',
    completedAt: daysFromNow(-1),
  });

  const goals = await upsertList(db, userId, 'Personal Goals', {
    category: 'health',
    priority: 'low',
  });
  await upsertTodo(db, userId, goals._id, 'Morning run', {
    status: 'successful',
    completedAt: daysFromNow(0),
  });
  await upsertTodo(db, userId, goals._id, 'Read 20 pages', {
    priority: 'low',
  });
};

const main = async () => {
  loadEnv();

  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!emulatorHost) {
    console.error(
      'FIREBASE_AUTH_EMULATOR_HOST is not set. This script only ever seeds ' +
        'the Firebase Auth emulator — it refuses to create a fixed-password ' +
        'account against a real project. Start the emulator first (npm run emulator).'
    );
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('FIREBASE_PROJECT_ID is not set in .env.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  if (!admin.apps.length) admin.initializeApp({ projectId });

  const firebaseUser = await getOrCreateFirebaseUser();

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db();

    const user = await upsertUser(db, firebaseUser.uid);
    await seed(db, user._id);

    console.log('Demo data ready.');
    console.log(`  Sign in at /login with:`);
    console.log(`    email:    ${DEMO_EMAIL}`);
    console.log(`    password: ${DEMO_PASSWORD}`);
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error('Seeding demo data failed:', error);
  process.exit(1);
});
