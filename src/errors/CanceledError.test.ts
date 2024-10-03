import { it, describe, expect } from 'vitest';
import { CanceledError } from './CanceledError.js';

describe('static', () => {
  describe('is', () => {
    it('should return true if value is instance of CanceledError', () => {
      expect(CanceledError.is(new CanceledError())).toBe(true);
      expect(CanceledError.is(new Error())).toBe(false);
    });
  });
});