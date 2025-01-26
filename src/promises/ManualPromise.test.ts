import { expect, describe, it, vi, beforeAll, afterAll } from 'vitest';

import { ManualPromise } from './ManualPromise.js';

describe('static', () => {
  describe('withFn', () => {
    it('should resolve result of function execution', async () => {
      await expect(ManualPromise.fn(() => true)).resolves.toBe(true);
    });

    it('should reject thrown error', async () => {
      await expect(ManualPromise.fn(() => {
        throw new Error('Oops');
      })).rejects.toStrictEqual(new Error('Oops'));
    });
  });

  describe('resolve', () => {
    it('should return ManualPromise resolved with passed argument', async () => {
      await expect(ManualPromise.resolve()).resolves.toBeUndefined();
      await expect(ManualPromise.resolve('ABC')).resolves.toBe('ABC');
    });

    it('should return instance of ManualPromise', () => {
      expect(ManualPromise.resolve()).toBeInstanceOf(ManualPromise);
    });
  });

  describe('reject', () => {
    it('should return ManualPromise rejected with passed argument', async () => {
      await expect(ManualPromise.reject().catch(e => e)).resolves.toBeUndefined();
      await expect(ManualPromise.reject('ABC').catch(e => e)).resolves.toBe('ABC');
    });

    it('should return instance of ManualPromise', () => {
      const p = ManualPromise.reject();
      p.catch(() => null);
      expect(p).toBeInstanceOf(ManualPromise);
    });
  });
});

describe('resolve', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should resolve specified value', async () => {
    const p = new ManualPromise<string>();
    p.resolve('WOW');
    await expect(p).resolves.toBe('WOW');
  });
});
