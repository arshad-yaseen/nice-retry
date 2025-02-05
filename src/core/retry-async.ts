import {DEFAULT_BASE_OPTIONS} from 'defaults';
import {calculateDelay, delayWithAbort} from 'delay';
import {
  FallbackError,
  MaxRetriesExceededError,
  RetryAbortedError,
  RetryConditionFailedError,
} from 'retry-error';
import type {AsyncFunction, RetryAsyncOptions, RetryResult} from 'types';

export const retryAsync = async <T>(
  fn: AsyncFunction<T>,
  options: RetryAsyncOptions<T> = {},
): Promise<RetryResult<T>> => {
  const mergedOptions = {...DEFAULT_BASE_OPTIONS, ...options};
  const startTime = Date.now();
  const errors: Error[] = [];

  for (let attempt = 0; attempt < mergedOptions.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        data: result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // Check if we should abort
      if (mergedOptions.signal?.aborted) {
        throw new RetryAbortedError(attempt + 1, errors);
      }

      // Check if we've exhausted all attempts
      if (attempt === mergedOptions.maxAttempts - 1) {
        break;
      }

      if (mergedOptions.retryIf && !mergedOptions.retryIf(err)) {
        throw new RetryConditionFailedError(attempt + 1, errors);
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        mergedOptions.initialDelay,
        mergedOptions.maxDelay,
        mergedOptions.backoffFactor,
        mergedOptions.jitter,
      );

      // Notify about retry attempt
      mergedOptions.onRetry?.(err, attempt + 1);

      // Wait before next attempt
      await delayWithAbort(delay, mergedOptions.signal);
    }
  }

  // If we have fallbacks, try them
  if (mergedOptions.fallback) {
    const fallbacks = Array.isArray(mergedOptions.fallback)
      ? mergedOptions.fallback
      : [mergedOptions.fallback];

    for (const fallback of fallbacks) {
      try {
        const result = await fallback();
        return {
          data: result,
          attempts: mergedOptions.maxAttempts,
          totalTime: Date.now() - startTime,
          errors,
        };
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    throw new FallbackError(mergedOptions.maxAttempts, errors);
  }

  throw new MaxRetriesExceededError(mergedOptions.maxAttempts, errors);
};
