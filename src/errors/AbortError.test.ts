import { it, describe, expect } from 'vitest';
import { AbortError } from './AbortError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of AbortError', () => {
      expect(AbortError.is(new AbortError())).toBe(true);
      expect(AbortError.is(new Error())).toBe(false);
    });
  });
});