// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

// PLAN.md Phase 11 requires error monitoring to redact tokens, task text,
// email addresses, and AI payloads — the same policy Step 4.4 already
// applies to pino logging. httpBodies: [] is the one that matters most:
// request/response bodies are where task names/notes and the agent's
// message text/tool arguments live, so no body is ever sent to Sentry.
// Authorization/cookie headers are filtered by Sentry's own default
// sensitive-value scrubbing regardless of httpHeaders config.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  dataCollection: {
    userInfo: false,
    httpBodies: [],
    genAI: { inputs: false, outputs: false },
  },
});
