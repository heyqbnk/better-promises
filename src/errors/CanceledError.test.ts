import { it, describe, expect } from 'vitest';
import { CanceledError, isCanceledError } from './CanceledError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of CanceledError', () => {
      expect(isCanceledError(new CanceledError())).toBe(true);
      expect(isCanceledError(new Error())).toBe(false);
    });
  });
});