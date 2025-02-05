import {DEFAULT_FETCH_OPTIONS} from 'defaults';
import {isNetworkError, isRetryableHttpError} from 'error-predicates';
import {RetryFetchOptions, RetryResult} from 'types';

import {retryAsync} from './retry-async';

export const retryFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit & {retry?: Partial<RetryFetchOptions<Response>>},
): Promise<RetryResult<Response>> => {
  const {retry: retryOptions, ...fetchInit} = init || {};
  const mergedOptions = {...DEFAULT_FETCH_OPTIONS, ...retryOptions};

  return retryAsync(
    async () => {
      const response = await fetch(input, fetchInit);

      if (!response.ok) {
        const error = new Error(
          `HTTP Error ${response.status}: ${response.statusText}`,
        );
        (error as any).status = response.status;
        throw error;
      }

      return response;
    },
    {
      ...mergedOptions,
      retryIf: (error: Error) => {
        return (
          (mergedOptions.retryNetworkErrors && isNetworkError(error)) ||
          isRetryableHttpError(error, mergedOptions.retryStatusCodes) ||
          (mergedOptions.retryIf?.(error) ?? false)
        );
      },
    },
  );
};
