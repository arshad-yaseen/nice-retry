import {RetryAbortedError} from 'retry-errors';

export const checkAborted = (
    signal: AbortSignal | undefined,
    attempt: number,
    errors: Error[],
): void => {
    if (signal?.aborted) {
        throw new RetryAbortedError(attempt, errors);
    }
};
