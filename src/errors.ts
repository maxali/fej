import type { FejContext } from './types.js';

/**
 * Base error class for all Fej-related errors
 *
 * Extends the native Error class with additional context about the failed request.
 * All Fej errors include optional request context and original error information.
 *
 * @example
 * ```typescript
 * import { FejError } from 'fej';
 *
 * try {
 *   await api.fej('/api/users');
 * } catch (error) {
 *   if (error instanceof FejError) {
 *     console.error('Request failed:', error.message);
 *     console.error('Status code:', error.statusCode);
 *     console.error('URL:', error.context?.request.url);
 *   }
 * }
 * ```
 *
 * @public
 */
export class FejError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly context?: FejContext,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'FejError';
    Object.setPrototypeOf(this, FejError.prototype);
  }
}

/**
 * Error thrown when a request times out
 *
 * Thrown by the timeout middleware when a request exceeds the configured timeout duration.
 * Includes the timeout value that was exceeded.
 *
 * @example
 * ```typescript
 * import { createFej, createTimeoutMiddleware, FejTimeoutError } from 'fej';
 *
 * const api = createFej();
 * api.use('timeout', createTimeoutMiddleware({ timeout: 5000 }));
 *
 * try {
 *   await api.fej('/api/slow-endpoint');
 * } catch (error) {
 *   if (error instanceof FejTimeoutError) {
 *     console.error(`Request timed out after ${error.timeout}ms`);
 *   }
 * }
 * ```
 *
 * @public
 */
export class FejTimeoutError extends FejError {
  constructor(
    message: string,
    public readonly timeout: number,
    context?: FejContext
  ) {
    super(message, undefined, context);
    this.name = 'FejTimeoutError';
    Object.setPrototypeOf(this, FejTimeoutError.prototype);
  }
}

/**
 * Error thrown when retry attempts are exhausted
 *
 * Thrown by the retry middleware when all retry attempts have been exhausted.
 * Includes the number of attempts made and the last error encountered.
 *
 * @example
 * ```typescript
 * import { createFej, createRetryMiddleware, FejRetryError } from 'fej';
 *
 * const api = createFej();
 * api.use('retry', createRetryMiddleware({ attempts: 3 }));
 *
 * try {
 *   await api.fej('/api/unreliable-endpoint');
 * } catch (error) {
 *   if (error instanceof FejRetryError) {
 *     console.error(`Failed after ${error.attempts} attempts`);
 *     console.error('Last error:', error.lastError.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export class FejRetryError extends FejError {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error,
    context?: FejContext
  ) {
    super(message, lastError, context);
    this.name = 'FejRetryError';
    Object.setPrototypeOf(this, FejRetryError.prototype);
  }
}

/**
 * Error thrown when an HTTP response has a 4xx or 5xx status code
 *
 * Thrown by convenience methods (.get, .post, etc.) when `throwHttpErrors` is enabled (default).
 * Extends FejError so `instanceof FejError` still catches HTTP errors.
 *
 * @example
 * ```typescript
 * import { createFej, FejHttpError } from 'fej';
 *
 * const api = createFej();
 * try {
 *   await api.get('/api/users/999');
 * } catch (error) {
 *   if (error instanceof FejHttpError) {
 *     console.error(`HTTP ${error.status}: ${error.statusText}`);
 *     console.error('Response body:', error.data);
 *   }
 * }
 * ```
 *
 * @public
 */
export class FejHttpError extends FejError {
  constructor(
    message: string,
    /** HTTP status code (e.g. 404) */
    public readonly status: number,
    /** HTTP status text (e.g. "Not Found") */
    public readonly statusText: string,
    /** Parsed response body */
    public readonly data: unknown,
    /** Response headers */
    public readonly headers: Headers,
    context?: FejContext
  ) {
    super(message, undefined, context, status);
    this.name = 'FejHttpError';
    Object.setPrototypeOf(this, FejHttpError.prototype);
  }
}

/**
 * Error thrown for SSE-specific failures (connection, protocol errors)
 *
 * @example
 * ```typescript
 * import { createFej, FejSSEError } from 'fej';
 *
 * const api = createFej();
 * try {
 *   for await (const event of api.sse('/stream')) {
 *     console.log(event.data);
 *   }
 * } catch (error) {
 *   if (error instanceof FejSSEError) {
 *     console.error('SSE error:', error.message);
 *     console.error('Status:', error.response?.status);
 *   }
 * }
 * ```
 *
 * @public
 */
export class FejSSEError extends FejError {
  constructor(
    message: string,
    /** The HTTP response that caused the failure (for header/status inspection) */
    public readonly response?: Response,
    context?: FejContext
  ) {
    super(message, undefined, context, response?.status);
    this.name = 'FejSSEError';
    Object.setPrototypeOf(this, FejSSEError.prototype);
  }
}
