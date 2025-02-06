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
  backoffStrategy: 'exponential',
};

/**
 * Default status codes that should trigger a fetch retry
 */
export const DEFAULT_RETRY_STATUS_CODES = [
  408, // Request Timeout
  409, // Conflict
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  520, // Cloudflare: Unknown Error
  521, // Cloudflare: Web Server Down
  522, // Cloudflare: Connection Timed Out
  523, // Cloudflare: Origin Unreachable
  524, // Cloudflare: A Timeout Occurred
  525, // Cloudflare: SSL Handshake Failed
  526, // Cloudflare: Invalid SSL Certificate
] as const;

/**
 * Default fetch-specific options
 */
export const DEFAULT_FETCH_OPTIONS: Partial<RetryFetchOptions<Response>> = {
  retryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
  retryNetworkErrors: true,
};
