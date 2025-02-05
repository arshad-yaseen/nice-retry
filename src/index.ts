import {retryAsync} from 'core/retry-async';
import {retryFetch} from 'core/retry-fetch';

/**
 * Main retry utility object containing retry functions for different use cases
 */
export const retry = {
  /**
   * Retries fetch requests with configurable options and built-in error handling
   * for common HTTP and network errors
   */
  fetch: retryFetch,
  /**
   * Generic async retry function that can wrap any async operation with
   * configurable retry behavior and exponential backoff
   */
  async: retryAsync,
};

export type {
  RetryAsyncOptions,
  RetryFetchOptions,
  RetryAsyncResult,
  RetryFetchResult,
} from 'types';
export {
  RetryConditionFailedError,
  MaxRetriesExceededError,
  RetryAbortedError,
  FallbackError,
} from 'retry-errors';
