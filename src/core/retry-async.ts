import {
  FallbackError,
  MaxRetriesExceededError,
  RetryAbortedError,
} from 'retry-error';
import { calculateDelay, delayWithAbort } from 'delay';
import type { AsyncFunction, RetryOptions, RetryResult } from 'types';
import { DEFAULT_OPTIONS } from 'defaults';
import { isNetworkError, isRetryableHttpError } from 'error-predicates';

export const retryAsync = async <T>(
  fn: AsyncFunction<T>,
  options: RetryOptions<T> = {}
): Promise<RetryResult<T>> => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
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

      // Check if we should retry based on the error
      const shouldRetry =
        (mergedOptions.retryNetworkErrors && isNetworkError(err)) ||
        isRetryableHttpError(err, mergedOptions.retryStatusCodes) ||
        (mergedOptions.retryIf && mergedOptions.retryIf(err));

      if (!shouldRetry) {
        break;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        mergedOptions.initialDelay,
        mergedOptions.maxDelay,
        mergedOptions.backoffFactor,
        mergedOptions.jitter
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
} 
