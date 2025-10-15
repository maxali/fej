# Fej v2 Implementation Guide

## Technical Specifications and Implementation Details

This guide provides detailed technical specifications for implementing fej v2.0. It serves as a reference for developers working on the project.

---

## Table of Contents
1. [Architecture](#architecture)
2. [Core Interfaces](#core-interfaces)
3. [Implementation Details](#implementation-details)
4. [Testing Requirements](#testing-requirements)
5. [Build Configuration](#build-configuration)
6. [Migration Path](#migration-path)

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                         User Code                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Fej Instance                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Configuration                          │ │
│  │  - baseURL, timeout, retry, headers, etc.              │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Request Pipeline                           │ │
│  │                                                          │ │
│  │  1. Pre-request hooks                                   │ │
│  │  2. Middleware chain (sync & async)                     │ │
│  │  3. Request validation                                  │ │
│  │  4. Request execution (fetch)                           │ │
│  │  5. Response interception                               │ │
│  │  6. Error handling                                      │ │
│  │  7. Post-response hooks                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Native Fetch API                        │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/
├── index.ts                 # Main entry point, exports
├── core/
│   ├── fej.ts              # Main Fej class
│   ├── middleware.ts        # Middleware management
│   ├── interceptors.ts      # Request/response interceptors
│   └── config.ts           # Configuration management
├── types/
│   ├── index.ts            # Type definitions export
│   ├── config.ts           # Config types
│   ├── middleware.ts       # Middleware types
│   ├── interceptor.ts      # Interceptor types
│   └── request.ts          # Request/Response types
├── utils/
│   ├── merge.ts            # Deep merge utility
│   ├── validators.ts       # Input validation
│   ├── errors.ts           # Error classes
│   └── helpers.ts          # Helper functions
├── plugins/
│   ├── retry.ts            # Retry plugin
│   ├── cache.ts            # Cache plugin
│   ├── timeout.ts          # Timeout plugin
│   └── logger.ts           # Logger plugin
└── compat/
    └── v1.ts               # v1 compatibility layer
```

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

### Middleware Types

```typescript
/**
 * Synchronous middleware function
 */
export type Middleware = (
  request: FejRequest,
  next: NextFunction
) => FejRequest | Promise<FejRequest>;

/**
 * Asynchronous middleware function
 */
export type AsyncMiddleware = (
  request: FejRequest,
  next: NextFunction
) => Promise<FejRequest>;

/**
 * Next function for middleware chain
 */
export type NextFunction = () => Promise<void>;

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  /** Middleware name for identification */
  name?: string;
  
  /** Execution priority (higher = earlier) */
  priority?: number;
  
  /** Only apply to specific paths */
  paths?: string | RegExp | (string | RegExp)[];
  
  /** Only apply to specific methods */
  methods?: string[];
  
  /** Enable/disable this middleware */
  enabled?: boolean;
}

/**
 * Registered middleware
 */
export interface RegisteredMiddleware {
  fn: Middleware | AsyncMiddleware;
  config: MiddlewareConfig;
  id: symbol;
}
```

### Interceptor Types

```typescript
/**
 * Request interceptor
 */
export type RequestInterceptor = (
  request: FejRequest
) => FejRequest | Promise<FejRequest>;

/**
 * Response interceptor
 */
export type ResponseInterceptor = (
  response: FejResponse
) => FejResponse | Promise<FejResponse>;

/**
 * Error interceptor
 */
export type ErrorInterceptor = (
  error: FejError,
  request: FejRequest
) => Promise<FejResponse | void>;

/**
 * Interceptor manager
 */
export interface InterceptorManager {
  request: {
    use(interceptor: RequestInterceptor): number;
    eject(id: number): void;
  };
  response: {
    use(interceptor: ResponseInterceptor): number;
    eject(id: number): void;
  };
  error: {
    use(interceptor: ErrorInterceptor): number;
    eject(id: number): void;
  };
}
```

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
 * Main Fej class implementation
 */
export class Fej {
  private config: FejConfig;
  private middlewares: RegisteredMiddleware[] = [];
  private interceptors: InterceptorManager;
  
  constructor(config: FejConfig = {}) {
    this.config = this.normalizeConfig(config);
    this.interceptors = this.createInterceptorManager();
  }
  
  /**
   * Register middleware
   */
  use(
    middleware: Middleware | AsyncMiddleware,
    config?: MiddlewareConfig
  ): symbol {
    const id = Symbol('middleware');
    const registered: RegisteredMiddleware = {
      fn: middleware,
      config: config || {},
      id
    };
    
    this.middlewares.push(registered);
    this.sortMiddlewares();
    
    return id;
  }
  
  /**
   * Remove middleware by ID
   */
  eject(id: symbol): boolean {
    const index = this.middlewares.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.middlewares.splice(index, 1);
    return true;
  }
  
  /**
   * Execute request
   */
  async request(
    url: string | Request,
    init?: RequestInit
  ): Promise<FejResponse> {
    // 1. Create FejRequest
    const request = this.createRequest(url, init);
    
    // 2. Run request interceptors
    const interceptedRequest = await this.runRequestInterceptors(request);
    
    // 3. Run middleware chain
    const processedRequest = await this.runMiddlewareChain(interceptedRequest);
    
    // 4. Execute fetch
    try {
      const response = await this.executeFetch(processedRequest);
      
      // 5. Run response interceptors
      const interceptedResponse = await this.runResponseInterceptors(response);
      
      return interceptedResponse;
    } catch (error) {
      // 6. Run error interceptors
      const handledResponse = await this.runErrorInterceptors(
        error,
        processedRequest
      );
      
      if (handledResponse) {
        return handledResponse;
      }
      
      throw error;
    }
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
      body: JSON.stringify(body)
    });
  }
  
  put(url: string, body?: any, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, {
      ...init,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  
  delete(url: string, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, { ...init, method: 'DELETE' });
  }
  
  patch(url: string, body?: any, init?: RequestInit): Promise<FejResponse> {
    return this.request(url, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }
  
  // Private methods...
  private createRequest(
    url: string | Request,
    init?: RequestInit
  ): FejRequest {
    // Implementation
  }
  
  private async runMiddlewareChain(request: FejRequest): Promise<FejRequest> {
    let currentRequest = request;
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) return;
      
      const middleware = this.middlewares[index++];
      
      // Check if middleware should run
      if (!this.shouldRunMiddleware(middleware, currentRequest)) {
        return next();
      }
      
      currentRequest = await middleware.fn(currentRequest, next);
    };
    
    await next();
    return currentRequest;
  }
  
  private shouldRunMiddleware(
    middleware: RegisteredMiddleware,
    request: FejRequest
  ): boolean {
    // Check enabled
    if (middleware.config.enabled === false) return false;
    
    // Check paths
    if (middleware.config.paths) {
      const paths = Array.isArray(middleware.config.paths)
        ? middleware.config.paths
        : [middleware.config.paths];
      
      const matches = paths.some(pattern => {
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
      return priorityB - priorityA;
    });
  }
}
```

### 2. Deep Merge Utility

```typescript
/**
 * Type-safe deep merge implementation
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  
  const result = { ...target };
  
  for (const source of sources) {
    if (!isObject(source)) continue;
    
    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(
          targetValue as any,
          sourceValue as any
        ) as any;
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
    retryCondition = defaultRetryCondition
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
        const currentDelay = Math.min(
          delay * Math.pow(factor, attempt),
          maxDelay
        );
        
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
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 4. Cache Plugin

```typescript
/**
 * Simple in-memory cache implementation
 */
export class MemoryCache implements CacheStorage {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  
  constructor(maxSize: number = 10 * 1024 * 1024) {
    this.maxSize = maxSize;
  }
  
  async get(key: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }
  
  async set(key: string, value: CacheEntry): Promise<void> {
    // Check size limit
    while (this.getCurrentSize() + value.size > this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, value);
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  private getCurrentSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += entry.size;
    }
    return size;
  }
  
  private evictOldest(): void {
    const oldest = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    
    if (oldest) {
      this.cache.delete(oldest[0]);
    }
  }
}

/**
 * Cache plugin
 */
export function createCachePlugin(config: CacheConfig = {}): Middleware {
  const {
    enabled = true,
    ttl = 5 * 60 * 1000,
    keyGenerator = defaultKeyGenerator,
    storage = new MemoryCache()
  } = config;
  
  return async (request: FejRequest, next: NextFunction) => {
    if (!enabled) {
      await next();
      return request;
    }
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      await next();
      return request;
    }
    
    const key = keyGenerator(request as any);
    
    // Check cache
    const cached = await storage.get(key);
    if (cached) {
      request.metadata.set('cached', true);
      request.metadata.set('cachedResponse', cached.response);
      return request;
    }
    
    // Execute request
    await next();
    
    // Cache response
    const response = request.metadata.get('response') as Response;
    if (response && response.ok) {
      const entry: CacheEntry = {
        response: response.clone(),
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size: estimateResponseSize(response)
      };
      
      await storage.set(key, entry);
    }
    
    return request;
  };
}

function defaultKeyGenerator(request: Request): string {
  const url = new URL(request.url);
  return `${request.method}:${url.pathname}${url.search}`;
}

function estimateResponseSize(response: Response): number {
  const contentLength = response.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 1024;
}
```

---

## Testing Requirements

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
      const mockFetch = vi.fn().mockResolvedValue(
        new Response('{}', { status: 200 })
      );
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

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { Fej } from '../src';

const server = setupServer(
  rest.get('https://api.example.com/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  })
);

describe('Fej Integration', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());
  
  it('should handle real HTTP requests', async () => {
    const fej = new Fej({ baseURL: 'https://api.example.com' });
    const response = await fej.get('/users');
    const data = await response.json();
    
    expect(data).toEqual({ users: [] });
  });
  
  it('should apply middleware to requests', async () => {
    const fej = new Fej({ baseURL: 'https://api.example.com' });
    
    fej.use(async (req, next) => {
      req.headers.set('X-Custom-Header', 'test');
      await next();
      return req;
    });
    
    server.use(
      rest.get('https://api.example.com/users', (req, res, ctx) => {
        const header = req.headers.get('X-Custom-Header');
        return res(ctx.json({ header }));
      })
    );
    
    const response = await fej.get('/users');
    const data = await response.json();
    
    expect(data.header).toBe('test');
  });
});
```

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
    "prepublishOnly": "npm run lint && npm run test && npm run build"
  },
  "keywords": [
    "fetch",
    "middleware",
    "http",
    "request",
    "interceptor"
  ],
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=18"
  }
}
```

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
```

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
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
      }]
    }
  }
];
```

---

## Migration Path

### v1 Compatibility Layer

```typescript
/**
 * Compatibility layer for v1 API
 */
export class FejV1Compat {
  private instance: Fej;
  
  constructor() {
    this.instance = new Fej();
  }
  
  /**
   * v1: Fej.setInit()
   * v2: new Fej(config)
   */
  setInit(init: RequestInit): void {
    console.warn(
      'setInit() is deprecated. Use new Fej(config) instead.'
    );
    this.instance = new Fej(init);
  }
  
  /**
   * v1: Fej.addMiddleware()
   * v2: fej.use()
   */
  async addMiddleware(fn: (init: RequestInit) => RequestInit): Promise<void> {
    console.warn(
      'addMiddleware() is deprecated. Use fej.use() instead.'
    );
    this.instance.use((req, next) => {
      const modified = fn(req);
      Object.assign(req, modified);
      return next().then(() => req);
    });
  }
  
  /**
   * v1: Fej.addAsyncMiddleware()
   * v2: fej.use() with async function
   */
  addAsyncMiddleware(
    fn: (init: RequestInit) => Promise<RequestInit>
  ): void {
    console.warn(
      'addAsyncMiddleware() is deprecated. Use fej.use() instead.'
    );
    this.instance.use(async (req, next) => {
      const modified = await fn(req);
      Object.assign(req, modified);
      await next();
      return req;
    });
  }
  
  /**
   * v1: fej()
   * v2: fej.request()
   */
  async fej(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.instance.request(input as string, init);
  }
}

// Export singleton for v1 compatibility
const fejV1 = new FejV1Compat();
export const fej = fejV1.fej.bind(fejV1);
export const addMiddleware = fejV1.addMiddleware.bind(fejV1);
export const addAsyncMiddleware = fejV1.addAsyncMiddleware.bind(fejV1);
export default fejV1;
```

### Migration Script

```typescript
/**
 * Automated migration from v1 to v2
 * 
 * Usage: npx @fej/migrate path/to/your/code
 */

// Using jscodeshift or similar
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  
  // Transform: Fej.setInit() -> new Fej()
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'Fej' },
        property: { name: 'setInit' }
      }
    })
    .forEach(path => {
      const config = path.value.arguments[0];
      j(path).replaceWith(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier('fej'),
            j.newExpression(j.identifier('Fej'), [config])
          )
        ])
      );
    });
  
  // Transform: Fej.addMiddleware() -> fej.use()
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'Fej' },
        property: { name: 'addMiddleware' }
      }
    })
    .forEach(path => {
      path.value.callee.object.name = 'fej';
      path.value.callee.property.name = 'use';
    });
  
  return root.toSource();
}
```

---

## Performance Benchmarks

### Benchmark Suite

```typescript
import { bench, describe } from 'vitest';
import { Fej } from '../src';

describe('Performance', () => {
  bench('simple request', async () => {
    const fej = new Fej();
    await fej.get('https://api.example.com/users');
  });
  
  bench('request with middleware', async () => {
    const fej = new Fej();
    fej.use((req, next) => {
      req.headers.set('X-Custom', 'value');
      return next().then(() => req);
    });
    await fej.get('https://api.example.com/users');
  });
  
  bench('request with 10 middlewares', async () => {
    const fej = new Fej();
    for (let i = 0; i < 10; i++) {
      fej.use((req, next) => {
        req.headers.set(`X-Custom-${i}`, `value-${i}`);
        return next().then(() => req);
      });
    }
    await fej.get('https://api.example.com/users');
  });
});
```

---

## Deployment Checklist

### Pre-release
- [ ] All tests passing
- [ ] Test coverage > 80%
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Git tag created

### Release
- [ ] npm publish
- [ ] GitHub release created
- [ ] Documentation deployed
- [ ] Announcement posted

### Post-release
- [ ] Monitor npm downloads
- [ ] Monitor GitHub issues
- [ ] Collect feedback
- [ ] Plan next iteration

---

## Summary

This implementation guide provides the technical foundation for building fej v2. Key points:

1. **Modular Architecture**: Clean separation of concerns
2. **Type Safety**: Full TypeScript with strict mode
3. **Extensibility**: Plugin system for features
4. **Backward Compatibility**: v1 compatibility layer
5. **Testing**: Comprehensive test coverage
6. **Modern Tooling**: Current best practices

Follow this guide to ensure consistent, high-quality implementation across all v2 features.
