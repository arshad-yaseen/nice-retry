import {BackoffStrategy, JitterStrategy} from 'types';
import {clamp, randomBetween} from 'utils';

/**
 * Calculate the "base" backoff delay (pre-jitter) for a given attempt.
 */
const calculateBaseDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffStrategy: BackoffStrategy,
): number => {
  let delay: number;

  switch (backoffStrategy) {
    case 'fixed':
      // Always use the same delay, ignoring attempt count.
      delay = initialDelay;
      break;

    case 'linear':
      // Delay grows linearly with the attempt count:
      //   attempt #1 => initialDelay
      //   attempt #2 => 2*initialDelay
      //   attempt #3 => 3*initialDelay, etc.
      delay = initialDelay * attempt;
      break;

    case 'aggressive':
      // “Aggressive” is just a faster-growing exponent than typical.
      // For example, 3^(attempt - 1).
      //   attempt #1 => initialDelay * 3^0 => initialDelay
      //   attempt #2 => initialDelay * 3^1 => 3*initialDelay
      //   attempt #3 => initialDelay * 3^2 => 9*initialDelay, etc.
      delay = initialDelay * Math.pow(3, attempt - 1);
      break;

    case 'exponential':
    default:
      // Standard exponential backoff (base 2):
      //   attempt #1 => initialDelay * 2^0 => initialDelay
      //   attempt #2 => initialDelay * 2^1 => 2*initialDelay
      //   attempt #3 => initialDelay * 2^2 => 4*initialDelay, etc.
      delay = initialDelay * Math.pow(2, attempt - 1);
      break;
  }

  // Ensure we do not exceed maxDelay
  return Math.min(delay, maxDelay);
};

const applyJitter = (
  baseDelay: number,
  strategy: JitterStrategy,
  previousDelay: number,
  initialDelay: number,
  maxDelay: number,
): number => {
  switch (strategy) {
    case 'full': {
      // Full jitter: random value between 0 and baseDelay
      const jittered = Math.random() * baseDelay;
      return clamp(jittered, 0, maxDelay);
    }

    case 'equal': {
      // Equal jitter: half "fixed", half random
      // finalDelay = baseDelay/2 + random(baseDelay/2)
      const half = baseDelay / 2;
      const jittered = half + Math.random() * half;
      return clamp(jittered, 0, maxDelay);
    }

    case 'decorrelated': {
      // Decorrelated jitter approach from AWS:
      //   nextDelay = random( baseDelay, 3 * previousDelay )
      // but we keep a lower bound of initialDelay
      //
      // We'll clamp the random range within [initialDelay, maxDelay].
      // Then pick a random point between baseDelay and up to that upper bound.
      // The typical formula is:
      //   newDelay = Math.random() * (3 * prevDelay - baseDelay) + baseDelay
      //
      // However, to handle edge cases systematically, do:
      const lower = Math.min(baseDelay, maxDelay);
      // The usual decorrelated approach uses "3 * previousDelay":
      const upperCandidate = 3 * previousDelay;
      const upper = Math.min(upperCandidate, maxDelay);

      // If for some reason upper < lower (e.g. if previousDelay is very small),
      // fallback to the lower bound. This prevents negative or inverted ranges.
      if (upper <= lower) {
        return lower;
      }

      const jittered = randomBetween(lower, upper);
      // Always ensure it's at least initialDelay, but not beyond maxDelay.
      return clamp(Math.max(jittered, initialDelay), 0, maxDelay);
    }

    case 'none':
    default:
      // No jitter: use exact calculated delay
      return clamp(baseDelay, 0, maxDelay);
  }
};

/**
 * Compute the final delay (in milliseconds) to use for the nth attempt.
 * @returns The final delay (ms) to use for this attempt.
 */
export const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  jitterStrategy: JitterStrategy,
  backoffStrategy: BackoffStrategy,
  previousDelay?: number,
): number => {
  // First, compute the base delay based on the backoff strategy.
  const baseDelay = calculateBaseDelay(
    attempt,
    initialDelay,
    maxDelay,
    backoffStrategy,
  );

  const prevDelay = previousDelay ?? initialDelay;

  // Finally, apply the jitter strategy to that base delay.
  return applyJitter(
    baseDelay,
    jitterStrategy,
    prevDelay,
    initialDelay,
    maxDelay,
  );
};
