// Runs before any test file (and therefore before AppModule's providers,
// which read these once at import time) is loaded. The agent route's
// dedicated throttle is deliberately sized to Gemini's real free-tier
// budget (3/min) — far tighter than a single test file's request count.
// Raising it here keeps that production value untouched while letting
// integration suites exercise the route more than once per minute.
process.env.AGENT_THROTTLE_LIMIT = process.env.AGENT_THROTTLE_LIMIT || '1000';
