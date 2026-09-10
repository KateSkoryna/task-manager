import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleGenAI } from '@google/genai';
import { AuthModule } from '../auth/auth.module';
import { TodoModule } from '../todo/todo.module';
import { UserModule } from '../user/user.module';
import {
  AGENT_SESSION_MODEL_NAME,
  agentSessionSchema,
} from '../app/models/agent-session.model';
import { AgentController } from './agent.controller';
import { AgentSessionService } from './agent-session.service';
import { AgentToolsService } from './agent-tools.service';
import { AgentService, GEMINI_CLIENT } from './agent.service';

@Module({
  imports: [
    AuthModule,
    TodoModule,
    UserModule,
    MongooseModule.forFeature([
      { name: AGENT_SESSION_MODEL_NAME, schema: agentSessionSchema },
    ]),
  ],
  controllers: [AgentController],
  providers: [
    AgentToolsService,
    AgentSessionService,
    AgentService,
    {
      provide: GEMINI_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new GoogleGenAI({
          apiKey: configService.get<string>('GEMINI_API_KEY'),
        }),
    },
  ],
  exports: [AgentToolsService, AgentSessionService, AgentService],
})
export class AgentModule {}
