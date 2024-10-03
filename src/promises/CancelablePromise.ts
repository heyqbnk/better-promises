import {
  PromiseExecutorFn,
  PromiseOnRejectedFn,
  PromiseRejectFn,
  PromiseOnFulfilledFn,
  PromiseResolveFn,
  PromiseOptions, Maybe, WithFnFunction,
} from './types.js';
import { AbortError } from '../errors/AbortError.js';
import { TimeoutError } from '../errors/TimeoutError.js';
import { CanceledError } from '../errors/CanceledError.js';
import { RESOLVED_SYMBOL } from './resolve.js';

function assignReject<P extends CancelablePromise<any>>(
  childPromise: P,
  parentPromise: CancelablePromise<any>,
): P {
  childPromise.reject = parentPromise.reject;
  return childPromise;
}

/**
 * Improved version of the JavaScript Promise.
 */
export class CancelablePromise<Result> extends Promise<Result> {
  /**
   * Creates a new CancelablePromise instance using executor, resolving promise when a result
   * was returned.
   * @param fn - function returning promise result.
   * @param options - additional options.
   */
  static withFn<T>(fn: WithFnFunction<T>, options?: PromiseOptions): CancelablePromise<T> {
    return new CancelablePromise((res, _, signal) => {
      res(fn(signal));
    }, options);
  }

  /**
   * @see Promise.resolve
   */
  static override resolve(): CancelablePromise<void>;
  /**
   * @see Promise.resolve
   */
  static override resolve<T>(value: T | PromiseLike<T>): CancelablePromise<Awaited<T>>;
  static override resolve<T>(value?: T | PromiseLike<T>): CancelablePromise<Awaited<T>> {
    return new CancelablePromise(resolve => {
      resolve(value as Awaited<T>);
    });
  }

  /**
   * @see Promise.reject
   */
  static override reject<T = never>(reason?: any): CancelablePromise<T> {
    return new CancelablePromise((_, reject) => {
      reject(reason);
    });
  }

  /**
   * Creates a new CancelablePromise instance using only options.
   * @param options - additional options.
   */
  constructor(options?: PromiseOptions);
  /**
   * Creates a new CancelablePromise instance using specified executor and additional options.
   * @param executor - promise executor.
   * @param options - additional options.
   */
  constructor(executor?: PromiseExecutorFn<Result>, options?: PromiseOptions);
  constructor(
    executorOrOptions?: PromiseExecutorFn<Result> | PromiseOptions,
    maybeOptions?: PromiseOptions,
  ) {
    let resolve!: PromiseResolveFn<Result>;
    let reject!: PromiseRejectFn;
    super((res, rej) => {
      let executor: PromiseExecutorFn<Result> | undefined;
      let options: PromiseOptions | undefined;

      if (typeof executorOrOptions === 'function') {
        executor = executorOrOptions;
        options = maybeOptions;
      } else {
        options = executorOrOptions;
      }

      // If an abort signal was passed initially in the promise, and it was in the aborted state, it
      // means that we have to prevent the executor from being called, just because there is no
      // reason to do it.
      //
      // This signal will not be passed in case the promise was constructed via the "then" or
      // "finally" methods, so we wouldn't have any related problems due to unhandled promise
      // rejections.
      options ||= {};
      const { abortSignal } = options;
      if (abortSignal && abortSignal.aborted) {
        return rej(new AbortError(abortSignal.reason));
      }

      //#region Cleanup section.
      const cleanupFns: VoidFunction[] = [];
      const withCleanup = <F extends (...args: any) => any>(fn: F): F => {
        return ((...args) => {
          cleanupFns.forEach(fn => fn());
          return fn(...args);
        }) as F;
      };
      //#endregion

      // We are going to use our controller signal in the executor because we can control it.
      // We can't say the same about the abort signal passed from above, we can't abort it by
      // ourselves.
      const controller = new AbortController();
      const { signal: controllerSignal } = controller;

      // Enhance resolve and reject functions with cleanup and controller abortion.
      reject = withCleanup(reason => {
        rej(reason);
        controller.abort(reason);
      });
      resolve = withCleanup((result: Result) => {
        res(result);
        controller.abort(RESOLVED_SYMBOL);
      }) as PromiseResolveFn<Result>;

      //#region Process abortSignal option.
      if (abortSignal) {
        // Whenever the abort signal aborts, we are rejecting the promise.
        const listener = () => {
          reject(new AbortError(abortSignal.reason));
        };

        abortSignal.addEventListener('abort', listener);
        cleanupFns.push(() => {
          abortSignal.removeEventListener('abort', listener);
        });
      }
      //#endregion

      //#region Process timeout option.
      const { timeout } = options;
      if (timeout) {
        const timeoutId = setTimeout(() => {
          reject(new TimeoutError(timeout));
        }, timeout);

        cleanupFns.push(() => {
          clearTimeout(timeoutId);
        });
      }
      //#endregion

      executor && executor(resolve, reject, controllerSignal);
    });

    this.reject = reject;
  }

  /**
   * Rejects the promise with the cancel error.
   * @see reject
   */
  cancel(): void {
    this.reject(new AbortError(new CanceledError()));
  }

  /**
   * @see Promise.catch
   */
  override catch<CatchResult = never>(
    onRejected?: Maybe<PromiseOnRejectedFn<CatchResult>>,
  ): CancelablePromise<Result | CatchResult> {
    return this.then(undefined, onRejected);
  }

  /**
   * @see Promise.finally
   */
  override finally(onFinally?: Maybe<() => void>): CancelablePromise<Result> {
    // Here we follow the same logic described in the "then" method.
    return assignReject(super.finally(onFinally) as CancelablePromise<Result>, this);
  }

  /**
   * Rejects the initially created promise.
   *
   * This method aborts the signal passed to the executor with either `AbortError` or `TimeoutError`.
   * `AbortError` will contain full information on the abortion reason in the `cause` property.
   * @see AbortError
   * @see TimeoutError
   */
  reject!: PromiseRejectFn;

  /**
   * @see Promise.then
   */
  override then<A = Result, B = never>(
    onFulfilled?: Maybe<PromiseOnFulfilledFn<Result, A>>,
    onRejected?: Maybe<PromiseOnRejectedFn<B>>,
  ): CancelablePromise<A | B> {
    // Use the original promise "then" method as long as in fact, it creates a CancelablePromise
    // instance.
    // Then, reassign the promise "reject" method, because not doing it and rejecting the promise
    // it will lead to an unhandled promise rejection.
    //
    // Here is an example:
    // const myPromise = new CancelablePromise(...)
    //   .catch(() => console.log('Catched'));
    //
    // If we don't reassign myPromise's "reject" method here, it will reject the promise, returned
    // from the "catch" method, which is unexpected. So, even using several catches in a row,
    // a developer will not be able to catch the error, thrown using the "reject" method.
    //
    // The expected behavior here is the "reject" method rejecting the initially created promise.
    // Then, this error will be handled via the "catch" method.
    return assignReject(super.then(onFulfilled, onRejected) as CancelablePromise<A | B>, this);
  }
}
