/**
 * Test suite for V2 Middleware Utilities
 * Tests bearer token, logger, and retry middleware utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createFej,
  createBearerTokenMiddleware,
  createLoggerMiddleware,
  createRetryMiddleware,
  type FejContext,
} from '../../src/index';

describe('Bearer Token Middleware', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add static bearer token to Authorization header', async () => {
    api.use(
      'auth',
      createBearerTokenMiddleware({
        token: 'test-token-123',
      })
    );

    await api.fej('https://api.example.com/users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token-123');
  });

  it('should use custom header name', async () => {
    api.use(
      'api-key',
      createBearerTokenMiddleware({
        token: 'my-api-key',
        headerName: 'X-API-Key',
        prefix: '',
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('X-API-Key')).toBe('my-api-key');
    expect(headers.get('Authorization')).toBeNull();
  });

  it('should use custom prefix', async () => {
    api.use(
      'basic-auth',
      createBearerTokenMiddleware({
        token: 'dXNlcjpwYXNz',
        prefix: 'Basic',
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Basic dXNlcjpwYXNz');
  });

  it('should retrieve token from sync getToken function', async () => {
    let tokenCallCount = 0;

    api.use(
      'auth',
      createBearerTokenMiddleware({
        getToken: () => {
          tokenCallCount++;
          return `token-${tokenCallCount}`;
        },
      })
    );

    await api.fej('https://api.example.com/users');
    await api.fej('https://api.example.com/posts');

    expect(tokenCallCount).toBe(2);

    const firstCall = (global.fetch as any).mock.calls[0];
    const firstHeaders = firstCall[1].headers as Headers;
    expect(firstHeaders.get('Authorization')).toBe('Bearer token-1');

    const secondCall = (global.fetch as any).mock.calls[1];
    const secondHeaders = secondCall[1].headers as Headers;
    expect(secondHeaders.get('Authorization')).toBe('Bearer token-2');
  });

  it('should retrieve token from async getToken function', async () => {
    api.use(
      'auth',
      createBearerTokenMiddleware({
        getToken: async () => {
          // Simulate async token retrieval
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'async-token';
        },
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer async-token');
  });

  it('should not add header if no token is provided', async () => {
    api.use('auth', createBearerTokenMiddleware({}));

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    // If no token, headers might be undefined or Authorization header should not be set
    if (headers) {
      expect(headers.get('Authorization')).toBeNull();
    } else {
      // No headers set at all is also valid
      expect(headers).toBeUndefined();
    }
  });

  it('should not add header if getToken returns undefined', async () => {
    api.use(
      'auth',
      createBearerTokenMiddleware({
        getToken: () => undefined as any,
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    // If no token, headers might be undefined or Authorization header should not be set
    if (headers) {
      expect(headers.get('Authorization')).toBeNull();
    } else {
      // No headers set at all is also valid
      expect(headers).toBeUndefined();
    }
  });

  it('should merge with existing headers', async () => {
    api.use(
      'auth',
      createBearerTokenMiddleware({
        token: 'test-token',
      })
    );

    await api.fej('https://api.example.com/users', {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      },
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Custom')).toBe('value');
  });
});

describe('Logger Middleware', () => {
  let api: ReturnType<typeof createFej>;
  let logMessages: string[];
  let mockLogger: (message: string) => void;

  beforeEach(() => {
    api = createFej();
    logMessages = [];
    mockLogger = (message: string) => {
      logMessages.push(message);
    };

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log request and response with default format', async () => {
    api.use('logger', createLoggerMiddleware({ logger: mockLogger }));

    await api.fej('https://api.example.com/users');

    expect(logMessages).toHaveLength(2);
    expect(logMessages[0]).toMatch(/→ GET https:\/\/api\.example\.com\/users/);
    expect(logMessages[1]).toMatch(/← GET https:\/\/api\.example\.com\/users - 200 \(\d+ms\)/);
  });

  it('should log with detailed format', async () => {
    api.use('logger', createLoggerMiddleware({ logger: mockLogger, format: 'detailed' }));

    await api.fej('https://api.example.com/users');

    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages[0]).toContain('→ GET https://api.example.com/users');
    expect(logMessages.some((msg) => msg.includes('Headers:'))).toBe(true);
  });

  it('should log with JSON format', async () => {
    api.use('logger', createLoggerMiddleware({ logger: mockLogger, format: 'json' }));

    await api.fej('https://api.example.com/users');

    expect(logMessages).toHaveLength(2);

    const requestLog = JSON.parse(logMessages[0]);
    expect(requestLog).toMatchObject({
      type: 'request',
      method: 'GET',
      url: 'https://api.example.com/users',
    });

    const responseLog = JSON.parse(logMessages[1]);
    expect(responseLog).toMatchObject({
      type: 'response',
      method: 'GET',
      url: 'https://api.example.com/users',
      status: 200,
      statusText: 'OK',
    });
    expect(responseLog.duration).toBeGreaterThanOrEqual(0);
  });

  it('should use custom formatter', async () => {
    api.use(
      'logger',
      createLoggerMiddleware({
        logger: mockLogger,
        format: (ctx, duration) => {
          return `Custom: ${ctx.request.url} took ${duration}ms`;
        },
      })
    );

    await api.fej('https://api.example.com/users');

    // Custom formatter only applies to response logging
    expect(logMessages.some((msg) => msg.includes('Custom:'))).toBe(true);
    expect(
      logMessages.some((msg) => msg.includes('https://api.example.com/users took'))
    ).toBe(true);
  });

  it('should filter requests based on custom filter', async () => {
    api.use(
      'logger',
      createLoggerMiddleware({
        logger: mockLogger,
        filter: (ctx) => ctx.request.url.includes('/api/'),
      })
    );

    await api.fej('https://example.com/users');
    expect(logMessages).toHaveLength(0);

    await api.fej('https://example.com/api/users');
    expect(logMessages).toHaveLength(2);
  });

  it('should log only requests when logResponse is false', async () => {
    api.use(
      'logger',
      createLoggerMiddleware({
        logger: mockLogger,
        logResponse: false,
      })
    );

    await api.fej('https://api.example.com/users');

    expect(logMessages).toHaveLength(1);
    expect(logMessages[0]).toMatch(/→ GET/);
  });

  it('should log only responses when logRequest is false', async () => {
    api.use(
      'logger',
      createLoggerMiddleware({
        logger: mockLogger,
        logRequest: false,
      })
    );

    await api.fej('https://api.example.com/users');

    expect(logMessages).toHaveLength(1);
    expect(logMessages[0]).toMatch(/← GET/);
  });

  it('should log errors in response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    api.use('logger', createLoggerMiddleware({ logger: mockLogger }));

    await api.fej('https://api.example.com/users');

    expect(logMessages[1]).toMatch(/500/);
  });

  it('should log errors when error is set in context', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    api.use('logger', createLoggerMiddleware({ logger: mockLogger }), 100);

    // Error setter with lower priority (runs after logger in downstream, before in upstream)
    api.use(
      'error-setter',
      async (ctx, next) => {
        await next();
        if (ctx.response && !ctx.response.ok) {
          ctx.error = new Error('Request failed');
        }
      },
      50
    );

    await api.fej('https://api.example.com/users');

    // Should have logged request and response
    expect(logMessages.length).toBeGreaterThanOrEqual(2);
    // Check that response has error info  (error is set after logger runs upstream)
    // The logger will see the error in its upstream phase
    expect(logMessages[1]).toContain('[ERROR: Request failed]');
  });

  it('should measure request duration accurately', async () => {
    // Mock fetch with delay
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response('{}', {
                  status: 200,
                })
              ),
            50
          )
        )
    );

    api.use('logger', createLoggerMiddleware({ logger: mockLogger, format: 'json' }));

    await api.fej('https://api.example.com/users');

    const responseLog = JSON.parse(logMessages[1]);
    expect(responseLog.duration).toBeGreaterThanOrEqual(45); // Allow some margin
  });
});

describe('Retry Middleware', () => {
  let api: ReturnType<typeof createFej>;
  let fetchCallCount: number;

  beforeEach(() => {
    api = createFej();
    fetchCallCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not retry on successful request', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }));

    await api.fej('https://api.example.com/users');

    expect(fetchCallCount).toBe(1);
  });

  it('should retry on failed request', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 3) {
        return Promise.resolve(new Response('{}', { status: 500 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }));

    await api.fej('https://api.example.com/users');

    expect(fetchCallCount).toBe(3);
  });

  it('should throw after max retry attempts', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 500 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }));

    await expect(api.fej('https://api.example.com/users')).rejects.toThrow(
      'Request failed after 3 attempts'
    );

    expect(fetchCallCount).toBe(4); // Initial + 3 retries
  });

  it('should use fixed backoff strategy', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    global.fetch = vi.fn().mockImplementation(() => {
      const now = Date.now();
      if (fetchCallCount > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 500 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 50, backoff: 'fixed' }));

    try {
      await api.fej('https://api.example.com/users');
    } catch (error) {
      // Expected
    }

    // Check that delays are approximately equal (fixed backoff)
    delays.forEach((delay) => {
      expect(delay).toBeGreaterThanOrEqual(45); // ~50ms with tolerance
      expect(delay).toBeLessThan(150); // Not exponential
    });
  });

  it('should use linear backoff strategy', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    global.fetch = vi.fn().mockImplementation(() => {
      const now = Date.now();
      if (fetchCallCount > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 500 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 50, backoff: 'linear' }));

    try {
      await api.fej('https://api.example.com/users');
    } catch (error) {
      // Expected
    }

    // Linear: 50ms, 100ms, 150ms
    expect(delays[0]).toBeGreaterThanOrEqual(45);
    expect(delays[0]).toBeLessThan(150);
    expect(delays[1]).toBeGreaterThan(delays[0]); // Should increase
    expect(delays[2]).toBeGreaterThan(delays[1]); // Should increase
  });

  it('should use exponential backoff strategy', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    global.fetch = vi.fn().mockImplementation(() => {
      const now = Date.now();
      if (fetchCallCount > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 500 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 50, backoff: 'exponential' }));

    try {
      await api.fej('https://api.example.com/users');
    } catch (error) {
      // Expected
    }

    // Exponential: 50ms, 100ms, 200ms
    expect(delays[0]).toBeGreaterThanOrEqual(45);
    expect(delays[1]).toBeGreaterThan(delays[0] * 1.5); // Exponential growth
    expect(delays[2]).toBeGreaterThan(delays[1] * 1.5); // Exponential growth
  });

  it('should respect maxDelay', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    global.fetch = vi.fn().mockImplementation(() => {
      const now = Date.now();
      if (fetchCallCount > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 500 }));
    });

    api.use(
      'retry',
      createRetryMiddleware({
        attempts: 5,
        delay: 50,
        maxDelay: 100,
        backoff: 'exponential',
      })
    );

    try {
      await api.fej('https://api.example.com/users');
    } catch (error) {
      // Expected
    }

    // All delays should be <= maxDelay
    delays.forEach((delay) => {
      expect(delay).toBeLessThanOrEqual(150); // maxDelay + tolerance
    });
  });

  it('should use custom shouldRetry function', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve(new Response('{}', { status: 404 }));
    });

    api.use(
      'retry',
      createRetryMiddleware({
        attempts: 3,
        delay: 10,
        shouldRetry: (error, ctx) => {
          // Don't retry on 404
          return ctx.response?.status !== 404;
        },
      })
    );

    await api.fej('https://api.example.com/users');

    // Should not retry on 404
    expect(fetchCallCount).toBe(1);
  });

  it('should call onRetry callback', async () => {
    const retryCallbacks: Array<{ attempt: number; error: Error }> = [];

    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 3) {
        return Promise.resolve(new Response('{}', { status: 500 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    api.use(
      'retry',
      createRetryMiddleware({
        attempts: 3,
        delay: 10,
        onRetry: (error, attempt, ctx) => {
          retryCallbacks.push({ attempt, error });
        },
      })
    );

    await api.fej('https://api.example.com/users');

    expect(retryCallbacks).toHaveLength(2); // 2 retries before success
    expect(retryCallbacks[0].attempt).toBe(1);
    expect(retryCallbacks[1].attempt).toBe(2);
  });

  it('should clear response and error between retries', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 3) {
        return Promise.resolve(new Response('{}', { status: 500 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }));

    const response = await api.fej('https://api.example.com/users');

    expect(response.status).toBe(200);
  });

  it('should retry on network errors', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }));

    await api.fej('https://api.example.com/users');

    expect(fetchCallCount).toBe(3);
  });
});

describe('Middleware Utilities Integration', () => {
  let api: ReturnType<typeof createFej>;
  let logMessages: string[];
  let mockLogger: (message: string) => void;

  beforeEach(() => {
    api = createFej();
    logMessages = [];
    mockLogger = (message: string) => {
      logMessages.push(message);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should combine bearer token, logger, and retry middleware', async () => {
    let fetchCallCount = 0;

    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 2) {
        return Promise.resolve(new Response('{}', { status: 500 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    // Add middlewares in recommended order
    api.use(
      'auth',
      createBearerTokenMiddleware({
        token: 'test-token',
      }),
      100
    );

    api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }), 80);

    api.use('logger', createLoggerMiddleware({ logger: mockLogger, format: 'json' }), 50);

    await api.fej('https://api.example.com/users');

    // Verify auth was added
    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token');

    // Verify retry worked
    expect(fetchCallCount).toBe(2);

    // Verify logging
    expect(logMessages.length).toBeGreaterThan(0);
  });

  it('should work with all middleware in complex scenario', async () => {
    let tokenCallCount = 0;
    let fetchCallCount = 0;

    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount < 2) {
        return Promise.resolve(new Response('{}', { status: 429 })); // Rate limit
      }
      return Promise.resolve(
        new Response('{"data": "success"}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    // Dynamic token
    api.use(
      'auth',
      createBearerTokenMiddleware({
        getToken: () => {
          tokenCallCount++;
          return `token-${tokenCallCount}`;
        },
      }),
      100
    );

    // Retry on rate limit
    api.use(
      'retry',
      createRetryMiddleware({
        attempts: 3,
        delay: 10,
        shouldRetry: (error, ctx) => {
          return ctx.response?.status === 429 || (ctx.response && !ctx.response.ok);
        },
      }),
      80
    );

    // Log everything
    api.use('logger', createLoggerMiddleware({ logger: mockLogger, format: 'detailed' }), 50);

    const response = await api.fej('https://api.example.com/users');

    // Verify final response
    expect(response.status).toBe(200);

    // Verify token was fetched at least once
    // Note: In the current implementation, auth middleware runs once in the pipeline
    // even if retry middleware retries the request
    expect(tokenCallCount).toBeGreaterThanOrEqual(1);

    // Verify retry happened
    expect(fetchCallCount).toBe(2);

    // Verify logging
    expect(logMessages.length).toBeGreaterThan(0);
  });
});
