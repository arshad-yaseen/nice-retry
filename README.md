[![npm version](https://badge.fury.io/js/nice-retry.svg)](https://badge.fury.io/js/nice-retry)
[![Min zip size](https://img.shields.io/bundlephobia/minzip/nice-retry)](https://bundlephobia.com/package/nice-retry)

# nice-retry

A powerful, flexible, and developer-friendly retry utility for JavaScript/TypeScript with intelligent defaults and extensive customization options.

## Features

- 🚀 Two powerful retry functions:
  - `retry.async()` for any async operations
  - `retry.fetch()` specifically optimized for fetch requests
- 🔄 Smart exponential backoff with multiple jitter strategies
- 🎯 Configurable retry conditions with built-in error predicates
- 🔌 Fallback mechanism with support for multiple fallback functions
- ⚡ Abort support using standard AbortController
- 📊 Detailed retry results including attempts, timing, and error history
- 💪 TypeScript-first with comprehensive type definitions
- 🎨 Zero dependencies

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Basic Usage](#basic-usage)
  - [With Options](#with-options)
- [API Reference](#api-reference)
  - [retry.async](#retryasynct)
  - [retry.fetch](#retryfetch)
- [Options](#options)
  - [Common Options](#common-options)
  - [Fetch-Specific Options](#fetch-specific-options)
- [Jitter Strategies](#jitter-strategies)
- [Error Handling](#error-handling)

## Installation

```bash
npm install nice-retry
# or
yarn add nice-retry
# or
pnpm add nice-retry
```

## Quick Start

### Basic Usage

```typescript
import {retry} from 'nice-retry';

// Retry a fetch request
const {response} = await retry.fetch('https://api.example.com/data');

// Retry any async function
const {data} = await retry.async(async () => {
  return await someAsyncOperation();
});
```

### With Options

```typescript
const result = await retry.async(
  async () => {
    return await riskyOperation();
  },
  {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    jitterStrategy: 'full',
    onRetry: (error, attempt) => {
      console.log(`Attempt ${attempt} failed:`, error.message);
    },
  },
);
```

## API Reference

### retry.async<T>(fn, options?)

Retries an async function with configurable options.

```typescript
const result = await retry.async(
  async () => {
    // Your async operation
    return await someOperation();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    jitterStrategy: 'full',
    signal: abortController.signal,
    fallback: async () => backupOperation(),
    retryIf: (error) => error.name !== 'ValidationError',
    onRetry: (error, attempt) => console.log(`Retrying... (${attempt})`)
  }
);

// Result type:
{
  data: T;           // The successful result
  attempts: number;  // Number of attempts made
  totalTime: number; // Total time elapsed in ms
  errors: Error[];   // Array of errors from failed attempts
}
```

### retry.fetch(input, init?)

Specialized retry function for fetch requests with built-in handling for common HTTP errors.

```typescript
const result = await retry.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ foo: 'bar' }),
  retry: {
    maxAttempts: 3,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    retryNetworkErrors: true
  }
});

// Result type:
{
  response: Response; // The successful fetch response
  attempts: number;   // Number of attempts made
  totalTime: number;  // Total time elapsed in ms
  errors: Error[];    // Array of errors from failed attempts
}
```

## Options

### Common Options

| Option           | Type                                            | Default     | Description                      |
| ---------------- | ----------------------------------------------- | ----------- | -------------------------------- |
| `maxAttempts`    | `number`                                        | `3`         | Maximum number of retry attempts |
| `initialDelay`   | `number`                                        | `1000`      | Initial delay in milliseconds    |
| `maxDelay`       | `number`                                        | `30000`     | Maximum delay in milliseconds    |
| `jitterStrategy` | `'full' \| 'equal' \| 'decorrelated' \| 'none'` | `'full'`    | Strategy for delay randomization |
| `signal`         | `AbortSignal`                                   | `undefined` | AbortSignal to cancel retries    |
| `fallback`       | `Function \| Function[]`                        | `undefined` | Fallback function(s)             |
| `retryIf`        | `(error: Error) => boolean`                     | `undefined` | Custom retry condition           |
| `onRetry`        | `(error: Error, attempt: number) => void`       | `undefined` | Retry callback                   |

### Fetch-Specific Options

| Option               | Type       | Default                          | Description                |
| -------------------- | ---------- | -------------------------------- | -------------------------- |
| `retryStatusCodes`   | `number[]` | `[408, 429, 500, 502, 503, 504]` | HTTP status codes to retry |
| `retryNetworkErrors` | `boolean`  | `true`                           | Retry on network errors    |

## Jitter Strategies

nice-retry supports four jitter strategies:

1. **Full** (`'full'`): Completely random delay between 0 and calculated delay
2. **Equal** (`'equal'`): Random delay between calculated/2 and calculated\*1.5
3. **Decorrelated** (`'decorrelated'`): Independent random delays
4. **None** (`'none'`): No randomization

```typescript
await retry.async(fn, {
  jitterStrategy: 'full', // or 'equal', 'decorrelated', 'none'
});
```

## Error Handling

nice-retry provides specific error types for different failure scenarios:

```typescript
import {
  FallbackError, // All fallbacks failed
  MaxRetriesExceededError, // All retries failed
  RetryAbortedError, // Operation was aborted
  RetryConditionFailedError, // Retry condition returned false
  RetryError, // Base error type
} from 'nice-retry';

try {
  await retry.async(fn);
} catch (error) {
  if (error instanceof MaxRetriesExceededError) {
    console.log(`Failed after ${error.attempts} attempts`);
    console.log('Last error:', error.cause);
    console.log('All errors:', error.errors);
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
