export class AbortError extends Error {
  static is(value: unknown): value is AbortError {
    return value instanceof AbortError;
  }

  constructor(cause?: unknown) {
    super('Execution was aborted', { cause });
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}
