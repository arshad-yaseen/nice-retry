export class NiceRetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NiceRetryError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class InvalidBackoffFactorError extends NiceRetryError {
  constructor(factor: number) {
    super(`backoffFactor must be greater than or equal to 1, got: ${factor}`);
  }
}
