import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { AgentTurn } from '@shared/types';
import {
  AGENT_SESSION_MODEL_NAME,
  IAgentSessionDocument,
} from '../app/models/agent-session.model';
import { executeOperation } from '../common/utils/execute-operation';

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** How many turns the rolling window sent to the model keeps. */
const MAX_SESSION_TURNS = 20;

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

  /**
   * Finds the session for `(userId, chatId)` or creates an empty one,
   * refreshing its expiry either way. A tool call cannot arrive before its
   * session exists, so the agent controller calls this first.
   */
  getOrCreateSession(
    userId: string,
    chatId: string
  ): Promise<IAgentSessionDocument> {
    return executeOperation('Error loading agent session', async () => {
      const doc = await this.agentSessionModel.findOneAndUpdate(
        { userId, chatId },
        { $set: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return doc;
    });
  }

  /**
   * Appends turns to the session's rolling window, trimming to the last
   * `MAX_SESSION_TURNS` so the request sent to the model stays bounded.
   */
  appendTurns(
    userId: string,
    chatId: string,
    newTurns: AgentTurn[]
  ): Promise<void> {
    return executeOperation('Error appending agent turns', async () => {
      await this.agentSessionModel.updateOne(
        { userId, chatId },
        {
          $push: {
            turns: {
              $each: newTurns.map((turn) => ({
                ...turn,
                at: new Date(turn.at),
              })),
              $slice: -MAX_SESSION_TURNS,
            },
          },
          $set: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
          $inc: { version: 1 },
        }
      );
    });
  }
}
