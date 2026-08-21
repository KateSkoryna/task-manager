import { Schema, model, models, Document, Model, Types } from 'mongoose';
import {
  DEFAULT_USER_PREFERENCES,
  REPORT_CADENCES,
  REPORT_TONES,
  SUPPORTED_LOCALES,
  User,
  UserPreferences,
} from '@shared/types';

/**
 * `telegramLinked` is derived in `toJSON` rather than stored, so it is omitted
 * from the document type. The chat id lives here and never leaves the server.
 */
export interface IUserDocument
  extends Omit<User, 'id' | 'telegramLinked'>,
    Document {
  _id: Types.ObjectId;
  preferences: UserPreferences;
  telegram?: {
    chatId?: string;
    linkedAt?: Date;
    username?: string;
  };
}

const preferencesSchema = new Schema<UserPreferences>(
  {
    timezone: { type: String, default: DEFAULT_USER_PREFERENCES.timezone },
    locale: {
      type: String,
      enum: SUPPORTED_LOCALES as unknown as string[],
      default: DEFAULT_USER_PREFERENCES.locale,
    },
    reportCadence: {
      type: String,
      enum: REPORT_CADENCES as unknown as string[],
      default: DEFAULT_USER_PREFERENCES.reportCadence,
    },
    deliveryHour: {
      type: Number,
      min: 0,
      max: 23,
      default: DEFAULT_USER_PREFERENCES.deliveryHour,
    },
    tone: {
      type: String,
      enum: REPORT_TONES as unknown as string[],
      default: DEFAULT_USER_PREFERENCES.tone,
    },
    aiConsent: { type: Boolean, default: DEFAULT_USER_PREFERENCES.aiConsent },
  },
  { _id: false }
);

const telegramSchema = new Schema(
  {
    chatId: { type: String },
    linkedAt: { type: Date },
    username: { type: String, trim: true },
  },
  { _id: false }
);

export const USER_MODEL_NAME = 'User';
export const userSchema = new Schema<IUserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, trim: true, sparse: true },
    preferences: {
      type: preferencesSchema,
      default: () => ({ ...DEFAULT_USER_PREFERENCES }),
    },
    telegram: { type: telegramSchema, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: IUserDocument) => {
        const user: User = {
          id: ret._id.toString(),
          firebaseUid: ret.firebaseUid,
          email: ret.email,
          displayName: ret.displayName,
          firstName: ret.firstName,
          lastName: ret.lastName,
          username: ret.username,
          createdAt: ret.createdAt as unknown as string,
          updatedAt: ret.updatedAt as unknown as string,
          preferences: {
            ...DEFAULT_USER_PREFERENCES,
            ...(ret.preferences ?? {}),
          },
          telegramLinked: Boolean(ret.telegram?.chatId),
        };
        return user;
      },
    },
    toObject: { virtuals: true },
  }
);

/**
 * Unique so one chat can never be bound to two accounts. The partial filter
 * indexes only documents where the chat id is actually a string, so the many
 * users with no Telegram subdocument — or an explicit null — do not collide
 * with each other. MongoDB rejects combining this with `sparse`.
 */
userSchema.index(
  { 'telegram.chatId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'telegram.chatId': { $type: 'string' } },
  }
);

export const UserModel =
  (models[USER_MODEL_NAME] as Model<IUserDocument>) ||
  model<IUserDocument>(USER_MODEL_NAME, userSchema);
