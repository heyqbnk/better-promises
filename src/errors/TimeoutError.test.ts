import { it, describe, expect } from 'vitest';
import { isTimeoutError, TimeoutError } from './TimeoutError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of TimeoutError', () => {
      expect(isTimeoutError(new TimeoutError(100))).toBe(true);
      expect(isTimeoutError(new Error())).toBe(false);
    });
  });
});