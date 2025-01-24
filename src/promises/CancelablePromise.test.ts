import { expect, beforeAll, describe, vi, it, afterAll } from 'vitest';

import { CanceledError } from '../errors/CanceledError.js';
import { TimeoutError } from '../errors/TimeoutError.js';

import { CancelablePromise } from './CancelablePromise.js';

describe('static', () => {
  describe('withFn', () => {
    it('should resolve result of function execution', async () => {
      await expect(CancelablePromise.withFn(() => true)).resolves.toBe(true);
    });

    it('should reject thrown error', async () => {
      await expect(CancelablePromise.withFn(() => {
        throw new Error('Oops');
      })).rejects.toStrictEqual(new Error('Oops'));
    });
  });

  describe('resolve', () => {
    it('should return CancelablePromise resolved with passed argument', async () => {
      await expect(CancelablePromise.resolve()).resolves.toBeUndefined();
      await expect(CancelablePromise.resolve('ABC')).resolves.toBe('ABC');
    });

    it('should return instance of CancelablePromise', () => {
      expect(CancelablePromise.resolve()).toBeInstanceOf(CancelablePromise);
    });
  });

  describe('reject', () => {
    it('should return CancelablePromise rejected with passed argument', async () => {
      await expect(CancelablePromise.reject().catch(e => e)).resolves.toBeUndefined();
      await expect(CancelablePromise.reject('ABC').catch(e => e)).resolves.toBe('ABC');
    });

    it('should return instance of CancelablePromise', () => {
      const p = CancelablePromise.reject();
      p.catch(() => null);
      expect(p).toBeInstanceOf(CancelablePromise);
    });
  });
});

describe('constructor', () => {
  it('should notify executor if signal was aborted', () => {
    const spy = vi.fn();
    const p = new CancelablePromise((_res, _rej, context) => {
      context.onAborted(spy);
    })
      .catch(() => {
      });

    p.reject(new Error('TEST_ERROR'));
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new Error('TEST_ERROR'));
  });

  describe('context', () => {
    describe('abortReason', () => {
      it('should be initially set if abortSignal was passed with abort reason', async () => {
        const spy = vi.fn();
        const controller = new AbortController();

        await new CancelablePromise((res, _rej, context) => {
          spy(context.abortReason());
          res();
        }, { abortSignal: controller.signal });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(undefined);

        spy.mockClear();
        await new CancelablePromise((_res, _rej, context) => {
          controller.abort(new Error('TEST'));
          spy(context.abortReason());
        }, { abortSignal: controller.signal })
          .catch(() => {
          });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(new Error('TEST'));
      });
    });

    describe('isAborted', () => {
      it('should be initially set if abortSignal was passed with abort reason', async () => {
        const spy = vi.fn();
        const controller = new AbortController();

        await new CancelablePromise((res, _, context) => {
          spy(context.isAborted());
          res();
        }, { abortSignal: controller.signal });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(false);

        spy.mockClear();
        await new CancelablePromise((_res, _rej, context) => {
          controller.abort();
          spy(context.isAborted());
        }, { abortSignal: controller.signal })
          .catch(() => {
          });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(true);
      });
    });

    describe('isResolved', () => {
      it('should be set to true if promise was resolved', async () => {
        const spy = vi.fn();
        const promise = new CancelablePromise((res, _, context) => {
          spy(context.isResolved());
          res();
          spy(context.isResolved());
        });
        await promise;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, false);
        expect(spy).toHaveBeenNthCalledWith(2, true);
      });
    });

    describe('onAborted', () => {
      it('should call passed listener when signal was aborted', async () => {
        const spy = vi.fn();
        const controller = new AbortController();

        const promise = new CancelablePromise((_, rej, context) => {
          context.onAborted(spy);
          rej(new Error('Woops'));
        }, { abortSignal: controller.signal });
        await promise.catch(() => {
        });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(new Error('Woops'));
      });
    });

    describe('resolved', () => {
      it('should return promise resolve result', async () => {
        const spy = vi.fn();
        const promise = new CancelablePromise((res, _, context) => {
          spy(context.resolved());
          res(123);
          spy(context.resolved());
        });
        await promise;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, undefined);
        expect(spy).toHaveBeenNthCalledWith(2, 123);
      });
    });
  });

  describe('options', () => {
    describe('timeout', () => {
      beforeAll(() => {
        vi.useFakeTimers();
      });

      afterAll(() => {
        vi.useRealTimers();
      });

      it('should reject promise with TimeoutError if timeout was reached', async () => {
        const promise = new CancelablePromise({ timeout: 100 });
        vi.advanceTimersByTime(200);
        await expect(promise).rejects.toStrictEqual(new TimeoutError(100));
      });
    });

    describe('rejectOnAbort = false', () => {
      it('should not be rejected on abort', async () => {
        const spy = vi.fn();
        const controller = new AbortController();

        let promise = new CancelablePromise((res, _, context) => {
          spy(context.abortReason());
          res();
        }, { abortSignal: controller.signal, rejectOnAbort: false });
        await promise;
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(undefined);

        spy.mockClear();
        controller.abort(new Error('TEST'));
        promise = new CancelablePromise((res, _, context) => {
          spy(context.abortReason());
          res();
        }, { abortSignal: controller.signal, rejectOnAbort: false });
        await promise;
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(new Error('TEST'));
      });
    });
  });
});

describe('abort', () => {
  it('should abort promise with passed reason', async () => {
    const promise = new CancelablePromise();
    promise.abort('Reason!');
    await expect(promise).rejects.toBe('Reason!');
  });

  it('should be properly handled by catch', async () => {
    const spy = vi.fn();
    const p = new CancelablePromise().catch(spy);
    p.abort(123);
    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(123);
  });
});

describe('cancel', () => {
  it('should reject promise with CanceledError', async () => {
    const promise = new CancelablePromise();
    promise.cancel(true);
    await expect(promise).rejects.toStrictEqual(new CanceledError());
  });

  it('should abort promise with CanceledError if true passed', async () => {
    const spy = vi.fn();
    const promise = new CancelablePromise((res, _rej, context) => {
      context.onAborted(reason => {
        spy(reason);
        res();
      });
    }, { rejectOnAbort: false });
    promise.cancel(true);
    await promise;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new CanceledError());
  });

  it('should be properly handled by catch', async () => {
    const spy = vi.fn();
    const p = new CancelablePromise().catch(spy);
    p.cancel();
    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new CanceledError());
  });
});

describe('reject', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should reject specified value', async () => {
    const p = new CancelablePromise();
    p.reject(new Error('REJECT REASON'));
    await expect(p).rejects.toStrictEqual(new Error('REJECT REASON'));
  });

  it('should notify executor about rejection', async () => {
    const spy = vi.fn();
    const p = new CancelablePromise(async (res, _, context) => {
      await new Promise(r => setTimeout(r, 100));
      if (context.isAborted()) {
        spy();
        return;
      }
      res();
    });
    p.reject('Some external rejection');
    vi.advanceTimersByTime(500);
    await p.catch(() => null);
    expect(spy).toHaveBeenCalledOnce();
  });
});

it('should behave like usual promise', async () => {
  await expect(
    new CancelablePromise(res => res(true)),
  ).resolves.toBe(true);

  await expect(
    new CancelablePromise((_, rej) => rej(new Error('ERR'))),
  ).rejects.toStrictEqual(new Error('ERR'));
});

describe('then', () => {
  it('should create promise with reject of original one', () => {
    const p = new CancelablePromise<string>();
    const reject = vi.spyOn(p, 'reject');

    const p2 = p.then().catch(() => {
    });
    p2.reject(new Error('Oops'));
    expect(reject).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledWith(new Error('Oops'));
  });

  it('should be called with previous promise result', async () => {
    const spyA = vi.fn(r => r + 1);
    const spyB = vi.fn(r => r + 2);
    const p = new CancelablePromise<number>(res => res(1)).then(spyA).then(spyB);

    await expect(p).resolves.toBe(4);
    expect(spyA).toHaveBeenCalledOnce();
    expect(spyA).toHaveBeenCalledWith(1);
    expect(spyB).toHaveBeenCalledWith(2);
  });
});

describe('catch', () => {
  it('should create promise with reject of original one', () => {
    const p = new CancelablePromise<string>();
    const reject = vi.spyOn(p, 'reject');

    const p2 = p.catch(() => {
    });
    p2.reject(new Error('Oops'));
    expect(reject).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledWith(new Error('Oops'));
  });

  it('should handle error', async () => {
    const spy = vi.fn();
    const p = new CancelablePromise<string>().catch(spy);
    p.reject(new Error('Well..'));

    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new Error('Well..'));
  });
});

describe('finally', () => {
  it('should create promise with reject of original one', () => {
    const p = new CancelablePromise<string>();
    const reject = vi.spyOn(p, 'reject');

    const p2 = p.catch(() => {
    });
    p2.reject(new Error('Oops'));
    expect(reject).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledWith(new Error('Oops'));
  });

  it('should call handler in any case', async () => {
    const spy2 = vi.fn();
    const p = new CancelablePromise<string>()
      .catch(() => {
      })
      .finally(spy2);
    p.reject(new Error('Well..'));

    await p;
    expect(spy2).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledWith();
  });
});
