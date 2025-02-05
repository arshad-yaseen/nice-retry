import { retryAsync } from './retry-async';
import type { RetryOptions, RetryResult } from '../types';

// Default status codes that should trigger a retry
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export const retryFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit & { retry?: Partial<RetryOptions<Response>> }
): Promise<RetryResult<Response>> => {
  // Extract retry options from init
  const { retry: retryOptions, ...fetchInit } = init || {};

  return retryAsync(
    async () => {
      const response = await fetch(input, fetchInit);
      
      // Throw on unsuccessful responses to trigger retry
      if (!response.ok) {
        const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return response;
    },
    {
      retryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
      retryNetworkErrors: true,
      ...retryOptions,
    }
  );
}
