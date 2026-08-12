export const DEFAULT_THROTTLE_LIMIT = Number(process.env.THROTTLE_LIMIT) || 300;
export const DEFAULT_THROTTLE_TTL_MS =
  Number(process.env.THROTTLE_TTL_MS) || 60_000;

export const AUTH_THROTTLE_LIMIT =
  Number(process.env.AUTH_THROTTLE_LIMIT) || 10;
export const AUTH_THROTTLE_TTL_MS =
  Number(process.env.AUTH_THROTTLE_TTL_MS) || 60_000;
