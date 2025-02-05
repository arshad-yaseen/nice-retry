import {BaseRetryOptions, RetryFetchOptions} from 'types';

/**
 * Default retry options
 */
export const DEFAULT_BASE_OPTIONS: Required<
  Omit<BaseRetryOptions<any>, 'signal' | 'fallback' | 'retryIf' | 'onRetry'>
> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  jitterStrategy: 'full',
  backoffFactor: 2,
};

/**
 * Default status codes that should trigger a fetch retry
 */
export const DEFAULT_RETRY_STATUS_CODES = [
  408, 429, 500, 502, 503, 504,
] as const;

/**
 * Default fetch-specific options
 */
export const DEFAULT_FETCH_OPTIONS: Partial<RetryFetchOptions<Response>> = {
  retryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
  retryNetworkErrors: true,
};
