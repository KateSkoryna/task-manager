import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import {
  AgentMessageInput,
  agentMessageInputSchema,
  AgentTurn,
  dayKeyInZone,
  ParsedTask,
  ParseTodoInput,
  parseTodoInputSchema,
} from '@shared/types';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
  AGENT_THROTTLE_LIMIT,
  AGENT_THROTTLE_TTL_MS,
} from '../common/config/throttle.config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { zodToApiSchema } from '../common/openapi/zod-schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserPreferencesService } from '../user/user-preferences.service';
import { AgentSessionService } from './agent-session.service';
import { AgentService } from './agent.service';
import { AgentThrottlerGuard } from './agent-throttler.guard';

const sessionTurnToAgentTurn = (turn: {
  role: string;
  text: string;
  at: Date;
}): AgentTurn => ({
  role: turn.role === 'assistant' ? 'assistant' : 'user',
  text: turn.text,
  at: turn.at.toISOString(),
});

const writeEvent = (res: Response, event: string, data: unknown): void => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

const AI_CONSENT_REQUIRED = {
  code: 'ai_consent_required',
  message: 'Enable AI assistance in your preferences to use the agent.',
};

@ApiTags('agent')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, AgentThrottlerGuard)
// The global per-client ThrottlerGuard (APP_GUARD) still runs too and caps
// each caller individually. AgentThrottlerGuard adds a second check against
// the same numbers, tracked by one shared bucket instead of per-client — the
// real constraint here is a single project-wide Gemini quota, not fairness
// between callers, and two guards is simpler than fighting Nest's metadata
// system to make one guard behave differently per instance.
@Throttle({
  default: { limit: AGENT_THROTTLE_LIMIT, ttl: AGENT_THROTTLE_TTL_MS },
})
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly agentSessionService: AgentSessionService,
    private readonly userPreferencesService: UserPreferencesService
  ) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the conversational agent' })
  @ApiBody({ schema: zodToApiSchema(agentMessageInputSchema) })
  @ApiResponse({
    status: 200,
    description:
      'text/event-stream of token, tool_call, tool_result, proposal, done, and error events',
  })
  @ApiResponse({
    status: 403,
    description: 'The user has not enabled AI assistance in preferences',
  })
  async message(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(agentMessageInputSchema))
    body: AgentMessageInput,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const preferences = await this.userPreferencesService.findByUserId(user.id);
    if (!preferences?.aiConsent) {
      res.status(403).json(AI_CONSENT_REQUIRED);
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    try {
      const timezone = preferences.timezone;
      const session = await this.agentSessionService.getOrCreateSession(
        user.id,
        body.chatId
      );

      const userTurn: AgentTurn = {
        role: 'user',
        text: body.text,
        at: new Date().toISOString(),
      };
      const turns = [...session.turns.map(sessionTurnToAgentTurn), userTurn];

      let finalText = '';
      const stream = this.agentService.replyStream(
        user.id,
        body.chatId,
        turns,
        { today: dayKeyInZone(new Date(), timezone), timezone },
        { signal: abortController.signal }
      );

      for await (const event of stream) {
        writeEvent(res, event.type, event);
        if (event.type === 'done') {
          finalText = event.text;
        }
      }

      const assistantTurn: AgentTurn = {
        role: 'assistant',
        text: finalText,
        at: new Date().toISOString(),
      };
      await this.agentSessionService.appendTurns(user.id, body.chatId, [
        userTurn,
        assistantTurn,
      ]);
    } catch (error) {
      this.logger.error({ err: error }, 'Agent request failed');
      if (!res.writableEnded) {
        writeEvent(res, 'error', {
          type: 'error',
          message: 'The agent could not complete this request.',
        });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @Post('parse-todo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Parse one line of free text into a single structured task',
  })
  @ApiBody({ schema: zodToApiSchema(parseTodoInputSchema) })
  @ApiResponse({ status: 200, description: 'The parsed task' })
  @ApiResponse({
    status: 403,
    description: 'The user has not enabled AI assistance in preferences',
  })
  async parseTodo(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(parseTodoInputSchema)) body: ParseTodoInput,
    @Req() req: Request
  ): Promise<ParsedTask> {
    const preferences = await this.userPreferencesService.findByUserId(user.id);
    if (!preferences?.aiConsent) {
      throw new ForbiddenException(AI_CONSENT_REQUIRED);
    }

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const timezone = preferences.timezone;
    return this.agentService.parseTodo(
      user.id,
      body.text,
      { today: dayKeyInZone(new Date(), timezone), timezone },
      { signal: abortController.signal }
    );
  }
}
