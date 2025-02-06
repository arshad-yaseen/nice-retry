export type Awaitable<T> = T | Promise<T>;

/**
 * Represents a function that can be asynchronous or synchronous
 */
export type AsyncFunction<T = any, Args extends any[] = any[]> = (
  ...args: Args
) => Awaitable<T>;

export type FallbackFunction<T> = AsyncFunction<T>;

export type ErrorFilter = (error: Error) => boolean;

/**
 * Different strategies for adding jitter to retry delays
 */
export type JitterStrategy = 'full' | 'equal' | 'decorrelated' | 'none';

/**
 * Different strategies for increasing delay between retries
 */
export type BackoffStrategy = 'exponential' | 'fixed' | 'linear' | 'aggressive';

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
   * Strategy to use for adding jitter to delays
   * - `full`: Completely random delay between 0 and calculated delay
   * - `equal`: Random delay between calculated/2 and calculated*1.5
   * - `decorrelated`: Independent random delays with mean = calculated
   * - `none`: No jitter, use exact calculated delay
   * @default `full`
   */
  jitterStrategy?: JitterStrategy;

  /**
   * Strategy for increasing delay between retries
   * - `exponential`: Doubles delay each time (1s → 2s → 4s → 8s)
   * - `linear`: Increases delay linearly (1s → 2s → 3s → 4s)
   * - `aggressive`: Triples delay each time (1s → 3s → 9s → 27s)
   * - `fixed`: Keeps delay constant (1s → 1s → 1s)
   * @default `exponential`
   */
  backoffStrategy?: BackoffStrategy;

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

export type BaseRetryResult = {
  /** Number of attempts made before success or giving up */
  attempts: number;
  /** Total time elapsed in milliseconds across all retry attempts */
  totalTime: number;
  /** Array of errors from failed attempts */
  errors: Error[];
};

/**
 * Represents the result of a generic retry operation
 * @template T The type of data returned from the successful retry attempt
 * @extends BaseRetryResult
 */
export type RetryAsyncResult<T> = BaseRetryResult & {
  /** The data returned from the successful retry attempt */
  data: T;
};

/**
 * Represents the result of a retry operation specifically for fetch requests
 * @extends BaseRetryResult
 */
export type RetryFetchResult = BaseRetryResult & {
  /** The Response object returned from the successful fetch retry attempt */
  response: Response;
};
