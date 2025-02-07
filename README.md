# nice-retry

[![npm version](https://badge.fury.io/js/nice-retry.svg)](https://badge.fury.io/js/nice-retry)
[![Min zip size](https://img.shields.io/bundlephobia/minzip/nice-retry)](https://bundlephobia.com/package/nice-retry)

A lightweight, zero-dependency retry utility that just works.

## Quick Start

```bash
npm install nice-retry
```

```typescript
import {retry} from 'nice-retry';

// Retry any async operation
await retry.async(() => someAsyncOperation());

// Retry fetch requests
await retry.fetch('https://api.example.com/data');
```

That's all you need for 90% of use cases! 🎉

## Why nice-retry?

- 🪶 **Lightweight** - Zero dependencies, tiny bundle size
- 🔋 **Batteries included** - Built-in fetch support, backoff, jitter, fallbacks
- 📦 **Just works** - Smart defaults, no complex configuration needed
- 💪 **TypeScript-first** - Full type safety and autocompletion

## Common Use Cases

```typescript
// Retry with custom attempts
await retry.async(fn, {maxAttempts: 5});

// Retry with custom delay
await retry.async(fn, {initialDelay: 1000});

// Retry fetch with options
await retry.fetch('https://api.example.com/data', {
  retry: {maxAttempts: 3},
});
```

## Advanced Features

<details>
<summary>🔄 Retry Conditions</summary>

```typescript
await retry.async(fn, {
  retryIf: error => error.name === 'NetworkError',
});
```

</details>

<details>
<summary>🔙 Fallbacks</summary>

```typescript
await retry.async(fn, {
  fallback: async () => backupOperation(),
  // Or multiple fallbacks
  fallback: [async () => primaryBackup(), async () => secondaryBackup()],
});
```

</details>

<details>
<summary>⏱️ Backoff Strategies</summary>

Backoff is a technique that progressively increases the delay between retry attempts. This helps prevent overwhelming the system being called and allows it time to recover from any issues. Like gradually stepping back when something's not working, rather than continuously trying at the same rate.

```typescript
await retry.async(fn, {
  backoffStrategy: 'exponential', // 1s → 2s → 4s (default)
  backoffStrategy: 'linear', // 1s → 2s → 3s
  backoffStrategy: 'aggressive', // 1s → 3s → 9s
  backoffStrategy: 'fixed', // 1s → 1s → 1s
});
```

</details>

<details>
<summary>🎲 Jitter Strategies</summary>

Jitter adds randomness to retry delays to prevent multiple clients from retrying at exactly the same time. This is particularly important in distributed systems where synchronized retries could cause "thundering herd" problems - where many clients hit a service simultaneously after a failure.

```typescript
await retry.async(fn, {
  jitterStrategy: 'full', // Random between 0 and delay (default)
  jitterStrategy: 'equal', // Random between delay/2 and delay*1.5
  jitterStrategy: 'decorrelated', // Independent random delays
  jitterStrategy: 'none', // Exact delays
});
```

</details>

<details>
<summary>🛑 Abort Control</summary>

```typescript
const controller = new AbortController();

await retry.async(fn, {
  signal: controller.signal,
});

// Cancel retries
controller.abort();
```

</details>

<details>
<summary>📡 Fetch-Specific Options</summary>

```typescript
await retry.fetch('https://api.example.com/data', {
  retry: {
    retryStatusCodes: [408, 429, 500, 502, 503, 504], // HTTP status codes that will trigger a retry
    retryNetworkErrors: true, // Whether to retry on network/connection errors
  },
});
```

</details>

## Full API Reference

<details>
<summary>View Complete API</summary>

### retry.async<T>

```typescript
function async<T>(
  fn: () => Promise<T>,
  options?: RetryAsyncOptions<T>,
): Promise<RetryAsyncResult<T>>;

interface RetryAsyncResult<T> {
  data: T; // The result of the function
  attempts: number; // The number of attempts made
  totalTime: number; // The total time taken for all attempts
  errors: Error[]; // The errors that occurred during the attempts
}
```

### retry.fetch

```typescript
function fetch(
  input: RequestInfo | URL,
  init?: RequestInit & {
    retry?: RetryFetchOptions;
  },
): Promise<RetryFetchResult>;

interface RetryFetchResult {
  response: Response; // The response from the fetch request
  attempts: number; // The number of attempts made
  totalTime: number; // The total time taken for all attempts
  errors: Error[]; // The errors that occurred during the attempts
}
```

### Error Types

```typescript
import {
  MaxRetriesExceededError, // Thrown when max retries are exceeded
  RetryAbortedError, // Thrown when the operation is aborted
  RetryConditionFailedError, // Thrown when the retry condition check fails
  RetryOperationError, // Base error for all retry operations
} from 'nice-retry';
```

</details>

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  BackoffStrategy,
  JitterStrategy,
  RetryAsyncOptions,
  RetryFetchOptions,
} from 'nice-retry';
```

## Default Configuration

All options are optional with smart defaults:

```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  jitterStrategy: 'full',
  backoffStrategy: 'exponential',
  retryNetworkErrors: true,
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
}
```

## Contributing

We welcome contributions! Check out our [contributing guide](https://github.com/arshad-yaseen/nice-retry/blob/main/CONTRIBUTING.md).

## License

MIT © [Arshad Yaseen](https://github.com/arshad-yaseen)
