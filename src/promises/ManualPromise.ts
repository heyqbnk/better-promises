import { CancelablePromise } from './CancelablePromise.js';
import type {
  PromiseExecutorFn,
  PromiseOnRejectedFn,
  PromiseOnFulfilledFn,
  PromiseResolveFn,
  PromiseOptions,
  Maybe,
  WithFnFunction,
} from './types.js';

function assignResolve<P extends ManualPromise<any>>(
  childPromise: P,
  parentPromise: ManualPromise<any>,
): P {
  childPromise.resolve = parentPromise.resolve;
  return childPromise;
}

export class ManualPromise<T> extends CancelablePromise<T> {
  /**
   * Creates a new ManualPromise instance using an executor, resolving the promise when a result
   * was returned.
   * @param fn - function returning promise result.
   * @param options - additional options.
   */
  static withFn<T>(fn: WithFnFunction<T>, options?: PromiseOptions): ManualPromise<T> {
    return new ManualPromise((res, rej, signal) => {
      try {
        Promise.resolve(fn(signal)).then(res, rej);
      } catch (e) {
        rej(e);
      }
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
    return this.withFn(() => value) as CancelablePromise<Awaited<T>>;
  }

  /**
   * @see Promise.reject
   */
  static override reject<T = never>(reason?: any,): ManualPromise<T> {
    return new ManualPromise((_, rej) => {
      rej(reason);
    });
  }

  /**
   * Creates a new ManualPromise instance using only options.
   * @param options - additional options.
   */
  constructor(options?: PromiseOptions);
  /**
   * Creates a new ManualPromise instance using specified executor and additional options.
   * @param executor - promise executor.
   * @param options - additional options.
   */
  constructor(executor?: PromiseExecutorFn<T>, options?: PromiseOptions);
  constructor(
    executorOrOptions?: PromiseExecutorFn<T> | PromiseOptions,
    maybeOptions?: PromiseOptions,
  ) {
    let executor: PromiseExecutorFn<T> | undefined;
    let options: PromiseOptions | undefined;

    if (typeof executorOrOptions === 'function') {
      executor = executorOrOptions;
      options = maybeOptions;
    } else {
      options = executorOrOptions;
    }

    let resolve!: PromiseResolveFn<T>;
    super((res, rej, context) => {
      resolve = res;
      executor && executor(res, rej, context);
    }, options);
    this.resolve = resolve;
  }

  /**
   * @see Promise.catch
   */
  override catch<CatchResult = never>(
    onRejected?: Maybe<PromiseOnRejectedFn<CatchResult>>,
  ): ManualPromise<T | CatchResult> {
    return this.then(undefined, onRejected);
  }

  /**
   * @see Promise.finally
   */
  override finally(onFinally?: Maybe<() => void>): ManualPromise<T> {
    // Here, we are completely following the logic, described in the CancelablePromise.finally.
    return assignResolve(super.finally(onFinally) as ManualPromise<T>, this);
  }

  /**
   * Resolves the promise.
   */
  resolve: PromiseResolveFn<T>;

  /**
   * @see Promise.then
   */
  override then<A = T, B = never>(
    onFulfilled?: Maybe<PromiseOnFulfilledFn<T, A>>,
    onRejected?: Maybe<PromiseOnRejectedFn<B>>,
  ): ManualPromise<A | B> {
    // Here, we are completely following the logic, described in the CancelablePromise.then.
    return assignResolve(super.then(onFulfilled, onRejected) as ManualPromise<A | B>, this);
  }
}