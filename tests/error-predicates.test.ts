import {isNetworkError, isRetryableHttpError} from 'error-predicates';
import {describe, expect, it} from 'vitest';

describe('isNetworkError', () => {
  it('should identify network errors', () => {
    const networkErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EHOSTUNREACH',
    ];

    networkErrors.forEach(code => {
      const error = new Error('Network error');
      (error as any).code = code;
      expect(isNetworkError(error)).toBe(true);
    });
  });

  it('should return false for non-network errors', () => {
    const error = new Error('Regular error');
    expect(isNetworkError(error)).toBe(false);
  });

  it('should return false for invalid code types', () => {
    const error = new Error('Invalid code');
    (error as any).code = 123;
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isRetryableHttpError', () => {
  const retryStatusCodes = [408, 429, 500, 502, 503, 504];

  it('should identify retryable HTTP status codes', () => {
    retryStatusCodes.forEach(status => {
      const error = new Error('HTTP error');
      (error as any).status = status;
      expect(isRetryableHttpError(error, retryStatusCodes)).toBe(true);
    });
  });

  it('should return false for non-retryable status codes', () => {
    const error = new Error('HTTP error');
    (error as any).status = 400;
    expect(isRetryableHttpError(error, retryStatusCodes)).toBe(false);
  });

  it('should return false when no status codes provided', () => {
    const error = new Error('HTTP error');
    (error as any).status = 500;
    expect(isRetryableHttpError(error, undefined)).toBe(false);
  });
});
