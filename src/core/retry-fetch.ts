import {DEFAULT_FETCH_OPTIONS} from 'defaults';
import {isNetworkError, isRetryableHttpError} from 'error-predicates';
import {RetryFetchOptions, RetryFetchResult} from 'types';

import {retryAsync} from './retry-async';

export const retryFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit & {retry?: RetryFetchOptions<Response>},
): Promise<RetryFetchResult> => {
    const {retry: retryOptions, ...fetchInit} = init || {};
    const mergedOptions = {...DEFAULT_FETCH_OPTIONS, ...retryOptions};

    const result = await retryAsync(
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
                    (mergedOptions.retryNetworkErrors &&
                        isNetworkError(error)) ||
                    isRetryableHttpError(
                        error,
                        mergedOptions.retryStatusCodes,
                    ) ||
                    (mergedOptions.retryIf?.(error) ?? false)
                );
            },
        },
    );

    return {
        ...result,
        response: result.data,
    };
};
