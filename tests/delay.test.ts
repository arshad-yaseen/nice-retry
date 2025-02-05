import {calculateDelay, delayWithAbort} from 'delay';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('calculateDelay', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('should calculate initial delay correctly', () => {
    const delay = calculateDelay(0, 1000, 30000, 2, 0.1);
    expect(delay).toBe(1000); // With 0.5 random, should return base delay
  });

  it('should respect maxDelay', () => {
    const delay = calculateDelay(5, 1000, 5000, 2, 0.1);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it('should apply exponential backoff', () => {
    const delay = calculateDelay(2, 1000, 30000, 2, 0);
    expect(delay).toBe(4000); // 1000 * (2^2)
  });

  it('should apply jitter', () => {
    const delay = calculateDelay(0, 1000, 30000, 2, 0.5);
    // With 0.5 random and 0.5 jitter, should be in middle of jitter range
    expect(delay).toBe(1000);
  });
});

describe('delayWithAbort', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after specified delay', async () => {
    const promise = delayWithAbort(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should reject immediately if already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(delayWithAbort(1000, controller.signal)).rejects.toThrow(
      'Aborted',
    );
  });

  it('should reject when aborted during delay', async () => {
    const controller = new AbortController();
    const promise = delayWithAbort(1000, controller.signal);

    vi.advanceTimersByTime(500);
    controller.abort();

    await expect(promise).rejects.toThrow('Aborted');
  });
});
