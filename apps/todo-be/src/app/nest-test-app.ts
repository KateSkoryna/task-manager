import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureApplication, installOpenApi } from '../bootstrap';
import { FIREBASE_ADMIN } from '../integrations/firebase/firebase.constants';

const identities: Record<string, { uid: string; email: string }> = {
  'token-a': { uid: 'firebase-a', email: 'a@example.com' },
  'token-b': { uid: 'firebase-b', email: 'b@example.com' },
  'token-new': { uid: 'firebase-new', email: 'new@example.com' },
};

export async function createNestTestApplication(
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(FIREBASE_ADMIN)
    .useValue({
      auth: () => ({
        verifyIdToken: async (token: string) => {
          const identity = identities[token];
          if (!identity) throw new Error('invalid token');
          return identity;
        },
      }),
    });
  if (configure) builder = configure(builder);

  const module = await builder.compile();

  const app = module.createNestApplication();
  configureApplication(app);
  installOpenApi(app);
  await app.init();
  return app;
}
