import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PaginatedResult,
  PaginationQuery,
  TodoList,
  TodolistCreateInput,
  TodolistUpdateInput,
} from '@shared/types';
import {
  ITodolistDocument,
  TODOLIST_MODEL_NAME,
} from '../app/models/todoList.model';
import { ITodoDocument, TODO_MODEL_NAME } from '../app/models/todo.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class TodolistService {
  constructor(
    @InjectModel(TODOLIST_MODEL_NAME)
    private readonly todolistModel: Model<ITodolistDocument>,
    @InjectModel(TODO_MODEL_NAME)
    private readonly todoModel: Model<ITodoDocument>
  ) {}

  findAll(
    userId: string,
    { cursor, limit }: PaginationQuery
  ): Promise<PaginatedResult<TodoList>> {
    return executeOperation('Error fetching todolists', async () => {
      const filter: FilterQuery<ITodolistDocument> = { userId };
      if (cursor) filter._id = { $gt: new Types.ObjectId(cursor) };

      const docs = await this.todolistModel
        .find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .populate('todos');

      const hasMore = docs.length > limit;
      const page = hasMore ? docs.slice(0, limit) : docs;
      return {
        items: page.map((doc) => doc.toJSON() as TodoList),
        nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
      };
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

  /**
   * Deleting a list keeps its todos: they move to the inbox rather than being
   * removed with it. The todos are reparented before the list is deleted, so a
   * failure leaves an empty list instead of todos with no reachable owner.
   */
  delete(id: string, userId: string): Promise<TodoList | null> {
    return executeOperation('Error deleting todolist', async () => {
      const doc = await this.todolistModel.findOne({ _id: id, userId });
      if (!doc) return null;

      await this.todoModel.updateMany(
        { todolistId: doc._id },
        { $set: { todolistId: null, userId: doc.userId } }
      );
      await doc.deleteOne();

      return doc.toJSON() as TodoList;
    });
  }
}
