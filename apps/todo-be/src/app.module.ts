import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
} from './common/config/throttle.config';
import { HealthModule } from './health/health.module';
import { TodoModule } from './todo/todo.module';
import { TodolistModule } from './todolist/todolist.module';
import { UserModule } from './user/user.module';

const REQUEST_ID_PATTERN = /^[\w-]{1,100}$/;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id =
            typeof existing === 'string' && REQUEST_ID_PATTERN.test(existing)
              ? existing
              : randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        serializers: {
          req: (req) => ({ id: req.id, method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error(
            'MONGODB_URI is not defined in environment variables. Please check your .env file or environment setup.'
          );
        }
        return { uri };
      },
    }),
    ThrottlerModule.forRoot([
      { ttl: DEFAULT_THROTTLE_TTL_MS, limit: DEFAULT_THROTTLE_LIMIT },
    ]),
    AuthModule,
    TodolistModule,
    TodoModule,
    UserModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
