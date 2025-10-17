// ============================================================
// Re-export all types
// ============================================================
export type {
  IFejMiddleware,
  IFejAsyncMiddleware,
  FejContext,
  FejMiddlewareFunction,
  MiddlewareEntry,
  RetryConfig,
  TimeoutConfig,
  RequestConfig,
  CancellationOptions,
  ErrorTransform,
  CancellationMiddlewareConfig,
  FejConfig,
} from './types.js';

// ============================================================
// Re-export error classes
// ============================================================
export { FejError, FejTimeoutError, FejRetryError } from './errors.js';

// ============================================================
// Re-export middleware utilities
// ============================================================
export {
  createRetryMiddleware,
  createTimeoutMiddleware,
  createErrorMiddleware,
  createCancellationMiddleware,
  createBearerTokenMiddleware,
  createLoggerMiddleware,
  createBaseURLMiddleware,
  createDefaultHeadersMiddleware,
} from './middleware.js';

// ============================================================
// Re-export middleware utility types
// ============================================================
export type {
  BearerTokenConfig,
  LoggerConfig,
  LoggerFormat,
  BaseURLConfig,
  DefaultHeadersConfig,
} from './middleware.js';

// ============================================================
// Re-export Fej class and factory
// ============================================================
export { Fej, createFej } from './fej.js';

// ============================================================
// Import for singleton pattern
// ============================================================
import { Fej } from './fej.js';
import type { IFejMiddleware, IFejAsyncMiddleware } from './types.js';

// ============================================================
// Singleton pattern (deprecated but maintained for backward compatibility)
// ============================================================
const mFej = new Fej();

let singletonWarningShown = false;
const showSingletonWarning = (): void => {
  if (!singletonWarningShown) {
    console.warn(
      '[Fej Deprecation Warning] The singleton pattern (default export) is deprecated and will be removed in v2.0.\n' +
        'Use instance-based approach instead:\n' +
        '  import { createFej } from "fej";\n' +
        '  const api = createFej({ /* config */ });\n' +
        'This allows multiple isolated instances and better configuration.\n' +
        'Learn more: https://github.com/maxali/fej#v2-migration\n' +
        'v2.0-alpha will be released in approximately 2 months.'
    );
    singletonWarningShown = true;
  }
};

// Wrap singleton exports to show warning on first use
export const fej = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  showSingletonWarning();
  return mFej.fej(input, init);
};

export const addMiddleware = (fn: IFejMiddleware): void => {
  showSingletonWarning();
  return mFej.addMiddleware(fn);
};

export const addAsyncMiddleware = (fn: IFejAsyncMiddleware): void => {
  showSingletonWarning();
  return mFej.addAsyncMiddleware(fn);
};

/**
 * Clear all middleware (internal testing helper)
 *
 * This is an internal testing utility that should not be used in production code.
 * It clears all middleware and resets the singleton warning state.
 *
 * @internal
 */
export const _clearMiddleware = (): void => {
  singletonWarningShown = false; // Reset the warning flag
  return mFej._clearMiddleware(false); // Don't call reset again
};

// Hook up the reset function
mFej._resetSingletonWarning = (): void => {
  singletonWarningShown = false;
};

export default mFej;
