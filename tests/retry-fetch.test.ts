import {retryFetch} from 'core/retry-fetch';
import {RetryConditionFailedError} from 'retry-errors';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {createMockResponse, mockFetchWithDelay} from './mocks';

describe('retryFetch', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should succeed on first attempt', async () => {
        const mockResponse = createMockResponse(200);
        global.fetch = vi
            .fn()
            .mockImplementation(mockFetchWithDelay(mockResponse));

        const result = await retryFetch('https://api.example.com');

        expect(result.response).toBe(mockResponse);
        expect(result.attempts).toBe(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable status codes', async () => {
        const errorResponse = createMockResponse(503, 'Service Unavailable');
        const successResponse = createMockResponse(200);

        global.fetch = vi
            .fn()
            .mockImplementationOnce(mockFetchWithDelay(errorResponse))
            .mockImplementationOnce(mockFetchWithDelay(successResponse));

        const promise = retryFetch('https://api.example.com', {
            retry: {maxAttempts: 2, initialDelay: 100},
        });

        const result = await promise;
        expect(result.response).toBe(successResponse);
        expect(result.attempts).toBe(2);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable status codes', async () => {
        const errorResponse = createMockResponse(400, 'Bad Request');
        global.fetch = vi
            .fn()
            .mockImplementation(mockFetchWithDelay(errorResponse));

        await expect(retryFetch('https://api.example.com')).rejects.toThrow(
            RetryConditionFailedError,
        );

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
        const networkError = new Error('Network error');
        (networkError as any).code = 'ECONNRESET';

        const successResponse = createMockResponse(200);

        global.fetch = vi
            .fn()
            .mockImplementationOnce(mockFetchWithDelay(networkError))
            .mockImplementationOnce(mockFetchWithDelay(successResponse));

        const result = await retryFetch('https://api.example.com');

        expect(result.response).toBe(successResponse);
        expect(result.attempts).toBe(2);
    });

    it('should respect custom retry options', async () => {
        const errorResponse = createMockResponse(429, 'Too Many Requests');
        const successResponse = createMockResponse(200);

        global.fetch = vi
            .fn()
            .mockImplementationOnce(mockFetchWithDelay(errorResponse))
            .mockImplementationOnce(mockFetchWithDelay(successResponse));

        const onRetry = vi.fn();

        await retryFetch('https://api.example.com', {
            retry: {
                maxAttempts: 2,
                initialDelay: 100,
                onRetry,
            },
        });

        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
