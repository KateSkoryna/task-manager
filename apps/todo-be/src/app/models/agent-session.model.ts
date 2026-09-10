import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { AGENT_TURN_ROLES } from '@shared/types';

export interface IAgentTurn {
  role: string;
  text: string;
  at: Date;
}

export interface IPendingClarification {
  todoId: Types.ObjectId;
  field: string;
  question: string;
  askedAt: Date;
}

/**
 * A short-lived, single-use token issued when a destructive tool call (e.g.
 * `delete_task`) arrives without confirmation. Consuming it clears this
 * field, which is what makes replay impossible.
 */
export interface IPendingConfirmation {
  token: string;
  toolName: string;
  input: Record<string, unknown>;
  expiresAt: Date;
}

export interface IAgentSessionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  chatId: string;
  turns: IAgentTurn[];
  pendingClarifications: IPendingClarification[];
  lastTaskIds: Types.ObjectId[];
  pendingConfirmation: IPendingConfirmation | null;
  expiresAt: Date;
  /** Incremented on every write so interleaved messages cannot clobber state. */
  version: number;
}

const turnSchema = new Schema<IAgentTurn>(
  {
    role: {
      type: String,
      enum: AGENT_TURN_ROLES as unknown as string[],
      required: true,
    },
    text: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const clarificationSchema = new Schema<IPendingClarification>(
  {
    todoId: { type: Schema.Types.ObjectId, ref: 'Todo', required: true },
    field: {
      type: String,
      enum: ['dueDate', 'priority', 'todolistId'],
      required: true,
    },
    question: { type: String, required: true },
    askedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const pendingConfirmationSchema = new Schema<IPendingConfirmation>(
  {
    token: { type: String, required: true },
    toolName: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

export const AGENT_SESSION_MODEL_NAME = 'AgentSession';
export const agentSessionSchema = new Schema<IAgentSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chatId: { type: String, required: true },
    turns: { type: [turnSchema], default: [] },
    pendingClarifications: { type: [clarificationSchema], default: [] },
    lastTaskIds: { type: [Schema.Types.ObjectId], ref: 'Todo', default: [] },
    pendingConfirmation: { type: pendingConfirmationSchema, default: null },
    expiresAt: { type: Date, required: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * MongoDB removes the document once `expiresAt` passes. `expireAfterSeconds: 0`
 * means "expire at the stored time" rather than "after zero seconds".
 */
agentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/** One live session per chat per user. */
agentSessionSchema.index({ userId: 1, chatId: 1 }, { unique: true });

/**
 * `lastTaskIds` and `pendingClarifications.todoId` are deliberately not
 * indexed. A session is only ever found by `(userId, chatId)` above; those
 * arrays are read *out* of a session already in hand, never searched by. An
 * index on either would be multikey, cost write throughput on every
 * conversational turn, and serve no read.
 */

export const AgentSession =
  (models[AGENT_SESSION_MODEL_NAME] as Model<IAgentSessionDocument>) ||
  model<IAgentSessionDocument>(AGENT_SESSION_MODEL_NAME, agentSessionSchema);
