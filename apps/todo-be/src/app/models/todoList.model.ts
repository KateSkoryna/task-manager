import { Schema, model, models, Document, Model, Types } from 'mongoose';
import {
  TodoList,
  TodoItem,
  TodoListPriority,
  TodoListCategory,
} from '@shared/types';

export interface ITodolistDocument
  extends Omit<
      TodoList,
      'id' | 'userId' | 'dueDate' | 'createdAt' | 'updatedAt'
    >,
    Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  priority?: TodoListPriority;
  category?: TodoListCategory;
  dueDate?: Date | null;
  notes?: string | null;
}

export const TODOLIST_MODEL_NAME = 'Todolist';
export const todolistSchema = new Schema<ITodolistDocument>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: undefined,
    },
    category: {
      type: String,
      enum: ['home', 'education', 'work', 'family', 'health'],
      default: undefined,
    },
    dueDate: { type: Date, default: undefined },
    notes: { type: String, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: ITodolistDocument) => {
        const todolist: TodoList = {
          id: ret._id.toString(),
          name: ret.name,
          userId: ret.userId.toString(),
          todos: (ret.todos as TodoItem[]) || [],
          priority: ret.priority,
          category: ret.category,
          dueDate: ret.dueDate ? ret.dueDate.toISOString() : null,
          notes: ret.notes,
          createdAt: (
            ret as unknown as { createdAt: Date }
          ).createdAt?.toISOString(),
          updatedAt: (
            ret as unknown as { updatedAt: Date }
          ).updatedAt?.toISOString(),
        };
        return todolist;
      },
    },
    toObject: { virtuals: true },
  }
);

todolistSchema.virtual('todos', {
  ref: 'Todo',
  localField: '_id',
  foreignField: 'todolistId',
});

export const Todolist =
  (models[TODOLIST_MODEL_NAME] as Model<ITodolistDocument>) ||
  model<ITodolistDocument>(TODOLIST_MODEL_NAME, todolistSchema);
