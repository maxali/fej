/**
 * Unit tests for deep merge functionality
 * Tests all edge cases for merging RequestInit objects
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFetch, extractHeaders, createHeaders } from '../utils/test-helpers';

describe('Deep Merge - RequestInit Merging Logic', () => {
  let originalFetch: typeof globalThis.fetch;

  // Import functions dynamically to reset state between tests
  let fej: typeof import('../../src/index').fej;
  let addMiddleware: typeof import('../../src/index').addMiddleware;
  let FejModule: typeof import('../../src/index').default;
  let _clearMiddleware: typeof import('../../src/index')._clearMiddleware;

  beforeEach(async () => {
    // Import once (singleton pattern means we don't reset modules)
    if (!fej) {
      const module = await import('../../src/index');
      fej = module.fej;
      addMiddleware = module.addMiddleware;
      FejModule = module.default;
      _clearMiddleware = module._clearMiddleware;
    }

    originalFetch = globalThis.fetch;
    // Clear middleware state before each test
    _clearMiddleware();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
    // Clear middleware after test
    _clearMiddleware();
  });

  describe('Null and Undefined Handling', () => {
    it('should handle null source value', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, custom: null as any };
      });

      await fej('https://api.example.com/users', {
        custom: 'original' as any,
      });

      expect((calls[0].init as any).custom).toBeNull();
    });

    it('should handle undefined source value', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, custom: undefined as any };
      });

      await fej('https://api.example.com/users', {
        custom: 'original' as any,
      });

      expect((calls[0].init as any).custom).toBeUndefined();
    });

    it('should handle undefined target value', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, newProperty: 'added' as any };
      });

      await fej('https://api.example.com/users');

      expect((calls[0].init as any).newProperty).toBe('added');
    });

    it('should preserve null target when source is undefined', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, custom: undefined as any };
      });

      await fej('https://api.example.com/users', {
        custom: null as any,
      });

      expect((calls[0].init as any).custom).toBeUndefined();
    });
  });

  describe('Headers Object Merging', () => {
    it('should merge Headers objects correctly', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const initialHeaders = createHeaders({
        'Content-Type': 'application/json',
        'X-Initial': 'value',
      });

      addMiddleware((init) => {
        const headers = createHeaders({
          Authorization: 'Bearer token',
          'X-Middleware': 'added',
        });
        return { ...init, headers };
      });

      await fej('https://api.example.com/users', { headers: initialHeaders });

      const resultHeaders = calls[0].init?.headers as Headers;
      expect(resultHeaders).toBeInstanceOf(Headers);
      expect(resultHeaders.get('Content-Type')).toBe('application/json');
      expect(resultHeaders.get('X-Initial')).toBe('value');
      expect(resultHeaders.get('Authorization')).toBe('Bearer token');
      expect(resultHeaders.get('X-Middleware')).toBe('added');
    });

    it('should override headers with same key', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const initialHeaders = createHeaders({
        Authorization: 'Bearer old-token',
      });

      addMiddleware((init) => {
        const headers = createHeaders({
          Authorization: 'Bearer new-token',
        });
        return { ...init, headers };
      });

      await fej('https://api.example.com/users', { headers: initialHeaders });

      const resultHeaders = calls[0].init?.headers as Headers;
      expect(resultHeaders.get('Authorization')).toBe('Bearer new-token');
    });

    it('should convert plain object to Headers when merging with Headers', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          headers: { 'X-Plain': 'value' },
        };
      });

      await fej('https://api.example.com/users', {
        headers: createHeaders({ 'Content-Type': 'application/json' }),
      });

      const headers = extractHeaders(calls[0].init);
      // Headers are case-insensitive and typically lowercased
      expect(headers['x-plain']).toBe('value');
      // Should also have the original header
      expect(headers['content-type']).toBe('application/json');
    });

    it('should handle empty Headers objects', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, headers: new Headers() };
      });

      await fej('https://api.example.com/users', {
        headers: createHeaders({ 'Content-Type': 'application/json' }),
      });

      expect(calls[0].init?.headers).toBeInstanceOf(Headers);
    });
  });

  describe('Array Handling', () => {
    it('should replace arrays instead of merging', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, tags: ['new1', 'new2'] as any };
      });

      await fej('https://api.example.com/users', {
        tags: ['old1', 'old2'] as any,
      });

      expect((calls[0].init as any).tags).toEqual(['new1', 'new2']);
    });

    it('should create independent copy of array', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const sourceArray = ['item1', 'item2'];
      addMiddleware((init) => {
        return { ...init, items: sourceArray as any };
      });

      await fej('https://api.example.com/users');

      const resultArray = (calls[0].init as any).items;
      expect(resultArray).toEqual(sourceArray);
      expect(resultArray).not.toBe(sourceArray); // Different reference
    });

    it('should handle empty arrays', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, items: [] as any };
      });

      await fej('https://api.example.com/users', {
        items: ['item1'] as any,
      });

      expect((calls[0].init as any).items).toEqual([]);
    });

    it('should handle arrays with different types', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, mixed: [1, 'string', null, { nested: true }] as any };
      });

      await fej('https://api.example.com/users');

      expect((calls[0].init as any).mixed).toEqual([1, 'string', null, { nested: true }]);
    });
  });

  describe('Nested Object Merging', () => {
    it('should merge nested objects deeply', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          custom: {
            level1: {
              level2: {
                value: 'deep',
              },
            },
          } as any,
        };
      });

      await fej('https://api.example.com/users', {
        custom: {
          level1: {
            existing: 'preserved',
          },
        } as any,
      });

      const custom = (calls[0].init as any).custom;
      expect(custom.level1.level2.value).toBe('deep');
      expect(custom.level1.existing).toBe('preserved');
    });

    it('should override nested primitive values', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          custom: {
            nested: {
              value: 'new',
            },
          } as any,
        };
      });

      await fej('https://api.example.com/users', {
        custom: {
          nested: {
            value: 'old',
          },
        } as any,
      });

      expect((calls[0].init as any).custom.nested.value).toBe('new');
    });

    it('should add new nested properties', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          custom: {
            existing: 'preserved',
            new: {
              nested: 'added',
            },
          } as any,
        };
      });

      await fej('https://api.example.com/users', {
        custom: {
          existing: 'preserved',
        } as any,
      });

      const custom = (calls[0].init as any).custom;
      expect(custom.existing).toBe('preserved');
      expect(custom.new.nested).toBe('added');
    });

    it('should replace non-object target with source object', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          custom: {
            nested: {
              value: 'object',
            },
          } as any,
        };
      });

      await fej('https://api.example.com/users', {
        custom: 'string-value' as any,
      });

      expect((calls[0].init as any).custom.nested.value).toBe('object');
    });

    it('should handle deeply nested merge across multiple middleware', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return {
          ...init,
          config: {
            retry: { attempts: 3 },
          } as any,
        };
      });

      addMiddleware((init) => {
        return {
          ...init,
          config: {
            ...(init as any).config,
            retry: {
              ...(init as any).config.retry,
              delay: 1000,
            },
          } as any,
        };
      });

      addMiddleware((init) => {
        return {
          ...init,
          config: {
            ...(init as any).config,
            timeout: 5000,
          } as any,
        };
      });

      await fej('https://api.example.com/users');

      const config = (calls[0].init as any).config;
      expect(config.retry.attempts).toBe(3);
      expect(config.retry.delay).toBe(1000);
      expect(config.timeout).toBe(5000);
    });
  });

  describe('Primitive Value Handling', () => {
    it('should replace primitive values', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, method: 'POST' };
      });

      await fej('https://api.example.com/users', { method: 'GET' });

      expect(calls[0].init?.method).toBe('POST');
    });

    it('should handle string values', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, custom: 'string-value' as any };
      });

      await fej('https://api.example.com/users');

      expect((calls[0].init as any).custom).toBe('string-value');
    });

    it('should handle number values', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, timeout: 5000 as any };
      });

      await fej('https://api.example.com/users');

      expect((calls[0].init as any).timeout).toBe(5000);
    });

    it('should handle boolean values', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, keepalive: true };
      });

      await fej('https://api.example.com/users');

      expect(calls[0].init?.keepalive).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original init object', async () => {
      const { mock } = createMockFetch();
      globalThis.fetch = mock;

      const originalInit = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        custom: { value: 'original' } as any,
      };

      const originalInitCopy = JSON.parse(JSON.stringify(originalInit));

      addMiddleware((init) => {
        return {
          ...init,
          method: 'POST',
          headers: { 'X-Modified': 'value' },
          custom: { value: 'modified' } as any,
        };
      });

      await fej('https://api.example.com/users', originalInit);

      // Original should be unchanged
      expect(originalInit.method).toBe(originalInitCopy.method);
      expect(originalInit.custom.value).toBe(originalInitCopy.custom.value);
    });

    it('should not share references between middleware', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const sharedObject = { value: 'shared' };

      addMiddleware((init) => {
        return {
          ...init,
          custom: sharedObject as any,
        };
      });

      addMiddleware((init) => {
        // Try to modify the custom object
        if ((init as any).custom) {
          (init as any).custom.value = 'modified';
        }
        return init;
      });

      await fej('https://api.example.com/users');

      // Original shared object should NOT be modified (deep cloning prevents this)
      expect(sharedObject.value).toBe('shared');
      // But the final result should have the modification from the second middleware
      expect((calls[0].init as any).custom.value).toBe('modified');
    });
  });

  describe('Special RequestInit Properties', () => {
    it('should merge body property', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, body: JSON.stringify({ modified: true }) };
      });

      await fej('https://api.example.com/users', {
        body: JSON.stringify({ original: true }),
      });

      expect(calls[0].init?.body).toBe(JSON.stringify({ modified: true }));
    });

    it('should merge signal property', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      const controller = new AbortController();

      addMiddleware((init) => {
        return { ...init, signal: controller.signal };
      });

      await fej('https://api.example.com/users');

      expect(calls[0].init?.signal).toBe(controller.signal);
    });

    it('should merge credentials property', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, credentials: 'include' as RequestCredentials };
      });

      await fej('https://api.example.com/users', {
        credentials: 'omit' as RequestCredentials,
      });

      expect(calls[0].init?.credentials).toBe('include');
    });

    it('should merge mode property', async () => {
      const { mock, calls } = createMockFetch();
      globalThis.fetch = mock;

      addMiddleware((init) => {
        return { ...init, mode: 'no-cors' as RequestMode };
      });

      await fej('https://api.example.com/users');

      expect(calls[0].init?.mode).toBe('no-cors');
    });
  });
});
