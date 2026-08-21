import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TODO_MODEL_NAME, todoSchema } from '../app/models/todo.model';
import { USER_MODEL_NAME, userSchema } from '../app/models/user.model';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StatsPeriodPipe } from './stats-period.pipe';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TODO_MODEL_NAME, schema: todoSchema },
      { name: USER_MODEL_NAME, schema: userSchema },
    ]),
  ],
  controllers: [UserController, UserPreferencesController],
  providers: [UserService, StatsPeriodPipe, UserPreferencesService],
})
export class UserModule {}
