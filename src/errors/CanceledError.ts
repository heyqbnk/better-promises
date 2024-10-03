export class CanceledError extends Error {
  static is(value: unknown): value is CanceledError {
    return value instanceof CanceledError;
  }

  constructor() {
    super('Execution was canceled');
    Object.setPrototypeOf(this, CanceledError.prototype);
  }
}
