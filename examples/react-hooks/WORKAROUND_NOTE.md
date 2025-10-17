# BaseURL Workaround

## Issue

The `createFej()` function accepts a `baseURL` config option in the `FejConfig` type:

```typescript
export interface FejConfig {
  baseURL?: string;
  headers?: HeadersInit;
  timeout?: number;
  retry?: Partial<RetryConfig>;
  errorTransforms?: ErrorTransform[];
}
```

However, the implementation in `src/fej.ts` does not actually handle `baseURL`, `headers`, or `timeout`:

```typescript
export const createFej = (config?: FejConfig): Fej => {
  const instance = new Fej();

  // Only handles retry and errorTransforms
  if (config?.retry) {
    instance.setDefaultRetry(config.retry);
  }

  if (config?.errorTransforms) {
    config.errorTransforms.forEach((transform) => instance.addErrorTransform(transform));
  }

  return instance;
};
```

## Workaround

Until this is implemented in the core library, use middleware to handle `baseURL`:

```javascript
const api = createFej();

api.use('baseURL', async (ctx, next) => {
  const baseURL = 'https://api.example.com';

  // Only prepend baseURL if the URL is relative
  if (ctx.request.url && !ctx.request.url.startsWith('http')) {
    const relativeUrl = ctx.request.url.startsWith('/')
      ? ctx.request.url.slice(1)
      : ctx.request.url;

    ctx.request.url = `${baseURL}/${relativeUrl}`;
  }

  await next();
}, 500);
```

## Implementation in useFej Hook

The `useFej` hook in this example uses this workaround pattern. See `hooks/useFej.js` for the implementation.

## Future Fix

This should be implemented in `createFej()` to properly handle all config options:

```typescript
export const createFej = (config?: FejConfig): Fej => {
  const instance = new Fej();

  // Handle baseURL
  if (config?.baseURL) {
    instance.use('baseURL', async (ctx, next) => {
      if (ctx.request.url && !ctx.request.url.startsWith('http')) {
        const relativeUrl = ctx.request.url.startsWith('/')
          ? ctx.request.url.slice(1)
          : ctx.request.url;
        ctx.request.url = `${config.baseURL}/${relativeUrl}`;
      }
      await next();
    }, 500);
  }

  // Handle default headers
  if (config?.headers) {
    instance.use('default-headers', async (ctx, next) => {
      const headers = new Headers(ctx.request.init.headers);
      const defaultHeaders = new Headers(config.headers);
      defaultHeaders.forEach((value, key) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });
      ctx.request.init.headers = headers;
      await next();
    }, 400);
  }

  // Handle timeout
  if (config?.timeout) {
    instance.use('timeout', async (ctx, next) => {
      if (!ctx.request.init.signal) {
        const controller = new AbortController();
        ctx.request.init.signal = controller.signal;

        const timeoutId = setTimeout(() => {
          controller.abort();
        }, config.timeout);

        try {
          await next();
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        await next();
      }
    }, 600);
  }

  // Handle retry
  if (config?.retry) {
    instance.setDefaultRetry(config.retry);
  }

  // Handle error transforms
  if (config?.errorTransforms) {
    config.errorTransforms.forEach((transform) => instance.addErrorTransform(transform));
  }

  return instance;
};
```

This would make the config options actually work as expected.
