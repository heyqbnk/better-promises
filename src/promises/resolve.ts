export type PromiseResolveResult<T> = [typeof RESOLVED_SYMBOL, T];

const RESOLVED_SYMBOL = Symbol('Resolved');

/**
 * @return True if passed value determines that the promise was resolved.
 * @param value
 * @example
 * const promise = new ManualPromise(async (res, rej, signal) => {
 *   // Imitate something async here.
 *   await new Promise(res => setTimeout(res, 1000));
 *
 *   if (isResolved(signal.reason)) {
 *     // It means that ManualPromise was resolved outside. We probably want to stop executing
 *     // the function as long as the result will not affect anything.
 *     return;
 *   }
 *
 *   // Otherwise keep doing what we do.
 * });
 */
export function isPromiseResolveResult(value: unknown): value is PromiseResolveResult<unknown> {
  return Array.isArray(value) && value[0] === RESOLVED_SYMBOL;
}

export function withResolved<T>(value: T): PromiseResolveResult<T> {
  return [RESOLVED_SYMBOL, value];
}