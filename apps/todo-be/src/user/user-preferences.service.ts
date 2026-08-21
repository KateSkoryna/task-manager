import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserPreferences,
  UserPreferencesUpdate,
  userPreferencesSchema,
} from '@shared/types';
import { IUserDocument, USER_MODEL_NAME } from '../app/models/user.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<IUserDocument>
  ) {}

  findByUserId(userId: string): Promise<UserPreferences | null> {
    return executeOperation('Error fetching preferences', async () => {
      const doc = await this.userModel.findById(userId);
      return doc ? userPreferencesSchema.parse(doc.preferences ?? {}) : null;
    });
  }

  update(
    userId: string,
    input: UserPreferencesUpdate
  ): Promise<UserPreferences | null> {
    return executeOperation('Error updating preferences', async () => {
      const set: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(input)) {
        set[`preferences.${field}`] = value;
      }
      const doc = await this.userModel.findByIdAndUpdate(
        userId,
        { $set: set },
        { new: true }
      );
      return doc ? userPreferencesSchema.parse(doc.preferences ?? {}) : null;
    });
  }
}
