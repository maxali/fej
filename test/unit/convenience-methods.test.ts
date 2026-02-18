/**
 * Unit tests for convenience methods (.get, .post, .put, .patch, .delete)
 * Tests the typed FejResponse API, auto-serialization, error handling, and middleware integration
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFetch } from '../utils/test-helpers';
import { createFej } from '../../src/index';
import { FejHttpError } from '../../src/errors.js';
import type { Fej } from '../../src/fej.js';

describe('Convenience Methods', () => {
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
  // GET tests
  // ============================================================

  describe('.get()', () => {
    it('should return FejResponse with parsed JSON data', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ id: 1, name: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const result = await api.get('https://api.example.com/users/1');

      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.ok).toBe(true);
      expect(result.headers).toBeInstanceOf(Headers);
      expect(result.raw).toBeInstanceOf(Response);
      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('GET');
    });

    it('should parse typed response with .get<T>()', async () => {
      interface User {
        id: number;
        name: string;
      }

      const { mock } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ id: 42, name: 'Alice' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const { data } = await api.get<User>('https://api.example.com/users/42');

      expect(data.id).toBe(42);
      expect(data.name).toBe('Alice');
    });

    it('should pass headers through', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      await api.get('https://api.example.com/users', {
        headers: { Authorization: 'Bearer token123', 'X-Custom': 'value' },
      });

      expect(calls).toHaveLength(1);
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer token123');
      expect(headers.get('X-Custom')).toBe('value');
    });

    it('should append query string from params', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify([]),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      await api.get('https://api.example.com/users', {
        params: { page: 1, limit: 10, active: true },
      });

      expect(calls).toHaveLength(1);
      const url = calls[0].input as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
      expect(url).toContain('active=true');
    });

    it('should throw FejHttpError on 404', async () => {
      const { mock } = createMockFetch({
        status: 404,
        statusText: 'Not Found',
        body: JSON.stringify({ error: 'not found' }),
      });
      globalThis.fetch = mock;

      try {
        await api.get('https://api.example.com/users/999');
        expect.fail('Expected FejHttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejHttpError);
        const httpError = error as FejHttpError;
        expect(httpError.status).toBe(404);
        expect(httpError.statusText).toBe('Not Found');
        expect(httpError.data).toEqual({ error: 'not found' });
      }
    });

    it('should throw FejHttpError on 500', async () => {
      const { mock } = createMockFetch({
        status: 500,
        statusText: 'Internal Server Error',
        body: JSON.stringify({ error: 'server error' }),
      });
      globalThis.fetch = mock;

      try {
        await api.get('https://api.example.com/users');
        expect.fail('Expected FejHttpError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FejHttpError);
        const httpError = error as FejHttpError;
        expect(httpError.status).toBe(500);
        expect(httpError.statusText).toBe('Internal Server Error');
        expect(httpError.data).toEqual({ error: 'server error' });
      }
    });

    it('should not throw on 4xx/5xx when throwHttpErrors is false', async () => {
      const apiNoThrow = createFej({ throwHttpErrors: false });

      const { mock } = createMockFetch({
        status: 404,
        statusText: 'Not Found',
        body: JSON.stringify({ error: 'not found' }),
      });
      globalThis.fetch = mock;

      const result = await apiNoThrow.get('https://api.example.com/users/999');

      expect(result.status).toBe(404);
      expect(result.ok).toBe(false);
      expect(result.data).toEqual({ error: 'not found' });
    });

    it('should run through middleware pipeline', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      api.use('add-header', async (ctx, next) => {
        ctx.request.init.headers = new Headers(ctx.request.init.headers);
        ctx.request.init.headers.set('X-From-Middleware', 'yes');
        await next();
      });

      await api.get('https://api.example.com/users/1');

      expect(calls).toHaveLength(1);
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.get('X-From-Middleware')).toBe('yes');
    });
  });

  // ============================================================
  // POST tests
  // ============================================================

  describe('.post()', () => {
    it('should auto-stringify object body and set Content-Type', async () => {
      const { mock, calls } = createMockFetch({
        status: 201,
        statusText: 'Created',
        body: JSON.stringify({ id: 1, name: 'Test' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const result = await api.post('https://api.example.com/users', {
        name: 'Test',
        email: 'test@example.com',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('POST');
      expect(calls[0].init?.body).toBe(
        JSON.stringify({ name: 'Test', email: 'test@example.com' })
      );
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(result.status).toBe(201);
    });

    it('should pass FormData body through without auto-stringify', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const formData = new FormData();
      formData.append('file', 'content');

      await api.post('https://api.example.com/upload', formData);

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBe(formData);
      // Content-Type should NOT be set (browser sets it with boundary for FormData)
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.has('Content-Type')).toBe(false);
    });

    it('should pass string body without modification', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const rawBody = '<xml>data</xml>';
      await api.post('https://api.example.com/xml-endpoint', rawBody);

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBe(rawBody);
    });

    it('should return typed FejResponse', async () => {
      interface CreateResponse {
        id: number;
        created: boolean;
      }

      const { mock } = createMockFetch({
        status: 201,
        statusText: 'Created',
        body: JSON.stringify({ id: 5, created: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const { data, status } = await api.post<CreateResponse>(
        'https://api.example.com/items',
        { name: 'New Item' }
      );

      expect(data.id).toBe(5);
      expect(data.created).toBe(true);
      expect(status).toBe(201);
    });
  });

  // ============================================================
  // PUT tests
  // ============================================================

  describe('.put()', () => {
    it('should send PUT method with body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ id: 1, name: 'Updated' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      await api.put('https://api.example.com/users/1', {
        name: 'Updated',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('PUT');
      expect(calls[0].init?.body).toBe(JSON.stringify({ name: 'Updated' }));
    });

    it('should auto-stringify object body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const body = { title: 'Hello', content: 'World' };
      await api.put('https://api.example.com/posts/1', body);

      expect(calls[0].init?.body).toBe(JSON.stringify(body));
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  // ============================================================
  // PATCH tests
  // ============================================================

  describe('.patch()', () => {
    it('should send PATCH method with body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ id: 1, name: 'Patched' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      await api.patch('https://api.example.com/users/1', {
        name: 'Patched',
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('PATCH');
      expect(calls[0].init?.body).toBe(JSON.stringify({ name: 'Patched' }));
    });
  });

  // ============================================================
  // DELETE tests
  // ============================================================

  describe('.delete()', () => {
    it('should send DELETE method', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: '{}',
      });
      globalThis.fetch = mock;

      await api.delete('https://api.example.com/users/1');

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.method).toBe('DELETE');
    });

    it('should return parsed response', async () => {
      const { mock } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ deleted: true, id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      const result = await api.delete<{ deleted: boolean; id: number }>(
        'https://api.example.com/users/1'
      );

      expect(result.data).toEqual({ deleted: true, id: 1 });
      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
    });
  });

  // ============================================================
  // Middleware integration
  // ============================================================

  describe('Middleware integration', () => {
    it('should run convenience methods through middleware', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;

      api.use('auth', async (ctx, next) => {
        ctx.request.init.headers = new Headers(ctx.request.init.headers);
        ctx.request.init.headers.set('Authorization', 'Bearer my-token');
        await next();
      });

      await api.get('https://api.example.com/protected');

      expect(calls).toHaveLength(1);
      const headers = new Headers(calls[0].init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer my-token');
    });
  });

  // ============================================================
  // responseType option tests
  // ============================================================

  describe('responseType option', () => {
    it('should return text when responseType is "text"', async () => {
      const { mock } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: 'plain text response',
        headers: { 'content-type': 'text/plain' },
      });
      globalThis.fetch = mock;

      const result = await api.get<string>('https://api.example.com/text', {
        responseType: 'text',
      });

      expect(result.data).toBe('plain text response');
      expect(result.status).toBe(200);
    });

    it('should use default responseType from config', async () => {
      const textApi = createFej({ responseType: 'text' });

      const { mock } = createMockFetch({
        status: 200,
        statusText: 'OK',
        body: 'default text response',
        headers: { 'content-type': 'text/plain' },
      });
      globalThis.fetch = mock;

      const result = await textApi.get<string>('https://api.example.com/text');

      expect(result.data).toBe('default text response');
    });
  });
});
