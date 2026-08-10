import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { User } from '@shared/types';

export interface IUserDocument extends Omit<User, 'id'>, Document {
  _id: Types.ObjectId;
}

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
        };
        return user;
      },
    },
    toObject: { virtuals: true },
  }
);

export const UserModel =
  (models[USER_MODEL_NAME] as Model<IUserDocument>) ||
  model<IUserDocument>(USER_MODEL_NAME, userSchema);
