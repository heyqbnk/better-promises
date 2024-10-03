# `better-promises`

[code-badge]: https://img.shields.io/badge/source-black?logo=github

[link]: https://github.com/heyqbnk/better-promises/tree/master

[npm-link]: https://npmjs.com/package/better-promises

[npm-badge]: https://img.shields.io/npm/v/better-promises?logo=npm

[size-badge]: https://img.shields.io/bundlephobia/minzip/better-promises

[![NPM][npm-badge]][npm-link]
![Size][size-badge]
[![code-badge]][link]

JavaScript's `Promise` extensions you may find useful during development.

## Installation

```bash
# yarn
yarn add better-promises

# pnpm
pnpm i better-promises

# npm
npm i better-promises
```

## `CancelablePromise`

The `CancelablePromise` class provides promises that can be canceled. There are several ways to
create a `CancelablePromise`:

```ts
import { CancelablePromise } from 'better-promises';

// Using no arguments at all. But in this case, the promise will
// never be resolved. 
const p = new CancelablePromise();

// Using the classic Promise executor with the additional
// abort signal, which will be aborted in case, the promise
// was resolved or rejected externally.
const p2 = new CancelablePromise((res, rej, abortSignal) => {
  // ..
});

// Using only options. All options are optional.
const c = new AbortController();
const p3 = new CancelablePromise({
  // Abort signal to let the promise know, the execution
  // should be aborted. If the signal was aborted, the
  // promise will be rejected with the AbortError,
  abortSignal: c.signal,
  // Execution timeout. When timeout was reached, the
  // promise will be rejected with the TimeoutError.
  timeout: 3000
});

// Using the executor and options.
const c2 = new AbortController();
const p4 = new CancelablePromise((res, rej, abortSignal) => {
  // ..
}, { abortSignal: c.signal, timeout: 3000 })
```

In addition to standard promise methods (`then`, `catch`, and `finally`), `CancelablePromise`
introduces two new methods: `reject` and `cancel`. It also provides a static method `withFn`.

### `withFn`

The `withFn` method executes a function in sync without callbacks. It accepts the function and
optional settings passed to the `CancelablePromise` constructor.

```ts
const c2 = new AbortController();
const p = CancelablePromise.withFn((abortSignal) => {
  return 'Resolved!';
}, {
  abortSignal: c.signal,
  timeout: 3000,
});

p.then(console.log); // Output: 'Resolved!'

const p2 = CancelablePromise.withFn(() => {
  throw new Error('Nah :(');
});
p2.catch(console.error); // Output: Error('Nah :(')

const p3 = CancelablePromise.withFn(async () => {
  const r = await fetch('...');
  return r.json();
});
// p3 resolves with the fetched JSON body
```

### `reject`

The `reject` method rejects the initially created promise with a given reason. It is important to
note that `reject` applies to the original promise, regardless of any chained promises. So, calling
this method, only the initially created promise will be rejected to follow the expected flow.

The expected flow is the flow when rejection was performed in the promise executor (the function,
passed to the promise constructor), and then all chained callbacks (add via `catch(fn)`) called.

Here is the example:

```ts
const promise = new CancelablePromise();
const promise2 = promise.catch(e => {
  console.log('I got it!');
});

// Here calling promise.reject ()and promise2.reject()
// will have the same effect. We will see the log "I got it!"
```

A bit more real example:

```ts
const promise = new CancelablePromise((res, rej) => {
  return fetch('...').then(res, rej);
})
  .then(r => r.json())
  .catch(e => {
    console.error('Something went wrong', e);
  });

// Imagine, that we want to reject the promise for some reason
// and stop the execution. Calling the "reject" method we expect
// the "rej" argument in the executor to be called, and then
// call the "catch" method callback.

promise.reject(new Error('Stop it! Get some help!'));
// 'Something went wrong', Error('Stop it! Get some help!')
```

### `cancel`

This method rejects the promise using `CancelError`.

```ts
import { CancelablePromise, CancelError } from 'better-promises';

const promise = new CancelablePromise().catch(e => {
  if (CancelError.is(e)) {
    console.error('Canceled');
  }
});
promise.cancel();
```

## `ManualPromise`

The `ManualPromise` class extends `CancelablePromise` and introduces the `resolve` method to resolve
the promise manually.

```ts
import { ManualPromise } from 'better-promises';

const p = new ManualPromise();
p.resolve('Done!');
p.then(console.log); // 'Done!'
```

It also notifies the executor about promise resolution, allowing developers to stop execution if
resolved externally.

```ts
import { ManualPromise, isResolved } from 'better-promises';

const promise = new ManualPromise(async (res, rej, signal) => {
  // Imitate something async here.
  await new Promise(res => setTimeout(res, 1000));

  if (isResolved(signal.reason)) {
    // It means that ManualPromise was resolved outside. 
    // We probably want to stop executing the function 
    // as long as the result will not affect anything.
    return;
  }

  // Otherwise keep doing what we do.
});

promise.resolve('I got the result from somewhere else');
```