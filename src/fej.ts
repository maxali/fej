import type {
  IFejMiddleware,
  IFejAsyncMiddleware,
  FejContext,
  FejMiddlewareFunction,
  MiddlewareEntry,
  RetryConfig,
  ErrorTransform,
  CancellationOptions,
  FejConfig,
} from './types.js';
import {
  createBaseURLMiddleware,
  createDefaultHeadersMiddleware,
  createTimeoutMiddleware,
} from './middleware.js';

/**
 * Fej - Fetch with middleware support
 *
 * The main class that provides middleware capabilities for the Fetch API.
 * Supports both legacy v1 singleton pattern and new v2 instance-based approach.
 *
 * @example
 * ```typescript
 * // v2 Instance-based approach (recommended)
 * import { createFej } from 'fej';
 *
 * const api = createFej({
 *   retry: { attempts: 3, delay: 1000 },
 * });
 *
 * api.use('auth', async (ctx, next) => {
 *   ctx.request.init.headers = new Headers(ctx.request.init.headers);
 *   ctx.request.init.headers.set('Authorization', 'Bearer token');
 *   await next();
 * });
 *
 * const response = await api.fej('https://api.example.com/users');
 * ```
 *
 * @public
 */
export class Fej {
  private static globalInit: RequestInit = {};
  private middleWares: IFejMiddleware[] = [];
  private asyncMiddleWares: IFejAsyncMiddleware[] = [];

  // V2 Middleware management
  private middlewareEntries: Map<string, MiddlewareEntry> = new Map();
  private middlewareIdCounter = 0;

  // V2 Error handling & Retry
  private errorTransforms: ErrorTransform[] = [];
  private defaultRetryConfig: RetryConfig = {
    attempts: 3,
    delay: 1000,
    maxDelay: 30000,
    backoff: 'exponential',
  };
  private abortControllers: Map<string, AbortController> = new Map();
  private requestTags: Map<string, Set<string>> = new Map(); // Map tags to request IDs
  private requestIdCounter = 0;

  /**
   * Execute a fetch request with middleware applied
   *
   * This method applies all registered middleware (both v1 and v2) and executes
   * the fetch request. Middleware are executed in priority order (v2) and registration
   * order (v1 backward compatibility).
   *
   * @param input - The URL or Request object to fetch
   * @param init - Optional RequestInit configuration
   * @returns Promise that resolves to the Response
   *
   * @example
   * ```typescript
   * const api = createFej();
   * const response = await api.fej('https://api.example.com/users');
   * const data = await response.json();
   * ```
   *
   * @example
   * ```typescript
   * const response = await api.fej('https://api.example.com/users', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ name: 'John' }),
   * });
   * ```
   *
   * @public
   */
  public fej = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    // If there are v2 middleware, use the new pipeline
    if (this.middlewareEntries.size > 0) {
      return this.executeMiddlewarePipeline(input, init);
    }

    // Legacy v1 behavior (backward compatibility)
    // Merge global init first, then apply middleware
    let _init = this.mergeDeep(Fej.globalInit, init ?? {}) as RequestInit;

    // merge non-async middleWares
    _init = this.mergeNonAsyncMiddlewares(_init);

    _init = await this.mergeAsyncMiddlewares(_init);

    return fetch(input, _init);
  };

  public setInit = (init: RequestInit): void => {
    console.warn(
      '[Fej Deprecation Warning] Fej.setInit() is deprecated and will be removed in v2.0.\n' +
        'Use instance-based configuration instead:\n' +
        '  const api = createFej({ baseURL: "...", headers: {...} });\n' +
        'Learn more: https://github.com/maxali/fej#v2-migration\n' +
        'v2.0-alpha will be released in approximately 2 months.'
    );
    Fej.globalInit = init;
  };

  public addMiddleware = (fn: IFejMiddleware): void => {
    console.warn(
      '[Fej Deprecation Warning] Fej.addMiddleware() is deprecated and will be removed in v2.0.\n' +
        'Use the unified api.use() method instead:\n' +
        '  api.use("middleware-name", async (request, next) => { ... });\n' +
        'Learn more: https://github.com/maxali/fej#v2-migration\n' +
        'v2.0-alpha will be released in approximately 2 months.'
    );
    function runMiddleware(_init: RequestInit): RequestInit {
      return fn(_init);
    }
    this.middleWares.push(runMiddleware);
  };

  public addAsyncMiddleware = (fn: IFejAsyncMiddleware): void => {
    console.warn(
      '[Fej Deprecation Warning] Fej.addAsyncMiddleware() is deprecated and will be removed in v2.0.\n' +
        'Use the unified api.use() method instead (handles both sync and async automatically):\n' +
        '  api.use("middleware-name", async (request, next) => { ... });\n' +
        'Learn more: https://github.com/maxali/fej#v2-migration\n' +
        'v2.0-alpha will be released in approximately 2 months.'
    );
    async function runMiddleware(_init: RequestInit): Promise<RequestInit> {
      return await fn(_init);
    }
    this.asyncMiddleWares.push(runMiddleware);
  };

  // Internal method for testing - clears all middleware
  public _clearMiddleware = (resetSingletonWarning = true): void => {
    this.middleWares = [];
    this.asyncMiddleWares = [];
    this.middlewareEntries.clear();
    this.middlewareIdCounter = 0;
    Fej.globalInit = {};
    if (resetSingletonWarning) {
      // Reset singleton warning flag to allow retesting
      this._resetSingletonWarning();
    }
  };

  // Internal method for testing - resets singleton warning state
  public _resetSingletonWarning = (): void => {
    // This will be called from the exported function
  };

  // ============================================================
  // V2 Middleware Management API
  // ============================================================

  /**
   * Add named middleware with optional priority
   *
   * Register a middleware function that will be executed in the request/response pipeline.
   * Middleware are executed in descending priority order (higher priority runs first).
   * Uses Koa-style onion model where middleware can execute code before and after
   * calling next().
   *
   * @param name - Unique identifier for the middleware (will replace existing with same name)
   * @param fn - Middleware function (Koa-style with ctx and next)
   * @param priority - Optional priority (default: 0, higher = earlier execution)
   * @returns The unique ID of the middleware (for internal tracking)
   *
   * @example Basic middleware
   * ```typescript
   * const api = createFej();
   * api.use('custom-header', async (ctx, next) => {
   *   ctx.request.init.headers = new Headers(ctx.request.init.headers);
   *   ctx.request.init.headers.set('X-Custom', 'value');
   *   await next();
   * });
   * ```
   *
   * @example Middleware with before/after logic
   * ```typescript
   * api.use('logger', async (ctx, next) => {
   *   const start = Date.now();
   *   console.log(`→ ${ctx.request.url}`);
   *
   *   await next(); // Execute request and downstream middleware
   *
   *   const duration = Date.now() - start;
   *   console.log(`← ${ctx.request.url} (${duration}ms)`);
   * });
   * ```
   *
   * @example Middleware with priority
   * ```typescript
   * // Auth runs first (priority: 100)
   * api.use('auth', authMiddleware, 100);
   * // Logger runs second (priority: 0, default)
   * api.use('logger', loggerMiddleware);
   * ```
   *
   * @public
   */
  public use(name: string, fn: FejMiddlewareFunction, priority = 0): string {
    // Generate unique ID
    const id = `${name}:${this.middlewareIdCounter++}`;

    // Check if middleware with this name already exists
    if (this.middlewareEntries.has(name)) {
      console.warn(
        `[Fej Warning] Middleware with name "${name}" already exists. ` +
          `It will be replaced. Use a unique name or remove the existing one first.`
      );
      // Remove old middleware with same name
      this.middlewareEntries.delete(name);
    }

    // Add middleware
    this.middlewareEntries.set(name, {
      name,
      fn,
      priority,
      enabled: true,
      id,
    });

    return id;
  }

  /**
   * Remove middleware by name
   *
   * Removes a previously registered middleware from the pipeline.
   *
   * @param name - The name of the middleware to remove
   * @returns true if middleware was removed, false if not found
   *
   * @example
   * ```typescript
   * api.use('temp', tempMiddleware);
   * const removed = api.removeMiddleware('temp'); // true
   * const removed2 = api.removeMiddleware('nonexistent'); // false
   * ```
   *
   * @public
   */
  public removeMiddleware(name: string): boolean {
    return this.middlewareEntries.delete(name);
  }

  /**
   * Enable or disable middleware without removing it
   *
   * Allows temporarily disabling middleware without removing it from the pipeline.
   * Useful for debugging or conditional middleware execution.
   *
   * @param name - The name of the middleware
   * @param enabled - Whether to enable (true) or disable (false)
   * @returns true if middleware was found, false otherwise
   *
   * @example
   * ```typescript
   * api.use('debug', debugMiddleware);
   * api.toggleMiddleware('debug', false); // Disable debug logging
   * // ... do something ...
   * api.toggleMiddleware('debug', true); // Re-enable debug logging
   * ```
   *
   * @public
   */
  public toggleMiddleware(name: string, enabled: boolean): boolean {
    const entry = this.middlewareEntries.get(name);
    if (!entry) return false;

    entry.enabled = enabled;
    return true;
  }

  /**
   * Get the list of all registered middleware names
   *
   * Returns middleware names in the order they will execute (sorted by priority).
   *
   * @returns Array of middleware names in priority order (highest priority first)
   *
   * @example
   * ```typescript
   * api.use('auth', authMiddleware, 100);
   * api.use('logger', loggerMiddleware, 0);
   * api.use('retry', retryMiddleware, 50);
   * const names = api.getMiddlewareNames(); // ['auth', 'retry', 'logger']
   * ```
   *
   * @public
   */
  public getMiddlewareNames(): string[] {
    return Array.from(this.middlewareEntries.values())
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.name);
  }

  /**
   * Check if a middleware exists
   *
   * @param name - The name of the middleware
   * @returns true if middleware exists, false otherwise
   *
   * @example
   * ```typescript
   * api.use('auth', authMiddleware);
   * api.hasMiddleware('auth'); // true
   * api.hasMiddleware('nonexistent'); // false
   * ```
   *
   * @public
   */
  public hasMiddleware(name: string): boolean {
    return this.middlewareEntries.has(name);
  }

  // ============================================================
  // V2 Error Handling & Retry API
  // ============================================================

  /**
   * Add an error transformation function
   *
   * Error transforms allow you to customize error handling globally.
   * Transforms are executed in registration order for all errors.
   *
   * @param transform - Function to transform errors
   *
   * @example
   * ```typescript
   * const api = createFej();
   * api.addErrorTransform(async (error, ctx) => {
   *   // Add context to all errors
   *   const enhancedError = new Error(`[${ctx.request.url}] ${error.message}`);
   *   enhancedError.stack = error.stack;
   *   return enhancedError;
   * });
   * ```
   *
   * @public
   */
  public addErrorTransform(transform: ErrorTransform): void {
    this.errorTransforms.push(transform);
  }

  /**
   * Remove all error transforms
   *
   * Clears all registered error transformation functions.
   *
   * @example
   * ```typescript
   * api.clearErrorTransforms();
   * ```
   *
   * @public
   */
  public clearErrorTransforms(): void {
    this.errorTransforms = [];
  }

  /**
   * Set default retry configuration
   *
   * Configures the default retry behavior for the instance. This affects
   * middleware that use retry logic.
   *
   * @param config - Partial retry configuration
   *
   * @example
   * ```typescript
   * const api = createFej();
   * api.setDefaultRetry({
   *   attempts: 5,
   *   delay: 2000,
   *   backoff: 'exponential',
   * });
   * ```
   *
   * @public
   */
  public setDefaultRetry(config: Partial<RetryConfig>): void {
    this.defaultRetryConfig = { ...this.defaultRetryConfig, ...config };
  }

  /**
   * Generate a unique request ID
   * @private
   */
  private generateRequestId(): string {
    return `fej-req-${Date.now()}-${this.requestIdCounter++}`;
  }

  /**
   * Track a request with tags
   * @private
   */
  private trackRequest(requestId: string, tags?: string[]): void {
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        if (!this.requestTags.has(tag)) {
          this.requestTags.set(tag, new Set());
        }
        this.requestTags.get(tag)!.add(requestId);
      });
    }
  }

  /**
   * Untrack a request and clean up its tags
   * @private
   */
  private untrackRequest(requestId: string): void {
    // Remove from all tag sets
    this.requestTags.forEach((requestIds, tag) => {
      requestIds.delete(requestId);
      // Clean up empty tag sets
      if (requestIds.size === 0) {
        this.requestTags.delete(tag);
      }
    });
  }

  /**
   * Create a new AbortController for request cancellation
   *
   * Creates an AbortController instance for cancelling requests. The controller
   * is tracked internally and can be aborted by ID or tags.
   *
   * @param id - Optional custom identifier for the controller (generated if not provided)
   * @param tags - Optional tags for grouping requests (e.g., ['user-profile', 'high-priority'])
   * @returns Object containing the AbortController and the request ID
   *
   * @example Basic usage
   * ```typescript
   * const { controller, requestId } = api.createAbortController();
   * const response = await api.fej('https://api.example.com/users', {
   *   signal: controller.signal,
   * });
   * ```
   *
   * @example With tags for batch cancellation
   * ```typescript
   * const { controller } = api.createAbortController(undefined, ['dashboard', 'user-data']);
   * const response = await api.fej('/api/user', { signal: controller.signal });
   * // Later: cancel all dashboard requests
   * api.abortRequestsByTag('dashboard');
   * ```
   *
   * @public
   */
  public createAbortController(
    id?: string,
    tags?: string[]
  ): { controller: AbortController; requestId: string } {
    const requestId = id || this.generateRequestId();
    const controller = new AbortController();

    this.abortControllers.set(requestId, controller);
    this.trackRequest(requestId, tags);

    // Clean up when aborted
    controller.signal.addEventListener('abort', () => {
      this.untrackRequest(requestId);
      this.abortControllers.delete(requestId);
    });

    return { controller, requestId };
  }

  /**
   * Abort a request by ID
   *
   * Cancels a specific request using its ID. The request ID is returned when
   * creating an AbortController.
   *
   * @param id - The ID of the request to abort
   * @param options - Optional cancellation options (e.g., custom reason)
   * @returns true if request was aborted, false if not found
   *
   * @example
   * ```typescript
   * const { controller, requestId } = api.createAbortController();
   * const fetchPromise = api.fej('/api/data', { signal: controller.signal });
   *
   * // Cancel after 5 seconds
   * setTimeout(() => {
   *   const aborted = api.abortRequest(requestId, { reason: 'Timeout' });
   *   console.log(aborted); // true
   * }, 5000);
   * ```
   *
   * @public
   */
  public abortRequest(id: string, options?: CancellationOptions): boolean {
    const controller = this.abortControllers.get(id);
    if (controller) {
      if (options?.reason) {
        // Modern AbortController.abort() supports reason parameter
        (controller.abort as (reason?: unknown) => void)(options.reason);
      } else {
        controller.abort();
      }
      this.untrackRequest(id);
      this.abortControllers.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Abort all requests with a specific tag
   *
   * Cancels all requests that were tagged with the specified tag.
   * Useful for cancelling groups of related requests (e.g., all dashboard requests).
   *
   * @param tag - The tag to match
   * @param options - Optional cancellation options (e.g., custom reason)
   * @returns Number of requests aborted
   *
   * @example
   * ```typescript
   * // Tag requests with 'dashboard'
   * const { controller: c1 } = api.createAbortController(undefined, ['dashboard']);
   * const { controller: c2 } = api.createAbortController(undefined, ['dashboard']);
   *
   * const p1 = api.fej('/api/users', { signal: c1.signal });
   * const p2 = api.fej('/api/stats', { signal: c2.signal });
   *
   * // Cancel all dashboard requests
   * const count = api.abortRequestsByTag('dashboard'); // returns 2
   * ```
   *
   * @public
   */
  public abortRequestsByTag(tag: string, options?: CancellationOptions): number {
    const requestIds = this.requestTags.get(tag);
    if (!requestIds || requestIds.size === 0) {
      return 0;
    }

    let abortedCount = 0;
    // Convert to array to avoid modification during iteration
    const idsToAbort = Array.from(requestIds);

    idsToAbort.forEach((id) => {
      if (this.abortRequest(id, options)) {
        abortedCount++;
      }
    });

    return abortedCount;
  }

  /**
   * Abort all pending requests
   *
   * Cancels all currently pending requests tracked by this Fej instance.
   * Use with caution as this will cancel ALL requests.
   *
   * @param options - Optional cancellation options (e.g., custom reason)
   *
   * @example
   * ```typescript
   * // User navigates away - cancel all pending requests
   * window.addEventListener('beforeunload', () => {
   *   api.abortAllRequests({ reason: 'Navigation' });
   * });
   * ```
   *
   * @public
   */
  public abortAllRequests(options?: CancellationOptions): void {
    this.abortControllers.forEach((controller) => {
      if (options?.reason) {
        (controller.abort as (reason?: unknown) => void)(options.reason);
      } else {
        controller.abort();
      }
    });
    this.abortControllers.clear();
    this.requestTags.clear();
  }

  /**
   * Get all pending request IDs
   *
   * Returns an array of all request IDs that are currently pending.
   *
   * @returns Array of pending request IDs
   *
   * @example
   * ```typescript
   * const pending = api.getPendingRequests();
   * console.log(`${pending.length} requests in flight`);
   * ```
   *
   * @public
   */
  public getPendingRequests(): string[] {
    return Array.from(this.abortControllers.keys());
  }

  /**
   * Get all requests with a specific tag
   *
   * Returns request IDs for all requests tagged with the specified tag.
   *
   * @param tag - The tag to match
   * @returns Array of request IDs with this tag
   *
   * @example
   * ```typescript
   * const dashboardRequests = api.getRequestsByTag('dashboard');
   * console.log(`Dashboard has ${dashboardRequests.length} pending requests`);
   * ```
   *
   * @public
   */
  public getRequestsByTag(tag: string): string[] {
    const requestIds = this.requestTags.get(tag);
    return requestIds ? Array.from(requestIds) : [];
  }

  /**
   * Check if a request is pending
   *
   * Checks whether a specific request ID is still pending.
   *
   * @param id - The request ID
   * @returns true if pending, false otherwise
   *
   * @example
   * ```typescript
   * const { requestId } = api.createAbortController();
   * const pending = api.isRequestPending(requestId); // true
   * api.abortRequest(requestId);
   * const stillPending = api.isRequestPending(requestId); // false
   * ```
   *
   * @public
   */
  public isRequestPending(id: string): boolean {
    return this.abortControllers.has(id);
  }

  /**
   * Apply error transformations to an error
   * @private
   */
  private async transformError(error: Error, ctx: FejContext): Promise<Error> {
    let transformedError = error;

    for (const transform of this.errorTransforms) {
      transformedError = await transform(transformedError, ctx);
    }

    return transformedError;
  }

  /**
   * Compose middleware functions into a single pipeline (Koa-style onion model)
   * The final function in the chain executes the actual fetch
   * @private
   */
  private composeMiddleware(
    middleware: MiddlewareEntry[],
    ctx: FejContext,
    finalHandler: () => Promise<void>
  ): () => Promise<void> {
    return async function dispatch(index: number): Promise<void> {
      if (index >= middleware.length) {
        // All middleware have been called downstream, now execute the final handler (fetch)
        await finalHandler();
        return;
      }

      const entry = middleware[index];
      if (!entry) {
        throw new Error(`Middleware at index ${index} is undefined`);
      }
      if (!entry.enabled) {
        // Skip disabled middleware
        return dispatch(index + 1);
      }

      try {
        await entry.fn(ctx, () => dispatch(index + 1));
      } catch (error) {
        // Set error in context if not already set
        if (!ctx.error) {
          ctx.error = error instanceof Error ? error : new Error(String(error));
        }
        throw error;
      }
    }.bind(null, 0);
  }

  /**
   * Execute the middleware pipeline (Koa-style onion model)
   * @private
   */
  private async executeMiddlewarePipeline(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    // Merge global init with request init
    const mergedInit = this.mergeDeep(Fej.globalInit, init ?? {}) as RequestInit;

    // Apply legacy middleware for backward compatibility
    let finalInit = this.mergeNonAsyncMiddlewares(mergedInit);
    finalInit = await this.mergeAsyncMiddlewares(finalInit);

    // Create context
    const url = typeof input === 'string' ? input : input.url;
    const ctx: FejContext = {
      request: {
        url,
        init: finalInit,
      },
      state: {},
    };

    // Sort middleware by priority (higher priority = earlier execution)
    const sortedMiddleware = Array.from(this.middlewareEntries.values()).sort(
      (a, b) => b.priority - a.priority
    );

    // Define the final handler that performs the actual fetch
    const finalHandler = async (): Promise<void> => {
      // Only execute fetch if middleware hasn't already set a response
      if (!ctx.response) {
        ctx.response = await fetch(ctx.request.url, ctx.request.init);
      }
    };

    // Compose and execute middleware pipeline with fetch as the final handler
    const pipeline = this.composeMiddleware(sortedMiddleware, ctx, finalHandler);

    try {
      await pipeline();
    } catch (error) {
      // Set error in context if not already set
      if (!ctx.error) {
        ctx.error = error instanceof Error ? error : new Error(String(error));
      }
      // Apply error transformations
      if (this.errorTransforms.length > 0) {
        ctx.error = await this.transformError(ctx.error, ctx);
      }
      throw ctx.error;
    }

    // Return response (should be set by either fetch or middleware)
    if (!ctx.response) {
      throw new Error('No response was set by middleware or fetch');
    }

    return ctx.response;
  }

  private isObject = (item: unknown): item is Record<string, unknown> => {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  };

  private isHeaders = (item: unknown): item is Headers => {
    return item instanceof Headers;
  };

  private isSpecialObject = (item: unknown): boolean => {
    // Check for special non-clonable objects
    if (item === null || item === undefined) return false;
    if (typeof item !== 'object') return false;

    // Check for AbortSignal
    if (item instanceof AbortSignal) return true;

    // Check for objects that become empty when JSON stringified
    try {
      const stringified = JSON.stringify(item);
      // If it's an object but stringifies to empty object, it's special
      if (stringified === '{}' && Object.keys(item).length === 0 && item.constructor !== Object) {
        return true;
      }
    } catch {
      return true;
    }

    return false;
  };

  private deepClone = (item: unknown): unknown => {
    if (item === null || item === undefined) return item;
    if (Array.isArray(item)) return item.slice();
    if (this.isHeaders(item)) return new Headers(item);
    if (this.isSpecialObject(item)) return item; // Don't clone special objects
    if (this.isObject(item)) {
      try {
        const cloned: unknown = JSON.parse(JSON.stringify(item));
        // Verify the clone is equivalent
        if (JSON.stringify(cloned) === JSON.stringify(item)) {
          return cloned;
        }
        // If not equivalent, keep reference
        return item;
      } catch {
        return item;
      }
    }
    return item;
  };

  private mergeDeep = (target: unknown, source: unknown): unknown => {
    // Handle null or undefined source - return source to overwrite target
    if (source === null) {
      return null;
    }
    if (source === undefined) {
      return undefined;
    }

    // Handle null or undefined target - return deep clone of source
    if (target === null || target === undefined) {
      return this.deepClone(source);
    }

    // Handle Headers objects specially
    if (this.isHeaders(target) && this.isHeaders(source)) {
      const merged = new Headers(target);
      source.forEach((value, key) => {
        merged.set(key, value);
      });
      return merged;
    }

    // If either is Headers, handle Headers merging
    if (this.isHeaders(target) || this.isHeaders(source)) {
      const merged = new Headers();

      // Add target headers first
      if (this.isHeaders(target)) {
        target.forEach((value, key) => {
          merged.set(key, value);
        });
      } else if (this.isObject(target)) {
        Object.entries(target).forEach(([key, value]) => {
          if (typeof value === 'string') {
            merged.set(key, value);
          }
        });
      }

      // Add source headers (overwrites existing)
      if (this.isHeaders(source)) {
        source.forEach((value, key) => {
          merged.set(key, value);
        });
      } else if (this.isObject(source)) {
        Object.entries(source).forEach(([key, value]) => {
          if (typeof value === 'string') {
            merged.set(key, value);
          }
        });
      }

      return merged;
    }

    // Handle arrays - replace instead of merge, create independent copy
    if (Array.isArray(source)) {
      return this.deepClone(source);
    }

    // Handle objects - deep merge
    if (this.isObject(target) && this.isObject(source)) {
      const result: Record<string, unknown> = {};

      // Copy all target properties
      Object.keys(target).forEach((key) => {
        const targetValue = target[key];
        if (this.isObject(targetValue) && !this.isHeaders(targetValue)) {
          // Deep clone plain objects only
          result[key] = this.deepClone(targetValue);
        } else if (Array.isArray(targetValue)) {
          // Deep clone arrays
          result[key] = this.deepClone(targetValue);
        } else {
          result[key] = targetValue;
        }
      });

      // Merge source properties
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = result[key];

        // Special handling for Headers objects
        if (this.isHeaders(sourceValue) || this.isHeaders(targetValue)) {
          result[key] = this.mergeDeep(targetValue, sourceValue);
        } else if (this.isObject(sourceValue)) {
          if (this.isObject(targetValue)) {
            // Both are plain objects, merge recursively
            result[key] = this.mergeDeep(targetValue, sourceValue);
          } else {
            // Source is object but target is not, deep clone source
            result[key] = this.deepClone(sourceValue);
          }
        } else if (Array.isArray(sourceValue)) {
          // Arrays are replaced, not merged
          result[key] = this.deepClone(sourceValue);
        } else {
          // Primitive value or special object, replace it
          result[key] = sourceValue;
        }
      });

      return result;
    }

    // Default: source overwrites target
    return source;
  };

  private async mergeAsyncMiddlewares(_init: RequestInit | undefined): Promise<RequestInit> {
    // Execute all async middleware functions sequentially to maintain order
    let result: RequestInit = _init ?? {};
    for (const asyncMiddleware of this.asyncMiddleWares) {
      try {
        const mdwInit = await asyncMiddleware(result);
        result = this.mergeDeep(result, mdwInit) as RequestInit;
      } catch (error) {
        // Re-throw with context about which middleware failed
        throw new Error(
          `Async middleware execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return result;
  }

  private mergeNonAsyncMiddlewares(_init: RequestInit | undefined): RequestInit {
    let result: RequestInit = _init ?? {};
    for (const middleware of this.middleWares) {
      try {
        const mdwInit = middleware(result);
        result = this.mergeDeep(result, mdwInit) as RequestInit;
      } catch (error) {
        // Re-throw with context about which middleware failed
        throw new Error(
          `Middleware execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    return result;
  }
}

/**
 * Create a new Fej instance with configuration
 *
 * Factory function for creating isolated Fej instances with custom configuration.
 * This is the recommended way to use Fej in v2.
 *
 * @param config - Configuration for the instance
 * @returns A new Fej instance
 *
 * @example Basic instance
 * ```typescript
 * import { createFej } from 'fej';
 *
 * const api = createFej();
 * const response = await api.fej('https://api.example.com/users');
 * ```
 *
 * @example With configuration
 * ```typescript
 * const api = createFej({
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
 * });
 * ```
 *
 * @example Multiple instances
 * ```typescript
 * const userApi = createFej({ retry: { attempts: 5 } });
 * const paymentApi = createFej({ retry: { attempts: 10 } });
 * // Each instance has independent configuration and middleware
 * ```
 *
 * @public
 */
export const createFej = (config?: FejConfig): Fej => {
  const instance = new Fej();

  // Apply baseURL middleware (highest priority: 100)
  // This runs first to ensure all URLs are properly resolved
  if (config?.baseURL) {
    instance.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: config.baseURL,
      }),
      100
    );
  }

  // Apply default headers middleware (priority: 90)
  // This runs after baseURL but before most other middleware
  if (config?.headers) {
    instance.use(
      'defaultHeaders',
      createDefaultHeadersMiddleware({
        headers: config.headers,
      }),
      90
    );
  }

  // Apply timeout middleware (priority: 80)
  // This runs after headers but before retry logic
  if (config?.timeout) {
    instance.use(
      'timeout',
      createTimeoutMiddleware({
        timeout: config.timeout,
      }),
      80
    );
  }

  // Apply retry configuration
  if (config?.retry) {
    instance.setDefaultRetry(config.retry);
  }

  // Apply error transforms
  if (config?.errorTransforms) {
    config.errorTransforms.forEach((transform) => instance.addErrorTransform(transform));
  }

  return instance;
};
