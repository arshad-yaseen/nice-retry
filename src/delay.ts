/**
 * Calculates the delay for the next retry attempt with exponential backoff and jitter
 */
export const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitter: number,
): number => {
  // Calculate base delay with exponential backoff
  const baseDelay = Math.min(
    initialDelay * Math.pow(backoffFactor, attempt),
    maxDelay,
  );

  // Add jitter to prevent thundering herd problem
  const jitterAmount = baseDelay * jitter;
  const minDelay = Math.max(0, baseDelay - jitterAmount);
  const maxJitteredDelay = baseDelay + jitterAmount;

  return Math.random() * (maxJitteredDelay - minDelay) + minDelay;
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
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        {once: true},
      );
    }
  });
};
