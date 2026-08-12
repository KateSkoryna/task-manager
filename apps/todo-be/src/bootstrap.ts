import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function resolveCorsOrigin(): string[] | boolean {
  const origins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins?.length) return origins;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  }
  return true;
}

export function configureApplication(app: INestApplication): void {
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({ origin: resolveCorsOrigin() });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Todo List API')
    .setDescription('Authenticated todo-list and todo operations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function installOpenApi(app: INestApplication): void {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/api-docs-json',
  });
}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApplication(app);
  installOpenApi(app);
  return app;
}
