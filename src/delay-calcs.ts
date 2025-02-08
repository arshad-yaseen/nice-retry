import {BackoffStrategy, JitterStrategy} from 'types';
import {clamp, randomBetween} from 'utils';

const calculateBaseDelay = (
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    backoffStrategy: BackoffStrategy,
): number => {
    let delay: number;

    switch (backoffStrategy) {
        case 'fixed':
            delay = initialDelay;
            break;

        case 'linear':
            delay = initialDelay * attempt;
            break;

        case 'aggressive':
            delay = initialDelay * Math.pow(3, attempt - 1);
            break;

        case 'exponential':
        default:
            delay = initialDelay * Math.pow(2, attempt - 1);
            break;
    }

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
            const jittered = Math.random() * baseDelay;
            return clamp(jittered, 0, maxDelay);
        }

        case 'equal': {
            const half = baseDelay / 2;
            const jittered = half + Math.random() * half;
            return clamp(jittered, 0, maxDelay);
        }

        case 'decorrelated': {
            const lower = Math.min(baseDelay, maxDelay);
            const upperCandidate = 3 * previousDelay;
            const upper = Math.min(upperCandidate, maxDelay);

            if (upper <= lower) {
                return lower;
            }

            const jittered = randomBetween(lower, upper);
            return clamp(Math.max(jittered, initialDelay), 0, maxDelay);
        }

        case 'none':
        default:
            return clamp(baseDelay, 0, maxDelay);
    }
};

export const calculateDelay = (
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    jitterStrategy: JitterStrategy,
    backoffStrategy: BackoffStrategy,
    previousDelay?: number,
): number => {
    const baseDelay = calculateBaseDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffStrategy,
    );

    const prevDelay = previousDelay ?? initialDelay;

    return applyJitter(
        baseDelay,
        jitterStrategy,
        prevDelay,
        initialDelay,
        maxDelay,
    );
};
