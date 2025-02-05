/**
 * Error for retry-related errors
 */
export class RetryError extends Error {
  public readonly cause?: Error;
  public readonly attempts: number;
  public readonly errors: Error[];

  constructor(message: string, attempts: number, errors: Error[] = []) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.errors = errors;
    this.cause = errors[errors.length - 1];

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryError);
    }
  }
}

/**
 * Error thrown when all retry attempts are exhausted
 */
export class MaxRetriesExceededError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super(`Max retries (${attempts}) exceeded`, attempts, errors);
    this.name = 'MaxRetriesExceededError';
  }
}

/**
 * Error thrown when the retry condition (retryIf) returns false
 */
export class RetryConditionFailedError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super('Retry condition returned false', attempts, errors);
    this.name = 'RetryConditionFailedError';
  }
}

/**
 * Error thrown when the retry operation is aborted
 */
export class RetryAbortedError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super('Retry operation aborted', attempts, errors);
    this.name = 'RetryAbortedError';
  }
}

/**
 * Error thrown when all fallbacks fail
 */
export class FallbackError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super('All fallback attempts failed', attempts, errors);
    this.name = 'FallbackError';
  }
}
