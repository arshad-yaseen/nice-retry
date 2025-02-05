import {JitterStrategy} from 'types';

/**
 * Calculates the base exponential backoff delay without jitter
 */
const calculateBaseDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
): number => {
  // attempt - 1 since we want first attempt to use initialDelay
  return Math.min(maxDelay, initialDelay * Math.pow(2, attempt - 1));
};

/**
 * Applies jitter to the base delay according to different strategies
 */
const applyJitter = (
  baseDelay: number,
  strategy: JitterStrategy,
  previousDelay: number,
  initialDelay: number,
): number => {
  switch (strategy) {
    case 'full':
      // Full jitter: random value between 0 and baseDelay
      return Math.random() * baseDelay;

    case 'equal': {
      // Equal jitter: half fixed, half random
      const half = baseDelay / 2;
      return half + Math.random() * half;
    }

    case 'decorrelated':
      // Decorrelated jitter: random between initial delay and 3x previous delay
      return Math.random() * (3 * previousDelay - initialDelay) + initialDelay;

    case 'none':
      // No jitter: use exact calculated delay
      return baseDelay;

    default:
      return baseDelay;
  }
};

/**
 * Calculates the delay for the next retry attempt using exponential backoff and jitter
 */
export const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  jitterStrategy: JitterStrategy,
  previousDelay?: number,
): number => {
  const baseDelay = calculateBaseDelay(attempt, initialDelay, maxDelay);

  const prevDelay = previousDelay ?? initialDelay;

  return applyJitter(baseDelay, jitterStrategy, prevDelay, initialDelay);
};

/**
 * Creates a promise that resolves after the calculated delay, but can be aborted
 */
export const delayWithAbort = (
  ms: number,
  signal?: AbortSignal,
): Promise<void> => {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };

      signal.addEventListener('abort', abortHandler, {once: true});

      // Clean up listener both on success and failure
      const cleanup = () => signal.removeEventListener('abort', abortHandler);
      Promise.prototype.finally.call(
        new Promise(res => setTimeout(res, ms)),
        cleanup,
      );
    }
  });
};
