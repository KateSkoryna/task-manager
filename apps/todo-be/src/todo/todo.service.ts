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

  create(
    todolistId: string | null,
    input: TodoCreateInput,
    userId?: string
  ): Promise<TodoItem> {
    return executeOperation('Error creating todo', async () => {
      const doc = await this.todoModel.create({
        ...input,
        userId,
        todolistId,
        dueDate: input.dueDate ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        completedAt: input.completedAt ?? null,
        image: input.image ?? null,
        order: input.order ?? 0,
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

  /**
   * Ownership-based lookup used by the inbox/unified todo routes, where a
   * todo may not belong to any list. Falls back to list ownership for todos
   * created before the userId field existed.
   */
  private async findOwned(
    id: string,
    userId: string
  ): Promise<ITodoDocument | null> {
    const doc = await this.todoModel.findById(id);
    if (!doc) return null;
    if (doc.userId) return doc.userId.toString() === userId ? doc : null;
    if (
      doc.todolistId &&
      (await this.listExists(doc.todolistId.toString(), userId))
    ) {
      return doc;
    }
    return null;
  }

  findInbox(userId: string): Promise<TodoItem[]> {
    return executeOperation('Error fetching inbox todos', async () => {
      const docs = await this.todoModel
        .find({ userId, todolistId: null })
        .sort({ order: 1, createdAt: 1 });
      return docs.map((doc) => doc.toJSON() as TodoItem);
    });
  }

  updateOwned(
    id: string,
    userId: string,
    input: TodoUpdateInput
  ): Promise<TodoItem | null> {
    return executeOperation('Error updating todo', async () => {
      const doc = await this.findOwned(id, userId);
      if (!doc) return null;
      doc.set({ ...input, userId: doc.userId ?? userId });
      await doc.save();
      return doc.toJSON() as TodoItem;
    });
  }

  deleteOwned(id: string, userId: string): Promise<TodoItem | null> {
    return executeOperation('Error deleting todo', async () => {
      const doc = await this.findOwned(id, userId);
      if (!doc) return null;
      await doc.deleteOne();
      return doc.toJSON() as TodoItem;
    });
  }
}
