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

export class ManualPromise<Result, Resolvable = Result> extends CancelablePromise<Result> {
  /**
   * Creates a new ManualPromise instance using executor, resolving promise when a result
   * was returned.
   * @param fn - function returning promise result.
   * @param options - additional options.
   */
  static override withFn<T>(fn: WithFnFunction<T>, options?: PromiseOptions): ManualPromise<T> {
    return this.resolve<T>().then(() => CancelablePromise.withFn(fn, options))
  }

  /**
   * @see Promise.resolve
   */
  static override resolve<Resolvable>(): ManualPromise<void, Resolvable>;
  /**
   * @see Promise.resolve
   */
  static override resolve<Result, Resolvable = Result>(
    value: Result,
  ): ManualPromise<Result, Resolvable>;
  static override resolve<Result, Resolvable = Result>(
    value?: Result,
  ): ManualPromise<Result, Resolvable> {
    return new ManualPromise(resolve => {
      resolve(value as Result);
    });
  }

  /**
   * @see Promise.reject
   */
  static override reject<Result = never, Resolvable = Result>(
    reason?: any,
  ): ManualPromise<Result, Resolvable> {
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
  constructor(executor?: PromiseExecutorFn<Result>, options?: PromiseOptions);
  constructor(
    executorOrOptions?: PromiseExecutorFn<Result> | PromiseOptions,
    maybeOptions?: PromiseOptions,
  ) {
    let executor: PromiseExecutorFn<Result> | undefined;
    let options: PromiseOptions | undefined;

    if (typeof executorOrOptions === 'function') {
      executor = executorOrOptions;
      options = maybeOptions;
    } else {
      options = executorOrOptions;
    }

    let resolve!: PromiseResolveFn<Result>;
    super((res, rej, signal) => {
      resolve = res;
      executor && executor(res, rej, signal);
    }, options);

    this.resolve = resolve as unknown as PromiseResolveFn<Resolvable>;
  }

  /**
   * @see Promise.catch
   */
  override catch<CatchResult = never>(
    onRejected?: Maybe<PromiseOnRejectedFn<CatchResult>>,
  ): ManualPromise<Result | CatchResult, Resolvable> {
    return this.then(undefined, onRejected);
  }

  /**
   * @see Promise.finally
   */
  override finally(onFinally?: Maybe<() => void>): ManualPromise<Result, Resolvable> {
    // Here, we are completely following the logic, described in the CancelablePromise.finally.
    return assignResolve(super.finally(onFinally) as ManualPromise<Result, Resolvable>, this);
  }

  /**
   * Resolves the promise.
   */
  resolve!: PromiseResolveFn<Resolvable>;

  /**
   * @see Promise.then
   */
  override then<A = Result, B = never>(
    onFulfilled?: Maybe<PromiseOnFulfilledFn<Result, A>>,
    onRejected?: Maybe<PromiseOnRejectedFn<B>>,
  ): ManualPromise<A | B, Resolvable> {
    // Here, we are completely following the logic, described in the CancelablePromise.then.
    return assignResolve(super.then(onFulfilled, onRejected) as ManualPromise<A | B, Resolvable>, this);
  }
}