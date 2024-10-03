import { it, describe, expect } from 'vitest';
import { TimeoutError } from './TimeoutError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of TimeoutError', () => {
      expect(TimeoutError.is(new TimeoutError(100))).toBe(true);
      expect(TimeoutError.is(new Error())).toBe(false);
    });
  });
});