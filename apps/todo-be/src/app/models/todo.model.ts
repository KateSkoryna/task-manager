import { Schema, model, models, Document, Model, Types } from 'mongoose';
import {
  TODO_PRIORITIES,
  TodoItem,
  TodoPriority,
  TodoSource,
  TodoStatus,
} from '@shared/types';

export interface ITodoDocument
  extends Omit<TodoItem, 'id' | 'todolistId' | 'dueDate' | 'completedAt'>,
    Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  todolistId?: Types.ObjectId | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  order: number;
  priority: TodoPriority;
  source: TodoSource;
  /** Never selected by default; see the `select: false` on the schema path. */
  embedding?: number[];
  embeddingUpdatedAt?: Date | null;
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
    priority: {
      type: String,
      enum: TODO_PRIORITIES as unknown as TodoPriority[],
      default: 'medium',
    },
    source: {
      type: String,
      enum: ['web', 'telegram'] as TodoSource[],
      default: 'web',
    },
    /**
     * Vector embedding of the task text. Excluded from every query by default
     * so a 768-float array never rides along on ordinary todo reads.
     */
    embedding: { type: [Number], select: false, default: undefined },
    embeddingUpdatedAt: { type: Date, default: null },
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
          priority: ret.priority ?? 'medium',
          source: ret.source ?? 'web',
        };
        return todoItem;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

/**
 * Every user-scoped read filters on `userId`, and the inbox and statistics
 * queries add `todolistId` or `dueDate`. Without these the collection is
 * scanned in full on every request.
 */
todoSchema.index({ userId: 1, todolistId: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ todolistId: 1 });

export const Todo =
  (models[TODO_MODEL_NAME] as Model<ITodoDocument>) ||
  model<ITodoDocument>(TODO_MODEL_NAME, todoSchema);
