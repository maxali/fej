/**
 * Legacy v1 middleware function (deprecated)
 *
 * @deprecated Use FejMiddlewareFunction with the `use()` method instead
 * @public
 */
export type IFejMiddleware = (init: RequestInit) => RequestInit;

/**
 * Legacy v1 async middleware function (deprecated)
 *
 * @deprecated Use FejMiddlewareFunction with the `use()` method instead
 * @public
 */
export type IFejAsyncMiddleware = (init: RequestInit) => Promise<RequestInit>;

/**
 * Context object passed to middleware functions
 *
 * Contains information about the current request, response, and shared state.
 * Middleware can read and modify all properties except `error` (which should only be set on errors).
 *
 * @example
 * ```typescript
 * api.use('custom', async (ctx, next) => {
 *   // Access request info
 *   console.log('URL:', ctx.request.url);
 *   console.log('Method:', ctx.request.init.method);
 *
 *   // Store data in shared state
 *   ctx.state.startTime = Date.now();
 *
 *   await next();
 *
 *   // Access response
 *   if (ctx.response) {
 *     console.log('Status:', ctx.response.status);
 *   }
 *
 *   // Access shared state
 *   const duration = Date.now() - (ctx.state.startTime as number);
 *   console.log('Duration:', duration);
 * });
 * ```
 *
 * @public
 */
export interface FejContext {
  /** Request information */
  request: {
    /** The URL being requested */
    url: string;
    /** Request initialization options */
    init: RequestInit;
  };
  /** Response object (set after fetch completes) */
  response?: Response;
  /** Shared state between middleware */
  state: Record<string, unknown>;
  /** Error that occurred during request (set by middleware or fetch) */
  error?: Error;
}

/**
 * Middleware function type (Koa-style onion model)
 *
 * Middleware functions receive a context object and a next function.
 * They can execute code before calling next() (request phase) and after (response phase).
 *
 * @param ctx - The request context
 * @param next - Function to call the next middleware in the chain
 * @returns Promise or void
 *
 * @example
 * ```typescript
 * const myMiddleware: FejMiddlewareFunction = async (ctx, next) => {
 *   // Before request
 *   console.log('→ Request starting');
 *
 *   await next(); // Execute request and downstream middleware
 *
 *   // After request
 *   console.log('← Request completed');
 * };
 * ```
 *
 * @public
 */
export type FejMiddlewareFunction = (
  ctx: FejContext,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Internal middleware entry (used by Fej instance)
 *
 * @internal
 */
export interface MiddlewareEntry {
  name: string;
  fn: FejMiddlewareFunction;
  priority: number;
  enabled: boolean;
  id: string; // Unique identifier
}

/**
 * Configuration for retry behavior
 *
 * @example
 * ```typescript
 * const retryConfig: RetryConfig = {
 *   attempts: 3,
 *   delay: 1000,
 *   maxDelay: 30000,
 *   backoff: 'exponential',
 *   shouldRetry: (error) => error.name === 'NetworkError',
 *   onRetry: (error, attempt) => console.log(`Retry ${attempt}`),
 * };
 * ```
 *
 * @public
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  attempts: number;
  /** Initial delay in ms (default: 1000) */
  delay: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;
  /** Backoff strategy (default: 'exponential') */
  backoff: 'fixed' | 'exponential' | 'linear';
  /** Custom retry condition - return true to retry, false to stop */
  shouldRetry?: (error: Error, ctx: FejContext) => boolean;
  /** Callback invoked before each retry attempt */
  onRetry?: (error: Error, attempt: number, ctx: FejContext) => void;
}

/**
 * Configuration for timeout behavior
 *
 * @example
 * ```typescript
 * const timeoutConfig: TimeoutConfig = {
 *   timeout: 5000,
 *   signal: controller.signal, // Optional external signal
 * };
 * ```
 *
 * @public
 */
export interface TimeoutConfig {
  /** Timeout in milliseconds */
  timeout: number;
  /** Optional external abort signal to respect */
  signal?: AbortSignal;
}

/**
 * Extended RequestInit with request tracking
 *
 * @public
 */
export interface RequestConfig extends RequestInit {
  /** Optional request ID for tracking and cancellation */
  requestId?: string;
  /** Optional tags for grouping requests */
  tags?: string[];
}

/**
 * Options for request cancellation
 *
 * @public
 */
export interface CancellationOptions {
  /** Optional cancellation reason (passed to AbortController) */
  reason?: string;
}

/**
 * Function type for transforming errors
 *
 * Error transforms allow you to customize error handling globally.
 * They are executed in registration order for all errors.
 *
 * @param error - The error to transform
 * @param ctx - The request context
 * @returns The transformed error (can be the same or a new error)
 *
 * @example
 * ```typescript
 * const errorTransform: ErrorTransform = async (error, ctx) => {
 *   const enhancedError = new Error(`[${ctx.request.url}] ${error.message}`);
 *   enhancedError.stack = error.stack;
 *   return enhancedError;
 * };
 * ```
 *
 * @public
 */
export interface ErrorTransform {
  (error: Error, ctx: FejContext): Error | Promise<Error>;
}

/**
 * Configuration for the cancellation middleware
 *
 * @public
 */
export interface CancellationMiddlewareConfig {
  /** Optional custom request ID */
  requestId?: string;
  /** Optional tags for grouping requests */
  tags?: string[];
  /** Whether to track this request (default: true) */
  trackRequest?: boolean;
  /** Called when request is cancelled */
  onCancel?: (requestId: string, ctx: FejContext) => void;
}

/**
 * Configuration for creating a Fej instance
 *
 * @example
 * ```typescript
 * const config: FejConfig = {
 *   retry: {
 *     attempts: 3,
 *     delay: 1000,
 *     backoff: 'exponential',
 *   },
 *   errorTransforms: [
 *     async (error, ctx) => {
 *       console.error(`Request failed: ${ctx.request.url}`);
 *       return error;
 *     },
 *   ],
 * };
 * const api = createFej(config);
 * ```
 *
 * @public
 */
export interface FejConfig {
  /** Base URL for all requests (optional) */
  baseURL?: string;
  /** Default headers to include in all requests */
  headers?: HeadersInit;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Error transformation functions */
  errorTransforms?: ErrorTransform[];
  /** Additional custom configuration */
  [key: string]: unknown;
}
