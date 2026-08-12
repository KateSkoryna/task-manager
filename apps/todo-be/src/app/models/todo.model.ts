import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { TodoItem, TodoStatus } from '@shared/types';

export interface ITodoDocument
  extends Omit<TodoItem, 'id' | 'todolistId' | 'dueDate' | 'completedAt'>,
    Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  todolistId?: Types.ObjectId | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  order: number;
}

export const TODO_MODEL_NAME = 'Todo';
export const todoSchema = new Schema<ITodoDocument>(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'] as TodoStatus[],
      default: 'pending',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    todolistId: {
      type: Schema.Types.ObjectId,
      ref: 'Todolist',
      required: false,
      default: null,
    },
    dueDate: { type: Date, default: null },
    location: { type: String, default: null },
    notes: { type: String, default: null },
    completedAt: { type: Date, default: null },
    image: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: ITodoDocument) => {
        const todoItem: TodoItem = {
          id: ret._id.toString(),
          name: ret.name,
          status: ret.status,
          todolistId: ret.todolistId ? ret.todolistId.toString() : null,
          dueDate: ret.dueDate ? ret.dueDate.toISOString() : null,
          location: ret.location ?? null,
          notes: ret.notes ?? null,
          completedAt: ret.completedAt ? ret.completedAt.toISOString() : null,
          image: ret.image ?? null,
          order: ret.order ?? 0,
        };
        return todoItem;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

export const Todo =
  (models[TODO_MODEL_NAME] as Model<ITodoDocument>) ||
  model<ITodoDocument>(TODO_MODEL_NAME, todoSchema);
