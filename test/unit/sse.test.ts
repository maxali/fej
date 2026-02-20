/**
 * Unit tests for the .sse() method on the Fej class
 * Tests SSE streaming, event parsing, error handling, middleware integration,
 * abort/cancellation, and edge cases.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFej } from '../../src/index.js';
import { FejSSEError, FejHttpError } from '../../src/errors.js';
import { createMockSSEFetch, createMultiResponseMockSSEFetch } from '../utils/test-helpers.js';
import type { Fej } from '../../src/fej.js';
import type { SSEEvent } from '../../src/types.js';

describe('.sse()', () => {
  let originalFetch: typeof globalThis.fetch;
  let api: Fej;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    api = createFej();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  // ============================================================
  // 1. Basic event delivery
  // ============================================================

  it('should yield parsed SSE events via for-await', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: hello\n\n');
      stream.push('data: world\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('hello');
    expect(events[1].data).toBe('world');
  });

  // ============================================================
  // 2. SSE-specific headers
  // ============================================================

  it('should set Accept: text/event-stream and Cache-Control: no-store headers', async () => {
    const { mock, calls, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(calls).toHaveLength(1);
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('Accept')).toBe('text/event-stream');
    expect(headers.get('Cache-Control')).toBe('no-store');
  });

  // ============================================================
  // 3. Default event type is "message"
  // ============================================================

  it('should default event type to "message" when no event: field', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: hello\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('message');
  });

  // ============================================================
  // 4. Named events (custom event: field)
  // ============================================================

  it('should handle named events with custom event: field', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('event: custom-event\ndata: payload\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('custom-event');
    expect(events[0].data).toBe('payload');
  });

  // ============================================================
  // 5. POST with JSON body (LLM pattern)
  // ============================================================

  it('should support POST with JSON body', async () => {
    const { mock, calls, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    const body = { model: 'gpt-4', stream: true, messages: [{ role: 'user', content: 'Hi' }] };

    setTimeout(() => {
      stream.push('data: chunk\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/chat/completions', {
      method: 'POST',
      body,
      reconnect: false,
    })) {
      events.push(event);
    }

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe('POST');
    expect(calls[0].init?.body).toBe(JSON.stringify(body));
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  // ============================================================
  // 6. Auto-JSON parsing with generics
  // ============================================================

  it('should auto-parse JSON data when using generics', async () => {
    interface ChatChunk {
      id: string;
      choices: Array<{ delta: { content: string } }>;
    }

    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    const jsonPayload: ChatChunk = {
      id: 'chatcmpl-1',
      choices: [{ delta: { content: 'Hello' } }],
    };

    setTimeout(() => {
      stream.push(`data: ${JSON.stringify(jsonPayload)}\n\n`);
      stream.close();
    }, 10);

    const events: SSEEvent<ChatChunk>[] = [];
    for await (const event of api.sse<ChatChunk>('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual(jsonPayload);
    expect(events[0].data.id).toBe('chatcmpl-1');
    expect(events[0].data.choices[0].delta.content).toBe('Hello');
  });

  // ============================================================
  // 7. JSON parse failure returns raw string
  // ============================================================

  it('should return raw string when JSON parse fails', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: this is not json\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('this is not json');
  });

  // ============================================================
  // 8. Terminator matching ([DONE] consumed, not yielded)
  // ============================================================

  it('should consume [DONE] terminator without yielding it', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: first\n\n');
      stream.push('data: second\n\n');
      stream.push('data: [DONE]\n\n');
      // Do NOT close -- the terminator should end the generator
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('first');
    expect(events[1].data).toBe('second');
  });

  // ============================================================
  // 9. Custom terminators option
  // ============================================================

  it('should support custom terminators', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: event1\n\n');
      stream.push('data: END\n\n');
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', {
      terminators: ['END'],
      reconnect: false,
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('event1');
  });

  // ============================================================
  // 10. onOpen callback receives Response
  // ============================================================

  it('should call onOpen callback with the Response', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    const onOpen = vi.fn();

    setTimeout(() => {
      stream.push('data: hi\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { onOpen, reconnect: false })) {
      events.push(event);
    }

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(expect.any(Response));
  });

  // ============================================================
  // 11. Middleware integration
  // ============================================================

  it('should run middleware on SSE requests', async () => {
    const { mock, calls, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    api.use('auth', async (ctx, next) => {
      ctx.request.init.headers = new Headers(ctx.request.init.headers);
      ctx.request.init.headers.set('Authorization', 'Bearer test-token');
      await next();
    });

    setTimeout(() => {
      stream.push('data: hello\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(calls).toHaveLength(1);
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  // ============================================================
  // 12. AbortSignal cancellation
  // ============================================================

  it('should stop yielding events when AbortSignal is triggered', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    const controller = new AbortController();

    // Push one event, then abort after a short delay
    setTimeout(() => {
      stream.push('data: event1\n\n');
    }, 10);

    setTimeout(() => {
      controller.abort();
      // Also close the stream to ensure the reader finishes
      try { stream.close(); } catch { /* ignore if already closed */ }
    }, 50);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', {
      signal: controller.signal,
      reconnect: false,
    })) {
      events.push(event);
    }

    // Should have received the first event before abort
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].data).toBe('event1');
  }, 10000);

  // ============================================================
  // 13. HTTP 204 = clean close
  // ============================================================

  it('should cleanly close on HTTP 204 without yielding events or errors', async () => {
    // Response constructor does not allow a body with 204 status, so use a custom mock
    const mockFetch = async (_input: RequestInfo, _init?: RequestInit): Promise<Response> => {
      return new Response(null, {
        status: 204,
        statusText: 'No Content',
      });
    };
    globalThis.fetch = mockFetch as typeof fetch;

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
  });

  // ============================================================
  // 14. Content-Type validation
  // ============================================================

  it('should throw FejSSEError when Content-Type is not text/event-stream', async () => {
    const mockFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      return new Response('not sse', {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
    };
    globalThis.fetch = mockFetch as typeof fetch;

    await expect(async () => {
      for await (const _event of api.sse('/stream', { reconnect: false })) {
        // Should not reach here
      }
    }).rejects.toThrow(FejSSEError);
  });

  // ============================================================
  // 15. HTTP errors: 4xx/5xx throw FejHttpError
  // ============================================================

  describe('HTTP error handling', () => {
    it('should throw FejHttpError on 401', async () => {
      const mockFetch = async (): Promise<Response> => {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        });
      };
      globalThis.fetch = mockFetch as typeof fetch;

      try {
        for await (const _event of api.sse('/stream', { reconnect: false })) {
          // Should not reach here
        }
        expect.fail('Expected FejHttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejHttpError);
        const httpError = error as FejHttpError;
        expect(httpError.status).toBe(401);
      }
    });

    it('should throw FejHttpError on 404', async () => {
      const mockFetch = async (): Promise<Response> => {
        return new Response(JSON.stringify({ error: 'not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        });
      };
      globalThis.fetch = mockFetch as typeof fetch;

      try {
        for await (const _event of api.sse('/stream', { reconnect: false })) {
          // Should not reach here
        }
        expect.fail('Expected FejHttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejHttpError);
        const httpError = error as FejHttpError;
        expect(httpError.status).toBe(404);
      }
    });

    it('should throw FejHttpError on 500 when reconnect is disabled', async () => {
      const mockFetch = async (): Promise<Response> => {
        return new Response(JSON.stringify({ error: 'server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        });
      };
      globalThis.fetch = mockFetch as typeof fetch;

      try {
        for await (const _event of api.sse('/stream', { reconnect: false })) {
          // Should not reach here
        }
        expect.fail('Expected FejHttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejHttpError);
        const httpError = error as FejHttpError;
        expect(httpError.status).toBe(500);
      }
    });
  });

  // ============================================================
  // 16. Query params via params option
  // ============================================================

  it('should append query params from the params option', async () => {
    const { mock, calls, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', {
      params: { topic: 'news', limit: 10 },
      reconnect: false,
    })) {
      events.push(event);
    }

    expect(calls).toHaveLength(1);
    const url = calls[0].input as string;
    expect(url).toContain('topic=news');
    expect(url).toContain('limit=10');
  });

  // ============================================================
  // 17. Empty terminators array disables terminator matching
  // ============================================================

  it('should yield [DONE] as data when terminators array is empty', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: first\n\n');
      stream.push('data: [DONE]\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', {
      terminators: [],
      reconnect: false,
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('first');
    expect(events[1].data).toBe('[DONE]');
  });

  // ============================================================
  // 18. Multiple events in a single stream — ordered correctly
  // ============================================================

  it('should yield multiple events in correct order', async () => {
    const { mock, stream } = createMockSSEFetch();
    globalThis.fetch = mock;

    setTimeout(() => {
      stream.push('data: alpha\n\ndata: bravo\n\ndata: charlie\n\n');
      stream.close();
    }, 10);

    const events: SSEEvent[] = [];
    for await (const event of api.sse('/stream', { reconnect: false })) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].data).toBe('alpha');
    expect(events[1].data).toBe('bravo');
    expect(events[2].data).toBe('charlie');
  });
});
