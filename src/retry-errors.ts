export class RetryOperationError extends Error {
    public readonly cause?: Error;
    public readonly attempts: number;
    public readonly errors: Error[];

    constructor(message: string, attempts: number, errors: Error[] = []) {
        super(message);
        this.name = 'RetryOperationError';
        this.attempts = attempts;
        this.errors = errors;
        this.cause = errors[errors.length - 1];
    }
}

export class MaxRetriesExceededError extends RetryOperationError {
    constructor(attempts: number, errors: Error[] = []) {
        super(`Failed after ${attempts} attempts`, attempts, errors);
        this.name = 'MaxRetriesExceededError';
    }
}

export class RetryConditionFailedError extends RetryOperationError {
    constructor(attempts: number, errors: Error[] = []) {
        super(
            'Operation failed and retry condition prevented further attempts',
            attempts,
            errors,
        );
        this.name = 'RetryConditionFailedError';
    }
}

export class RetryAbortedError extends RetryOperationError {
    constructor(attempts: number, errors: Error[] = []) {
        super('Operation was cancelled before completion', attempts, errors);
        this.name = 'RetryAbortedError';
    }
}
