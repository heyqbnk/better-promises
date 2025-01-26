# `better-promises`

[code-badge]: https://img.shields.io/badge/source-black?logo=github

[link]: https://github.com/heyqbnk/better-promises/tree/master

[npm-link]: https://npmjs.com/package/better-promises

[npm-badge]: https://img.shields.io/npm/v/better-promises?logo=npm

[size-badge]: https://img.shields.io/bundlephobia/minzip/better-promises

[![NPM][npm-badge]][npm-link]
![Size][size-badge]
[![code-badge]][link]

JavaScript's `Promise` enhanced, flexible versions you may find useful in your project.

## Installation

```bash
# yarn
yarn add better-promises

# pnpm
pnpm i better-promises

# npm
npm i better-promises
```

## About Promises

The package mainly provides two classes of promises: `AbortablePromise` and `ManualPromise`.

We use the `AbortablePromise` class when we don't want to have an opportunity to resolve it
externally. In other words, we don't want to have an interface like `promise.resolve(value)`.
Instead, we want to have an API to abort this promise.

In case, we need to resolve the promise externally, we should use the `ManualPromise`, completely
extending the `AbortablePromise` class and following its idea.

It is important to note here that abortion is different from rejection—it depends
on the way the promise was created. You will learn more about this mechanism later.

## Creating

Both classes have several ways of creating their instances.

- **Using no arguments at all**

```ts
import { AbortablePromise } from 'better-promises';

const promise = new AbortablePromise();
```

- **Using options only**

```ts
const controller = new AbortController();
const promise = new AbortablePromise({
  abortSignal: controller.signal,
  timeout: 3000
});
```

- **Using the promise executor**. In this case the executor will receive an additional
  argument representing the execution context.

```ts
const promise = new AbortablePromise((res, rej, context) => {
  // ..
});
```

- **Using both executor and options**.

```ts
const controller = new AbortController();
const promise = new AbortablePromise((res, rej, context) => {
  // ..
}, { abortSignal: controller.signal, timeout: 3000 })
```

When the promise was resolved, it aborts the signal letting the executor know about the promise
fulfilling.

```ts
new AbortablePromise((res, rej, context) => {
  context.onAborted(reason => {
    if (context.isResolved()) {
      const result = context.resolved();
    }
  });
  // or
  context.onResolved(result => {
    // ...
  })
});
```

Now, let's learn more about which options both these classes accept.

### `rejectOnAbort?: boolean`

By default, promises will be rejected if its abort signal was aborted.

To prevent a promise from automatic rejection, use the `rejectOnAbort` option disabling this
kind of behavior. This can be useful if you want to have complete control over the promise
lifecycle.

> [!WARNING]
> Note that the promise's `reject` method ignores this option and not only aborts the promise,
> but also rejects it.

```ts
const promise = new AbortablePromise().catch(() => {
  // This handler will be called, bacuse the promise
  // will be aborted on the next line.
});
promise.abort();

const promise2 = new AbortablePromise((res, rej, context) => {
  context.onAborted(reason => {
    // This will be executed after calling promise2.abort().
    // The reason will be "Ooops!".
    // Let's resolve the promise instead of rejecting it.
    res(reason);
  });
}, { rejectOnAbort: false })
  .then(result => {
    console.log(result);
    // Output: 'Ooops!'
  })
  .catch(() => {
    // This handler will NOT be called during a standard abortion.
  });
promise2.abort('Ooops!');
```

### `abortSignal?: AbortSignal`

An abort signal to let the promise know, it should probably stop the execution.

```ts
const controller = new AbortController();
const promise = new AbortablePromise({ abortSignal: controller.signal })
  .catch(e => {
    console.log(e);
    // Output: Error('Oops!')
  });

setTimeout(() => {
  controller.abort(new Error('Oops!'));
}, 1000);
```

Using the `rejectOnAbort` option:

```ts
const controller = new AbortController();
const promise = new AbortablePromise(
  // On abort, resolve instead of rejection.
  (res, _, context) => context.obAborted(res), {
    abortSignal: controller.signal,
    rejectOnAbort: false,
  },
).then(result => {
  console.log(result);
  // Output: Error('Oops!')
});

setTimeout(() => {
  controller.abort(new Error('Oops!'));
}, 1000);
```

### `timeout?: number`

Timeout in milliseconds after which the promise will be aborted with the `TimeoutError` error.

```ts
const promise = new AbortablePromise({ timeout: 1000 })
  .catch(e => {
    if (isTimeoutError(e)) {
      console.log(e);
      // Output: TimeoutError('Timed out: 1000ms')
    }
  });
```

## Execution Context

By execution context, we mean an object passed as the third argument to the promise executor.
It contains useful data that executor may use.

### `abortReason(): unknown`

Returns the abortion reason if the promise execution was aborted.

Note that if a promise was created with an already aborted signal, the promise will be
automatically aborted.

```ts
const controller = new AbortController();
controller.abort(new Error('Just because'));

new AbortablePromise((_res, _rej, context) => {
  console.log(context.abortReason());
  // Output: Error('Just because')
}, { abortSignal: controller.signal });
```

The value will also be returned if the promise was resolved:

```ts
new AbortablePromise((res, _rej, context) => {
  res(123);
  console.log(context.abortReason());
  // Output: [symbol, 123]
});
```

### `isAborted(): boolean`

Returns `true` if the execution was aborted.

```ts
const controller = new AbortController();
controller.abort();

new AbortablePromise((_res, _rej, context) => {
  console.log(context.isAborted());
  // Output: true
}, { abortSignal: controller.signal });
```

### `isResolved(): boolean`

Returns true if the promise was resolved.

```ts
new AbortablePromise((res, _rej, context) => {
  res(123);
  console.log(context.isResolved());
  // Output: true
});
```

### `onAborted(listener: (reason: unknown) => void): VoidFunction`

Adds an abort signal listener. Returns a function to remove it.

The listener will be removed automatically if the promise was rejected or resolved.

```ts
new AbortablePromise((res, _rej, context) => {
  context.onAborted(reason => {
    console.log(reason);
    // Output: [symbol, 123]
  });
  res(123);
});
```

### `resolved(): T | undefined`

Returns the promise resolve result.

```ts
new AbortablePromise((res, _rej, context) => {
  res(123);
  console.log(context.resolved());
  // Output: 123
});
```

### `throwIfAborted(): void | never`

Will throw an error if the abort signal is currently aborted. The thrown error will be equal
to the `abortReason()` result.

```ts
const controller = new AbortController();
controller.abort(new Error('Hey ho!'));

new AbortablePromise((_res, _rej, context) => {
  context.throwIfAborted()
}, {
  abortSignal: controller.signal,
  rejectOnAbort: false,
})
  .catch(e => {
    console.log(e);
    // Output: Error('Hey ho!')
  });
```

## Methods

In addition to standard promise methods (`then`, `catch`, and `finally`), `AbortablePromise`
introduces three new methods: `abort`, `reject` and `cancel`. It also provides a static
method `fn`.

### `fn`

The `fn` static method executes a function and resolves its result.

The executed function receives the same execution context as when using the default way of
using `AbortablePromise` via constructor.

The method optionally accepts options passed to the `AbortablePromise` constructor.

```ts
const controller = new AbortController();
const promise = AbortablePromise.fn(context => 'Resolved!', {
  abortSignal: controller.signal,
  timeout: 3000,
});

promise.then(console.log); // Output: 'Resolved!'

const promise2 = AbortablePromise.fn(() => {
  throw new Error('Nah :(');
});
promise2.catch(console.error); // Output: Error('Nah :(')

const promise3 = AbortablePromise.fn(async () => {
  const r = await fetch('...');
  return r.json();
});
// promise3 resolves with the fetched JSON body
```

### `abort`

The `abort` method aborts the promise execution. It calls the underlying `AbortController`'s
abort method with the specified reason.

By default, aborted promises are automatically rejected. To change this behavior, use the promise's
`rejectOnAbort` constructor option.

```ts
const promise = new CancelablePromise().catch(e => {
  console.log(e);
  // Output: Error('Oops!')
});

setTimeout(() => promise.abort(new Error('Oops!')), 1000);
```

### `reject`

The `reject` method rejects the initially created promise with a given reason. It is important to
note that `reject` applies to the original promise, regardless of any chained promises. So, calling
this method, only the initially created promise will be rejected to follow the expected flow.

The expected flow is the flow when rejection was performed in the promise executor (the function,
passed to the promise constructor), and then all chained callbacks (add via `catch(func)`) called.

Here is the example:

```ts
const promise = new AbortablePromise();
const promise2 = promise.catch(e => {
  console.log('I got it!');
});

// Here calling promise.reject() and promise2.reject()
// will have the same effect. We will see the log "I got it!"
```

A bit more real-world example:

```ts
const promise = new AbortablePromise((res, rej) => {
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
// Output: 'Something went wrong', Error('Stop it! Get some help!')
```

### `cancel`

This method aborts the promise with `CancelledError`.

```ts
new AbortablePromise()
  .catch(e => {
    if (isCancelledError(e)) {
      console.log('Canceled');
    }
  })
  .cancel();
// Output: Canceled.

new AbortablePromise((res, rej, context) => {
  context.onAborted(e => {
    if (isCancelledError(e)) {
      res();
    }
  });
})
  .then(() => {
    console.log('Handled properly');
  })
  .cancel();
// Output: Handled properly
```

### `resolve`

This method is specific only to the `ManualPromise` class instance. It resolves the promise with
the specified result.

```ts
const promise = new ManualPromise();
promise.then(console.log);
// Output: 'Done!'

promise.resolve('Done!');
```

It also notifies the executor about promise resolution, allowing developers to stop execution if
needed.

```ts
const promise = new ManualPromise(async (res, rej, context) => {
  // Imitate something async here.
  await new Promise(res => setTimeout(res, 1000));

  if (context.isResolved()) {
    // It means that ManualPromise was resolved outside. 
    // We probably want to stop executing the function 
    // as long as the result will not affect anything.
    return;
  }

  // Otherwise keep doing what we do.
});

promise.resolve('I got the result from somewhere else');
```