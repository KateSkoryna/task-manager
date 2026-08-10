import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TODO_MODEL_NAME, todoSchema } from '../app/models/todo.model';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StatsPeriodPipe } from './stats-period.pipe';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: TODO_MODEL_NAME, schema: todoSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, StatsPeriodPipe],
})
export class UserModule {}
