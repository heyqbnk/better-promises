import { it, describe, expect } from 'vitest';
import { AbortError, isAbortError } from './AbortError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of AbortError', () => {
      expect(isAbortError(new AbortError())).toBe(true);
      expect(isAbortError(new Error())).toBe(false);
    });
  });
});