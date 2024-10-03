export interface PromiseOptions {
  /**
   * Signal to abort the execution.
   */
  abortSignal?: AbortSignal;
  /**
   * Execution timeout. After the timeout was reached, the promise will be rejected with the
   * timeout error.
   */
  timeout?: number;
}

export type WithFnFunction<T> = (abortSignal: AbortSignal) => (T | PromiseLike<T>)

export type Maybe<T> = T | undefined | null;

export type PromiseResolveFn<T> = undefined extends T
  ? (value?: T | PromiseLike<T>) => void
  : (value: T | PromiseLike<T>) => void;

export type PromiseRejectFn = (reason?: any) => void;

export type PromiseExecutorFn<T> = (
  res: PromiseResolveFn<T>,
  rej: PromiseRejectFn,
  abortSignal: AbortSignal,
) => any;

export type PromiseOnFulfilledFn<TResult1, TResult2> =
  (value: TResult1) => TResult2 | PromiseLike<TResult2>;

export type PromiseOnRejectedFn<T> = (value: any) => T | PromiseLike<T>;