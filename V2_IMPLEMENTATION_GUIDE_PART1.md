---
This has part 2 which is in @V2_IMPLEMENTATION_GUIDE_PART2.md
---

# Fej v2 Implementation Guide

## Technical Specifications and Implementation Details

This guide provides detailed technical specifications for implementing fej v2.0. It serves as a reference for developers working on the project.

**IMPORTANT**: This guide has been updated to reflect the **70% scope reduction** from the original plan. Only essential features (8-10 core features) are included in v2.0. Advanced features are deferred to v2.1+.

### Scope Philosophy

- **v2.0**: Essential features only, high quality, realistic timeline
- **v2.1+**: Advanced features (circuit breaker, caching, monitoring, etc.)
- **Focus**: Deliver a solid, maintainable foundation

---

## Table of Contents

1. [Architecture](#architecture)
2. [Core Interfaces](#core-interfaces)
3. [Implementation Details](#implementation-details)
4. [Testing Requirements](#testing-requirements)
5. [Build Configuration](#build-configuration)
6. [Migration Path](#migration-path)
7. [Time Estimates & Complexity](#time-estimates--complexity)
8. [Risk Management for Implementation](#risk-management-for-implementation)

---

## Architecture

### High-Level Design (Simplified - Single Middleware Concept)

```
┌─────────────────────────────────────────────────────────────┐
│                         User Code                            │
│              api.get('/users')                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fej Instance                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Configuration                                          │ │
│  │  - baseURL, timeout, retry, headers                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Unified Middleware Chain                        │ │
│  │         (Priority-Ordered, Onion Model)                 │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ MW1: Auth (priority: 100)                        │  │ │
│  │  │   ↓ Add headers                                  │  │ │
│  │  │   ├→ await next() ──┐                           │  │ │
│  │  │                      │                           │  │ │
│  │  │ MW2: Logger (priority: 0)                        │  │ │
│  │  │   ↓ Log start        │                           │  │ │
│  │  │   ├→ await next() ───┼──┐                       │  │ │
│  │  │                      │  │                        │  │ │
│  │  │ MW3: Error Handler (priority: 0)                 │  │ │
│  │  │   ↓ try/catch        │  │                        │  │ │
│  │  │   ├→ await next() ───┼──┼──┐                    │  │ │
│  │  │                      │  │  │                     │  │ │
│  │  │         ┌────────────┘  │  │                     │  │ │
│  │  │         │ Native fetch()│  │                     │  │ │
│  │  │         │ (HTTP Request)│  │                     │  │ │
│  │  │         └────────────┬──┘  │                     │  │ │
│  │  │                      │     │                     │  │ │
│  │  │ MW3: Error Handler   │     │                     │  │ │
│  │  │   ↑ Handle errors ───┘     │                     │  │ │
│  │  │                            │                      │  │ │
│  │  │ MW2: Logger                │                      │  │ │
│  │  │   ↑ Log duration ──────────┘                     │  │ │
│  │  │                                                   │  │ │
│  │  │ MW1: Auth                                         │  │ │
│  │  │   ↑ (No post-processing)                         │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Native Fetch API                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      Response to User
```

**Architecture Simplifications from Critical Review:**

1. ❌ **REMOVED**: Separate "interceptors" concept (was confusing)
2. ❌ **REMOVED**: Separate "hooks" concept (was redundant)
3. ❌ **REMOVED**: Multiple stages (pre-request, validation, etc.) - too complex
4. ✅ **UNIFIED**: Single middleware concept handles everything
5. ✅ **CLEAR**: Onion/Stack execution model (proven by Koa)
6. ✅ **SIMPLE**: Priority-based ordering for predictable execution

**Why This is Better:**

- One concept to learn (middleware) instead of three (middleware + interceptors + hooks)
- Clear execution order: priority → registration order → reverse on response
- Proven pattern (Koa, Express) that developers already understand
- Flexible enough for all use cases without extra complexity

### Module Structure (Simplified - No Interceptors)

```
src/
├── index.ts                 # Main entry point, exports
├── core/
│   ├── fej.ts              # Main Fej class
│   ├── middleware.ts        # Middleware management and execution
│   └── config.ts           # Configuration management
├── types/
│   ├── index.ts            # Type definitions export
│   ├── config.ts           # Config types
│   ├── middleware.ts       # Middleware types
│   └── request.ts          # Request/Response types
├── utils/
│   ├── merge.ts            # Deep merge utility
│   ├── errors.ts           # Error classes
│   └── helpers.ts          # Helper functions
├── middleware/
│   ├── retry.ts            # Basic retry middleware (ESSENTIAL)
│   ├── auth.ts             # Bearer token middleware (ESSENTIAL)
│   └── logger.ts           # Logger middleware (ESSENTIAL)
└── compat/
    └── v1.ts               # v1 compatibility layer
```

**Changes from Original Structure:**

- ❌ Removed `core/interceptors.ts` (no longer needed)
- ❌ Removed `types/interceptor.ts` (no longer needed)
- ❌ Removed `utils/validators.ts` (conflicts with zero-dependency policy - users handle validation)
- ❌ Removed `middleware/cache.ts` (deferred to v2.2+ as optional plugin with peer dependencies)
- ❌ Removed `middleware/circuit-breaker.ts` (too complex, deferred to v2.2+ as optional plugin)
- ❌ Removed `middleware/deduplication.ts` (deferred to v2.2+ as optional plugin)
- ✅ Simplified to single middleware concept
- ✅ Only 3 essential middleware utilities (auth, logger, retry)
- ✅ Fewer files = easier to maintain
- ✅ All remaining code uses ONLY native APIs (zero dependencies)

---

## Core Interfaces

### Configuration Types

```typescript
/**
 * Main configuration for Fej instance
 */
export interface FejConfig {
  /** Base URL for all requests */
  baseURL?: string;

  /** Default request timeout in milliseconds */
  timeout?: number;

  /** Default headers for all requests */
  headers?: HeadersInit;

  /** Retry configuration */
  retry?: RetryConfig;

  /** Cache configuration */
  cache?: CacheConfig;

  /** Debug mode */
  debug?: boolean;

  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  attempts?: number;

  /** Base delay between retries in milliseconds */
  delay?: number;

  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;

  /** Exponential backoff factor */
  factor?: number;

  /** HTTP status codes that should trigger retry */
  statusCodes?: number[];

  /** HTTP methods that should be retried */
  methods?: string[];

  /** Custom retry condition */
  retryCondition?: (error: Error, attempt: number) => boolean;
}

/**
 * Cache configuration
 *
 * NOTE: Cache feature DEFERRED to v2.2+ as optional plugin - NOT in v2.0 scope
 *
 * Reason: Advanced caching (LRU eviction, TTL, memory limits) would require:
 * - External dependency (lru-cache) OR
 * - 2-4KB custom implementation
 * Both conflict with zero-dependency policy.
 *
 * Future: Will be available as @fej/plugin-cache with peer dependency on lru-cache
 * Users who need caching can:
 * 1. Use browser's native Cache API
 * 2. Implement simple Map-based caching
 * 3. Wait for v2.2+ plugin
 */
export interface CacheConfig {
  /** Enable caching */
  enabled?: boolean;

  /** Maximum cache size in bytes */
  maxSize?: number;

  /** Default TTL in milliseconds */
  ttl?: number;

  /** Cache key generator */
  keyGenerator?: (request: Request) => string;

  /** Custom cache storage */
  storage?: CacheStorage;
}
```

### Middleware Types (Unified - No Interceptors)

```typescript
/**
 * Unified middleware function (handles both sync and async)
 * Inspired by Koa's middleware model
 */
export type Middleware = (
  request: FejRequest,
  next: NextFunction
) => Promise<FejRequest> | FejRequest;

/**
 * Next function for middleware chain
 * Returns a Promise that resolves when all downstream middleware completes
 */
export type NextFunction = () => Promise<void>;

/**
 * Middleware configuration options
 */
export interface MiddlewareConfig {
  /** Optional middleware name for identification and removal */
  name?: string;

  /** Execution priority (higher = runs earlier, default: 0) */
  priority?: number;

  /** Only apply to specific URL paths (string or regex patterns) */
  paths?: string | RegExp | (string | RegExp)[];

  /** Only apply to specific HTTP methods */
  methods?: string[];

  /** Enable/disable this middleware (default: true) */
  enabled?: boolean;
}

/**
 * Internal registered middleware representation
 */
export interface RegisteredMiddleware {
  fn: Middleware;
  config: MiddlewareConfig;
  id: symbol; // Unique ID for removal
}
```

**Key Simplifications:**

- ❌ Removed `AsyncMiddleware` type (all middleware is async by default)
- ❌ Removed entire `InterceptorManager` interface (no longer needed)
- ❌ Removed `RequestInterceptor`, `ResponseInterceptor`, `ErrorInterceptor` types
- ✅ Single `Middleware` type handles all scenarios
- ✅ Middleware can handle request, response, and errors using try/catch

### Request/Response Types

```typescript
/**
 * Enhanced request object
 */
export interface FejRequest extends RequestInit {
  /** Request URL */
  url: string;

  /** Request method */
  method: string;

  /** Request headers */
  headers: Headers;

  /** Request metadata */
  metadata: Map<string, any>;

  /** Request timestamp */
  timestamp: number;

  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Enhanced response object
 */
export interface FejResponse extends Response {
  /** Request that generated this response */
  request: FejRequest;

  /** Response timestamp */
  timestamp: number;

  /** Response duration in milliseconds */
  duration: number;

  /** Whether response came from cache */
  cached: boolean;
}

/**
 * Error class for Fej errors
 */
export class FejError extends Error {
  constructor(
    message: string,
    public request: FejRequest,
    public response?: FejResponse,
    public code?: string
  ) {
    super(message);
    this.name = 'FejError';
  }
}
```

---

## Implementation Details

### 1. Core Fej Class

```typescript
/**
 * Main Fej class implementation (Simplified - Middleware Only)
 */
export class Fej {
  private config: FejConfig;
  private middlewares: RegisteredMiddleware[] = [];

  constructor(config: FejConfig = {}) {
    this.config = this.normalizeConfig(config);
  }

  /**
   * Register middleware with optional configuration
   * Returns a symbol ID that can be used to remove the middleware later
   */
  use(
    nameOrMiddleware: string | Middleware,
    middlewareOrConfig?: Middleware | MiddlewareConfig,
    maybeConfig?: MiddlewareConfig
  ): symbol {
    // Parse overloaded arguments
    let middleware: Middleware;
    let config: MiddlewareConfig;

    if (typeof nameOrMiddleware === 'function') {
      // use(middleware, config?)
      middleware = nameOrMiddleware;
      config = (middlewareOrConfig as MiddlewareConfig) || {};
    } else {
      // use(name, middleware, config?)
      middleware = middlewareOrConfig as Middleware;
      config = maybeConfig || {};
      config.name = nameOrMiddleware;
    }

    const id = Symbol('middleware');
    const registered: RegisteredMiddleware = {
      fn: middleware,
      config,
      id,
    };

    this.middlewares.push(registered);
    this.sortMiddlewares();

    return id;
  }

  /**
   * Remove middleware by ID or name
   */
  eject(idOrName: symbol | string): boolean {
    const index = this.middlewares.findIndex(
      (m) => m.id === idOrName || m.config.name === idOrName
    );

    if (index === -1) return false;

    this.middlewares.splice(index, 1);
    return true;
  }

  /**
   * Execute request through middleware chain
   */
  async request(url: string | Request, init?: RequestInit): Promise<FejResponse> {
    // 1. Create FejRequest
    const request = this.createRequest(url, init);

    // 2. Run middleware chain (handles everything: request, response, errors)
    const processedRequest = await this.runMiddlewareChain(request);

    // 3. Extract response from request metadata
    const response = processedRequest.metadata.get('response') as FejResponse;

    return response;
  }

  /**
   * Convenience methods
   */
  get(url: string, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, { ...init, method: 'GET' });
  }

  post(url: string, body?: any, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(url: string, body?: any, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, {
      ...init,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(url: string, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, { ...init, method: 'DELETE' });
  }

  patch(url: string, body?: any, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Private methods...
  private createRequest(url: string | Request, init?: RequestInit): FejRequest {
    // Merge base URL and request URL
    const fullUrl = this.resolveUrl(url);

    // Merge headers
    const headers = new Headers(this.config.headers);
    if (init?.headers) {
      const initHeaders = new Headers(init.headers);
      initHeaders.forEach((value, key) => headers.set(key, value));
    }

    // Create FejRequest
    const request: FejRequest = {
      url: fullUrl,
      method: init?.method || 'GET',
      headers,
      metadata: new Map(),
      timestamp: Date.now(),
      ...init,
    };

    return request;
  }

  /**
   * Run middleware chain with Koa-style onion model
   * Middleware executes in order, then in reverse after fetch
   */
  private async runMiddlewareChain(request: FejRequest): Promise<FejRequest> {
    let currentRequest = request;
    let index = 0;

    // Define the next function (recursive middleware execution)
    const next = async (): Promise<void> => {
      // If we've run all middleware, execute the fetch
      if (index >= this.middlewares.length) {
        const response = await fetch(currentRequest.url, currentRequest);
        currentRequest.metadata.set('response', response);
        return;
      }

      const middleware = this.middlewares[index++];

      // Check if middleware should run
      if (!this.shouldRunMiddleware(middleware, currentRequest)) {
        return next();
      }

      // Execute middleware
      currentRequest = await middleware.fn(currentRequest, next);
    };

    // Start the chain
    await next();
    return currentRequest;
  }

  private shouldRunMiddleware(middleware: RegisteredMiddleware, request: FejRequest): boolean {
    // Check enabled
    if (middleware.config.enabled === false) return false;

    // Check paths
    if (middleware.config.paths) {
      const paths = Array.isArray(middleware.config.paths)
        ? middleware.config.paths
        : [middleware.config.paths];

      const matches = paths.some((pattern) => {
        if (typeof pattern === 'string') {
          return request.url.includes(pattern);
        }
        return pattern.test(request.url);
      });

      if (!matches) return false;
    }

    // Check methods
    if (middleware.config.methods) {
      if (!middleware.config.methods.includes(request.method)) {
        return false;
      }
    }

    return true;
  }

  private sortMiddlewares(): void {
    this.middlewares.sort((a, b) => {
      const priorityA = a.config.priority || 0;
      const priorityB = b.config.priority || 0;
      return priorityB - priorityA; // Higher priority = earlier execution
    });
  }

  private resolveUrl(url: string | Request): string {
    const urlStr = typeof url === 'string' ? url : url.url;

    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }

    if (this.config.baseURL) {
      return `${this.config.baseURL}${urlStr}`;
    }

    return urlStr;
  }
}
```

**Key Implementation Changes:**

- ❌ Removed `runRequestInterceptors()`, `runResponseInterceptors()`, `runErrorInterceptors()`
- ❌ Removed `createInterceptorManager()`
- ✅ Single `runMiddlewareChain()` method handles everything
- ✅ Fetch happens at the end of the middleware chain (when `index >= this.middlewares.length`)
- ✅ Response stored in `request.metadata.get('response')`
- ✅ Clean Koa-style onion model

### 2. Deep Merge Utility

```typescript
/**
 * Type-safe deep merge implementation
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;

  const result = { ...target };

  for (const source of sources) {
    if (!isObject(source)) continue;

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

      const sourceValue = source[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue as any, sourceValue as any) as any;
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

function isObject(item: any): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
```

### 3. Retry Plugin

```typescript
/**
 * Retry plugin implementation
 */
export function createRetryPlugin(config: RetryConfig = {}): Middleware {
  const {
    attempts = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    statusCodes = [408, 429, 500, 502, 503, 504],
    methods = ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
    retryCondition = defaultRetryCondition,
  } = config;

  return async (request: FejRequest, next: NextFunction) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        await next();
        return request;
      } catch (error) {
        lastError = error as Error;

        // Check if should retry
        if (!retryCondition(error as Error, attempt)) {
          throw error;
        }

        // Check if method is retryable
        if (!methods.includes(request.method)) {
          throw error;
        }

        // Check status code if available
        if (error instanceof FejError && error.response) {
          if (!statusCodes.includes(error.response.status)) {
            throw error;
          }
        }

        // Calculate delay
        const currentDelay = Math.min(delay * Math.pow(factor, attempt), maxDelay);

        // Wait before retry
        await sleep(currentDelay);
      }
    }

    throw lastError;
  };
}

function defaultRetryCondition(error: Error, attempt: number): boolean {
  return attempt < 3;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 4. Essential Middleware Utilities

**NOTE**: Advanced plugins (cache, circuit breaker, deduplication) are DEFERRED to v2.1+

Only 3 essential middleware utilities are included in v2.0:

#### 4.1 Bearer Token Middleware

```typescript
/**
 * Bearer token authentication middleware
 * ESSENTIAL - INCLUDED IN v2.0
 */
export interface BearerAuthConfig {
  /** Token value or function to get token */
  token: string | (() => string | Promise<string>);

  /** Custom header name (default: 'Authorization') */
  headerName?: string;

  /** Custom prefix (default: 'Bearer') */
  prefix?: string;
}

export function createBearerAuthMiddleware(config: BearerAuthConfig): Middleware {
  const { token, headerName = 'Authorization', prefix = 'Bearer' } = config;

  return async (request: FejRequest, next: NextFunction) => {
    // Get token (support both static and dynamic)
    const tokenValue = typeof token === 'function' ? await token() : token;

    // Set authorization header
    request.headers.set(headerName, `${prefix} ${tokenValue}`);

    await next();
    return request;
  };
}
```

#### 4.2 Logger Middleware

```typescript
/**
 * Logger middleware for debugging
 * ESSENTIAL - INCLUDED IN v2.0
 */
export interface LoggerConfig {
  /** Log requests */
  logRequests?: boolean;

  /** Log responses */
  logResponses?: boolean;

  /** Log errors */
  logErrors?: boolean;

  /** Custom logger function */
  logger?: (message: string, data?: any) => void;
}

export function createLoggerMiddleware(config: LoggerConfig = {}): Middleware {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    logger = console.log,
  } = config;

  return async (request: FejRequest, next: NextFunction) => {
    const startTime = Date.now();

    if (logRequests) {
      logger('Request:', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      });
    }

    try {
      await next();

      const duration = Date.now() - startTime;

      if (logResponses) {
        logger('Response:', {
          url: request.url,
          duration: `${duration}ms`,
          status: request.metadata.get('status'),
        });
      }

      return request;
    } catch (error) {
      if (logErrors) {
        logger('Error:', {
          url: request.url,
          error: error instanceof Error ? error.message : error,
        });
      }
      throw error;
    }
  };
}
```

---

## Testing Requirements

### Baseline Performance Testing (Phase 0 - CRITICAL)

**IMPORTANT:** Before implementing v2 features, establish v1 performance baseline.

This addresses **Critical Review Point 9: No Baseline Measurements**. The original plan set performance targets without knowing v1's actual performance, making it impossible to:

- Set realistic targets
- Measure improvement
- Identify bottlenecks

**Phase 0.1 Deliverable:** `BASELINE_METRICS.md` with comprehensive v1 measurements

See **Time Estimates & Complexity > Phase 0: Baseline Measurement** section for detailed implementation steps (25-35 hours).

**Key Baseline Metrics to Measure:**

1. **Request Overhead:** Time for 0, 1, 3, 5, 10 middleware (calculate per-middleware overhead)
2. **Memory Usage:** Heap size for empty instance, 10 middleware, 1000 requests (detect leaks)
3. **Bundle Size:** Minified and gzipped size, module breakdown
4. **GC Pressure:** Garbage collection frequency and duration

**Tools Required:**

- `benchmark.js` for precise performance measurements
- Node.js `--inspect` + Chrome DevTools for profiling
- `webpack-bundle-analyzer` or `rollup-plugin-visualizer` for bundle analysis
- `size-limit` for automated size checks

**Outcome:** Data-driven v2 performance targets based on actual v1 measurements (not guesses).

---

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Fej } from '../src/core/fej';

describe('Fej', () => {
  let fej: Fej;

  beforeEach(() => {
    fej = new Fej();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(fej).toBeInstanceOf(Fej);
    });

    it('should accept custom config', () => {
      const config = { baseURL: 'https://api.example.com' };
      const instance = new Fej(config);
      expect(instance.config.baseURL).toBe(config.baseURL);
    });
  });

  describe('use', () => {
    it('should register middleware', () => {
      const middleware = vi.fn();
      const id = fej.use(middleware);

      expect(id).toBeTypeOf('symbol');
      expect(fej.middlewares).toHaveLength(1);
    });

    it('should sort middlewares by priority', () => {
      fej.use(vi.fn(), { priority: 1 });
      fej.use(vi.fn(), { priority: 3 });
      fej.use(vi.fn(), { priority: 2 });

      expect(fej.middlewares[0].config.priority).toBe(3);
      expect(fej.middlewares[1].config.priority).toBe(2);
      expect(fej.middlewares[2].config.priority).toBe(1);
    });
  });

  describe('request', () => {
    it('should execute fetch request', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
      global.fetch = mockFetch;

      await fej.request('https://api.example.com/users');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should run middleware chain', async () => {
      const middleware1 = vi.fn(async (req, next) => {
        await next();
        return req;
      });
      const middleware2 = vi.fn(async (req, next) => {
        await next();
        return req;
      });

      fej.use(middleware1);
      fej.use(middleware2);

      await fej.request('https://api.example.com/users');

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
  });
});
```

### Integration Test Template

**Zero-Dependency Testing Approach**: Use Node.js native `http` module for integration tests (no MSW)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'http';
import { Fej } from '../src';

describe('Fej Integration', () => {
  let server: Server;
  let baseURL: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      // Create real HTTP server for integration tests
      server = createServer((req, res) => {
        // Handle GET /users
        if (req.url === '/users' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ users: [] }));
          return;
        }

        // Handle custom header test
        if (req.url === '/users' && req.headers['x-custom-header']) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              header: req.headers['x-custom-header'],
            })
          );
          return;
        }

        // 404 for other routes
        res.writeHead(404);
        res.end();
      });

      server.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' ? address?.port : 0;
        baseURL = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should handle real HTTP requests', async () => {
    const fej = new Fej({ baseURL });
    const response = await fej.get('/users');
    const data = await response.json();

    expect(data).toEqual({ users: [] });
  });

  it('should apply middleware to requests', async () => {
    const fej = new Fej({ baseURL });

    fej.use(async (req, next) => {
      req.headers.set('X-Custom-Header', 'test');
      await next();
      return req;
    });

    const response = await fej.get('/users');
    const data = await response.json();

    expect(data.header).toBe('test');
  });
});
```

**Why No MSW?**

1. **Heavy dependency**: MSW is ~30KB minified (contradicts "faster installs" goal)
2. **Overkill**: Native http server is simpler and more direct for library testing
3. **Better for libraries**: Real HTTP requests better test fetch integration
4. **Zero config**: No service worker setup or complex configuration needed

---

## Build Configuration

### package.json

```json
{
  "name": "fej",
  "version": "2.0.0",
  "description": "Fetch API with middleware support",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./plugins/*": {
      "import": "./dist/plugins/*.js",
      "require": "./dist/plugins/*.cjs",
      "types": "./dist/plugins/*.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "docs": "typedoc",
    "size": "size-limit",
    "size:why": "size-limit --why",
    "prepublishOnly": "npm run lint && npm run test && npm run build && npm run size"
  },
  "keywords": ["fetch", "middleware", "http", "request", "interceptor"],
  "files": ["dist"],
  "engines": {
    "node": ">=18"
  },
  "dependencies": {},
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typedoc": "^0.25.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@size-limit/preset-small-lib": "^11.0.0",
    "size-limit": "^11.0.0"
  },
  "peerDependencies": {},
  "optionalDependencies": {}
}
```

**Critical Note About Dependencies:**

```json
"dependencies": {}  // ← MUST REMAIN EMPTY - Zero production dependencies policy
```

This empty object is **enforced by CI** and is a **core principle** of fej. Any PR that adds a production dependency will be **automatically rejected**.

````

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/*.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  target: 'es2020',
  outDir: 'dist'
});
````

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": false,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### eslint.config.js

```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
```

### .size-limit.json

```json
{
  "limits": [
    {
      "name": "Full Library (all features)",
      "path": "dist/index.js",
      "limit": "10 KB",
      "gzip": true
    },
    {
      "name": "Core + 3 middleware utilities (typical usage)",
      "path": "dist/index.js",
      "import": "{ createFej, createBearerAuthMiddleware, createLoggerMiddleware, createRetryMiddleware }",
      "limit": "8 KB",
      "gzip": true
    },
    {
      "name": "Core only (minimal usage)",
      "path": "dist/index.js",
      "import": "{ createFej }",
      "limit": "5 KB",
      "gzip": true
    }
  ]
}
```

**Bundle Size Configuration Notes:**

This configuration implements the recommendations from Critical Review Point 4:

1. **Realistic Targets**:
   - Full library: <10KB (vs original impossible <5KB target)
   - Typical usage: <8KB (with tree-shaking)
   - Core only: <5KB (minimal footprint)

2. **Automated Enforcement**:
   - CI fails if any limit is exceeded
   - Runs on every build via `prepublishOnly` script
   - Developers can check locally with `npm run size`

3. **Per-Feature Budget**:
   - With 8-10 features and 10KB limit, each feature has ~0.8-1KB budget
   - Individual feature size can be checked with `npm run size:why`

4. **Comparison to Competitors**:
   - fej v1: ~3KB
   - wretch: ~6KB
   - ky: ~8KB
   - fej v2: ~8-10KB (competitive with more features)
   - axios: ~13KB (we remain smaller)
