import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  TODOLIST_MODEL_NAME,
  todolistSchema,
} from '../app/models/todoList.model';
import { TodolistController } from './todolist.controller';
import { TodolistService } from './todolist.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TODOLIST_MODEL_NAME, schema: todolistSchema },
    ]),
  ],
  controllers: [TodolistController],
  providers: [TodolistService],
  exports: [TodolistService],
})
export class TodolistModule {}
