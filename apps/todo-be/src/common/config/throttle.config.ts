export const DEFAULT_THROTTLE_LIMIT = Number(process.env.THROTTLE_LIMIT) || 300;
export const DEFAULT_THROTTLE_TTL_MS =
  Number(process.env.THROTTLE_TTL_MS) || 60_000;

export const AUTH_THROTTLE_LIMIT =
  Number(process.env.AUTH_THROTTLE_LIMIT) || 10;
export const AUTH_THROTTLE_TTL_MS =
  Number(process.env.AUTH_THROTTLE_TTL_MS) || 60_000;

// The Gemini free tier behind GEMINI_API_KEY allows 5 requests/minute for
// the whole project (verified live via AI Studio's rate-limit dashboard on
// 2026-09-10). 3/min per client leaves headroom for more than one signed-in
// user without a single client being able to exhaust the shared budget.
export const AGENT_THROTTLE_LIMIT =
  Number(process.env.AGENT_THROTTLE_LIMIT) || 3;
export const AGENT_THROTTLE_TTL_MS =
  Number(process.env.AGENT_THROTTLE_TTL_MS) || 60_000;
