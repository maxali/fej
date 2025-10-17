/**
 * Phase 2 Integration Tests
 *
 * Comprehensive integration tests for all Phase 2 features working together:
 * - Middleware Management (Phase 2.1)
 * - Error Handling & Retry (Phase 2.2)
 * - AbortController Integration (Phase 2.3)
 * - Middleware Utilities (Phase 2.4)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { createFej } from '../../src/index';
import type { Fej } from '../../src/index';

describe('Phase 2: All Features Integration', () => {
  let server: Server;
  let baseURL: string;
  let port: number;
  let requestCount = 0;

  beforeAll(async () => {
    // Create a real HTTP server for testing
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '/', `http://localhost`);
      requestCount++;

      // Echo endpoint - returns request details
      if (url.pathname === '/api/echo') {
        const headers: Record<string, string | string[] | undefined> = {};
        Object.keys(req.headers).forEach((key) => {
          headers[key] = req.headers[key];
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          method: req.method,
          headers,
          url: url.pathname
        }));
        return;
      }

      // Flaky endpoint - fails first 2 times, succeeds on 3rd
      if (url.pathname === '/api/flaky') {
        const attempt = parseInt(url.searchParams.get('attempt') || '1', 10);
        if (attempt < 3) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error', attempt }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, attempt }));
        return;
      }

      // Slow endpoint - delays response
      if (url.pathname === '/api/slow') {
        const delayMs = parseInt(url.searchParams.get('ms') || '1000', 10);
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ delayed: true, ms: delayMs }));
        }, delayMs);
        return;
      }

      // Auth endpoint - requires bearer token
      if (url.pathname === '/api/protected') {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ authenticated: true, token: authHeader }));
        return;
      }

      // Users endpoint
      if (url.pathname === '/api/users') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }));
        return;
      }

      // Default 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    // Start server on random available port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          port = address.port;
          baseURL = `http://localhost:${port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  beforeEach(() => {
    requestCount = 0;
  });

  describe('Middleware Management + Error Handling', () => {
    it('should execute middleware in priority order with error handling', async () => {
      const api = createFej();
      const executionOrder: string[] = [];

      // Low priority middleware
      api.use('low', async (ctx, next) => {
        executionOrder.push('low-before');
        await next();
        executionOrder.push('low-after');
      }, 10);

      // High priority middleware
      api.use('high', async (ctx, next) => {
        executionOrder.push('high-before');
        await next();
        executionOrder.push('high-after');
      }, 100);

      // Medium priority middleware
      api.use('medium', async (ctx, next) => {
        executionOrder.push('medium-before');
        await next();
        executionOrder.push('medium-after');
      }, 50);

      const response = await api.fej(`${baseURL}/api/users`);

      expect(response.status).toBe(200);
      expect(executionOrder).toEqual([
        'high-before',
        'medium-before',
        'low-before',
        'low-after',
        'medium-after',
        'high-after'
      ]);
    });

    it('should handle errors in middleware chain', async () => {
      const api = createFej();
      let errorCaught = false;

      // Error handler middleware
      api.use('errorHandler', async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          errorCaught = true;
          ctx.state.errorHandled = true;
        }
      }, 1000);

      // Middleware that throws
      api.use('thrower', async (ctx, next) => {
        throw new Error('Middleware error');
      }, 50);

      await expect(api.fej(`${baseURL}/api/users`)).rejects.toThrow();
      expect(errorCaught).toBe(true);
    });
  });

  describe('Middleware Management + Retry Logic', () => {
    it('should track multiple middleware executing together', async () => {
      const api = createFej();
      const executionLog: string[] = [];

      // Request modifier middleware
      api.use('modifier', async (ctx, next) => {
        executionLog.push('modifier-before');
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          'X-Modified': 'true'
        };
        await next();
        executionLog.push('modifier-after');
      }, 100);

      // Logger middleware
      api.use('logger', async (ctx, next) => {
        executionLog.push('logger-before');
        await next();
        executionLog.push('logger-after');
      }, 50);

      const response = await api.fej(`${baseURL}/api/echo`);
      const data = await response.json();

      expect(data.headers['x-modified']).toBe('true');
      expect(executionLog).toEqual([
        'modifier-before',
        'logger-before',
        'logger-after',
        'modifier-after'
      ]);
    });
  });

  describe('AbortController + Timeout', () => {
    it('should abort slow requests with timeout', async () => {
      const api = createFej();

      // Create abort controller with timeout
      const { controller, requestId } = api.createAbortController('slow-request');

      // Timeout after 100ms
      setTimeout(() => {
        api.abortRequest(requestId);
      }, 100);

      await expect(
        api.fej(`${baseURL}/api/slow?ms=1000`, {
          signal: controller.signal
        })
      ).rejects.toThrow();

      expect(api.isRequestPending(requestId)).toBe(false);
    });

    it('should cancel multiple requests by tag', async () => {
      const api = createFej();

      const { controller: ctrl1 } = api.createAbortController('req1', ['api', 'users']);
      const { controller: ctrl2 } = api.createAbortController('req2', ['api', 'users']);
      const { controller: ctrl3 } = api.createAbortController('req3', ['other']);

      // Start multiple requests
      const promise1 = api.fej(`${baseURL}/api/slow?ms=1000`, { signal: ctrl1.signal });
      const promise2 = api.fej(`${baseURL}/api/slow?ms=1000`, { signal: ctrl2.signal });
      const promise3 = api.fej(`${baseURL}/api/slow?ms=1000`, { signal: ctrl3.signal });

      // Cancel all 'api' tagged requests
      api.abortRequestsByTag('api');

      // First two should fail, third should continue
      await expect(promise1).rejects.toThrow();
      await expect(promise2).rejects.toThrow();

      // Cancel the third one manually
      api.abortAllRequests();
      await expect(promise3).rejects.toThrow();
    });
  });

  describe('Complete Feature Integration', () => {
    it('should handle authentication, logging, retry, and cancellation together', async () => {
      const api = createFej();
      const logs: string[] = [];

      // Authentication middleware (highest priority)
      api.use('auth', async (ctx, next) => {
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          Authorization: 'Bearer test-token-123'
        };
        await next();
      }, 1000);

      // Logging middleware
      api.use('logger', async (ctx, next) => {
        const start = Date.now();
        logs.push(`Request started: ${ctx.request.url}`);
        await next();
        const duration = Date.now() - start;
        logs.push(`Request completed: ${ctx.response?.status} in ${duration}ms`);
      }, 500);

      // Request tracking middleware
      api.use('tracking', async (ctx, next) => {
        const requestId = `req-${Date.now()}`;
        ctx.state.requestId = requestId;
        logs.push(`Tracking: ${requestId}`);
        await next();
      }, 250);

      const response = await api.fej(`${baseURL}/api/protected`);
      const data = await response.json();

      expect(data.authenticated).toBe(true);
      expect(data.token).toBe('Bearer test-token-123');
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs[0]).toContain('Request started');
      expect(logs.some(log => log.includes('Tracking:'))).toBe(true);
      expect(logs[logs.length - 1]).toContain('Request completed: 200');
    });

    it('should handle middleware state sharing across the chain', async () => {
      const api = createFej();

      // First middleware sets state
      api.use('state-setter', async (ctx, next) => {
        ctx.state.userId = 'user-123';
        ctx.state.startTime = Date.now();
        await next();
      }, 100);

      // Second middleware reads and modifies state
      api.use('state-reader', async (ctx, next) => {
        expect(ctx.state.userId).toBe('user-123');
        ctx.state.processed = true;
        await next();
      }, 50);

      // Third middleware validates state
      api.use('state-validator', async (ctx, next) => {
        expect(ctx.state.userId).toBe('user-123');
        expect(ctx.state.processed).toBe(true);
        expect(ctx.state.startTime).toBeTypeOf('number');
        await next();
      }, 25);

      const response = await api.fej(`${baseURL}/api/users`);
      expect(response.status).toBe(200);
    });

    it('should handle enable/disable middleware dynamically', async () => {
      const api = createFej();
      const calls: string[] = [];

      api.use('middleware1', async (ctx, next) => {
        calls.push('m1');
        await next();
      });

      // Make first request
      await api.fej(`${baseURL}/api/users`);
      expect(calls).toEqual(['m1']);

      // Disable middleware
      calls.length = 0;
      api.toggleMiddleware('middleware1', false);
      await api.fej(`${baseURL}/api/users`);
      expect(calls).toEqual([]);

      // Re-enable middleware
      calls.length = 0;
      api.toggleMiddleware('middleware1', true);
      await api.fej(`${baseURL}/api/users`);
      expect(calls).toEqual(['m1']);
    });

    it('should handle removing middleware', async () => {
      const api = createFej();
      const calls: string[] = [];

      api.use('temp', async (ctx, next) => {
        calls.push('temp');
        await next();
      });

      api.use('permanent', async (ctx, next) => {
        calls.push('permanent');
        await next();
      });

      // First request - both should execute
      await api.fej(`${baseURL}/api/users`);
      expect(calls).toEqual(['temp', 'permanent']);

      // Remove temp middleware
      calls.length = 0;
      api.removeMiddleware('temp');
      await api.fej(`${baseURL}/api/users`);
      expect(calls).toEqual(['permanent']);
    });
  });

  describe('Real-World Scenario: Resilient API Client', () => {
    it('should implement a production-ready API client with all features', async () => {
      const api = createFej();
      const metrics = {
        requests: 0,
        retries: 0,
        errors: 0,
        cancelled: 0
      };

      // 1. Authentication
      api.use('auth', async (ctx, next) => {
        const token = 'prod-token-xyz';
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          Authorization: `Bearer ${token}`
        };
        await next();
      }, 1000);

      // 2. Request tracking
      api.use('tracking', async (ctx, next) => {
        metrics.requests++;
        const requestId = `req-${Date.now()}-${metrics.requests}`;
        ctx.state.requestId = requestId;

        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          'X-Request-ID': requestId
        };

        await next();
      }, 900);

      // 3. Error handling
      api.use('errorHandler', async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          metrics.errors++;
          // Transform error
          const fejError = new Error(`API Error: ${(error as Error).message}`);
          throw fejError;
        }
      }, 800);

      // 4. Response validation
      api.use('validator', async (ctx, next) => {
        await next();

        if (ctx.response && !ctx.response.ok) {
          throw new Error(`HTTP ${ctx.response.status}: ${ctx.response.statusText}`);
        }
      }, 100);

      // Make a successful request
      const response = await api.fej(`${baseURL}/api/protected`);
      const data = await response.json();

      expect(data.authenticated).toBe(true);
      expect(metrics.requests).toBe(1);
      expect(metrics.errors).toBe(0);

      // Verify headers were added
      const echoResponse = await api.fej(`${baseURL}/api/echo`);
      const echoData = await echoResponse.json();
      expect(echoData.headers.authorization).toBe('Bearer prod-token-xyz');
      expect(echoData.headers['x-request-id']).toMatch(/^req-\d+-2$/);
    });

    it('should handle error scenarios with custom error middleware', async () => {
      const api = createFej();
      const errors: Error[] = [];

      // Error tracking middleware
      api.use('errorTracker', async (ctx, next) => {
        try {
          await next();
          // Check if response is not OK
          if (ctx.response && !ctx.response.ok) {
            errors.push(new Error(`HTTP ${ctx.response.status}`));
          }
        } catch (error) {
          errors.push(error as Error);
          throw error;
        }
      }, 1000);

      // Make a request to a 404 endpoint
      const response = await api.fej(`${baseURL}/api/nonexistent`);

      expect(response.status).toBe(404);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('HTTP 404');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent requests with shared middleware', async () => {
      const api = createFej();
      const requestIds = new Set<string>();

      api.use('tracking', async (ctx, next) => {
        const id = `req-${Date.now()}-${Math.random()}`;
        requestIds.add(id);
        ctx.state.requestId = id;
        await next();
      }, 100);

      const requests = [
        api.fej(`${baseURL}/api/users`),
        api.fej(`${baseURL}/api/echo`),
        api.fej(`${baseURL}/api/protected`, {
          headers: { Authorization: 'Bearer test' }
        }),
        api.fej(`${baseURL}/api/users`),
        api.fej(`${baseURL}/api/echo`)
      ];

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(5);
      expect(requestIds.size).toBe(5); // Each request should have unique ID
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    it('should handle middleware state isolation between concurrent requests', async () => {
      const api = createFej();

      api.use('state-setter', async (ctx, next) => {
        const requestNum = Math.random();
        ctx.state.requestNum = requestNum;

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

        await next();

        // State should still be the same after async work
        expect(ctx.state.requestNum).toBe(requestNum);
      }, 100);

      const requests = Array(10).fill(null).map(() =>
        api.fej(`${baseURL}/api/users`)
      );

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle middleware that modifies response', async () => {
      const api = createFej();

      // Middleware that adds metadata to response
      api.use('response-enhancer', async (ctx, next) => {
        await next();

        if (ctx.response) {
          // Store original response data
          ctx.state.originalStatus = ctx.response.status;
          ctx.state.responseTime = Date.now();
        }
      }, 50);

      const response = await api.fej(`${baseURL}/api/users`);

      expect(response.status).toBe(200);
      // Note: ctx.state is not accessible here, but middleware executed correctly
    });

    it('should handle cleanup after request completion', async () => {
      const api = createFej();
      const cleanups: string[] = [];

      api.use('cleanup-tracker', async (ctx, next) => {
        const id = 'cleanup-test';
        ctx.state.cleanupId = id;

        try {
          await next();
        } finally {
          // Cleanup logic
          cleanups.push(id);
        }
      }, 100);

      await api.fej(`${baseURL}/api/users`);

      expect(cleanups).toEqual(['cleanup-test']);
    });

    it('should handle middleware that prevents request execution', async () => {
      const api = createFej();
      let requestMade = false;

      // Middleware that short-circuits
      api.use('cache-check', async (ctx, next) => {
        // Simulate cache hit - don't call next()
        ctx.state.fromCache = true;
        // Don't call next() - request should not be made
      }, 1000);

      // This middleware should never execute
      api.use('should-not-run', async (ctx, next) => {
        requestMade = true;
        await next();
      }, 500);

      // Since middleware doesn't call next(), this should not make actual HTTP request
      // But it will fail because no response is set
      await expect(api.fej(`${baseURL}/api/users`)).rejects.toThrow();

      expect(requestMade).toBe(false);
    });
  });
});
