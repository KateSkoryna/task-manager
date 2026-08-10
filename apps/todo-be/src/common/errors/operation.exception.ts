export class OperationException extends Error {
  constructor(readonly publicMessage: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}
