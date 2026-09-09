import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import {
  AGENT_SESSION_MODEL_NAME,
  IAgentSessionDocument,
} from '../app/models/agent-session.model';
import { executeOperation } from '../common/utils/execute-operation';

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AgentSessionService {
  constructor(
    @InjectModel(AGENT_SESSION_MODEL_NAME)
    private readonly agentSessionModel: Model<IAgentSessionDocument>
  ) {}

  /**
   * Issues a short-lived, single-use token for a destructive tool call and
   * stores it on the session so `consumeConfirmation` can later validate it.
   * Requires the `(userId, chatId)` session to already exist — a tool call
   * cannot arrive before the session that carries its conversation does.
   */
  createConfirmation(
    userId: string,
    chatId: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<string> {
    return executeOperation('Error creating confirmation', async () => {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);

      const doc = await this.agentSessionModel.findOneAndUpdate(
        { userId, chatId },
        {
          $set: { pendingConfirmation: { token, toolName, input, expiresAt } },
          $inc: { version: 1 },
        }
      );

      if (!doc) {
        throw new Error(`No agent session for user ${userId} chat ${chatId}`);
      }

      return token;
    });
  }

  /**
   * Validates and atomically clears the pending confirmation in one step, so
   * a second attempt with the same token finds nothing left to match —
   * replay is impossible by construction, not by a separate check. Matching
   * `input` too means a token issued for one task can never be redirected
   * onto a different one by changing the call's arguments.
   */
  consumeConfirmation(
    userId: string,
    chatId: string,
    token: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<boolean> {
    return executeOperation('Error consuming confirmation', async () => {
      const doc = await this.agentSessionModel.findOneAndUpdate(
        {
          userId,
          chatId,
          'pendingConfirmation.token': token,
          'pendingConfirmation.toolName': toolName,
          'pendingConfirmation.expiresAt': { $gt: new Date() },
        },
        { $set: { pendingConfirmation: null }, $inc: { version: 1 } },
        { new: false }
      );

      if (!doc?.pendingConfirmation) return false;
      return (
        JSON.stringify(doc.pendingConfirmation.input) === JSON.stringify(input)
      );
    });
  }
}
