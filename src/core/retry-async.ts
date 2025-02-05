import {toError} from 'common-utils';
import {DEFAULT_BASE_OPTIONS} from 'defaults';
import {calculateDelay, delayWithAbort} from 'delay';
import {
  FallbackError,
  MaxRetriesExceededError,
  RetryAbortedError,
  RetryConditionFailedError,
} from 'retry-error';
import type {AsyncFunction, RetryAsyncOptions, RetryAsyncResult} from 'types';

export const retryAsync = async <T>(
  fn: AsyncFunction<T>,
  options: RetryAsyncOptions<T> = {},
): Promise<RetryAsyncResult<T>> => {
  const mergedOptions = {...DEFAULT_BASE_OPTIONS, ...options};
  const startTime = Date.now();
  const errors: Error[] = [];
  let previousDelay = mergedOptions.initialDelay;

  for (let attempt = 1; attempt <= mergedOptions.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      const err = toError(error);
      errors.push(err);

      // Check if we should abort
      if (mergedOptions.signal?.aborted) {
        throw new RetryAbortedError(attempt, errors);
      }

      // Check if we've exhausted all attempts
      if (attempt === mergedOptions.maxAttempts) {
        break;
      }

      if (mergedOptions.retryIf && !mergedOptions.retryIf(err)) {
        throw new RetryConditionFailedError(attempt, errors);
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        mergedOptions.initialDelay,
        mergedOptions.maxDelay,
        mergedOptions.jitterStrategy,
        previousDelay,
      );

      // Store this delay for next iteration
      previousDelay = delay;

      // Notify about retry attempt
      mergedOptions.onRetry?.(err, attempt);

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
        errors.push(toError(error));
      }
    }

    throw new FallbackError(mergedOptions.maxAttempts, errors);
  }

  throw new MaxRetriesExceededError(mergedOptions.maxAttempts, errors);
};
