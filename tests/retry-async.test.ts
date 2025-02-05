import {retryAsync} from 'core/retry-async';
import {
  FallbackError,
  MaxRetriesExceededError,
  RetryAbortedError,
} from 'retry-error';
import {describe, expect, it, vi} from 'vitest';

describe('retryAsync', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryAsync(fn);

    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success');

    const onRetry = vi.fn();
    const result = await retryAsync(fn, {
      maxAttempts: 3,
      initialDelay: 100,
      onRetry,
    });

    expect(result.data).toBe('success');
    expect(result.attempts).toBe(3);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toBe('fail1');
    expect(result.errors[1].message).toBe('fail2');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
  });

  it('should throw MaxRetriesExceededError after all attempts fail', async () => {
    const error = new Error('fail');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retryAsync(fn, {maxAttempts: 3})).rejects.toThrow(
      MaxRetriesExceededError,
    );
  });

  it('should abort retries when signal is triggered', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const retryPromise = retryAsync(fn, {
      signal: controller.signal,
      maxAttempts: 3,
      initialDelay: 100,
    });

    controller.abort();

    await expect(retryPromise).rejects.toThrow(RetryAbortedError);
  });

  it('should try fallbacks when all retries fail', async () => {
    const mainFn = vi.fn().mockRejectedValue(new Error('main fail'));
    const fallback1 = vi.fn().mockRejectedValue(new Error('fallback1 fail'));
    const fallback2 = vi.fn().mockResolvedValue('fallback success');

    const result = await retryAsync(mainFn, {
      maxAttempts: 2,
      fallback: [fallback1, fallback2],
    });

    expect(result.data).toBe('fallback success');
    expect(result.attempts).toBe(2);
    expect(mainFn).toHaveBeenCalledTimes(2);
    expect(fallback1).toHaveBeenCalledTimes(1);
    expect(fallback2).toHaveBeenCalledTimes(1);
  });

  it('should throw FallbackError when all fallbacks fail', async () => {
    const mainFn = vi.fn().mockRejectedValue(new Error('main fail'));
    const fallback = vi.fn().mockRejectedValue(new Error('fallback fail'));

    await expect(
      retryAsync(mainFn, {
        maxAttempts: 2,
        fallback,
      }),
    ).rejects.toThrow(FallbackError);
  });
});
