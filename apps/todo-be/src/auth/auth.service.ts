import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@shared/types';
import { IUserDocument, USER_MODEL_NAME } from '../app/models/user.model';
import { executeOperation } from '../common/utils/execute-operation';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<IUserDocument>
  ) {}

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ firebaseUid });
    return doc ? (doc.toJSON() as User) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id);
    return doc ? (doc.toJSON() as User) : null;
  }

  provision(
    firebaseUid: string,
    email: string,
    input: { firstName?: string; lastName?: string; username?: string }
  ): Promise<User> {
    return executeOperation('Error provisioning user', async () => {
      let doc = await this.userModel.findOne({ firebaseUid });
      if (!doc) {
        doc = await this.userModel.findOneAndUpdate(
          { email },
          { firebaseUid },
          { new: true }
        );
      }
      if (!doc) {
        const firstName = input.firstName || '';
        const lastName = input.lastName || '';
        const fallback = email.split('@')[0];
        doc = await this.userModel.create({
          firebaseUid,
          email,
          firstName,
          lastName,
          username: input.username || fallback,
          displayName: `${firstName} ${lastName}`.trim() || fallback,
        });
      }
      return doc.toJSON() as User;
    });
  }
}
