export type Awaitable<T> = T | Promise<T>;

/**
 * Represents a function that can be asynchronous or synchronous
 */
export type AsyncFunction<T = any, Args extends any[] = any[]> = (
  ...args: Args
) => Awaitable<T>;

/**
 * Represents the result of a retry operation
 */
export type RetryResult<T> = {
  data: T;
  attempts: number;
  totalTime: number;
  errors: Error[];
};

export type FallbackFunction<T> = AsyncFunction<T>;

export type ErrorFilter = (error: Error) => boolean;

/**
 * Base options for retry operations
 * @template T The type of data being returned by the retried function
 */
export type BaseRetryOptions<T> = {
  /**
   * Maximum number of retry attempts before giving up
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds between retry attempts
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Factor to multiply the delay by after each attempt
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Random factor to add to the delay to prevent thundering herd
   * @default 0.1
   */
  jitter?: number;

  /**
   * AbortSignal to cancel retry attempts
   */
  signal?: AbortSignal;

  /**
   * Fallback function(s) to try if all retries fail
   */
  fallback?: FallbackFunction<T> | FallbackFunction<T>[];

  /**
   * Function to determine if a particular error should trigger a retry
   */
  retryIf?: ErrorFilter;

  /**
   * Callback function called before each retry attempt
   * @param error The error that triggered the retry
   * @param attempt The number of the upcoming retry attempt
   */
  onRetry?: (error: Error, attempt: number) => void;
};

/**
 * Options specific to retryAsync
 */
export type RetryAsyncOptions<T> = BaseRetryOptions<T>;

/**
 * Options specific to retryFetch
 */
export type RetryFetchOptions<T> = BaseRetryOptions<T> & {
  /**
   * HTTP status codes to retry on
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryStatusCodes?: readonly number[];

  /**
   * Whether to retry on network errors
   * @default true
   */
  retryNetworkErrors?: boolean;
};
