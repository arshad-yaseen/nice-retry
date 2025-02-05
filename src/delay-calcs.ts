import {JitterStrategy} from 'types';

export const calculateBaseDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
): number => {
  // attempt - 1 since we want first attempt to use initialDelay
  return Math.min(maxDelay, initialDelay * Math.pow(2, attempt - 1));
};

export const applyJitter = (
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
