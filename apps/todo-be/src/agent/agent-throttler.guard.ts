import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../auth/authenticated-user';

/**
 * Tracks one bucket per signed-in user rather than one shared bucket for
 * every caller: a single global bucket (the previous behavior) meant one
 * user's own usage — or another user entirely — could exhaust the whole
 * app's agent quota and 429 everyone else. `FirebaseAuthGuard` runs before
 * this guard on every route that uses it (see `AgentController`'s
 * `@UseGuards` order), so `request.user` is always populated here.
 */
@Injectable()
export class AgentThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: AuthenticatedRequest): Promise<string> {
    return req.user?.id ?? 'anonymous-agent-caller';
  }
}
