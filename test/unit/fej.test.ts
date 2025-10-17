/**
 * Unit tests for Fej class and public APIs
 * Tests all public methods, middleware execution, and edge cases
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFetch, extractHeaders, createTracingMiddleware, captureConsoleWarnings } from '../utils/test-helpers';

describe('Fej - Public API Unit Tests', () => {
  let originalFetch: typeof globalThis.fetch;

  // Import functions dynamically to reset state between tests
  let fej: typeof import('../../src/index').fej;
  let addMiddleware: typeof import('../../src/index').addMiddleware;
  let addAsyncMiddleware: typeof import('../../src/index').addAsyncMiddleware;
  let FejModule: typeof import('../../src/index').default;
  let _clearMiddleware: typeof import('../../src/index')._clearMiddleware;

  beforeEach(async () => {
    // Import once (singleton pattern means we don't reset modules)
    if (!fej) {
      const module = await import('../../src/index');
      fej = module.fej;
      addMiddleware = module.addMiddleware;
      addAsyncMiddleware = module.addAsyncMiddleware;
      FejModule = module.default;
      _clearMiddleware = module._clearMiddleware;
    }

    // Save original fetch
    originalFetch = globalThis.fetch;

    // Clear middleware state before each test
    _clearMiddleware();
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    // Clear all mocks
    vi.clearAllMocks();
    // Clear middleware after test
    _clearMiddleware();
  });

  describe('fej() - Main fetch wrapper', () => {
    it('should call native fetch with correct arguments', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      await fej('https://api.example.com/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].input).toBe('https://api.example.com/users');
      expect(calls[0].init?.method).toBe('GET');
    });

    it('should work with Request object as input', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const request = new Request('https://api.example.com/users', {
        method: 'POST',
      });

      await fej(request);

      expect(calls).toHaveLength(1);
      expect(calls[0].input).toBe(request);
    });

    it('should handle undefined init parameter', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      const response = await fej('https://api.example.com/users');

      expect(response.status).toBe(200);
    });

    it('should return Response object', async () => {
      const { mock } = createMockFetch({ body: '{"success":true}', status: 201 });
      globalThis.fetch = mock;

      const response = await fej('https://api.example.com/users');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should propagate fetch errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(fej('https://api.example.com/users')).rejects.toThrow('Network error');
    });
  });

  describe('setInit() - Global configuration', () => {
    it('should set global RequestInit', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      FejModule.setInit({
        headers: { 'X-Global': 'global-value' },
        mode: 'cors',
      });

      await fej('https://api.example.com/users');

      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Global']).toBe('global-value');
      expect(calls[0].init?.mode).toBe('cors');
    });

    it('should show deprecation warning', () => {
      const { warnings, restore } = captureConsoleWarnings();

      FejModule.setInit({ headers: {} });

      expect(warnings.length).toBeGreaterThan(0);
      // setInit is called on the instance directly, so no singleton warning
      const setInitWarning = warnings.find(w => w.message.includes('setInit'));
      expect(setInitWarning).toBeDefined();
      expect(setInitWarning!.message).toContain('Fej.setInit() is deprecated');
      expect(setInitWarning!.message).toContain('future major version');

      restore();
    });

    it('should merge global init with per-request init', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      FejModule.setInit({
        headers: { 'X-Global': 'global' },
      });

      await fej('https://api.example.com/users', {
        headers: { 'X-Local': 'local' },
      });

      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Global']).toBe('global');
      expect(headers['X-Local']).toBe('local');
    });

    it('should allow per-request init to override global init', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      FejModule.setInit({
        method: 'GET',
        headers: { 'X-Header': 'global' },
      });

      await fej('https://api.example.com/users', {
        method: 'POST',
        headers: { 'X-Header': 'local' },
      });

      expect(calls[0].init?.method).toBe('POST');
      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Header']).toBe('local');
    });
  });

  describe('addMiddleware() - Synchronous middleware', () => {
    it('should execute sync middleware', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      let executed = false;
      addMiddleware((init) => {
        executed = true;
        return init;
      });

      await fej('https://api.example.com/users');

      expect(executed).toBe(true);
    });

    it('should show deprecation warning', () => {
      const { warnings, restore } = captureConsoleWarnings();

      addMiddleware((init) => init);

      expect(warnings.length).toBeGreaterThanOrEqual(2); // Singleton + method warning
      // Find the addMiddleware-specific warning (could be first or second)
      const middlewareWarning = warnings.find(w => w.message.includes('addMiddleware'));
      expect(middlewareWarning).toBeDefined();
      expect(middlewareWarning!.message).toContain('addMiddleware() is deprecated');
      expect(middlewareWarning!.message).toContain('api.use()');

      restore();
    });

    it('should not return a Promise', () => {
      const result = addMiddleware((init) => init);

      expect(result).toBeUndefined();
    });

    it('should pass RequestInit to middleware', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      let capturedInit: RequestInit | undefined;
      addMiddleware((init) => {
        capturedInit = init;
        return init;
      });

      const requestInit = { method: 'POST', headers: { 'X-Test': 'value' } };
      await fej('https://api.example.com/users', requestInit);

      expect(capturedInit).toBeDefined();
      expect(capturedInit?.method).toBe('POST');
    });

    it('should apply middleware transformations', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          headers: { ...init.headers, 'X-Middleware': 'added' },
        };
      });

      await fej('https://api.example.com/users');

      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Middleware']).toBe('added');
    });

    it('should execute multiple middleware in order', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      const traces: string[] = [];

      addMiddleware((init) => {
        traces.push('first');
        return init;
      });

      addMiddleware((init) => {
        traces.push('second');
        return init;
      });

      await fej('https://api.example.com/users');

      expect(traces).toEqual(['first', 'second']);
    });

    it('should handle middleware errors with context', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        throw new Error('Middleware failed');
      });

      await expect(fej('https://api.example.com/users')).rejects.toThrow('Middleware execution failed');
      await expect(fej('https://api.example.com/users')).rejects.toThrow('Middleware failed');
    });
  });

  describe('addAsyncMiddleware() - Asynchronous middleware', () => {
    it('should execute async middleware', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      let executed = false;
      addAsyncMiddleware(async (init) => {
        executed = true;
        return init;
      });

      await fej('https://api.example.com/users');

      expect(executed).toBe(true);
    });

    it('should show deprecation warning', () => {
      const { warnings, restore } = captureConsoleWarnings();

      addAsyncMiddleware(async (init) => init);

      expect(warnings.length).toBeGreaterThanOrEqual(2); // Singleton + method warning
      // Find the addAsyncMiddleware-specific warning (could be first or second)
      const middlewareWarning = warnings.find(w => w.message.includes('addAsyncMiddleware'));
      expect(middlewareWarning).toBeDefined();
      expect(middlewareWarning!.message).toContain('addAsyncMiddleware() is deprecated');
      expect(middlewareWarning!.message).toContain('api.use()');

      restore();
    });

    it('should handle async operations', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addAsyncMiddleware(async (init) => {
        // Simulate async token fetch
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ...init,
          headers: { ...init.headers, Authorization: 'Bearer async-token' },
        };
      });

      await fej('https://api.example.com/users');

      const headers = extractHeaders(calls[0].init);
      expect(headers.Authorization).toBe('Bearer async-token');
    });

    it('should execute async middleware sequentially', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      const executionOrder: number[] = [];

      addAsyncMiddleware(async (init) => {
        executionOrder.push(1);
        await new Promise((resolve) => setTimeout(resolve, 20));
        executionOrder.push(2);
        return init;
      });

      addAsyncMiddleware(async (init) => {
        executionOrder.push(3);
        return init;
      });

      await fej('https://api.example.com/users');

      // Should be [1, 2, 3] proving sequential execution
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should handle async middleware errors with context', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      addAsyncMiddleware(async (init) => {
        throw new Error('Async middleware failed');
      });

      await expect(fej('https://api.example.com/users')).rejects.toThrow('Async middleware execution failed');
      await expect(fej('https://api.example.com/users')).rejects.toThrow('Async middleware failed');
    });
  });

  describe('Middleware Chain Integration', () => {
    it('should execute sync middleware before async middleware', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      const executionOrder: string[] = [];

      addMiddleware((init) => {
        executionOrder.push('sync');
        return init;
      });

      addAsyncMiddleware(async (init) => {
        executionOrder.push('async');
        return init;
      });

      await fej('https://api.example.com/users');

      expect(executionOrder).toEqual(['sync', 'async']);
    });

    it('should pass transformed init through middleware chain', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, headers: { 'X-Step': '1' } };
      });

      addMiddleware((init) => {
        return { ...init, headers: { ...init.headers, 'X-Step-2': '2' } };
      });

      addAsyncMiddleware(async (init) => {
        return { ...init, headers: { ...init.headers, 'X-Step-3': '3' } };
      });

      await fej('https://api.example.com/users');

      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Step']).toBe('1');
      expect(headers['X-Step-2']).toBe('2');
      expect(headers['X-Step-3']).toBe('3');
    });

    it('should stop execution on first error', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      let secondMiddlewareExecuted = false;

      addMiddleware((init) => {
        throw new Error('First middleware error');
      });

      addMiddleware((init) => {
        secondMiddlewareExecuted = true;
        return init;
      });

      await expect(fej('https://api.example.com/users')).rejects.toThrow();
      expect(secondMiddlewareExecuted).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty middleware chain', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      await fej('https://api.example.com/users', { method: 'GET' });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('GET');
    });

    it('should handle middleware returning empty object', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware(() => ({}));

      await fej('https://api.example.com/users', { method: 'POST' });

      expect(calls).toHaveLength(1);
    });

    it('should handle undefined init throughout chain', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, headers: { 'X-Test': 'value' } };
      });

      await fej('https://api.example.com/users');

      expect(calls).toHaveLength(1);
      const headers = extractHeaders(calls[0].init);
      expect(headers['X-Test']).toBe('value');
    });

    it('should handle null values in init', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      await fej('https://api.example.com/users', {
        body: null as any,
        headers: null as any,
      });

      expect(calls).toHaveLength(1);
    });

    it('should handle multiple concurrent requests', async () => {
      const { mock, calls } = createMockFetch({ delay: 10 });
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, headers: { 'X-Test': 'value' } };
      });

      const promises = [
        fej('https://api.example.com/users/1'),
        fej('https://api.example.com/users/2'),
        fej('https://api.example.com/users/3'),
      ];

      await Promise.all(promises);

      expect(calls).toHaveLength(3);
      calls.forEach((call) => {
        const headers = extractHeaders(call.init);
        expect(headers['X-Test']).toBe('value');
      });
    });
  });
});
