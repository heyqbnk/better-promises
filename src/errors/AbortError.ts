import { errorClass } from 'error-kid';

export const [AbortError, isAbortError] =
  errorClass<[cause?: unknown]>(
    'AbortError',
    cause => ['', { cause }],
  );
