import {RetryAbortedError} from 'retry-errors';

/**
 * Helper function to check if operation is aborted and throw appropriate error
 */
export const checkAborted = (
  signal: AbortSignal | undefined,
  attempt: number,
  errors: Error[],
): void => {
  if (signal?.aborted) {
    throw new RetryAbortedError(attempt, errors);
  }
};
