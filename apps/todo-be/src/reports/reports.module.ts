import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AgentModule } from '../agent/agent.module';
import { UserModule } from '../user/user.module';
import { REPORT_MODEL_NAME, reportSchema } from '../app/models/report.model';
import { TODO_MODEL_NAME, todoSchema } from '../app/models/todo.model';
import {
  TODOLIST_MODEL_NAME,
  todolistSchema,
} from '../app/models/todoList.model';
import { USER_MODEL_NAME, userSchema } from '../app/models/user.model';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    AuthModule,
    AgentModule,
    UserModule,
    MongooseModule.forFeature([
      { name: REPORT_MODEL_NAME, schema: reportSchema },
      { name: TODO_MODEL_NAME, schema: todoSchema },
      { name: TODOLIST_MODEL_NAME, schema: todolistSchema },
      { name: USER_MODEL_NAME, schema: userSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
