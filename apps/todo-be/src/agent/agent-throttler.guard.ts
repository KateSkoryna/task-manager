import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * The default `ThrottlerGuard` tracks by client (IP), which protects against
 * one abusive caller but not the resource this route actually shares: a
 * single Gemini free-tier project quota (5 requests/minute total, see
 * docs/PLAN.md Step 4.1/4.4). Two well-behaved signed-in users each staying
 * under a per-client limit can still blow through the shared budget, so this
 * guard tracks one bucket for every caller instead of one per client.
 */
@Injectable()
export class AgentThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(): Promise<string> {
    return 'agent-message';
  }
}
