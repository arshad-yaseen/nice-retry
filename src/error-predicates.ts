const NETWORK_ERROR_CODES = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ECONNABORTED',
    'ETIMEDOUT',
    'ENETUNREACH',
    'EHOSTUNREACH',
]);

export const isNetworkError = (error: Error): boolean => {
    if ('code' in error && typeof (error as any).code === 'string') {
        return NETWORK_ERROR_CODES.has((error as any).code);
    }
    return false;
};

export const isRetryableHttpError = (
    error: Error,
    retryStatusCodes?: readonly number[],
): boolean => {
    if (!retryStatusCodes) return false;

    if ('status' in error && typeof (error as any).status === 'number') {
        return retryStatusCodes.includes((error as any).status);
    }

    return false;
};
