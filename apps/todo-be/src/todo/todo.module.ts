import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TODO_MODEL_NAME, todoSchema } from '../app/models/todo.model';
import {
  TODOLIST_MODEL_NAME,
  todolistSchema,
} from '../app/models/todoList.model';
import { TodoController } from './todo.controller';
import { TodoInboxController } from './todo-inbox.controller';
import { TodoService } from './todo.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TODO_MODEL_NAME, schema: todoSchema },
      { name: TODOLIST_MODEL_NAME, schema: todolistSchema },
    ]),
  ],
  controllers: [TodoController, TodoInboxController],
  providers: [TodoService],
  exports: [TodoService],
})
export class TodoModule {}
