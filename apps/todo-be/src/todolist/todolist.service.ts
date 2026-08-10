import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TodoList,
  TodolistCreateInput,
  TodolistUpdateInput,
} from '@shared/types';
import {
  ITodolistDocument,
  TODOLIST_MODEL_NAME,
} from '../app/models/todoList.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class TodolistService {
  constructor(
    @InjectModel(TODOLIST_MODEL_NAME)
    private readonly todolistModel: Model<ITodolistDocument>
  ) {}

  findAll(userId: string): Promise<TodoList[]> {
    return executeOperation('Error fetching todolists', async () => {
      const docs = await this.todolistModel.find({ userId }).populate('todos');
      return docs.map((doc) => doc.toJSON() as TodoList);
    });
  }

  findById(id: string, userId: string): Promise<TodoList | null> {
    return executeOperation('Error fetching todolist', async () => {
      const doc = await this.todolistModel
        .findOne({ _id: id, userId })
        .populate('todos');
      return doc
        ? ((doc as unknown as { toJSON(): unknown }).toJSON() as TodoList)
        : null;
    });
  }

  create(userId: string, input: TodolistCreateInput): Promise<TodoList> {
    return executeOperation('Error creating todolist', async () => {
      const doc = await this.todolistModel.create({ ...input, userId });
      return doc.toJSON() as TodoList;
    });
  }

  update(
    id: string,
    userId: string,
    input: TodolistUpdateInput
  ): Promise<TodoList | null> {
    return executeOperation('Error updating todolist', async () => {
      const doc = await this.todolistModel.findOneAndUpdate(
        { _id: id, userId },
        input,
        { new: true }
      );
      return doc
        ? ((doc as unknown as { toJSON(): unknown }).toJSON() as TodoList)
        : null;
    });
  }

  delete(id: string, userId: string): Promise<TodoList | null> {
    return executeOperation('Error deleting todolist', async () => {
      const doc = await this.todolistModel.findOneAndDelete({
        _id: id,
        userId,
      });
      return doc
        ? ((doc as unknown as { toJSON(): unknown }).toJSON() as TodoList)
        : null;
    });
  }
}
