import 'dotenv/config';
import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { MongoClient, ObjectId } from 'mongodb';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const nxPreset = nxE2EPreset(__filename);

export default defineConfig({
  e2e: {
    ...nxPreset,
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1440,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      nxPreset.setupNodeEvents?.(on, config);
      on('task', {
        async cleanupAuthenticatedSmoke({
          userId,
          firebaseUid,
        }: {
          userId: string;
          firebaseUid: string;
        }) {
          const mongoUri = process.env.MONGODB_URI;
          if (!mongoUri) throw new Error('MONGODB_URI is required for cleanup');

          const client = await MongoClient.connect(mongoUri);
          try {
            const db = client.db();
            const userObjectId = new ObjectId(userId);
            const lists = await db
              .collection('todolists')
              .find({ userId: userObjectId }, { projection: { _id: 1 } })
              .toArray();
            await db.collection('todos').deleteMany({
              todolistId: { $in: lists.map((list) => list._id) },
            });
            await db
              .collection('todolists')
              .deleteMany({ userId: userObjectId });
            await db.collection('users').deleteOne({ _id: userObjectId });
          } finally {
            await client.close();
          }

          const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
          if (emulatorHost) {
            const projectId =
              process.env.NX_FIREBASE_PROJECT_ID ||
              process.env.FIREBASE_PROJECT_ID;
            if (!projectId) {
              throw new Error('FIREBASE_PROJECT_ID is required for cleanup');
            }
            const firebaseApp = getApps().length
              ? getApp()
              : initializeApp({ projectId });
            await getAuth(firebaseApp).deleteUser(firebaseUid);
          }
          return null;
        },
      });
      return config;
    },
  },
});
