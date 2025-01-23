export interface PromiseOptions {
  /**
   * Signal to abort the execution.
   */
  abortSignal?: AbortSignal;
  /**
   * Will reject the promise when it was aborted.
   *
   * You can use this option if you need more precise control over the promise execution.
   * @default True
   */
  rejectOnAbort?: boolean;
  /**
   * Execution timeout. After the timeout was reached, the promise will be rejected with the
   * timeout error.
   */
  timeout?: number;
}

export type WithFnFunction<T> = (context: PromiseExecutorContext<T>) => (T | PromiseLike<T>)

export type Maybe<T> = T | undefined | null;

export type PromiseResolveFn<T> = undefined extends T
  ? (value?: T | PromiseLike<T>) => void
  : (value: T | PromiseLike<T>) => void;

export type PromiseRejectFn = (reason?: any) => void;

export interface PromiseExecutorContext<Resolved> {
  /**
   * Returns the abort signal reason if any is present.
   */
  abortReason(): unknown;
  /**
   * Abort signal.
   */
  abortSignal: AbortSignal;
  /**
   * @returns True if the abortSignal was aborted.
   */
  isAborted(): boolean;
  /**
   * @returns True if the promise was resolved.
   */
  isResolved(): boolean;
  /**
   * Add a new listener that will be called whenever the abort signal was aborted.
   * The listener will be automatically removed when the promise was either resolved or rejected.
   * @param listener - a listener to add.
   * @returns A function to remove the listener.
   */
  onAborted(listener: (reason: unknown) => void): VoidFunction;
  /**
   * @returns Promise resolve result if it was resolved.
   */
  resolved(): Resolved | undefined;
  /**
   * Will throw an error stored in the abortSignal.reason if it was aborted.
   */
  throwIfAborted(): never | void;
}

export type PromiseExecutorFn<T> = (
  res: PromiseResolveFn<T>,
  rej: PromiseRejectFn,
  context: PromiseExecutorContext<T>,
) => any;

export type PromiseOnFulfilledFn<TResult1, TResult2> =
  (value: TResult1) => TResult2 | PromiseLike<TResult2>;

export type PromiseOnRejectedFn<T> = (value: any) => T | PromiseLike<T>;