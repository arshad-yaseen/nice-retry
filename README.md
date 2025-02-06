# nice-retry

[![npm version](https://badge.fury.io/js/nice-retry.svg)](https://badge.fury.io/js/nice-retry)
[![Min zip size](https://img.shields.io/bundlephobia/minzip/nice-retry)](https://bundlephobia.com/package/nice-retry)

A powerful, flexible, and developer-friendly retry utility for JavaScript/TypeScript with intelligent defaults and extensive customization options.

## Features

- 🚀 Two powerful retry functions:
  - `retry.async()` for any async operations
  - `retry.fetch()` specifically optimized for fetch requests
- 🔄 Multiple backoff strategies (exponential, linear, fixed, aggressive) with configurable jitter options (full, equal, decorrelated)
- 🎯 Configurable retry conditions with built-in error predicates
- 🔌 Fallback mechanism with support for multiple fallback functions
- ⚡ Abort support using standard AbortController
- 📊 Detailed retry results including attempts, timing, and error history
- 💪 TypeScript-first with comprehensive type definitions
- 🎨 Zero dependencies

## Installation

```bash
npm install nice-retry
# or
yarn add nice-retry
# or
pnpm add nice-retry
```

## Basic Usage

```typescript
import {retry} from 'nice-retry';

// Simple async retry
const result = await retry.async(async () => {
  return await someAsyncOperation();
});

// Simple fetch retry
const result = await retry.fetch('https://api.example.com/data');
```

## Configuration Options

### Retry Attempts

Control how many times the operation should be retried:

```typescript
const result = await retry.async(fn, {
  maxAttempts: 5, // Will try up to 5 times (1 initial + 4 retries)
});
```

### Delay Settings

Configure the timing between retry attempts:

```typescript
const result = await retry.async(fn, {
  initialDelay: 1000, // Start with 1 second delay
  maxDelay: 30000, // Never wait more than 30 seconds
});
```

### Retry Conditions

Specify when retries should occur:

```typescript
const result = await retry.async(fn, {
  // Retry only for specific errors
  retryIf: error => {
    return error.name === 'NetworkError' || error.message.includes('timeout');
  },
});
```

### Fallback Options

Configure fallback operations when all retries fail:

```typescript
const result = await retry.async(fn, {
  // Single fallback
  fallback: async () => backupOperation(),

  // Multiple fallbacks (tried in order)
  fallback: [
    async () => primaryBackup(),
    async () => secondaryBackup(),
    async () => lastResortBackup(),
  ],
});
```

### Abort Control

Control retry cancellation:

```typescript
const abortController = new AbortController();

const result = await retry.async(fn, {
  signal: abortController.signal,
});

// Later, to cancel retries:
abortController.abort();
```

### Callbacks

Monitor retry progress:

```typescript
const result = await retry.async(fn, {
  onRetry: (error, attempt) => {
    console.log(`Attempt ${attempt} failed:`, error.message);
    console.log(`Retrying in a moment...`);
  },
});
```

### Fetch-Specific Options

Special options for `retry.fetch`:

```typescript
const result = await retry.fetch('https://api.example.com/data', {
  retry: {
    // Retry on specific HTTP status codes
    retryStatusCodes: [408, 429, 500, 502, 503, 504],

    // Retry on network errors
    retryNetworkErrors: true,
  },
});
```

## Advanced Topics

### Backoff Strategies

Backoff is a technique that progressively increases the delay between retry attempts. This helps prevent overwhelming the system being called and allows it time to recover from any issues. Like gradually stepping back when something's not working, rather than continuously trying at the same rate.

```typescript
const result = await retry.async(fn, {
  backoffStrategy: 'exponential', // (default) Doubles delay each time (1s → 2s → 4s → 8s)
  // or
  backoffStrategy: 'linear', // Increases delay linearly (1s → 2s → 3s → 4s)
  // or
  backoffStrategy: 'aggressive', // Triples delay each time (1s → 3s → 9s → 27s)
  // or
  backoffStrategy: 'fixed', // Keeps delay constant (1s → 1s → 1s)
});
```

Each backoff strategy serves different use cases:

- `exponential` (default): Best for most scenarios, provides good balance between quick retries and preventing system overload
- `linear`: Useful when you want gradual increase in delay without exponential growth
- `aggressive`: For scenarios requiring more aggressive backing off to reduce system load
- `fixed`: When consistent retry intervals are needed

### Jitter Strategies

Jitter adds randomness to retry delays to prevent multiple clients from retrying at exactly the same time. This is particularly important in distributed systems where synchronized retries could cause "thundering herd" problems - where many clients hit a service simultaneously after a failure.

```typescript
const result = await retry.async(fn, {
  jitterStrategy: 'full', // (default) Completely random delay between 0 and calculated delay
  // or
  jitterStrategy: 'equal', // Random delay between calculated/2 and calculated*1.5
  // or
  jitterStrategy: 'decorrelated', // Independent random delays with mean = calculated
  // or
  jitterStrategy: 'none', // No randomization, use exact calculated delay
});
```

Each jitter strategy serves different purposes:

- `full` (default): Maximum randomization, best for preventing synchronized retries
- `equal`: Balanced randomization that maintains minimum delay threshold
- `decorrelated`: Independent randomization, good for distributed systems
- `none`: No randomization, predictable delays (not recommended for distributed systems)

Example with both strategies:

```typescript
const result = await retry.async(fn, {
  initialDelay: 1000,
  maxDelay: 30000,
  backoffStrategy: 'exponential',
  jitterStrategy: 'full',
});
```

## API Reference

### retry.async<T>

Retries an async function with configurable options.

```typescript
const result = await retry.async<T>(
  fn: () => Promise<T>,
  options?: RetryAsyncOptions<T>
): Promise<RetryAsyncResult<T>>
```

**Returns:**

```typescript
{
  data: T;           // The successful result
  attempts: number;  // Number of attempts made
  totalTime: number; // Total time elapsed in ms
  errors: Error[];   // Array of errors from failed attempts
}
```

### retry.fetch

Retries a fetch request with additional fetch-specific retry options.

```typescript
const result = await retry.fetch(
  input: RequestInfo | URL,
  init?: RequestInit & {
    retry?: RetryFetchOptions
  }
): Promise<RetryFetchResult>
```

**Returns:**

```typescript
{
  response: Response; // The successful response
  attempts: number;   // Number of attempts made
  totalTime: number; // Total time elapsed in ms
  errors: Error[];   // Array of errors from failed attempts
}
```

### Error Types

```typescript
import {
  FallbackError, // All fallbacks failed
  MaxRetriesExceededError, // Maximum retries reached
  RetryAbortedError, // Operation was aborted
  RetryConditionFailedError, // Retry condition prevented further attempts
  RetryOperationError, // Base class for all retry errors
} from 'nice-retry';

try {
  const result = await retry.async(fn);
} catch (error) {
  if (error instanceof MaxRetriesExceededError) {
    console.log(`Failed after ${error.attempts} attempts`);
    console.log('Error history:', error.errors);
  } else if (error instanceof FallbackError) {
    console.log('All fallbacks failed');
  }
}
```

## TypeScript Support

nice-retry is written in TypeScript and provides comprehensive type definitions:

```typescript
// Custom error types
interface MyCustomError extends Error {
  code: string;
}

// Type-safe retry function
const result = await retry.async<User[]>(
  async () => {
    const users = await fetchUsers();
    return users;
  },
  {
    retryIf: (error: MyCustomError) => error.code === 'NETWORK_ERROR',
  },
);

// Type-safe result
const users: User[] = result.data;
```

## Contributing

For guidelines on contributing, please read the [contributing guide](https://github.com/arshad-yaseen/nice-retry/blob/main/CONTRIBUTING.md).

We welcome contributions from the community to enhance nice-retry's capabilities and make it even more powerful. ❤️
