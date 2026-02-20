/**
 * Unit tests for SSE reconnection logic in the .sse() method.
 *
 * Tests cover: auto-reconnect, Last-Event-ID, server retry field,
 * maxRetries, reconnect:false, abort, non-retryable HTTP errors,
 * Content-Type mismatch, HTTP 204, 429 Retry-After, 5xx retry,
 * middleware re-run on reconnect, retry field validation, and
 * retry count reset on first successful event.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFej, FejHttpError, FejSSEError } from '../../src/index.js';
import { createMultiResponseMockSSEFetch } from '../utils/test-helpers.js';
import type { Fej } from '../../src/fej.js';

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('SSE Reconnection', () => {
  // ============================================================
  // 1. Auto-reconnect on stream drop
  // ============================================================
  it('auto-reconnects on stream drop (default reconnect: true)', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    const events: string[] = [];

    setTimeout(() => {
      streams[0].push('data: first\n\n');
      streams[0].close(); // triggers reconnection
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: second\n\n');
        streams[1].push('data: [DONE]\n\n'); // terminate
      }
    }, 100);

    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      events.push(event.data as string);
    }

    expect(events).toEqual(['first', 'second']);
    expect(calls.length).toBe(2);
  });

  // ============================================================
  // 2. Last-Event-ID header sent on reconnect
  // ============================================================
  it('sends Last-Event-ID header on reconnect when server sends id: field', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    setTimeout(() => {
      streams[0].push('id: evt-42\ndata: hello\n\n');
      streams[0].close();
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: [DONE]\n\n');
      }
    }, 100);

    for await (const _ of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      // consume
    }

    expect(calls.length).toBe(2);
    const secondCallHeaders = new Headers(calls[1].init?.headers);
    expect(secondCallHeaders.get('Last-Event-ID')).toBe('evt-42');
  });

  // ============================================================
  // 3. Empty id: suppresses Last-Event-ID header
  // ============================================================
  it('does not send Last-Event-ID when id is set to empty string', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    setTimeout(() => {
      // First set an id, then clear it with empty id:
      streams[0].push('id: evt-1\ndata: one\n\n');
      streams[0].push('id:\ndata: two\n\n');
      streams[0].close();
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: [DONE]\n\n');
      }
    }, 100);

    for await (const _ of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      // consume
    }

    expect(calls.length).toBe(2);
    const secondCallHeaders = new Headers(calls[1].init?.headers);
    expect(secondCallHeaders.has('Last-Event-ID')).toBe(false);
  });

  // ============================================================
  // 4. Server-sent retry: field updates reconnect delay
  // ============================================================
  it('server-sent retry: field updates reconnect delay', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    const start = Date.now();

    setTimeout(() => {
      // Server tells us to use 200ms retry delay
      streams[0].push('retry: 200\ndata: hello\n\n');
      streams[0].close();
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: [DONE]\n\n');
      }
    }, 350);

    for await (const _ of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 5000,
      jitter: false,
    })) {
      // consume
    }

    const elapsed = Date.now() - start;
    // The first event resets currentRetryDelay to the server's retry value (200ms).
    // Then after stream closes, reconnect delay should be ~200ms.
    // Total should be at least ~200ms (retry delay after first connection closes).
    expect(calls.length).toBe(2);
    expect(elapsed).toBeGreaterThanOrEqual(150); // Allow some timing slack
  });

  // ============================================================
  // 5. maxRetries limit stops reconnection
  // ============================================================
  it('stops reconnecting after maxRetries stream drops', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    // Close each stream immediately to trigger rapid reconnections
    const closeInterval = setInterval(() => {
      const lastStream = streams[streams.length - 1];
      if (lastStream) {
        try {
          lastStream.close();
        } catch {
          // ignore already-closed
        }
      }
    }, 15);

    const events: string[] = [];

    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 20,
      maxRetries: 2,
      jitter: false,
    })) {
      events.push(event.data as string);
    }

    clearInterval(closeInterval);

    // maxRetries: 2 means we get initial connection + 2 retries = 3 total calls
    expect(calls.length).toBe(3);
    expect(events).toEqual([]); // No events since streams were closed immediately
  });

  // ============================================================
  // 6. reconnect: false disables reconnection
  // ============================================================
  it('does not reconnect when reconnect: false', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    setTimeout(() => {
      streams[0].push('data: only\n\n');
      streams[0].close();
    }, 10);

    const events: string[] = [];

    for await (const event of api.sse('/stream', {
      reconnect: false,
      retryDelay: 10,
    })) {
      events.push(event.data as string);
    }

    expect(events).toEqual(['only']);
    expect(calls.length).toBe(1);
  });

  // ============================================================
  // 7. No reconnect after abort
  // ============================================================
  it('does not reconnect after AbortController aborts', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();
    const ac = new AbortController();

    setTimeout(() => {
      streams[0].push('data: before-abort\n\n');
    }, 10);

    setTimeout(() => {
      ac.abort();
      // Also error the stream so reader.read() unblocks
      try {
        streams[0].error(new Error('aborted'));
      } catch {
        // stream may already be errored/closed
      }
    }, 50);

    const events: string[] = [];

    for await (const event of api.sse('/stream', {
      signal: ac.signal,
      retryDelay: 10,
      maxRetryDelay: 50,
    })) {
      events.push(event.data as string);
    }

    expect(events).toEqual(['before-abort']);
    expect(calls.length).toBe(1);
  });

  // ============================================================
  // 8. No reconnect on 401/403/404
  // ============================================================
  describe('non-retryable HTTP errors throw immediately', () => {
    for (const statusCode of [401, 403, 404]) {
      it(`throws FejHttpError on ${statusCode} without retrying`, async () => {
        const { mock, calls, streams } = createMultiResponseMockSSEFetch({
          responseFactory: () => ({
            status: statusCode,
            statusText: statusCode === 401 ? 'Unauthorized' : statusCode === 403 ? 'Forbidden' : 'Not Found',
          }),
        });
        globalThis.fetch = mock;
        const api = createFej();

        // Close the error response stream so body can be read
        setTimeout(() => {
          if (streams[0]) streams[0].close();
        }, 5);

        await expect(async () => {
          for await (const _ of api.sse('/stream', {
            retryDelay: 10,
            maxRetryDelay: 50,
          })) {
            // should not yield
          }
        }).rejects.toThrow(FejHttpError);

        expect(calls.length).toBe(1);
      });
    }
  });

  // ============================================================
  // 9. No reconnect on Content-Type mismatch
  // ============================================================
  it('throws FejSSEError on Content-Type mismatch without retrying', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch({
      responseFactory: () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    globalThis.fetch = mock;
    const api = createFej();

    await expect(async () => {
      for await (const _ of api.sse('/stream', {
        retryDelay: 10,
        maxRetryDelay: 50,
      })) {
        // should not yield
      }
    }).rejects.toThrow(FejSSEError);

    expect(calls.length).toBe(1);
  });

  // ============================================================
  // 10. No reconnect on HTTP 204
  // ============================================================
  it('cleanly closes on HTTP 204 without reconnecting', async () => {
    // Cannot use createMultiResponseMockSSEFetch because Response constructor
    // rejects status 204 with a body (null body status). Build a custom mock.
    const calls: Array<{ input: RequestInfo; init?: RequestInit }> = [];
    const mock = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      calls.push({ input, init });
      return new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
      });
    };
    globalThis.fetch = mock as typeof fetch;
    const api = createFej();

    const events: string[] = [];

    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
    })) {
      events.push(event.data as string);
    }

    expect(events).toEqual([]);
    expect(calls.length).toBe(1);
  });

  // ============================================================
  // 11. 429 retry with Retry-After header respect
  // ============================================================
  it('retries on 429 and respects Retry-After header', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch({
      responseFactory: (callIndex) => {
        if (callIndex === 0) {
          return {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'Content-Type': 'text/event-stream',
              'Retry-After': '1', // 1 second
            },
          };
        }
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/event-stream' },
        };
      },
    });
    globalThis.fetch = mock;
    const api = createFej();

    // Close the 429 response body so safeReadBody doesn't block
    // (429 is retryable, but the body may be read for logging)
    setTimeout(() => {
      if (streams[0]) streams[0].close();
    }, 5);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: after-retry\n\n');
        streams[1].push('data: [DONE]\n\n');
      }
    }, 1200);

    const events: string[] = [];
    const start = Date.now();

    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 5000,
      jitter: false,
    })) {
      events.push(event.data as string);
    }

    const elapsed = Date.now() - start;

    expect(calls.length).toBe(2);
    expect(events).toEqual(['after-retry']);
    // Retry-After: 1 means ~1000ms delay
    expect(elapsed).toBeGreaterThanOrEqual(800);
  });

  // ============================================================
  // 12. 5xx errors trigger reconnect
  // ============================================================
  it('retries on 500 and succeeds on next attempt', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch({
      responseFactory: (callIndex) => {
        if (callIndex === 0) {
          return {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'Content-Type': 'text/event-stream' },
          };
        }
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/event-stream' },
        };
      },
    });
    globalThis.fetch = mock;
    const api = createFej();

    // Close the 500 response stream immediately so body can be read
    setTimeout(() => {
      if (streams[0]) streams[0].close();
    }, 5);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: recovered\n\n');
        streams[1].push('data: [DONE]\n\n');
      }
    }, 100);

    const events: string[] = [];

    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      events.push(event.data as string);
    }

    expect(calls.length).toBe(2);
    expect(events).toEqual(['recovered']);
  });

  // ============================================================
  // 13. Middleware re-runs on each reconnect
  // ============================================================
  it('middleware re-runs on each reconnect', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    let middlewareCount = 0;
    api.use('counter', async (ctx, next) => {
      middlewareCount++;
      await next();
    });

    setTimeout(() => {
      streams[0].push('data: first\n\n');
      streams[0].close();
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: second\n\n');
        streams[1].close();
      }
    }, 80);

    setTimeout(() => {
      if (streams[2]) {
        streams[2].push('data: [DONE]\n\n');
      }
    }, 150);

    for await (const _ of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      // consume
    }

    // 3 connections = middleware runs 3 times
    expect(middlewareCount).toBe(3);
    expect(calls.length).toBe(3);
  });

  // ============================================================
  // 14. Server-sent retry: with non-digits is ignored
  // ============================================================
  it('ignores retry: field with non-digit characters', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    const start = Date.now();

    setTimeout(() => {
      // Send invalid retry values — should be ignored
      streams[0].push('retry: abc\ndata: one\n\n');
      streams[0].push('retry: 10.5\ndata: two\n\n');
      streams[0].push('retry: 100ms\ndata: three\n\n');
      streams[0].close();
    }, 10);

    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: [DONE]\n\n');
      }
    }, 80);

    for await (const _ of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 50,
      jitter: false,
    })) {
      // consume
    }

    const elapsed = Date.now() - start;

    expect(calls.length).toBe(2);
    // The retry delay should remain at the initial 10ms (not changed by invalid retry fields)
    // So elapsed should be well under 200ms
    expect(elapsed).toBeLessThan(500);
  });

  // ============================================================
  // 15. Reset retry count on first successful event
  // ============================================================
  it('resets retry count on first successful event delivery', async () => {
    const { mock, calls, streams } = createMultiResponseMockSSEFetch();
    globalThis.fetch = mock;
    const api = createFej();

    // Connection 1: delivers an event then drops
    setTimeout(() => {
      streams[0].push('data: event1\n\n');
      streams[0].close();
    }, 10);

    // Connection 2: delivers an event then drops (retry count was reset)
    setTimeout(() => {
      if (streams[1]) {
        streams[1].push('data: event2\n\n');
        streams[1].close();
      }
    }, 80);

    // Connection 3: delivers an event then drops (retry count was reset again)
    setTimeout(() => {
      if (streams[2]) {
        streams[2].push('data: event3\n\n');
        streams[2].close();
      }
    }, 150);

    // Connection 4: terminate
    setTimeout(() => {
      if (streams[3]) {
        streams[3].push('data: [DONE]\n\n');
      }
    }, 220);

    const events: string[] = [];

    // maxRetries: 2 — but because retry count resets after each successful event
    // delivery, we should be able to reconnect more than 2 times total
    for await (const event of api.sse('/stream', {
      retryDelay: 10,
      maxRetryDelay: 20,
      maxRetries: 2,
      jitter: false,
    })) {
      events.push(event.data as string);
    }

    // Without retry reset, we'd only get 3 connections (1 initial + 2 retries).
    // With retry reset after each event, we can keep reconnecting.
    expect(events).toEqual(['event1', 'event2', 'event3']);
    expect(calls.length).toBe(4);
  });
});
