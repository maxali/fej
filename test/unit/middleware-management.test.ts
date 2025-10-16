/**
 * Test suite for V2 Middleware Management
 * Tests named middleware, priority, removal, and Koa-style onion execution
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createFej, type FejContext, type FejMiddlewareFunction } from '../../src/index';

describe('Middleware Management - Named Middleware', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
  });

  it('should add named middleware', async () => {
    const id = api.use('test-middleware', async (ctx, next) => {
      await next();
    });

    expect(id).toBe('test-middleware:0');
    expect(api.hasMiddleware('test-middleware')).toBe(true);
  });

  it('should warn and replace duplicate middleware names', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    api.use('duplicate', async (ctx, next) => {
      ctx.state.value = 'first';
      await next();
    });

    api.use('duplicate', async (ctx, next) => {
      ctx.state.value = 'second';
      await next();
    });

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Middleware with name "duplicate" already exists')
    );

    consoleWarn.mockRestore();
  });

  it('should remove middleware by name', async () => {
    api.use('removable', async (ctx, next) => {
      await next();
    });

    expect(api.hasMiddleware('removable')).toBe(true);

    const removed = api.removeMiddleware('removable');
    expect(removed).toBe(true);
    expect(api.hasMiddleware('removable')).toBe(false);
  });

  it('should return false when removing non-existent middleware', async () => {
    const removed = api.removeMiddleware('non-existent');
    expect(removed).toBe(false);
  });

  it('should generate unique IDs for middleware with same name added sequentially', async () => {
    const id1 = api.use('test', async (ctx, next) => await next());
    const id2 = api.use('test', async (ctx, next) => await next()); // Replaces first

    expect(id1).toBe('test:0');
    expect(id2).toBe('test:1');
  });
});

describe('Middleware Management - Priority System', () => {
  let api: ReturnType<typeof createFej>;
  let executionOrder: string[];

  beforeEach(() => {
    api = createFej();
    executionOrder = [];
    // Mock fetch to prevent actual network requests
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute middleware in priority order (highest first)', async () => {
    api.use(
      'low',
      async (ctx, next) => {
        executionOrder.push('low-before');
        await next();
        executionOrder.push('low-after');
      },
      1
    );

    api.use(
      'high',
      async (ctx, next) => {
        executionOrder.push('high-before');
        await next();
        executionOrder.push('high-after');
      },
      100
    );

    api.use(
      'medium',
      async (ctx, next) => {
        executionOrder.push('medium-before');
        await next();
        executionOrder.push('medium-after');
      },
      50
    );

    await api.fej('https://example.com/test');

    // Onion model: high -> medium -> low -> fetch -> low -> medium -> high
    expect(executionOrder).toEqual([
      'high-before',
      'medium-before',
      'low-before',
      'low-after',
      'medium-after',
      'high-after'
    ]);
  });

  it('should handle same priority middleware in registration order', async () => {
    api.use(
      'first',
      async (ctx, next) => {
        executionOrder.push('first');
        await next();
      },
      10
    );

    api.use(
      'second',
      async (ctx, next) => {
        executionOrder.push('second');
        await next();
      },
      10
    );

    api.use(
      'third',
      async (ctx, next) => {
        executionOrder.push('third');
        await next();
      },
      10
    );

    await api.fej('https://example.com/test');

    expect(executionOrder).toEqual(['first', 'second', 'third']);
  });

  it('should allow negative priorities', async () => {
    api.use(
      'positive',
      async (ctx, next) => {
        executionOrder.push('positive');
        await next();
      },
      10
    );

    api.use(
      'negative',
      async (ctx, next) => {
        executionOrder.push('negative');
        await next();
      },
      -10
    );

    api.use(
      'zero',
      async (ctx, next) => {
        executionOrder.push('zero');
        await next();
      },
      0
    );

    await api.fej('https://example.com/test');

    expect(executionOrder).toEqual(['positive', 'zero', 'negative']);
  });
});

describe('Middleware Management - Onion Model Execution', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute middleware in onion pattern (downstream then upstream)', async () => {
    const phases: string[] = [];

    api.use('outer', async (ctx, next) => {
      phases.push('outer-start');
      await next();
      phases.push('outer-end');
    });

    api.use(
      'inner',
      async (ctx, next) => {
        phases.push('inner-start');
        await next();
        phases.push('inner-end');
      },
      -10
    ); // Lower priority = inner layer

    await api.fej('https://example.com/test');

    expect(phases).toEqual(['outer-start', 'inner-start', 'inner-end', 'outer-end']);
  });

  it('should allow middleware to modify request before fetch', async () => {
    api.use('auth', async (ctx, next) => {
      ctx.request.init.headers = {
        ...ctx.request.init.headers,
        Authorization: 'Bearer test-token'
      };
      await next();
    });

    await api.fej('https://example.com/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('should allow middleware to access response after fetch', async () => {
    let statusCode: number | undefined;

    api.use('response-logger', async (ctx, next) => {
      await next();
      if (ctx.response) {
        statusCode = ctx.response.status;
      }
    });

    await api.fej('https://example.com/test');

    expect(statusCode).toBe(200);
  });

  it('should support state sharing between middleware', async () => {
    api.use(
      'set-state',
      async (ctx, next) => {
        ctx.state.user = { id: 123, name: 'Test User' };
        ctx.state.timestamp = Date.now();
        await next();
      },
      100
    );

    api.use(
      'read-state',
      async (ctx, next) => {
        expect(ctx.state.user).toEqual({ id: 123, name: 'Test User' });
        expect(ctx.state.timestamp).toBeTypeOf('number');
        await next();
      },
      50
    );

    await api.fej('https://example.com/test');
  });

  it('should allow middleware to short-circuit by not calling next()', async () => {
    const postMiddleware = vi.fn();

    api.use(
      'short-circuit',
      async (ctx, next) => {
        // Don't call next() - stop the chain
        ctx.response = new Response(JSON.stringify({ cached: true }), {
          status: 200,
          headers: { 'X-Cache': 'HIT' }
        });
      },
      100
    );

    api.use(
      'after',
      async (ctx, next) => {
        postMiddleware();
        await next();
      },
      50
    );

    const response = await api.fej('https://example.com/test');

    // Middleware after short-circuit should not execute
    expect(postMiddleware).not.toHaveBeenCalled();

    // Fetch should not be called
    expect(global.fetch).not.toHaveBeenCalled();

    // Should return the short-circuit response
    const data = await response.json();
    expect(data).toEqual({ cached: true });
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });
});

describe('Middleware Management - Enable/Disable', () => {
  let api: ReturnType<typeof createFej>;
  let executionLog: string[];

  beforeEach(() => {
    api = createFej();
    executionLog = [];
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip disabled middleware', async () => {
    api.use('enabled', async (ctx, next) => {
      executionLog.push('enabled');
      await next();
    });

    api.use('disabled', async (ctx, next) => {
      executionLog.push('disabled');
      await next();
    });

    // Disable the second middleware
    api.toggleMiddleware('disabled', false);

    await api.fej('https://example.com/test');

    expect(executionLog).toEqual(['enabled']);
    expect(executionLog).not.toContain('disabled');
  });

  it('should re-enable disabled middleware', async () => {
    api.use('toggle', async (ctx, next) => {
      executionLog.push('toggle');
      await next();
    });

    // Disable
    api.toggleMiddleware('toggle', false);
    await api.fej('https://example.com/test');
    expect(executionLog).toEqual([]);

    // Re-enable
    api.toggleMiddleware('toggle', true);
    await api.fej('https://example.com/test');
    expect(executionLog).toEqual(['toggle']);
  });

  it('should return false when toggling non-existent middleware', async () => {
    const result = api.toggleMiddleware('non-existent', false);
    expect(result).toBe(false);
  });
});

describe('Middleware Management - Query Methods', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
  });

  it('should return list of middleware names', async () => {
    api.use('first', async (ctx, next) => await next());
    api.use('second', async (ctx, next) => await next());
    api.use('third', async (ctx, next) => await next());

    const names = api.getMiddlewareNames();
    expect(names).toEqual(['first', 'second', 'third']);
  });

  it('should check if middleware exists', async () => {
    api.use('exists', async (ctx, next) => await next());

    expect(api.hasMiddleware('exists')).toBe(true);
    expect(api.hasMiddleware('does-not-exist')).toBe(false);
  });

  it('should return middleware names in priority order', async () => {
    api.use('low', async (ctx, next) => await next(), 1);
    api.use('high', async (ctx, next) => await next(), 100);
    api.use('medium', async (ctx, next) => await next(), 50);

    const names = api.getMiddlewareNames();
    expect(names).toEqual(['high', 'medium', 'low']);
  });

  it('should return empty array when no middleware registered', async () => {
    const names = api.getMiddlewareNames();
    expect(names).toEqual([]);
  });
});

describe('Middleware Management - Error Handling', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should propagate errors from middleware', async () => {
    api.use('error-thrower', async (ctx, next) => {
      throw new Error('Middleware error');
    });

    await expect(api.fej('https://example.com/test')).rejects.toThrow('Middleware error');
  });

  it('should stop execution when middleware throws', async () => {
    const afterError = vi.fn();

    api.use(
      'throws',
      async (ctx, next) => {
        throw new Error('Stop here');
      },
      100
    );

    api.use(
      'after',
      async (ctx, next) => {
        afterError();
        await next();
      },
      50
    );

    await expect(api.fej('https://example.com/test')).rejects.toThrow('Stop here');
    expect(afterError).not.toHaveBeenCalled();
  });

  it('should allow middleware to catch and handle errors from downstream', async () => {
    let errorCaught = false;

    api.use(
      'error-boundary',
      async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          errorCaught = true;
          ctx.response = new Response(
            JSON.stringify({ error: 'Handled error' }),
            { status: 500 }
          );
        }
      },
      100
    );

    api.use(
      'throws',
      async (ctx, next) => {
        throw new Error('Downstream error');
      },
      50
    );

    const response = await api.fej('https://example.com/test');

    expect(errorCaught).toBe(true);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Handled error' });
  });
});

describe('Middleware Management - Backward Compatibility', () => {
  let api: ReturnType<typeof createFej>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    api = createFej();
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work with legacy addMiddleware alongside new use()', async () => {
    const executionOrder: string[] = [];

    // Legacy middleware
    api.addMiddleware((init) => {
      executionOrder.push('legacy-sync');
      return init;
    });

    // V2 middleware
    api.use('v2-middleware', async (ctx, next) => {
      executionOrder.push('v2');
      await next();
    });

    await api.fej('https://example.com/test');

    // Legacy middleware should execute before v2 middleware
    expect(executionOrder).toEqual(['legacy-sync', 'v2']);
  });

  it('should apply legacy async middleware before v2 middleware', async () => {
    const executionOrder: string[] = [];

    api.addAsyncMiddleware(async (init) => {
      executionOrder.push('legacy-async');
      return init;
    });

    api.use('v2', async (ctx, next) => {
      executionOrder.push('v2');
      await next();
    });

    await api.fej('https://example.com/test');

    expect(executionOrder).toEqual(['legacy-async', 'v2']);
  });

  it('should show deprecation warnings for legacy methods', async () => {
    api.addMiddleware((init) => init);
    api.addAsyncMiddleware(async (init) => init);

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('addMiddleware() is deprecated')
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('addAsyncMiddleware() is deprecated')
    );
  });
});

describe('Middleware Management - Edge Cases', () => {
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    api = createFej();
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle middleware that modifies URL', async () => {
    api.use('url-modifier', async (ctx, next) => {
      ctx.request.url = 'https://modified.com/api';
      await next();
    });

    await api.fej('https://original.com/api');

    expect(global.fetch).toHaveBeenCalledWith('https://modified.com/api', expect.any(Object));
  });

  it('should handle multiple middleware modifying the same header', async () => {
    api.use(
      'header-1',
      async (ctx, next) => {
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          'X-Test': 'first'
        };
        await next();
      },
      100
    );

    api.use(
      'header-2',
      async (ctx, next) => {
        ctx.request.init.headers = {
          ...ctx.request.init.headers,
          'X-Test': 'second'
        };
        await next();
      },
      50
    );

    await api.fej('https://example.com/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Test': 'second'
        })
      })
    );
  });

  it('should handle middleware with no next() call (short-circuit)', async () => {
    api.use('short-circuit', async (ctx, next) => {
      ctx.response = new Response('cached', { status: 200 });
      // No next() call
    });

    const response = await api.fej('https://example.com/test');
    const text = await response.text();

    expect(text).toBe('cached');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle empty middleware pipeline', async () => {
    await api.fej('https://example.com/test');

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/test', expect.any(Object));
  });

  it('should handle middleware that throws error after next()', async () => {
    api.use('throws-after', async (ctx, next) => {
      await next();
      throw new Error('Error after next()');
    });

    await expect(api.fej('https://example.com/test')).rejects.toThrow('Error after next()');
  });

  it('should handle concurrent requests with shared middleware', async () => {
    const requestIds: string[] = [];

    api.use('request-tracker', async (ctx, next) => {
      const id = Math.random().toString(36);
      ctx.state.requestId = id;
      requestIds.push(id);
      await next();
    });

    // Make 3 concurrent requests
    await Promise.all([
      api.fej('https://example.com/1'),
      api.fej('https://example.com/2'),
      api.fej('https://example.com/3')
    ]);

    // All 3 should have executed
    expect(requestIds).toHaveLength(3);
    // All should be unique
    expect(new Set(requestIds).size).toBe(3);
  });

  it('should handle middleware that replaces entire context', async () => {
    api.use('context-replacer', async (ctx, next) => {
      ctx.request.init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replaced: true })
      };
      await next();
    });

    await api.fej('https://example.com/test', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ replaced: true })
      })
    );
  });

  it('should handle very high and very low priorities', async () => {
    const order: string[] = [];

    api.use(
      'very-low',
      async (ctx, next) => {
        order.push('very-low');
        await next();
      },
      -1000
    );

    api.use(
      'very-high',
      async (ctx, next) => {
        order.push('very-high');
        await next();
      },
      1000
    );

    api.use(
      'zero',
      async (ctx, next) => {
        order.push('zero');
        await next();
      },
      0
    );

    await api.fej('https://example.com/test');

    expect(order).toEqual(['very-high', 'zero', 'very-low']);
  });

  it('should handle middleware with async state mutations', async () => {
    api.use(
      'async-state-1',
      async (ctx, next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        ctx.state.value1 = 'first';
        await next();
      },
      100
    );

    api.use(
      'async-state-2',
      async (ctx, next) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        ctx.state.value2 = 'second';
        expect(ctx.state.value1).toBe('first');
        await next();
      },
      50
    );

    await api.fej('https://example.com/test');
  });
});
