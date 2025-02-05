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
 * Configuration options for retry behavior
 */
export type RetryOptions<T> = {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Exponential backoff factor
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Jitter factor to randomize delay (0-1)
   * @default 0.1
   */
  jitter?: number;

  /**
   * Abort signal to cancel retries
   */
  signal?: AbortSignal;

  /**
   * Single or multiple fallback functions
   */
  fallback?: FallbackFunction<T> | FallbackFunction<T>[];

  /**
   * Custom error filter function
   */
  retryIf?: ErrorFilter;

  /**
   * HTTP status codes to retry on
   */
  retryStatusCodes?: number[];

  /**
   * Whether to retry on network errors
   * @default true
   */
  retryNetworkErrors?: boolean;

  /**
   * Callback function for retry attempts
   */
  onRetry?: (error: Error, attempt: number) => void;
};
