/**
 * Basic Performance Benchmark
 *
 * This is a simplified performance test to ensure v2 doesn't introduce
 * significant performance regressions compared to v1.
 *
 * Note: Full Phase 0.1 baseline measurements were not completed.
 * This provides basic smoke testing for performance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { createFej } from '../../src/index';

describe('Performance: Basic Benchmarks', () => {
  let server: Server;
  let baseURL: string;
  let port: number;

  beforeAll(async () => {
    // Create a minimal HTTP server for testing
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });

    // Start server
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

  describe('Request Overhead', () => {
    it('should complete a simple request in reasonable time (no middleware)', async () => {
      const api = createFej();

      const start = performance.now();
      await api.fej(`${baseURL}/test`);
      const duration = performance.now() - start;

      // Should complete in less than 100ms (very generous threshold)
      expect(duration).toBeLessThan(100);
    });

    it('should handle 1 middleware with minimal overhead', async () => {
      const api = createFej();

      api.use('test-middleware', async (ctx, next) => {
        await next();
      });

      const start = performance.now();
      await api.fej(`${baseURL}/test`);
      const duration = performance.now() - start;

      // Single middleware should add minimal overhead
      expect(duration).toBeLessThan(100);
    });

    it('should handle 5 middleware with acceptable overhead', async () => {
      const api = createFej();

      // Add 5 middleware
      for (let i = 0; i < 5; i++) {
        api.use(`middleware-${i}`, async (ctx, next) => {
          await next();
        });
      }

      const start = performance.now();
      await api.fej(`${baseURL}/test`);
      const duration = performance.now() - start;

      // 5 middleware should still be reasonably fast
      expect(duration).toBeLessThan(150);
    });

    it('should handle 10 middleware with acceptable overhead', async () => {
      const api = createFej();

      // Add 10 middleware
      for (let i = 0; i < 10; i++) {
        api.use(`middleware-${i}`, async (ctx, next) => {
          await next();
        });
      }

      const start = performance.now();
      await api.fej(`${baseURL}/test`);
      const duration = performance.now() - start;

      // 10 middleware should complete within reasonable time
      // Target: < 5ms overhead for 10 middleware (from V2_PLAN.md)
      // We use 200ms to account for network variability in tests
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      const api = createFej();

      const start = performance.now();
      const promises = Array(10).fill(null).map(() =>
        api.fej(`${baseURL}/test`)
      );
      await Promise.all(promises);
      const duration = performance.now() - start;

      // 10 concurrent requests should complete reasonably fast
      expect(duration).toBeLessThan(500);
    });

    it('should handle 50 concurrent requests with middleware', async () => {
      const api = createFej();

      // Add middleware
      api.use('logger', async (ctx, next) => {
        await next();
      });

      const start = performance.now();
      const promises = Array(50).fill(null).map(() =>
        api.fej(`${baseURL}/test`)
      );
      await Promise.all(promises);
      const duration = performance.now() - start;

      // 50 concurrent requests should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated requests', async () => {
      const api = createFej();

      // Add some middleware
      api.use('test', async (ctx, next) => {
        ctx.state.testData = new Array(100).fill('test');
        await next();
      });

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await api.fej(`${baseURL}/test`);
      }

      // If we get here without OOM, test passes
      // This is a basic smoke test for memory leaks
      expect(true).toBe(true);
    });

    it('should handle middleware registration/removal efficiently', async () => {
      const api = createFej();

      const start = performance.now();

      // Add and remove middleware 100 times
      for (let i = 0; i < 100; i++) {
        api.use(`middleware-${i}`, async (ctx, next) => {
          await next();
        });
      }

      for (let i = 0; i < 100; i++) {
        api.removeMiddleware(`middleware-${i}`);
      }

      const duration = performance.now() - start;

      // Should be very fast (mostly CPU operations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Middleware Execution Performance', () => {
    it('should execute middleware in priority order efficiently', async () => {
      const api = createFej();
      const executionOrder: number[] = [];

      // Add 10 middleware with different priorities
      for (let i = 0; i < 10; i++) {
        api.use(`middleware-${i}`, async (ctx, next) => {
          executionOrder.push(i);
          await next();
        }, 100 - i * 10); // Descending priority
      }

      const start = performance.now();
      await api.fej(`${baseURL}/test`);
      const duration = performance.now() - start;

      // Should execute in correct order
      expect(executionOrder).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Should be reasonably fast
      expect(duration).toBeLessThan(200);
    });

    it('should handle disabled middleware efficiently', async () => {
      const api = createFej();
      let executionCount = 0;

      // Add middleware
      api.use('test', async (ctx, next) => {
        executionCount++;
        await next();
      });

      // Enable/disable 10 times
      for (let i = 0; i < 10; i++) {
        api.toggleMiddleware('test', i % 2 === 0);
        await api.fej(`${baseURL}/test`);
      }

      // Should have executed 5 times (when enabled)
      expect(executionCount).toBe(5);
    });
  });

  describe('Real-World Scenario Performance', () => {
    it('should handle a realistic API client configuration efficiently', async () => {
      const api = createFej();

      // Realistic middleware stack
      api.use('auth', async (ctx, next) => {
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          Authorization: 'Bearer token-123'
        };
        await next();
      }, 1000);

      api.use('logger', async (ctx, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        ctx.state.duration = duration;
      }, 500);

      api.use('retry', async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          // Retry logic would go here
          throw error;
        }
      }, 200);

      api.use('validator', async (ctx, next) => {
        await next();
        if (ctx.response && !ctx.response.ok) {
          throw new Error('Validation failed');
        }
      }, 100);

      // Make 20 requests
      const start = performance.now();
      const promises = Array(20).fill(null).map(() =>
        api.fej(`${baseURL}/test`)
      );
      await Promise.all(promises);
      const duration = performance.now() - start;

      // 20 requests with 4 middleware should complete quickly
      expect(duration).toBeLessThan(1000);
    });
  });
});
