/**
 * Browser compatibility tests
 * Tests that native browser APIs (fetch, Headers, AbortController) work correctly
 * NOT E2E tests - we're testing library behavior, not full application flows
 *
 * Target browsers: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('Browser API Compatibility', () => {
  describe('Fetch API Availability', () => {
    it('should have fetch available globally', () => {
      expect(typeof fetch).toBe('function');
      expect(fetch).toBeDefined();
    });

    it('should be able to create Request objects', () => {
      const request = new Request('https://api.example.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(request).toBeInstanceOf(Request);
      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://api.example.com/test');
    });

    it('should be able to create Response objects', () => {
      const response = new Response('{"test": true}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    it('should support Response.json() method', async () => {
      const response = new Response('{"test": true}', {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      expect(data).toEqual({ test: true });
    });

    it('should support Response.text() method', async () => {
      const response = new Response('plain text content');
      const text = await response.text();
      expect(text).toBe('plain text content');
    });
  });

  describe('Headers API', () => {
    it('should be able to create Headers objects', () => {
      const headers = new Headers();
      expect(headers).toBeInstanceOf(Headers);
    });

    it('should be able to set and get headers', () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', 'Bearer token123');

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token123');
    });

    it('should be able to initialize with object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-Custom')).toBe('value');
    });

    it('should be able to initialize with array of tuples', () => {
      const headers = new Headers([
        ['Content-Type', 'application/json'],
        ['X-Custom', 'value'],
      ]);

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-Custom')).toBe('value');
    });

    it('should be able to delete headers', () => {
      const headers = new Headers({ 'X-Test': 'value' });
      expect(headers.has('X-Test')).toBe(true);

      headers.delete('X-Test');
      expect(headers.has('X-Test')).toBe(false);
    });

    it('should be case-insensitive for header names', () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');

      expect(headers.get('content-type')).toBe('application/json');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('CONTENT-TYPE')).toBe('application/json');
    });

    it('should support forEach iteration', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      const entries: [string, string][] = [];
      headers.forEach((value, key) => {
        entries.push([key, value]);
      });

      expect(entries.length).toBe(2);
    });

    it('should support keys() iterator', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      const keys = Array.from(headers.keys());
      expect(keys).toContain('content-type');
      expect(keys).toContain('x-custom');
    });

    it('should support values() iterator', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      const values = Array.from(headers.values());
      expect(values).toContain('application/json');
      expect(values).toContain('value');
    });

    it('should support entries() iterator', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
      });

      const entries = Array.from(headers.entries());
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0]).toHaveLength(2);
    });
  });

  describe('AbortController API', () => {
    it('should be able to create AbortController', () => {
      const controller = new AbortController();
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal).toBeDefined();
    });

    it('should have signal property', () => {
      const controller = new AbortController();
      expect(controller.signal).toBeInstanceOf(AbortSignal);
    });

    it('should be able to abort signal', () => {
      const controller = new AbortController();
      expect(controller.signal.aborted).toBe(false);

      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });

    it('should support abort reason', () => {
      const controller = new AbortController();
      const reason = new Error('User cancelled');

      controller.abort(reason);
      expect(controller.signal.reason).toBe(reason);
    });

    it('should trigger abort event listener', () => {
      const controller = new AbortController();
      let aborted = false;

      controller.signal.addEventListener('abort', () => {
        aborted = true;
      });

      controller.abort();
      expect(aborted).toBe(true);
    });

    it('should support onabort property', () => {
      const controller = new AbortController();
      let aborted = false;

      controller.signal.onabort = () => {
        aborted = true;
      };

      controller.abort();
      expect(aborted).toBe(true);
    });
  });

  describe('URL and URLSearchParams', () => {
    it('should be able to create URL objects', () => {
      const url = new URL('https://api.example.com/path?param=value');
      expect(url).toBeInstanceOf(URL);
      expect(url.hostname).toBe('api.example.com');
      expect(url.pathname).toBe('/path');
    });

    it('should be able to parse search params', () => {
      const url = new URL('https://api.example.com/?foo=bar&baz=qux');
      expect(url.searchParams.get('foo')).toBe('bar');
      expect(url.searchParams.get('baz')).toBe('qux');
    });

    it('should be able to create URLSearchParams', () => {
      const params = new URLSearchParams('foo=bar&baz=qux');
      expect(params.get('foo')).toBe('bar');
      expect(params.get('baz')).toBe('qux');
    });

    it('should support URLSearchParams manipulation', () => {
      const params = new URLSearchParams();
      params.set('foo', 'bar');
      params.append('foo', 'baz');

      expect(params.getAll('foo')).toEqual(['bar', 'baz']);
    });
  });

  describe('Promise and Async/Await Support', () => {
    it('should support Promise.resolve', async () => {
      const result = await Promise.resolve('test');
      expect(result).toBe('test');
    });

    it('should support Promise.reject', async () => {
      await expect(Promise.reject(new Error('test error'))).rejects.toThrow('test error');
    });

    it('should support Promise.all', async () => {
      const results = await Promise.all([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
      ]);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should support Promise.race', async () => {
      const result = await Promise.race([
        new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
        Promise.resolve('fast'),
      ]);
      expect(result).toBe('fast');
    });

    it('should support async/await syntax', async () => {
      async function testAsync() {
        return 'async result';
      }

      const result = await testAsync();
      expect(result).toBe('async result');
    });
  });

  describe('Object and Array Methods', () => {
    it('should support Object.assign', () => {
      const target = { a: 1 };
      const source = { b: 2 };
      const result = Object.assign(target, source);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should support Object.keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const keys = Object.keys(obj);
      expect(keys).toEqual(['a', 'b', 'c']);
    });

    it('should support spread operator for objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should support spread operator for arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      const merged = [...arr1, ...arr2];
      expect(merged).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should support Array.forEach', () => {
      const arr = [1, 2, 3];
      const results: number[] = [];
      arr.forEach((item) => results.push(item * 2));
      expect(results).toEqual([2, 4, 6]);
    });

    it('should support Array.map', () => {
      const arr = [1, 2, 3];
      const doubled = arr.map((x) => x * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it('should support Array.filter', () => {
      const arr = [1, 2, 3, 4, 5];
      const evens = arr.filter((x) => x % 2 === 0);
      expect(evens).toEqual([2, 4]);
    });
  });

  describe('JSON Support', () => {
    it('should support JSON.stringify', () => {
      const obj = { test: 'value', nested: { prop: 123 } };
      const json = JSON.stringify(obj);
      expect(json).toBe('{"test":"value","nested":{"prop":123}}');
    });

    it('should support JSON.parse', () => {
      const json = '{"test":"value","nested":{"prop":123}}';
      const obj = JSON.parse(json);
      expect(obj).toEqual({ test: 'value', nested: { prop: 123 } });
    });

    it('should handle JSON errors', () => {
      expect(() => JSON.parse('invalid json')).toThrow();
    });
  });

  describe('Console API', () => {
    it('should have console.log available', () => {
      expect(typeof console.log).toBe('function');
    });

    it('should have console.warn available', () => {
      expect(typeof console.warn).toBe('function');
    });

    it('should have console.error available', () => {
      expect(typeof console.error).toBe('function');
    });
  });

  describe('TypeError and Error Handling', () => {
    it('should support Error constructor', () => {
      const error = new Error('test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('test error');
    });

    it('should support TypeError constructor', () => {
      const error = new TypeError('type error');
      expect(error).toBeInstanceOf(TypeError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('type error');
    });

    it('should support try/catch', () => {
      let caught = false;
      try {
        throw new Error('test');
      } catch (error) {
        caught = true;
      }
      expect(caught).toBe(true);
    });
  });
});
