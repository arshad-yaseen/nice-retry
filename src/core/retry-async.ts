import {checkAborted} from 'abort-handler';
import {delay, toError} from 'common-utils';
import {DEFAULT_BASE_OPTIONS} from 'defaults';
import {calculateDelay} from 'delay-calcs';
import {
  FallbackError,
  MaxRetriesExceededError,
  RetryConditionFailedError,
} from 'retry-errors';
import type {AsyncFunction, RetryAsyncOptions, RetryAsyncResult} from 'types';

export const retryAsync = async <T>(
  fn: AsyncFunction<T>,
  options: RetryAsyncOptions<T> = {},
): Promise<RetryAsyncResult<T>> => {
  const mergedOptions = {...DEFAULT_BASE_OPTIONS, ...options};
  const startTime = Date.now();
  const errors: Error[] = [];
  let previousDelay = mergedOptions.initialDelay;

  checkAborted(mergedOptions.signal, 0, errors);

  for (let attempt = 1; attempt <= mergedOptions.maxAttempts; attempt++) {
    try {
      checkAborted(mergedOptions.signal, attempt, errors);

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

      checkAborted(mergedOptions.signal, attempt, errors);

      mergedOptions.onRetry?.(err, attempt);

      // Check if we've exhausted all attempts
      if (attempt === mergedOptions.maxAttempts) {
        break;
      }

      if (mergedOptions.retryIf && !mergedOptions.retryIf(err)) {
        throw new RetryConditionFailedError(attempt, errors);
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        mergedOptions.initialDelay,
        mergedOptions.maxDelay,
        mergedOptions.jitterStrategy,
        previousDelay,
      );

      previousDelay = delayMs;

      // Wait before next attempt
      await delay(delayMs);
    }
  }

  // If we have fallbacks, try them
  if (mergedOptions.fallback) {
    const fallbacks = Array.isArray(mergedOptions.fallback)
      ? mergedOptions.fallback
      : [mergedOptions.fallback];

    for (const fallback of fallbacks) {
      try {
        checkAborted(mergedOptions.signal, mergedOptions.maxAttempts, errors);

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
