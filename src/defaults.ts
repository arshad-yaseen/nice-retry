import { RetryOptions } from "types";

/**
 * Default retry options
 */
export const DEFAULT_OPTIONS: Required<Omit<RetryOptions<any>, 'signal' | 'fallback' | 'retryIf' | 'retryStatusCodes' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: 0.1,
  retryNetworkErrors: true,
};
