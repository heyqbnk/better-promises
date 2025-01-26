import { it, describe, expect } from 'vitest';
import { CancelledError, isCancelledError } from './CancelledError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of CancelledError', () => {
      expect(isCancelledError(new CancelledError())).toBe(true);
      expect(isCancelledError(new Error())).toBe(false);
    });
  });
});