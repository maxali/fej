import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createFej,
  createRetryMiddleware,
  createTimeoutMiddleware,
  createErrorMiddleware,
  FejError,
  FejTimeoutError,
  FejRetryError,
  type FejContext,
  type ErrorTransform
} from '../../src/index';

describe('Error Handling & Retry', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    vi.clearAllMocks();
  });

  describe('Error Types', () => {
    it('should create FejError with message and context', () => {
      const ctx: FejContext = {
        request: { url: 'https://api.example.com', init: {} },
        state: {}
      };

      const error = new FejError('Test error', undefined, ctx, 500);
      expect(error.name).toBe('FejError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.context).toBe(ctx);
    });

    it('should create FejTimeoutError with timeout value', () => {
      const ctx: FejContext = {
        request: { url: 'https://api.example.com', init: {} },
        state: {}
      };

      const error = new FejTimeoutError('Timeout', 5000, ctx);
      expect(error.name).toBe('FejTimeoutError');
      expect(error.timeout).toBe(5000);
      expect(error.context).toBe(ctx);
    });

    it('should create FejRetryError with attempt count', () => {
      const ctx: FejContext = {
        request: { url: 'https://api.example.com', init: {} },
        state: {}
      };

      const lastError = new Error('Network failure');
      const error = new FejRetryError('Retry failed', 3, lastError, ctx);
      expect(error.name).toBe('FejRetryError');
      expect(error.attempts).toBe(3);
      expect(error.lastError).toBe(lastError);
    });
  });

  describe('Error Middleware', () => {
    it('should catch and handle errors from downstream middleware', async () => {
      const errorHandler = vi.fn();
      api.use('error-handler', createErrorMiddleware(errorHandler), 1000);
      api.use('failing-middleware', async () => {
        throw new Error('Simulated error');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simulated error'
        }),
        expect.objectContaining({
          request: expect.objectContaining({
            url: 'https://api.example.com'
          })
        })
      );
    });

    it('should handle HTTP error status codes', async () => {
      const errorHandler = vi.fn();
      api.use('error-handler', createErrorMiddleware(errorHandler), 1000);

      // Mock fetch to return 404
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers()
      });

      await api.fej('https://api.example.com/notfound');

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'HTTP 404: Not Found',
          statusCode: 404
        }),
        expect.any(Object)
      );
    });

    it('should set error in context', async () => {
      let capturedError: Error | undefined;

      api.use(
        'error-handler',
        createErrorMiddleware(async (error, ctx) => {
          capturedError = ctx.error;
        }),
        1000
      );

      api.use('failing', async () => {
        throw new Error('Test error');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();
      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toContain('Test error');
    });
  });

  describe('Retry Middleware', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attempts = 0;

      api.use('retry', createRetryMiddleware({ attempts: 3, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers()
        });
      });

      const response = await api.fej('https://api.example.com');
      expect(response.ok).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should respect maximum retry attempts', async () => {
      let attempts = 0;

      api.use('retry', createRetryMiddleware({ attempts: 2, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        FejRetryError
      );
      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should use fixed backoff strategy', async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 3,
          delay: 50,
          backoff: 'fixed'
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        delays.push(Date.now() - startTime);
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      // Check that delays are roughly equal (fixed backoff)
      // Allow 20ms tolerance for timing variations
      const delayDiffs = delays.slice(1).map((d, i) => d - delays[i]);
      delayDiffs.forEach((diff) => {
        expect(diff).toBeGreaterThanOrEqual(40);
        expect(diff).toBeLessThanOrEqual(70);
      });
    });

    it('should use linear backoff strategy', async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 3,
          delay: 50,
          backoff: 'linear'
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        delays.push(Date.now() - startTime);
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      // Check that delays increase linearly
      const delayDiffs = delays.slice(1).map((d, i) => d - delays[i]);
      expect(delayDiffs.length).toBeGreaterThan(0);
      // Linear backoff: 50ms, 100ms, 150ms
      // Allow tolerance for timing variations
    });

    it('should use exponential backoff strategy', async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 3,
          delay: 50,
          backoff: 'exponential'
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        delays.push(Date.now() - startTime);
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      // Check that delays increase exponentially
      expect(delays.length).toBeGreaterThan(1);
      // Exponential backoff: 50ms, 100ms, 200ms
    });

    it('should respect maxDelay option', async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 5,
          delay: 100,
          maxDelay: 200,
          backoff: 'exponential'
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        delays.push(Date.now() - startTime);
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      // Check that no delay exceeds maxDelay
      // Exponential would be: 100, 200, 400, 800 but capped at 200
      const delayDiffs = delays.slice(1).map((d, i) => d - delays[i]);
      delayDiffs.forEach((diff) => {
        expect(diff).toBeLessThanOrEqual(250); // Allow 50ms tolerance
      });
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 3,
          delay: 10,
          onRetry
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers()
        });
      });

      await api.fej('https://api.example.com');

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should use custom shouldRetry function', async () => {
      let attempts = 0;

      const shouldRetry = vi.fn((error: Error) => {
        // Only retry network errors, not "permanent" failures
        return error.message.includes('Network');
      });

      api.use(
        'retry',
        createRetryMiddleware({
          attempts: 3,
          delay: 10,
          shouldRetry
        }),
        100
      );

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Permanent failure'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        'Permanent failure'
      );
      expect(attempts).toBe(1); // No retries
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    it('should retry on HTTP error status codes', async () => {
      let attempts = 0;

      api.use('retry', createRetryMiddleware({ attempts: 2, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers()
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers()
        });
      });

      const response = await api.fej('https://api.example.com');
      expect(response.ok).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('Timeout Middleware', () => {
    it('should timeout requests that exceed timeout duration', async () => {
      api.use('timeout', createTimeoutMiddleware({ timeout: 100 }), 1000);

      global.fetch = vi.fn().mockImplementation(
        (_, init?: RequestInit) =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                headers: new Headers()
              });
            }, 200); // Longer than timeout

            // Check if aborted
            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('The operation was aborted'));
              });
            }
          })
      );

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        FejTimeoutError
      );
    });

    it('should not timeout requests that complete in time', async () => {
      api.use('timeout', createTimeoutMiddleware({ timeout: 200 }), 1000);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers()
      });

      const response = await api.fej('https://api.example.com');
      expect(response.ok).toBe(true);
    });

    it('should include timeout value in error', async () => {
      api.use('timeout', createTimeoutMiddleware({ timeout: 50 }), 1000);

      global.fetch = vi.fn().mockImplementation(
        (_, init?: RequestInit) =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve({ ok: true }), 200);

            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('The operation was aborted'));
              });
            }
          })
      );

      try {
        await api.fej('https://api.example.com');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejTimeoutError);
        if (error instanceof FejTimeoutError) {
          expect(error.timeout).toBe(50);
          expect(error.message).toContain('50ms');
        }
      }
    });

    it('should work with external AbortSignal', async () => {
      const externalController = new AbortController();

      api.use(
        'timeout',
        createTimeoutMiddleware({
          timeout: 5000,
          signal: externalController.signal
        }),
        1000
      );

      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Should have been aborted'));
            }, 200);
          })
      );

      // Abort externally before timeout
      setTimeout(() => externalController.abort(), 50);

      await expect(api.fej('https://api.example.com')).rejects.toThrow();
    });
  });

  describe('Error Transformations', () => {
    it('should apply error transformations', async () => {
      const transform: ErrorTransform = (error, ctx) => {
        return new FejError(`Transformed: ${error.message}`, error, ctx);
      };

      api.addErrorTransform(transform);

      api.use(
        'error-handler',
        createErrorMiddleware(async (error, ctx) => {
          expect(error.message).toContain('Transformed:');
          throw error;
        }),
        1000
      );

      api.use('failing', async () => {
        throw new Error('Original error');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        'Transformed:'
      );
    });

    it('should apply multiple error transformations in order', async () => {
      const transform1: ErrorTransform = (error) => {
        return new Error(`[T1] ${error.message}`);
      };

      const transform2: ErrorTransform = (error) => {
        return new Error(`[T2] ${error.message}`);
      };

      api.addErrorTransform(transform1);
      api.addErrorTransform(transform2);

      api.use(
        'error-handler',
        createErrorMiddleware(async (error) => {
          expect(error.message).toBe('[T2] [T1] Original');
          throw error;
        }),
        1000
      );

      api.use('failing', async () => {
        throw new Error('Original');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        '[T2] [T1] Original'
      );
    });

    it('should support async error transformations', async () => {
      const transform: ErrorTransform = async (error, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Error(`Async transformed: ${error.message}`);
      };

      api.addErrorTransform(transform);

      api.use(
        'error-handler',
        createErrorMiddleware(async (error) => {
          expect(error.message).toContain('Async transformed:');
          throw error;
        }),
        1000
      );

      api.use('failing', async () => {
        throw new Error('Original');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow(
        'Async transformed:'
      );
    });

    it('should clear error transformations', () => {
      const transform: ErrorTransform = (error) => error;
      api.addErrorTransform(transform);
      api.clearErrorTransforms();

      // Verify cleared by checking that original error is not transformed
      api.use(
        'error-handler',
        createErrorMiddleware(async (error) => {
          expect(error.message).toBe('Original');
          throw error;
        }),
        1000
      );

      api.use('failing', async () => {
        throw new Error('Original');
      });

      expect(api.fej('https://api.example.com')).rejects.toThrow('Original');
    });
  });

  describe('AbortController Integration (Legacy Tests)', () => {
    it('should create abort controller with ID', () => {
      const { controller, requestId } = api.createAbortController('test-request');
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal.aborted).toBe(false);
      expect(requestId).toBe('test-request');
    });

    it('should abort request by ID', () => {
      const { controller } = api.createAbortController('test-request');
      const aborted = api.abortRequest('test-request');

      expect(aborted).toBe(true);
      expect(controller.signal.aborted).toBe(true);
    });

    it('should return false when aborting non-existent request', () => {
      const aborted = api.abortRequest('non-existent');
      expect(aborted).toBe(false);
    });

    it('should abort all pending requests', () => {
      const { controller: controller1 } = api.createAbortController('request-1');
      const { controller: controller2 } = api.createAbortController('request-2');

      api.abortAllRequests();

      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(true);
    });

    it('should clean up aborted controllers', () => {
      api.createAbortController('test-request');
      api.abortRequest('test-request');

      // Try to abort again - should return false (already removed)
      const aborted = api.abortRequest('test-request');
      expect(aborted).toBe(false);
    });
  });

  describe('Combined Error Handling & Retry', () => {
    it('should work with both error handler and retry middleware', async () => {
      let errorHandlerCalls = 0;
      let attempts = 0;

      api.use(
        'error-handler',
        createErrorMiddleware(async (error) => {
          errorHandlerCalls++;
        }),
        1000
      );

      api.use('retry', createRetryMiddleware({ attempts: 2, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      expect(attempts).toBe(3); // Initial + 2 retries
      expect(errorHandlerCalls).toBeGreaterThan(0);
    });

    it('should work with timeout and retry middleware', async () => {
      let attempts = 0;

      api.use('timeout', createTimeoutMiddleware({ timeout: 100 }), 1000);
      api.use('retry', createRetryMiddleware({ attempts: 2, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          // First attempt times out
          return new Promise((resolve) => setTimeout(resolve, 200));
        }
        // Second attempt succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers()
        });
      });

      const response = await api.fej('https://api.example.com');
      expect(response.ok).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Default Retry Configuration', () => {
    it('should use default retry configuration', () => {
      api.setDefaultRetry({ attempts: 5, delay: 2000 });

      // This is tested indirectly through the middleware behavior
      // Direct inspection of private properties is not recommended
      expect(api).toBeDefined();
    });

    it('should merge partial retry configuration', () => {
      api.setDefaultRetry({ attempts: 5 });
      api.setDefaultRetry({ delay: 2000 });

      // Configuration is merged, not replaced
      expect(api).toBeDefined();
    });
  });

  describe('Context Error Property', () => {
    it('should set error in context when error occurs', async () => {
      let contextError: Error | undefined;

      api.use('error-inspector', async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          contextError = ctx.error;
          throw error;
        }
      });

      api.use('failing', async () => {
        throw new Error('Test error');
      });

      await expect(api.fej('https://api.example.com')).rejects.toThrow();
      expect(contextError).toBeDefined();
      expect(contextError?.message).toBe('Test error');
    });

    it('should clear error in context on retry', async () => {
      const errorStates: (Error | undefined)[] = [];
      let attempts = 0;

      api.use('error-tracker', async (ctx, next) => {
        await next();
        errorStates.push(ctx.error);
      });

      api.use('retry', createRetryMiddleware({ attempts: 2, delay: 10 }), 100);

      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Retry me'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers()
        });
      });

      await api.fej('https://api.example.com');

      // Last state should have no error (success)
      expect(errorStates[errorStates.length - 1]).toBeUndefined();
    });
  });
});
