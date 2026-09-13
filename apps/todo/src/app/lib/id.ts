// `crypto.randomUUID` isn't implemented by every `crypto` (notably jsdom's),
// so fall back to a non-cryptographic id — callers only need uniqueness
// within a browser session, not unguessability.
export const generateId = (prefix: string): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
