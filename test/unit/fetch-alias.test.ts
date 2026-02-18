import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFetch } from '../utils/test-helpers';
import { createFej } from '../../src/index';

describe('Fej.fetch() - drop-in replacement for globalThis.fetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('returns raw Response (not FejResponse)', () => {
    it('should return a standard Response object', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/data');

      expect(response).toBeInstanceOf(Response);
    });

    it('should have .json() method on the response', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/data');
      const data = await response.json();

      expect(data).toEqual({ ok: true });
    });

    it('should have .text() method on the response', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: 'hello world',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/data');
      const text = await response.text();

      expect(text).toBe('hello world');
    });

    it('should have .status property on the response', async () => {
      const { mock } = createMockFetch({
        status: 201,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/data');

      expect(response.status).toBe(201);
    });
  });

  describe('same signature as globalThis.fetch', () => {
    it('should accept url and RequestInit with method and body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      await api.fetch('https://example.com/data', {
        method: 'POST',
        body: '{"name":"test"}',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('POST');
      expect(calls[0].init?.body).toBe('{"name":"test"}');
    });

    it('should pass through all RequestInit options', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      await api.fetch('https://example.com/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('PUT');
      expect(calls[0].init?.credentials).toBe('include');
      expect(calls[0].init?.mode).toBe('cors');
      expect(calls[0].init?.cache).toBe('no-cache');
    });
  });

  describe('does NOT throw on 4xx/5xx (just like native fetch)', () => {
    it('should return the Response without throwing on 404', async () => {
      const { mock } = createMockFetch({
        status: 404,
        statusText: 'Not Found',
        body: '{"error": "not found"}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/missing');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(404);
      expect(response.ok).toBe(false);
    });

    it('should return the Response without throwing on 500', async () => {
      const { mock } = createMockFetch({
        status: 500,
        statusText: 'Internal Server Error',
        body: '{"error": "server error"}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch('https://example.com/error');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
    });
  });

  describe('runs through middleware pipeline', () => {
    it('should apply middleware that sets a header', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      api.use('test', async (ctx, next) => {
        ctx.request.init.headers = new Headers(ctx.request.init.headers);
        ctx.request.init.headers.set('X-Custom-Header', 'middleware-value');
        await next();
      });

      await api.fetch('https://example.com/data');

      expect(calls).toHaveLength(1);
      const requestHeaders = new Headers(calls[0].init?.headers);
      expect(requestHeaders.get('X-Custom-Header')).toBe('middleware-value');
    });
  });

  describe('works with URL object', () => {
    it('should accept a URL object as input', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: '{"ok": true}',
      });
      globalThis.fetch = mock;

      const api = createFej();
      const response = await api.fetch(new URL('https://example.com/path'));

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      // The URL object may be passed through as-is or coerced
      expect(String(calls[0].input)).toBe('https://example.com/path');
    });
  });
});
