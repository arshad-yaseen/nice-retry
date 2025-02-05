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

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryError);
    }
  }
}

export class MaxRetriesExceededError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super(`Failed after ${attempts} attempts`, attempts, errors);
    this.name = 'MaxRetriesExceededError';
  }
}

export class RetryConditionFailedError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super(
      'Operation failed and retry condition prevented further attempts',
      attempts,
      errors,
    );
    this.name = 'RetryConditionFailedError';
  }
}

export class RetryAbortedError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super('Operation was cancelled before completion', attempts, errors);
    this.name = 'RetryAbortedError';
  }
}

export class FallbackError extends RetryError {
  constructor(attempts: number, errors: Error[] = []) {
    super('Main operation and all fallback attempts failed', attempts, errors);
    this.name = 'FallbackError';
  }
}
