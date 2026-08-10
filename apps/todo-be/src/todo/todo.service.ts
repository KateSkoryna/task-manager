import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TodoCreateInput, TodoItem, TodoUpdateInput } from '@shared/types';
import { ITodoDocument, TODO_MODEL_NAME } from '../app/models/todo.model';
import {
  ITodolistDocument,
  TODOLIST_MODEL_NAME,
} from '../app/models/todoList.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(TODO_MODEL_NAME)
    private readonly todoModel: Model<ITodoDocument>,
    @InjectModel(TODOLIST_MODEL_NAME)
    private readonly todolistModel: Model<ITodolistDocument>
  ) {}

  async listExists(id: string, userId: string): Promise<boolean> {
    return Boolean(await this.todolistModel.exists({ _id: id, userId }));
  }

  async findById(id: string, todolistId: string): Promise<TodoItem | null> {
    const doc = await this.todoModel.findOne({ _id: id, todolistId });
    return doc ? (doc.toJSON() as TodoItem) : null;
  }

  create(todolistId: string, input: TodoCreateInput): Promise<TodoItem> {
    return executeOperation('Error creating todo', async () => {
      const doc = await this.todoModel.create({
        ...input,
        todolistId,
        dueDate: input.dueDate ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        completedAt: input.completedAt ?? null,
        image: input.image ?? null,
      });
      return doc.toJSON() as TodoItem;
    });
  }

  update(
    id: string,
    todolistId: string,
    input: TodoUpdateInput
  ): Promise<TodoItem | null> {
    return executeOperation('Error updating todo', async () => {
      const doc = await this.todoModel.findOneAndUpdate(
        { _id: id, todolistId },
        input,
        { new: true }
      );
      return doc
        ? ((doc as unknown as { toJSON(): unknown }).toJSON() as TodoItem)
        : null;
    });
  }

  delete(id: string, todolistId: string): Promise<TodoItem | null> {
    return executeOperation('Error deleting todo', async () => {
      const doc = await this.todoModel.findOneAndDelete({
        _id: id,
        todolistId,
      });
      return doc
        ? ((doc as unknown as { toJSON(): unknown }).toJSON() as TodoItem)
        : null;
    });
  }
}
