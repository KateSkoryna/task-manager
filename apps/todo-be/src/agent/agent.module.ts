import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoModule } from '../todo/todo.module';
import {
  AGENT_SESSION_MODEL_NAME,
  agentSessionSchema,
} from '../app/models/agent-session.model';
import { AgentSessionService } from './agent-session.service';
import { AgentToolsService } from './agent-tools.service';

@Module({
  imports: [
    TodoModule,
    MongooseModule.forFeature([
      { name: AGENT_SESSION_MODEL_NAME, schema: agentSessionSchema },
    ]),
  ],
  providers: [AgentToolsService, AgentSessionService],
  exports: [AgentToolsService, AgentSessionService],
})
export class AgentModule {}
