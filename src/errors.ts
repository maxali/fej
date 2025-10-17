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
