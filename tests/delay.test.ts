import {calculateDelay} from 'delay-calcs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('Delay Functions', () => {
  describe('calculateDelay', () => {
    beforeEach(() => {
      // Seed random number generator for consistent tests
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Base Exponential Backoff', () => {
      it('should follow standard exponential backoff formula for first attempt', () => {
        const result = calculateDelay(1, 1000, 64000, 'none');
        // First attempt should equal initial delay
        expect(result).toBe(1000);
      });

      it('should correctly calculate exponential growth', () => {
        const initialDelay = 1000;
        const maxDelay = 64000;

        // Testing multiple attempts to verify exponential growth
        const attempts = [2, 3, 4, 5];
        const expectedDelays = attempts.map(attempt =>
          Math.min(maxDelay, initialDelay * Math.pow(2, attempt - 1)),
        );

        attempts.forEach((attempt, index) => {
          const result = calculateDelay(
            attempt,
            initialDelay,
            maxDelay,
            'none',
          );
          expect(result).toBe(expectedDelays[index]);
        });
      });

      it('should respect maximum delay boundary', () => {
        const result = calculateDelay(10, 1000, 64000, 'none');
        expect(result).toBe(64000);
      });
    });

    describe('Jitter Strategies', () => {
      const initialDelay = 1000;
      const maxDelay = 64000;

      describe('Full Jitter', () => {
        it('should apply full jitter according to AWS recommendations', () => {
          const baseDelay = 2000; // Second attempt
          const result = calculateDelay(2, initialDelay, maxDelay, 'full');
          // With mocked Math.random() = 0.5, should be half of base delay
          expect(result).toBe(baseDelay * 0.5);
        });
      });

      describe('Equal Jitter', () => {
        it('should implement equal jitter as per standard algorithm', () => {
          const baseDelay = 2000;
          const result = calculateDelay(2, initialDelay, maxDelay, 'equal');
          // Half fixed + half random (with mocked 0.5)
          const expected = baseDelay / 2 + (baseDelay / 2) * 0.5;
          expect(result).toBe(expected);
        });
      });

      describe('Decorrelated Jitter', () => {
        it('should implement decorrelated jitter according to the formula', () => {
          const previousDelay = 1000;
          const result = calculateDelay(
            2,
            initialDelay,
            maxDelay,
            'decorrelated',
            previousDelay,
          );
          // Formula: random * (3 * previous - initial) + initial
          const expected =
            0.5 * (3 * previousDelay - initialDelay) + initialDelay;
          expect(result).toBe(expected);
        });

        it('should use initial delay as previous delay when not provided', () => {
          const result = calculateDelay(
            2,
            initialDelay,
            maxDelay,
            'decorrelated',
          );
          const expected =
            0.5 * (3 * initialDelay - initialDelay) + initialDelay;
          expect(result).toBe(expected);
        });
      });
    });
  });
});
