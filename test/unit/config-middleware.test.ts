/**
 * Test suite for Configuration Middleware (baseURL, headers, timeout)
 * Tests the new config options wired up in createFej()
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createFej,
  createBaseURLMiddleware,
  createDefaultHeadersMiddleware,
  FejTimeoutError,
} from '../../src/index';

describe('BaseURL Middleware', () => {
  beforeEach(() => {
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

  it('should prepend baseURL to relative paths', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com',
      })
    );

    await api.fej('/users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object)
    );
  });

  it('should handle baseURL with trailing slash', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com/',
      })
    );

    await api.fej('/users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object)
    );
  });

  it('should handle path without leading slash', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com',
      })
    );

    await api.fej('users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object)
    );
  });

  it('should not modify absolute URLs by default', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com',
      })
    );

    await api.fej('https://other-api.com/data');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://other-api.com/data',
      expect.any(Object)
    );
  });

  it('should force baseURL on absolute URLs when allowAbsoluteUrls is false', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://proxy.example.com',
        allowAbsoluteUrls: false,
      })
    );

    await api.fej('https://other-api.com/data');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://proxy.example.com/https://other-api.com/data',
      expect.any(Object)
    );
  });

  it('should handle empty path', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com',
      })
    );

    await api.fej('');

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com', expect.any(Object));
  });

  it('should handle complex paths with query parameters', async () => {
    const api = createFej();
    api.use(
      'baseURL',
      createBaseURLMiddleware({
        baseURL: 'https://api.example.com/v1',
      })
    );

    await api.fej('/users?page=1&limit=10');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/users?page=1&limit=10',
      expect.any(Object)
    );
  });
});

describe('Default Headers Middleware', () => {
  beforeEach(() => {
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

  it('should add default headers to requests', async () => {
    const api = createFej();
    api.use(
      'headers',
      createDefaultHeadersMiddleware({
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('should allow request headers to override defaults', async () => {
    const api = createFej();
    api.use(
      'headers',
      createDefaultHeadersMiddleware({
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'default-value',
        },
      })
    );

    await api.fej('https://api.example.com/users', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('text/plain');
    expect(headers.get('X-Custom')).toBe('default-value');
  });

  it('should work with Headers object', async () => {
    const api = createFej();
    const defaultHeaders = new Headers({
      'User-Agent': 'MyApp/1.0',
      'X-API-Version': 'v2',
    });

    api.use(
      'headers',
      createDefaultHeadersMiddleware({
        headers: defaultHeaders,
      })
    );

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('User-Agent')).toBe('MyApp/1.0');
    expect(headers.get('X-API-Version')).toBe('v2');
  });

  it('should handle case-insensitive header merging', async () => {
    const api = createFej();
    api.use(
      'headers',
      createDefaultHeadersMiddleware({
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    await api.fej('https://api.example.com/users', {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    // Headers are case-insensitive, so this should work
    expect(headers.get('content-type')).toBe('text/plain');
    expect(headers.get('Content-Type')).toBe('text/plain');
  });
});

describe('FejConfig Integration', () => {
  beforeEach(() => {
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

  it('should apply baseURL from config', async () => {
    const api = createFej({
      baseURL: 'https://api.example.com',
    });

    await api.fej('/users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object)
    );
  });

  it('should apply headers from config', async () => {
    const api = createFej({
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
      },
    });

    await api.fej('https://api.example.com/users');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Custom-Header')).toBe('test-value');
  });

  it('should apply timeout from config', async () => {
    // Mock a slow fetch that takes longer than timeout
    global.fetch = vi.fn().mockImplementation(
      (_url, options) =>
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve(new Response('{}', { status: 200 }));
          }, 2000);

          // Listen to abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        })
    );

    const api = createFej({
      timeout: 100,
    });

    await expect(api.fej('https://api.example.com/users')).rejects.toThrow(FejTimeoutError);
  });

  it('should apply all config options together', async () => {
    const api = createFej({
      baseURL: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer default-token',
      },
      timeout: 5000,
    });

    await api.fej('/users', {
      headers: {
        Authorization: 'Bearer custom-token', // Override default
      },
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const url = callArgs[0];
    const headers = callArgs[1].headers as Headers;

    expect(url).toBe('https://api.example.com/users');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer custom-token');
  });

  it('should maintain correct middleware priority order', async () => {
    const executionOrder: string[] = [];

    const api = createFej({
      baseURL: 'https://api.example.com',
      headers: {
        'X-Default': 'value',
      },
      timeout: 5000,
    });

    // Add custom middleware with various priorities
    api.use(
      'custom-high',
      async (ctx, next) => {
        executionOrder.push('custom-high-before');
        await next();
        executionOrder.push('custom-high-after');
      },
      95
    );

    api.use(
      'custom-low',
      async (ctx, next) => {
        executionOrder.push('custom-low-before');
        await next();
        executionOrder.push('custom-low-after');
      },
      10
    );

    await api.fej('/users');

    // Verify execution order (higher priority runs first)
    // baseURL (100) -> custom-high (95) -> defaultHeaders (90) -> timeout (80) -> custom-low (10)
    expect(executionOrder).toEqual([
      'custom-high-before',
      'custom-low-before',
      'custom-low-after',
      'custom-high-after',
    ]);

    // Verify baseURL was applied (priority 100, runs first)
    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[0]).toBe('https://api.example.com/users');
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
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

  it('should handle baseURL with subdirectory', async () => {
    const api = createFej({
      baseURL: 'https://api.example.com/v2/api',
    });

    await api.fej('/users/123');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/v2/api/users/123',
      expect.any(Object)
    );
  });

  it('should handle multiple slashes correctly', async () => {
    const api = createFej({
      baseURL: 'https://api.example.com/',
    });

    await api.fej('//users');

    // Should normalize multiple leading slashes
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object)
    );
  });

  it('should work with empty headers config', async () => {
    const api = createFej({
      headers: {},
    });

    await api.fej('https://api.example.com/users');

    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle config with only timeout', async () => {
    const api = createFej({
      timeout: 5000,
    });

    await api.fej('https://api.example.com/users');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
