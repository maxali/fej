import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockFetch } from '../utils/test-helpers';
import { createFej } from '../../src/index';

describe('Auto JSON - Request body and response parsing', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Request body auto-JSON', () => {
    it('should JSON.stringify an object body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/users', { name: 'John' });

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBe('{"name":"John"}');
    });

    it('should JSON.stringify an array body', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/items', [1, 2, 3]);

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBe('[1,2,3]');
    });

    it('should auto-set Content-Type to application/json for object bodies', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/users', { name: 'John' });

      expect(calls).toHaveLength(1);
      const headers = calls[0].init?.headers as Headers;
      expect(headers.get('content-type')).toBe('application/json');
    });

    it('should not overwrite a custom Content-Type header', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/users', { name: 'John' }, {
        headers: { 'Content-Type': 'application/xml' },
      });

      expect(calls).toHaveLength(1);
      const headers = calls[0].init?.headers as Headers;
      expect(headers.get('content-type')).toBe('application/xml');
    });

    it('should pass through a string body without auto Content-Type', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: 'ok',
        headers: { 'content-type': 'text/plain' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/data', 'raw text');

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBe('raw text');
      // No auto Content-Type header should be set for string bodies
      const headers = calls[0].init?.headers;
      if (headers instanceof Headers) {
        expect(headers.has('content-type')).toBe(false);
      } else {
        // headers may be undefined or a plain object without content-type
        expect(headers).toBeUndefined();
      }
    });

    it('should pass through FormData without stringifying', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      const formData = new FormData();
      formData.append('file', 'content');

      await api.post('https://api.example.com/upload', formData);

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBeInstanceOf(FormData);
    });

    it('should not include a body when none is provided', async () => {
      const { mock, calls } = createMockFetch({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      await api.post('https://api.example.com/ping');

      expect(calls).toHaveLength(1);
      expect(calls[0].init?.body).toBeUndefined();
    });
  });

  describe('Response parsing', () => {
    it('should parse a JSON response by default', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1, name: 'John' }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      const result = await api.get('https://api.example.com/users/1');

      expect(result.data).toEqual({ id: 1, name: 'John' });
    });

    it('should return raw text when responseType is text', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: 'Hello, world!',
        headers: { 'content-type': 'text/plain' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      const result = await api.get('https://api.example.com/greeting', {
        responseType: 'text',
      });

      expect(result.data).toBe('Hello, world!');
    });

    it('should fall back to text when JSON parsing fails', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: 'not valid json',
        headers: { 'content-type': 'text/plain' },
      });
      globalThis.fetch = mock;
      const api = createFej();

      const result = await api.get('https://api.example.com/data');

      expect(result.data).toBe('not valid json');
    });

    it('should return null for an empty response body', async () => {
      // Note: createMockFetch defaults body to '{}' when falsy, so use a
      // raw mock to test truly empty body
      globalThis.fetch = async () =>
        new Response('', { status: 200, headers: { 'content-type': 'application/json' } });
      const api = createFej();

      const result = await api.get('https://api.example.com/empty');

      expect(result.data).toBeNull();
    });

    it('should use config-level responseType as default', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej({ responseType: 'text' });

      const result = await api.get('https://api.example.com/data');

      // With responseType 'text', the raw JSON string is returned
      expect(result.data).toBe('{"id":1}');
    });

    it('should allow per-request responseType to override config', async () => {
      const { mock } = createMockFetch({
        status: 200,
        body: JSON.stringify({ id: 1 }),
        headers: { 'content-type': 'application/json' },
      });
      globalThis.fetch = mock;
      const api = createFej({ responseType: 'json' });

      const result = await api.get('https://api.example.com/data', {
        responseType: 'text',
      });

      // Per-request 'text' overrides config-level 'json'
      expect(result.data).toBe('{"id":1}');
    });
  });
});
