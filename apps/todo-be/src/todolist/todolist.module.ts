import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  TODOLIST_MODEL_NAME,
  todolistSchema,
} from '../app/models/todoList.model';
import { TODO_MODEL_NAME, todoSchema } from '../app/models/todo.model';
import { TodolistController } from './todolist.controller';
import { TodolistService } from './todolist.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TODOLIST_MODEL_NAME, schema: todolistSchema },
      { name: TODO_MODEL_NAME, schema: todoSchema },
    ]),
  ],
  controllers: [TodolistController],
  providers: [TodolistService],
  exports: [TodolistService],
})
export class TodolistModule {}
