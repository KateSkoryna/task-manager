import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from './firebase.constants';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): typeof admin => {
        if (!admin.apps.length) {
          const projectId = config.get<string>('FIREBASE_PROJECT_ID');
          const usesAuthEmulator = Boolean(
            config.get<string>('FIREBASE_AUTH_EMULATOR_HOST')
          );
          admin.initializeApp(
            usesAuthEmulator
              ? { projectId }
              : {
                  credential: admin.credential.cert({
                    projectId,
                    clientEmail: config.get<string>('FIREBASE_CLIENT_EMAIL'),
                    privateKey: config
                      .get<string>('FIREBASE_PRIVATE_KEY')
                      ?.replace(/\\n/g, '\n'),
                  }),
                }
          );
        }
        return admin;
      },
    },
  ],
  exports: [FIREBASE_ADMIN],
})
export class FirebaseModule {}
