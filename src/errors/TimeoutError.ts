export class TimeoutError extends Error {
  static is(value: unknown): value is TimeoutError {
    return value instanceof TimeoutError;
  }

  constructor(timeout: number, cause?: unknown) {
    super(`Timeout reached: ${timeout}ms`, { cause });
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
