import type {
  FejContext,
  FejMiddlewareFunction,
  RetryConfig,
  TimeoutConfig,
  CancellationMiddlewareConfig,
} from './types.js';
import { FejError, FejTimeoutError, FejRetryError } from './errors.js';
import { Fej } from './fej.js';

/**
 * Configuration for bearer token middleware
 *
 * @public
 */
export interface BearerTokenConfig {
  token?: string; // Static token
  getToken?: () => string | Promise<string>; // Dynamic token getter
  headerName?: string; // Custom header name (default: 'Authorization')
  prefix?: string; // Token prefix (default: 'Bearer')
}

/**
 * Logger output format type
 *
 * @public
 */
export type LoggerFormat =
  | 'default' // Simple format: METHOD URL - STATUS (DURATIONms)
  | 'detailed' // Detailed format with headers and body info
  | 'json' // JSON format for structured logging
  | ((ctx: FejContext, duration: number) => string); // Custom formatter

/**
 * Configuration for logger middleware
 *
 * @public
 */
export interface LoggerConfig {
  format?: LoggerFormat; // Output format (default: 'default')
  logRequest?: boolean; // Log request details (default: true)
  logResponse?: boolean; // Log response details (default: true)
  logger?: (message: string) => void; // Custom logger function (default: console.log)
  filter?: (ctx: FejContext) => boolean; // Filter which requests to log
}

/**
 * Create a retry middleware with exponential backoff
 *
 * Creates middleware that automatically retries failed requests with configurable
 * backoff strategies. Supports exponential, linear, and fixed delay patterns.
 *
 * @param config - Retry configuration
 * @returns Middleware function
 *
 * @example Basic retry with defaults
 * ```typescript
 * import { createFej, createRetryMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('retry', createRetryMiddleware({
 *   attempts: 3,
 *   delay: 1000,
 *   backoff: 'exponential',
 * }), 50); // Priority 50 to run before other middleware
 * ```
 *
 * @example Custom retry logic
 * ```typescript
 * api.use('retry', createRetryMiddleware({
 *   attempts: 5,
 *   delay: 500,
 *   backoff: 'exponential',
 *   maxDelay: 10000,
 *   shouldRetry: (error, ctx) => {
 *     // Only retry on network errors or 5xx status codes
 *     return error.name === 'NetworkError' ||
 *            (ctx.response && ctx.response.status >= 500);
 *   },
 *   onRetry: (error, attempt, ctx) => {
 *     console.log(`Retry attempt ${attempt} for ${ctx.request.url}`);
 *   },
 * }));
 * ```
 *
 * @public
 */
export function createRetryMiddleware(config: Partial<RetryConfig> = {}): FejMiddlewareFunction {
  const retryConfig: RetryConfig = {
    attempts: config.attempts ?? 3,
    delay: config.delay ?? 1000,
    maxDelay: config.maxDelay ?? 30000,
    backoff: config.backoff ?? 'exponential',
    shouldRetry: config.shouldRetry,
    onRetry: config.onRetry,
  };

  return async (ctx: FejContext, next: () => Promise<void>) => {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= retryConfig.attempts) {
      try {
        await next();

        // Check if response is OK
        if (ctx.response && ctx.response.ok) {
          return; // Success
        }

        // Response exists but not OK - should we retry?
        const error = new Error(`HTTP ${ctx.response?.status}: ${ctx.response?.statusText}`);

        if (retryConfig.shouldRetry && !retryConfig.shouldRetry(error, ctx)) {
          ctx.error = error;
          return; // Don't retry - exit gracefully
        }

        lastError = error;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry this error
        if (retryConfig.shouldRetry && !retryConfig.shouldRetry(lastError, ctx)) {
          ctx.error = lastError;
          throw lastError; // Don't retry - throw original error
        }
      }

      attempt++;

      // If we've exhausted attempts, throw
      if (attempt > retryConfig.attempts) {
        const retryError = new FejRetryError(
          `Request failed after ${retryConfig.attempts} attempts`,
          retryConfig.attempts,
          lastError,
          ctx
        );
        ctx.error = retryError;
        throw retryError;
      }

      // Only call onRetry and delay if we're going to retry
      if (lastError) {
        // Call onRetry callback
        if (retryConfig.onRetry) {
          retryConfig.onRetry(lastError, attempt, ctx);
        }

        // Calculate delay and wait
        let delay: number;
        switch (retryConfig.backoff) {
          case 'fixed':
            delay = retryConfig.delay;
            break;
          case 'linear':
            delay = retryConfig.delay * attempt;
            break;
          case 'exponential':
          default:
            delay = retryConfig.delay * Math.pow(2, attempt - 1);
            break;
        }

        if (retryConfig.maxDelay) {
          delay = Math.min(delay, retryConfig.maxDelay);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Clear response for retry
        ctx.response = undefined;
        ctx.error = undefined;
      }
    }
  };
}

/**
 * Create a timeout middleware using AbortController
 *
 * Creates middleware that automatically aborts requests that exceed a specified timeout.
 * Uses AbortController for proper cancellation.
 *
 * @param config - Timeout configuration
 * @returns Middleware function
 *
 * @example Basic timeout
 * ```typescript
 * import { createFej, createTimeoutMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('timeout', createTimeoutMiddleware({
 *   timeout: 5000, // 5 seconds
 * }));
 * ```
 *
 * @example Timeout with external abort signal
 * ```typescript
 * const externalController = new AbortController();
 * api.use('timeout', createTimeoutMiddleware({
 *   timeout: 3000,
 *   signal: externalController.signal, // Respect external cancellation
 * }));
 * ```
 *
 * @public
 */
export function createTimeoutMiddleware(config: TimeoutConfig): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    const controller = new AbortController();
    const timeout = config.timeout;

    // Merge or set the abort signal
    const originalSignal = ctx.request.init.signal;

    // Create a combined signal if there's an external one
    if (originalSignal || config.signal) {
      // If there's an original signal, listen to both
      const signals = [controller.signal];
      if (originalSignal) signals.push(originalSignal);
      if (config.signal) signals.push(config.signal);

      // Create abort handler
      const abortHandler = (): void => controller.abort();
      if (originalSignal) {
        originalSignal.addEventListener('abort', abortHandler);
      }
      if (config.signal) {
        config.signal.addEventListener('abort', abortHandler);
      }
    }

    // Set the signal
    ctx.request.init.signal = controller.signal;

    // Start timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      await next();
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if this was a timeout
      if (error instanceof Error && (error.name === 'AbortError' || controller.signal.aborted)) {
        const timeoutError = new FejTimeoutError(
          `Request timed out after ${timeout}ms`,
          timeout,
          ctx
        );
        ctx.error = timeoutError;
        throw timeoutError;
      }

      throw error;
    }
  };
}

/**
 * Create an error handling middleware
 *
 * Creates middleware that catches and handles errors from downstream middleware
 * and the fetch request. Converts non-FejError errors to FejError instances.
 *
 * @param handler - Error handler function
 * @returns Middleware function
 *
 * @example Basic error logging
 * ```typescript
 * import { createFej, createErrorMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('error-handler', createErrorMiddleware((error, ctx) => {
 *   console.error(`Request to ${ctx.request.url} failed:`, error.message);
 * }));
 * ```
 *
 * @example Error handling with reporting
 * ```typescript
 * api.use('error-handler', createErrorMiddleware(async (error, ctx) => {
 *   // Log to error tracking service
 *   await errorTracker.report({
 *     message: error.message,
 *     url: ctx.request.url,
 *     stack: error.stack,
 *   });
 *
 *   // Show user-friendly message
 *   if (ctx.response?.status === 404) {
 *     console.log('Resource not found');
 *   }
 * }));
 * ```
 *
 * @public
 */
export function createErrorMiddleware(
  handler: (error: Error, ctx: FejContext) => void | Promise<void>
): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    try {
      await next();

      // Check for HTTP error status codes
      if (ctx.response && !ctx.response.ok) {
        const error = new FejError(
          `HTTP ${ctx.response.status}: ${ctx.response.statusText}`,
          undefined,
          ctx,
          ctx.response.status
        );
        ctx.error = error;
        await handler(error, ctx);
      }
    } catch (error) {
      const fejError =
        error instanceof FejError
          ? error
          : new FejError(
              error instanceof Error ? error.message : String(error),
              error instanceof Error ? error : undefined,
              ctx
            );

      ctx.error = fejError;
      await handler(fejError, ctx);
    }
  };
}

/**
 * Create a cancellation middleware that automatically tracks requests
 *
 * Creates middleware that automatically tracks requests using AbortController,
 * enabling cancellation via the Fej instance methods.
 *
 * @param fejInstance - The Fej instance to use for tracking
 * @param config - Configuration options
 * @returns Middleware function
 *
 * @example Basic request tracking
 * ```typescript
 * import { createFej, createCancellationMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('cancellation', createCancellationMiddleware(api));
 *
 * // Requests are now automatically tracked
 * const response = await api.fej('/api/data');
 * ```
 *
 * @example With tags for grouping
 * ```typescript
 * api.use('cancellation', createCancellationMiddleware(api, {
 *   tags: ['dashboard', 'high-priority'],
 * }));
 *
 * // Later: cancel all dashboard requests
 * api.abortRequestsByTag('dashboard');
 * ```
 *
 * @example With cancellation callback
 * ```typescript
 * api.use('cancellation', createCancellationMiddleware(api, {
 *   onCancel: (requestId, ctx) => {
 *     console.log(`Request ${requestId} was cancelled`);
 *   },
 * }));
 * ```
 *
 * @public
 */
export function createCancellationMiddleware(
  fejInstance: Fej,
  config: CancellationMiddlewareConfig = {}
): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    const shouldTrack = config.trackRequest !== false;

    if (!shouldTrack) {
      await next();
      return;
    }

    // Create abort controller and get request ID
    const { controller, requestId } = fejInstance.createAbortController(
      config.requestId,
      config.tags
    );

    // Store request ID in context for reference
    ctx.state.requestId = requestId;

    // Merge abort signal with existing signal
    const originalSignal = ctx.request.init.signal;

    if (originalSignal) {
      // Listen to original signal
      const abortHandler = (): void => controller.abort();
      originalSignal.addEventListener('abort', abortHandler);
    }

    // Set the signal
    ctx.request.init.signal = controller.signal;

    try {
      await next();

      // Clean up on success (request completed without being aborted)
      if (fejInstance.isRequestPending(requestId)) {
        fejInstance.abortRequest(requestId);
      }
    } catch (error) {
      // Clean up on error
      if (fejInstance.isRequestPending(requestId)) {
        fejInstance.abortRequest(requestId);
      }

      // Check if this was a cancellation
      if (error instanceof Error && (error.name === 'AbortError' || controller.signal.aborted)) {
        // Call onCancel callback if provided
        if (config.onCancel) {
          config.onCancel(requestId, ctx);
        }

        // Create a custom cancellation error
        const cancelError = new FejError(
          `Request cancelled: ${requestId}`,
          error instanceof Error ? error : undefined,
          ctx
        );
        ctx.error = cancelError;
        throw cancelError;
      }

      throw error;
    }
  };
}

/**
 * Create a bearer token authentication middleware
 *
 * Creates middleware that automatically adds Bearer token authentication headers
 * to requests. Supports both static tokens and dynamic token retrieval.
 *
 * @param config - Bearer token configuration
 * @returns Middleware function
 *
 * @example Static token
 * ```typescript
 * import { createFej, createBearerTokenMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('auth', createBearerTokenMiddleware({
 *   token: 'your-static-token',
 * }), 100); // High priority to run early
 * ```
 *
 * @example Dynamic token (async)
 * ```typescript
 * api.use('auth', createBearerTokenMiddleware({
 *   getToken: async () => {
 *     const session = await getSession();
 *     return session.accessToken;
 *   },
 * }), 100);
 * ```
 *
 * @example Custom header name
 * ```typescript
 * api.use('auth', createBearerTokenMiddleware({
 *   token: 'api-key-123',
 *   headerName: 'X-API-Key',
 *   prefix: '', // No prefix, just the raw token
 * }));
 * ```
 *
 * @public
 */
export function createBearerTokenMiddleware(config: BearerTokenConfig): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    const headerName = config.headerName || 'Authorization';
    const prefix = config.prefix !== undefined ? config.prefix : 'Bearer';

    // Get token from config
    let token: string | undefined;
    if (config.getToken) {
      token = await config.getToken();
    } else if (config.token) {
      token = config.token;
    }

    // Add authorization header if token exists
    if (token) {
      const authValue = prefix ? `${prefix} ${token}` : token;

      // Merge with existing headers
      const headers = new Headers(ctx.request.init.headers);
      headers.set(headerName, authValue);
      ctx.request.init.headers = headers;
    }

    await next();
  };
}

/**
 * Configuration for baseURL middleware
 *
 * @public
 */
export interface BaseURLConfig {
  baseURL: string; // Base URL to prepend to relative URLs
  allowAbsoluteUrls?: boolean; // Whether to allow absolute URLs (default: true)
}

/**
 * Create a baseURL middleware
 *
 * Creates middleware that automatically prepends a base URL to relative request URLs.
 * Follows modern library patterns (axios, ky, ofetch) for URL handling.
 *
 * @param config - BaseURL configuration
 * @returns Middleware function
 *
 * @example Basic usage
 * ```typescript
 * import { createFej, createBaseURLMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('baseURL', createBaseURLMiddleware({
 *   baseURL: 'https://api.example.com',
 * }), 100); // High priority to run early
 *
 * // Request to '/users' becomes 'https://api.example.com/users'
 * await api.fej('/users');
 * ```
 *
 * @example With absolute URL handling
 * ```typescript
 * api.use('baseURL', createBaseURLMiddleware({
 *   baseURL: 'https://api.example.com',
 *   allowAbsoluteUrls: false, // Force baseURL even for absolute URLs
 * }));
 * ```
 *
 * @public
 */
export function createBaseURLMiddleware(config: BaseURLConfig): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    const { baseURL, allowAbsoluteUrls = true } = config;
    const url = ctx.request.url;

    // Check if URL is absolute
    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);

    // Only prepend baseURL if:
    // 1. URL is relative, OR
    // 2. allowAbsoluteUrls is false (force baseURL for all URLs)
    if (!isAbsolute || !allowAbsoluteUrls) {
      // Join baseURL with URL
      // Remove trailing slash from baseURL and leading slash from URL
      const normalizedBase = baseURL.replace(/\/+$/, '');
      const normalizedPath = url.replace(/^\/+/, '');

      // Handle edge cases
      if (!normalizedPath) {
        // Empty path - just use baseURL
        ctx.request.url = normalizedBase;
      } else if (isAbsolute && !allowAbsoluteUrls) {
        // Absolute URL but allowAbsoluteUrls is false - prepend anyway
        ctx.request.url = `${normalizedBase}/${url}`;
      } else {
        // Normal relative path joining
        ctx.request.url = `${normalizedBase}/${normalizedPath}`;
      }
    }

    await next();
  };
}

/**
 * Configuration for default headers middleware
 *
 * @public
 */
export interface DefaultHeadersConfig {
  headers: HeadersInit; // Default headers to merge with request headers
}

/**
 * Create a default headers middleware
 *
 * Creates middleware that automatically merges default headers with request headers.
 * Request headers take precedence over default headers.
 *
 * @param config - Default headers configuration
 * @returns Middleware function
 *
 * @example Basic usage
 * ```typescript
 * import { createFej, createDefaultHeadersMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('headers', createDefaultHeadersMiddleware({
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Accept': 'application/json',
 *   },
 * }), 90); // High priority, but after baseURL
 * ```
 *
 * @example With Headers object
 * ```typescript
 * const defaultHeaders = new Headers({
 *   'User-Agent': 'MyApp/1.0',
 *   'X-Custom-Header': 'value',
 * });
 *
 * api.use('headers', createDefaultHeadersMiddleware({
 *   headers: defaultHeaders,
 * }));
 * ```
 *
 * @public
 */
export function createDefaultHeadersMiddleware(
  config: DefaultHeadersConfig
): FejMiddlewareFunction {
  return async (ctx: FejContext, next: () => Promise<void>) => {
    // Create headers from defaults
    const merged = new Headers(config.headers);

    // Merge with existing request headers (request headers take precedence)
    const existingHeaders = new Headers(ctx.request.init.headers);
    existingHeaders.forEach((value, key) => {
      merged.set(key, value);
    });

    // Set merged headers
    ctx.request.init.headers = merged;

    await next();
  };
}

/**
 * Create a logger middleware for debugging
 *
 * Creates middleware that logs request and response information.
 * Supports multiple output formats and custom filtering.
 *
 * @param config - Logger configuration
 * @returns Middleware function
 *
 * @example Basic logging (default format)
 * ```typescript
 * import { createFej, createLoggerMiddleware } from 'fej';
 *
 * const api = createFej();
 * api.use('logger', createLoggerMiddleware());
 * // Output: → GET https://api.example.com/users
 * //         ← GET https://api.example.com/users - 200 (123ms)
 * ```
 *
 * @example JSON format
 * ```typescript
 * api.use('logger', createLoggerMiddleware({
 *   format: 'json',
 * }));
 * // Output: {"type":"request","method":"GET","url":"...","timestamp":"..."}
 * ```
 *
 * @example Detailed format with headers
 * ```typescript
 * api.use('logger', createLoggerMiddleware({
 *   format: 'detailed',
 *   logRequest: true,
 *   logResponse: true,
 * }));
 * ```
 *
 * @example Custom formatter
 * ```typescript
 * api.use('logger', createLoggerMiddleware({
 *   format: (ctx, duration) => {
 *     return `[${ctx.request.init.method || 'GET'}] ${ctx.request.url} took ${duration}ms`;
 *   },
 * }));
 * ```
 *
 * @example With filtering
 * ```typescript
 * api.use('logger', createLoggerMiddleware({
 *   filter: (ctx) => {
 *     // Only log POST requests
 *     return ctx.request.init.method === 'POST';
 *   },
 * }));
 * ```
 *
 * @public
 */
export function createLoggerMiddleware(config: LoggerConfig = {}): FejMiddlewareFunction {
  const {
    format = 'default',
    logRequest = true,
    logResponse = true,
    // TODO: Fix console.log default or configure ESLint to allow console.log in logger middleware
    // eslint-disable-next-line no-console
    logger = console.log,
    filter,
  } = config;

  return async (ctx: FejContext, next: () => Promise<void>) => {
    // Apply filter if provided
    if (filter && !filter(ctx)) {
      await next();
      return;
    }

    const startTime = Date.now();
    const method = ctx.request.init.method || 'GET';
    const url = ctx.request.url;

    // Log request
    if (logRequest) {
      if (format === 'json') {
        logger(
          JSON.stringify({
            type: 'request',
            method,
            url,
            timestamp: new Date().toISOString(),
          })
        );
      } else if (format === 'detailed') {
        const headers = ctx.request.init.headers;
        logger(`→ ${method} ${url}`);
        logger(`  Headers: ${JSON.stringify(headers)}`);
      } else if (format === 'default') {
        logger(`→ ${method} ${url}`);
      }
    }

    // Execute downstream middleware and request
    await next();

    // Calculate duration
    const duration = Date.now() - startTime;

    // Log response
    if (logResponse) {
      const status = ctx.response?.status || 'N/A';
      const statusText = ctx.response?.statusText || '';

      if (typeof format === 'function') {
        // Custom formatter
        logger(format(ctx, duration));
      } else if (format === 'json') {
        logger(
          JSON.stringify({
            type: 'response',
            method,
            url,
            status,
            statusText,
            duration,
            timestamp: new Date().toISOString(),
            error: ctx.error ? ctx.error.message : undefined,
          })
        );
      } else if (format === 'detailed') {
        const headers: Record<string, string> = {};
        if (ctx.response?.headers) {
          ctx.response.headers.forEach((value, key) => {
            headers[key] = value;
          });
        }
        logger(`← ${status} ${statusText} ${url} (${duration}ms)`);
        logger(`  Headers: ${JSON.stringify(headers)}`);
        if (ctx.error) {
          logger(`  Error: ${ctx.error.message}`);
        }
      } else {
        // Default format
        const errorSuffix = ctx.error ? ` [ERROR: ${ctx.error.message}]` : '';
        logger(`← ${method} ${url} - ${status} (${duration}ms)${errorSuffix}`);
      }
    }
  };
}
