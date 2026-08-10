import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './todo/todo.module';
import { TodolistModule } from './todolist/todolist.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AuthModule,
    TodolistModule,
    TodoModule,
    UserModule,
  ],
})
export class AppModule {}
