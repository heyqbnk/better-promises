import { errorClass } from 'error-kid';

export const [TimeoutError, isTimeoutError] =
  errorClass<[timeout: number, cause?: unknown]>(
    'TimeoutError',
    (timeout, cause) => [`Timeout reached: ${timeout}ms`, { cause }],
  );
