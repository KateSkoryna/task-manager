import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const usesAuthEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

admin.initializeApp(
  usesAuthEmulator
    ? { projectId }
    : {
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      }
);

export { admin };
