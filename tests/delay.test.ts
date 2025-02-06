import {calculateDelay} from 'delay-calcs';
import type {BackoffStrategy, JitterStrategy} from 'types';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('calculateDelay', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fixed backoff strategy', () => {
    const backoffStrategy: BackoffStrategy = 'fixed';

    it('should return initial delay with no jitter', () => {
      const result = calculateDelay(1, 1000, 5000, 'none', backoffStrategy);
      expect(result).toBe(1000);
    });

    it('should maintain fixed delay across multiple attempts', () => {
      const attempts = [1, 2, 3, 4, 5];
      const results = attempts.map(attempt =>
        calculateDelay(attempt, 1000, 5000, 'none', backoffStrategy),
      );
      results.forEach(result => expect(result).toBe(1000));
    });

    it('should respect maxDelay', () => {
      const result = calculateDelay(1, 6000, 5000, 'none', backoffStrategy);
      expect(result).toBe(5000);
    });
  });

  describe('linear backoff strategy', () => {
    const backoffStrategy: BackoffStrategy = 'linear';

    it('should increase delay linearly with attempts', () => {
      const expectedDelays = [1000, 2000, 3000, 4000, 5000];
      const results = [1, 2, 3, 4, 5].map(attempt =>
        calculateDelay(attempt, 1000, 10000, 'none', backoffStrategy),
      );
      expect(results).toEqual(expectedDelays);
    });

    it('should cap at maxDelay', () => {
      const result = calculateDelay(6, 1000, 5000, 'none', backoffStrategy);
      expect(result).toBe(5000);
    });
  });

  describe('exponential backoff strategy', () => {
    const backoffStrategy: BackoffStrategy = 'exponential';

    it('should increase delay exponentially with attempts', () => {
      const expectedDelays = [1000, 2000, 4000, 8000, 16000];
      const results = [1, 2, 3, 4, 5].map(attempt =>
        calculateDelay(attempt, 1000, 20000, 'none', backoffStrategy),
      );
      expect(results).toEqual(expectedDelays);
    });

    it('should respect maxDelay', () => {
      const result = calculateDelay(5, 1000, 10000, 'none', backoffStrategy);
      expect(result).toBe(10000);
    });
  });

  describe('aggressive backoff strategy', () => {
    const backoffStrategy: BackoffStrategy = 'aggressive';

    it('should increase delay aggressively with attempts', () => {
      const expectedDelays = [1000, 3000, 9000, 27000, 81000];
      const results = [1, 2, 3, 4, 5].map(attempt =>
        calculateDelay(attempt, 1000, 100000, 'none', backoffStrategy),
      );
      expect(results).toEqual(expectedDelays);
    });

    it('should respect maxDelay', () => {
      const result = calculateDelay(5, 1000, 10000, 'none', backoffStrategy);
      expect(result).toBe(10000);
    });
  });

  describe('jitter strategies', () => {
    describe('full jitter', () => {
      const jitterStrategy: JitterStrategy = 'full';

      it('should apply full jitter correctly', () => {
        const result = calculateDelay(1, 1000, 5000, jitterStrategy, 'fixed');
        expect(result).toBe(500);
      });

      it('should respect maxDelay', () => {
        const result = calculateDelay(1, 10000, 5000, jitterStrategy, 'fixed');
        expect(result).toBe(2500);
      });
    });

    describe('equal jitter', () => {
      const jitterStrategy: JitterStrategy = 'equal';

      it('should apply equal jitter correctly', () => {
        const result = calculateDelay(1, 1000, 5000, jitterStrategy, 'fixed');
        expect(result).toBe(750);
      });

      it('should respect maxDelay', () => {
        const result = calculateDelay(1, 10000, 5000, jitterStrategy, 'fixed');
        expect(result).toBe(3750);
      });
    });

    describe('decorrelated jitter', () => {
      const jitterStrategy: JitterStrategy = 'decorrelated';

      it('should apply decorrelated jitter correctly', () => {
        const result = calculateDelay(
          2,
          1000,
          5000,
          jitterStrategy,
          'exponential',
          1000,
        );
        expect(result).toBe(2500);
      });

      it('should respect initialDelay as minimum', () => {
        const result = calculateDelay(
          1,
          1000,
          5000,
          jitterStrategy,
          'fixed',
          100,
        );
        expect(result).toBe(1000);
      });

      it('should respect maxDelay', () => {
        const result = calculateDelay(
          1,
          1000,
          5000,
          jitterStrategy,
          'fixed',
          10000,
        );
        expect(result).toBe(3000);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero initial delay', () => {
      const result = calculateDelay(1, 0, 5000, 'none', 'fixed');
      expect(result).toBe(0);
    });

    it('should handle zero max delay', () => {
      const result = calculateDelay(1, 1000, 0, 'none', 'fixed');
      expect(result).toBe(0);
    });

    it('should handle negative attempts', () => {
      const result = calculateDelay(-1, 1000, 5000, 'none', 'fixed');
      expect(result).toBe(1000);
    });

    it('should handle very large attempts', () => {
      const result = calculateDelay(100, 1000, 5000, 'none', 'fixed');
      expect(result).toBe(1000);
    });

    it('should handle undefined previous delay', () => {
      const result = calculateDelay(
        2,
        1000,
        5000,
        'decorrelated',
        'exponential',
      );
      expect(result).toBe(2500);
    });
  });

  describe('combined scenarios', () => {
    it('should handle exponential backoff with full jitter', () => {
      const results = [1, 2, 3].map(attempt =>
        calculateDelay(attempt, 1000, 10000, 'full', 'exponential'),
      );
      expect(results[0]).toBe(500);
      expect(results[1]).toBe(1000);
      expect(results[2]).toBe(2000);
    });

    it('should handle aggressive backoff with equal jitter', () => {
      const results = [1, 2, 3].map(attempt =>
        calculateDelay(attempt, 1000, 10000, 'equal', 'aggressive'),
      );
      expect(results[0]).toBe(750);
      expect(results[1]).toBe(2250);
      expect(results[2]).toBe(6750);
    });
  });

  describe('performance boundaries', () => {
    it('should handle very small initial delays', () => {
      const result = calculateDelay(1, 0.1, 1000, 'none', 'exponential');
      expect(result).toBe(0.1);
    });

    it('should handle very large max delays', () => {
      const result = calculateDelay(
        1,
        1000,
        Number.MAX_SAFE_INTEGER,
        'none',
        'fixed',
      );
      expect(result).toBe(1000);
    });
  });
});
