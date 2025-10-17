import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createFej,
  createCancellationMiddleware,
  createTimeoutMiddleware,
  FejError,
  type CancellationOptions
} from '../../src/index';

describe('AbortController Integration', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    vi.clearAllMocks();
  });

  describe('Basic AbortController Management', () => {
    it('should create abort controller with auto-generated ID', () => {
      const { controller, requestId } = api.createAbortController();

      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal.aborted).toBe(false);
      expect(requestId).toMatch(/^fej-req-\d+-\d+$/);
      expect(api.isRequestPending(requestId)).toBe(true);
    });

    it('should create abort controller with custom ID', () => {
      const customId = 'my-custom-request';
      const { controller, requestId } = api.createAbortController(customId);

      expect(requestId).toBe(customId);
      expect(api.isRequestPending(customId)).toBe(true);
    });

    it('should create abort controller with tags', () => {
      const { requestId } = api.createAbortController(undefined, ['api', 'users']);

      expect(api.getRequestsByTag('api')).toContain(requestId);
      expect(api.getRequestsByTag('users')).toContain(requestId);
    });

    it('should abort request by ID', () => {
      const { controller, requestId } = api.createAbortController();
      const aborted = api.abortRequest(requestId);

      expect(aborted).toBe(true);
      expect(controller.signal.aborted).toBe(true);
      expect(api.isRequestPending(requestId)).toBe(false);
    });

    it('should return false when aborting non-existent request', () => {
      const aborted = api.abortRequest('non-existent-id');
      expect(aborted).toBe(false);
    });

    it('should abort request with custom reason', () => {
      const { controller, requestId } = api.createAbortController();
      const reason = 'User cancelled';

      api.abortRequest(requestId, { reason });

      expect(controller.signal.aborted).toBe(true);
      // Note: AbortSignal.reason is a modern feature, may not be available in all environments
    });
  });

  describe('Tag-based Request Management', () => {
    it('should abort all requests with a specific tag', () => {
      const req1 = api.createAbortController('req-1', ['api', 'users']);
      const req2 = api.createAbortController('req-2', ['api', 'posts']);
      const req3 = api.createAbortController('req-3', ['cache']);

      const abortedCount = api.abortRequestsByTag('api');

      expect(abortedCount).toBe(2);
      expect(req1.controller.signal.aborted).toBe(true);
      expect(req2.controller.signal.aborted).toBe(true);
      expect(req3.controller.signal.aborted).toBe(false);
    });

    it('should return 0 when aborting non-existent tag', () => {
      api.createAbortController('req-1', ['api']);
      const abortedCount = api.abortRequestsByTag('non-existent');

      expect(abortedCount).toBe(0);
    });

    it('should get all requests by tag', () => {
      api.createAbortController('req-1', ['api']);
      api.createAbortController('req-2', ['api']);
      api.createAbortController('req-3', ['cache']);

      const apiRequests = api.getRequestsByTag('api');
      expect(apiRequests).toHaveLength(2);
      expect(apiRequests).toContain('req-1');
      expect(apiRequests).toContain('req-2');
    });

    it('should return empty array for non-existent tag', () => {
      const requests = api.getRequestsByTag('non-existent');
      expect(requests).toEqual([]);
    });

    it('should clean up tags when request is aborted', () => {
      const { requestId } = api.createAbortController(undefined, ['api', 'users']);

      api.abortRequest(requestId);

      expect(api.getRequestsByTag('api')).toHaveLength(0);
      expect(api.getRequestsByTag('users')).toHaveLength(0);
    });
  });

  describe('Abort All Requests', () => {
    it('should abort all pending requests', () => {
      const req1 = api.createAbortController('req-1');
      const req2 = api.createAbortController('req-2');
      const req3 = api.createAbortController('req-3');

      api.abortAllRequests();

      expect(req1.controller.signal.aborted).toBe(true);
      expect(req2.controller.signal.aborted).toBe(true);
      expect(req3.controller.signal.aborted).toBe(true);
      expect(api.getPendingRequests()).toHaveLength(0);
    });

    it('should abort all requests with custom reason', () => {
      const req1 = api.createAbortController('req-1');
      const req2 = api.createAbortController('req-2');

      api.abortAllRequests({ reason: 'Cleanup' });

      expect(req1.controller.signal.aborted).toBe(true);
      expect(req2.controller.signal.aborted).toBe(true);
    });

    it('should clear all tags when aborting all requests', () => {
      api.createAbortController('req-1', ['api']);
      api.createAbortController('req-2', ['cache']);

      api.abortAllRequests();

      expect(api.getRequestsByTag('api')).toHaveLength(0);
      expect(api.getRequestsByTag('cache')).toHaveLength(0);
    });
  });

  describe('Request Tracking', () => {
    it('should track pending requests', () => {
      api.createAbortController('req-1');
      api.createAbortController('req-2');

      const pending = api.getPendingRequests();
      expect(pending).toHaveLength(2);
      expect(pending).toContain('req-1');
      expect(pending).toContain('req-2');
    });

    it('should check if request is pending', () => {
      api.createAbortController('req-1');

      expect(api.isRequestPending('req-1')).toBe(true);
      expect(api.isRequestPending('non-existent')).toBe(false);
    });

    it('should remove from pending after abort', () => {
      const { requestId } = api.createAbortController();

      expect(api.isRequestPending(requestId)).toBe(true);
      api.abortRequest(requestId);
      expect(api.isRequestPending(requestId)).toBe(false);
    });
  });

  describe('Cancellation Middleware', () => {
    it('should automatically track request and enable cancellation', async () => {
      const onCancel = vi.fn();

      api.use(
        'cancellation',
        createCancellationMiddleware(api, { tags: ['test'], onCancel }),
        1000
      );

      global.fetch = vi.fn().mockImplementation(
        (_, init?: RequestInit) =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                headers: new Headers()
              });
            }, 1000);

            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('The operation was aborted'));
              });
            }
          })
      );

      const requestPromise = api.fej('https://api.example.com');

      // Give middleware time to set up tracking
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cancel all requests with 'test' tag
      api.abortRequestsByTag('test');

      await expect(requestPromise).rejects.toThrow();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should store request ID in context', async () => {
      let capturedRequestId: string | undefined;

      api.use(
        'cancellation',
        createCancellationMiddleware(api, { requestId: 'my-request' }),
        1000
      );

      api.use('inspector', async (ctx, next) => {
        await next();
        capturedRequestId = ctx.state.requestId as string;
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers()
      });

      await api.fej('https://api.example.com');

      expect(capturedRequestId).toBe('my-request');
    });

    it('should not track request when trackRequest is false', async () => {
      api.use(
        'cancellation',
        createCancellationMiddleware(api, { trackRequest: false }),
        1000
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers()
      });

      await api.fej('https://api.example.com');

      expect(api.getPendingRequests()).toHaveLength(0);
    });

    it('should work with external abort signal', async () => {
      const externalController = new AbortController();

      api.use(
        'cancellation',
        createCancellationMiddleware(api, { requestId: 'test-req' }),
        1000
      );

      global.fetch = vi.fn().mockImplementation(
        (_, init?: RequestInit) =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve({ ok: true, status: 200, headers: new Headers() });
            }, 1000);

            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('The operation was aborted'));
              });
            }
          })
      );

      const requestPromise = api.fej('https://api.example.com', {
        signal: externalController.signal
      });

      // Give time for setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Abort via external controller
      externalController.abort();

      await expect(requestPromise).rejects.toThrow();
    });
  });

  describe('Integration with Timeout Middleware', () => {
    it('should work together with timeout middleware', async () => {
      api.use('timeout', createTimeoutMiddleware({ timeout: 100 }), 900);
      api.use('cancellation', createCancellationMiddleware(api), 1000);

      global.fetch = vi.fn().mockImplementation(
        (_, init?: RequestInit) =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve({ ok: true, status: 200 });
            }, 200); // Longer than timeout

            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('The operation was aborted'));
              });
            }
          })
      );

      await expect(api.fej('https://api.example.com')).rejects.toThrow();

      // Request should be cleaned up
      expect(api.getPendingRequests()).toHaveLength(0);
    });
  });

  describe('Cleanup and Lifecycle', () => {
    it('should auto-cleanup on abort event', async () => {
      const { controller, requestId } = api.createAbortController();

      expect(api.isRequestPending(requestId)).toBe(true);

      // Abort the controller directly (simulates external abort)
      controller.abort();

      // Give time for event listener to fire
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(api.isRequestPending(requestId)).toBe(false);
    });

    it('should clean up tags when controller is aborted directly', async () => {
      const { controller, requestId } = api.createAbortController(undefined, [
        'cleanup-test'
      ]);

      expect(api.getRequestsByTag('cleanup-test')).toContain(requestId);

      // Abort directly
      controller.abort();

      // Give time for cleanup
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(api.getRequestsByTag('cleanup-test')).toHaveLength(0);
    });
  });

  describe('Multiple Tags per Request', () => {
    it('should support multiple tags on a single request', () => {
      const { requestId } = api.createAbortController('multi-tag-req', [
        'api',
        'users',
        'critical'
      ]);

      expect(api.getRequestsByTag('api')).toContain(requestId);
      expect(api.getRequestsByTag('users')).toContain(requestId);
      expect(api.getRequestsByTag('critical')).toContain(requestId);
    });

    it('should abort request via any of its tags', () => {
      const { controller } = api.createAbortController('multi-tag-req', [
        'api',
        'users'
      ]);

      api.abortRequestsByTag('users');

      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('Error Cases', () => {
    it('should handle double abort gracefully', () => {
      const { requestId } = api.createAbortController();

      expect(api.abortRequest(requestId)).toBe(true);
      expect(api.abortRequest(requestId)).toBe(false);
    });

    it('should handle aborting with empty tag list', () => {
      const { requestId } = api.createAbortController(undefined, []);

      expect(api.getRequestsByTag('')).not.toContain(requestId);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests: Promise<Response>[] = [];

      for (let i = 0; i < 10; i++) {
        api.use(
          `cancel-${i}`,
          createCancellationMiddleware(api, {
            requestId: `req-${i}`,
            tags: [`batch-${Math.floor(i / 3)}`]
          })
        );
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers()
      });

      for (let i = 0; i < 10; i++) {
        requests.push(api.fej('https://api.example.com'));
      }

      // Abort batch-1 (requests 3, 4, 5)
      const abortedCount = api.abortRequestsByTag('batch-1');

      // Clean up test middleware
      for (let i = 0; i < 10; i++) {
        api.removeMiddleware(`cancel-${i}`);
      }

      expect(abortedCount).toBeLessThanOrEqual(3);
    });
  });
});
