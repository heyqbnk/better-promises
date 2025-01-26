import { expect, beforeAll, describe, vi, it, afterAll } from 'vitest';

import { CancelledError } from '../errors/CancelledError.js';
import { TimeoutError } from '../errors/TimeoutError.js';

import { AbortablePromise } from './AbortablePromise.js';

describe('static', () => {
  describe('fn', () => {
    it('should resolve result of function execution', async () => {
      await expect(AbortablePromise.fn(() => true)).resolves.toBe(true);
    });

    it('should reject thrown error', async () => {
      await expect(AbortablePromise.fn(() => {
        throw new Error('Oops');
      })).rejects.toStrictEqual(new Error('Oops'));
    });
  });

  describe('resolve', () => {
    it('should return AbortablePromise resolved with passed argument', async () => {
      await expect(AbortablePromise.resolve()).resolves.toBeUndefined();
      await expect(AbortablePromise.resolve('ABC')).resolves.toBe('ABC');
    });

    it('should return instance of AbortablePromise', () => {
      expect(AbortablePromise.resolve()).toBeInstanceOf(AbortablePromise);
    });
  });

  describe('reject', () => {
    it('should return AbortablePromise rejected with passed argument', async () => {
      await expect(AbortablePromise.reject().catch(e => e)).resolves.toBeUndefined();
      await expect(AbortablePromise.reject('ABC').catch(e => e)).resolves.toBe('ABC');
    });

    it('should return instance of AbortablePromise', () => {
      const p = AbortablePromise.reject();
      p.catch(() => null);
      expect(p).toBeInstanceOf(AbortablePromise);
    });
  });
});

describe('constructor', () => {
  it('should notify executor if signal was aborted', () => {
    const spy = vi.fn();
    const p = new AbortablePromise((_res, _rej, context) => {
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

        await new AbortablePromise((res, _rej, context) => {
          spy(context.abortReason());
          res();
        }, { abortSignal: controller.signal });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(undefined);

        spy.mockClear();
        await new AbortablePromise((_res, _rej, context) => {
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

        await new AbortablePromise((res, _, context) => {
          spy(context.isAborted());
          res();
        }, { abortSignal: controller.signal });
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(false);

        spy.mockClear();
        await new AbortablePromise((_res, _rej, context) => {
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
        const promise = new AbortablePromise((res, _, context) => {
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

        const promise = new AbortablePromise((_, rej, context) => {
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
        const promise = new AbortablePromise((res, _, context) => {
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
        const promise = new AbortablePromise({ timeout: 100 });
        vi.advanceTimersByTime(200);
        await expect(promise).rejects.toStrictEqual(new TimeoutError(100));
      });
    });

    describe('rejectOnAbort = false', () => {
      it('should not be rejected on abort', async () => {
        const spy = vi.fn();
        const controller = new AbortController();

        let promise = new AbortablePromise((res, _, context) => {
          spy(context.abortReason());
          res();
        }, { abortSignal: controller.signal, rejectOnAbort: false });
        await promise;
        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(undefined);

        spy.mockClear();
        controller.abort(new Error('TEST'));
        promise = new AbortablePromise((res, _, context) => {
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
    const promise = new AbortablePromise();
    promise.abort('Reason!');
    await expect(promise).rejects.toBe('Reason!');
  });

  it('should be properly handled by catch', async () => {
    const spy = vi.fn();
    const p = new AbortablePromise().catch(spy);
    p.abort(123);
    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(123);
  });
});

describe('cancel', () => {
  it('should abort promise with CancelledError', async () => {
    const promise = new AbortablePromise();
    promise.cancel();
    await expect(promise).rejects.toStrictEqual(new CancelledError());
  });

  it('should be properly handled by catch', async () => {
    const spy = vi.fn();
    const p = new AbortablePromise().catch(spy);
    p.cancel();
    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new CancelledError());
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
    const p = new AbortablePromise();
    p.reject(new Error('REJECT REASON'));
    await expect(p).rejects.toStrictEqual(new Error('REJECT REASON'));
  });

  it('should notify executor about rejection', async () => {
    const spy = vi.fn();
    const p = new AbortablePromise(async (res, _, context) => {
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
    new AbortablePromise(res => res(true)),
  ).resolves.toBe(true);

  await expect(
    new AbortablePromise((_, rej) => rej(new Error('ERR'))),
  ).rejects.toStrictEqual(new Error('ERR'));
});

describe('then', () => {
  it('should create promise with reject of original one', () => {
    const p = new AbortablePromise<string>();
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
    const p = new AbortablePromise<number>(res => res(1)).then(spyA).then(spyB);

    await expect(p).resolves.toBe(4);
    expect(spyA).toHaveBeenCalledOnce();
    expect(spyA).toHaveBeenCalledWith(1);
    expect(spyB).toHaveBeenCalledWith(2);
  });
});

describe('catch', () => {
  it('should create promise with reject of original one', () => {
    const p = new AbortablePromise<string>();
    const reject = vi.spyOn(p, 'reject');

    const p2 = p.catch(() => {
    });
    p2.reject(new Error('Oops'));
    expect(reject).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledWith(new Error('Oops'));
  });

  it('should handle error', async () => {
    const spy = vi.fn();
    const p = new AbortablePromise<string>().catch(spy);
    p.reject(new Error('Well..'));

    await p;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(new Error('Well..'));
  });
});

describe('finally', () => {
  it('should create promise with reject of original one', () => {
    const p = new AbortablePromise<string>();
    const reject = vi.spyOn(p, 'reject');

    const p2 = p.catch(() => {
    });
    p2.reject(new Error('Oops'));
    expect(reject).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledWith(new Error('Oops'));
  });

  it('should call handler in any case', async () => {
    const spy2 = vi.fn();
    const p = new AbortablePromise<string>()
      .catch(() => {
      })
      .finally(spy2);
    p.reject(new Error('Well..'));

    await p;
    expect(spy2).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledWith();
  });
});
