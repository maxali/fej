import { expectTypeOf } from 'expect-type';
import { describe, it } from 'vitest';
import type { IFejMiddleware, IFejAsyncMiddleware } from '../src/index';
import { fej, addMiddleware, addAsyncMiddleware } from '../src/index';

describe('Type Tests', () => {
  describe('Middleware Types', () => {
    it('IFejMiddleware should accept RequestInit and return RequestInit', () => {
      const middleware: IFejMiddleware = (init) => {
        expectTypeOf(init).toEqualTypeOf<RequestInit>();
        return init;
      };

      expectTypeOf(middleware).toBeFunction();
      expectTypeOf(middleware).parameters.toEqualTypeOf<[RequestInit]>();
      expectTypeOf(middleware).returns.toEqualTypeOf<RequestInit>();
    });

    it('IFejAsyncMiddleware should accept RequestInit and return Promise<RequestInit>', () => {
      const middleware: IFejAsyncMiddleware = async (init) => {
        expectTypeOf(init).toEqualTypeOf<RequestInit>();
        return init;
      };

      expectTypeOf(middleware).toBeFunction();
      expectTypeOf(middleware).parameters.toEqualTypeOf<[RequestInit]>();
      expectTypeOf(middleware).returns.toEqualTypeOf<Promise<RequestInit>>();
    });

    it('IFejMiddleware should work with headers manipulation', () => {
      const middleware: IFejMiddleware = (init) => {
        return {
          ...init,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      };

      const result = middleware({});
      expectTypeOf(result).toEqualTypeOf<RequestInit>();
      expectTypeOf(result.headers).toMatchTypeOf<HeadersInit | undefined>();
    });

    it('IFejAsyncMiddleware should work with async operations', async () => {
      const middleware: IFejAsyncMiddleware = async (init) => {
        const token = await Promise.resolve('token123');
        return {
          ...init,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      };

      const result = await middleware({});
      expectTypeOf(result).toEqualTypeOf<RequestInit>();
    });
  });

  describe('Function Signatures', () => {
    it('fej should accept RequestInfo and optional RequestInit', () => {
      expectTypeOf(fej).toBeFunction();
      expectTypeOf(fej).parameters.toEqualTypeOf<[RequestInfo, RequestInit?]>();
      expectTypeOf(fej).returns.toEqualTypeOf<Promise<Response>>();
    });

    it('fej should work with string URL', () => {
      // Type-only test - don't execute
      type TestType = typeof fej;
      expectTypeOf<TestType>().toBeCallableWith('https://api.example.com');
      expectTypeOf<TestType>().returns.toEqualTypeOf<Promise<Response>>();
    });

    it('fej should work with Request object', () => {
      // Type-only test - don't execute
      const request = new Request('https://api.example.com');
      type TestType = typeof fej;
      expectTypeOf<TestType>().toBeCallableWith(request);
      expectTypeOf<TestType>().returns.toEqualTypeOf<Promise<Response>>();
    });

    it('fej should work with URL object', () => {
      // Type-only test - don't execute
      const url = new URL('https://api.example.com');
      type TestType = typeof fej;
      expectTypeOf<TestType>().toBeCallableWith(url);
      expectTypeOf<TestType>().returns.toEqualTypeOf<Promise<Response>>();
    });

    it('fej should accept RequestInit options', () => {
      // Type-only test - don't execute
      type TestType = typeof fej;
      expectTypeOf<TestType>().toBeCallableWith('https://api.example.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      expectTypeOf<TestType>().returns.toEqualTypeOf<Promise<Response>>();
    });

    it('addMiddleware should accept IFejMiddleware', () => {
      expectTypeOf(addMiddleware).toBeFunction();
      expectTypeOf(addMiddleware).parameters.toEqualTypeOf<[IFejMiddleware]>();
      expectTypeOf(addMiddleware).returns.toEqualTypeOf<void>();
    });

    it('addAsyncMiddleware should accept IFejAsyncMiddleware', () => {
      expectTypeOf(addAsyncMiddleware).toBeFunction();
      expectTypeOf(addAsyncMiddleware).parameters.toEqualTypeOf<[IFejAsyncMiddleware]>();
      expectTypeOf(addAsyncMiddleware).returns.toEqualTypeOf<void>();
    });
  });

  describe('RequestInit Compatibility', () => {
    it('should accept all standard RequestInit properties', () => {
      const middleware: IFejMiddleware = (init) => {
        // All standard properties should be accessible
        expectTypeOf(init.method).toMatchTypeOf<string | undefined>();
        expectTypeOf(init.headers).toMatchTypeOf<HeadersInit | undefined>();
        expectTypeOf(init.body).toMatchTypeOf<BodyInit | null | undefined>();
        expectTypeOf(init.mode).toMatchTypeOf<RequestMode | undefined>();
        expectTypeOf(init.credentials).toMatchTypeOf<RequestCredentials | undefined>();
        expectTypeOf(init.cache).toMatchTypeOf<RequestCache | undefined>();
        expectTypeOf(init.redirect).toMatchTypeOf<RequestRedirect | undefined>();
        expectTypeOf(init.referrer).toMatchTypeOf<string | undefined>();
        expectTypeOf(init.referrerPolicy).toMatchTypeOf<ReferrerPolicy | undefined>();
        expectTypeOf(init.integrity).toMatchTypeOf<string | undefined>();
        expectTypeOf(init.keepalive).toMatchTypeOf<boolean | undefined>();
        expectTypeOf(init.signal).toMatchTypeOf<AbortSignal | null | undefined>();

        return init;
      };

      expectTypeOf(middleware).toBeCallableWith({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'test',
      });
    });

    it('should work with Headers object', () => {
      const middleware: IFejMiddleware = (init) => {
        const headers = new Headers();
        headers.set('Authorization', 'Bearer token');
        return {
          ...init,
          headers,
        };
      };

      const result = middleware({});
      expectTypeOf(result).toEqualTypeOf<RequestInit>();
    });

    it('should work with AbortSignal', () => {
      const middleware: IFejMiddleware = (init) => {
        const controller = new AbortController();
        return {
          ...init,
          signal: controller.signal,
        };
      };

      const result = middleware({});
      expectTypeOf(result).toEqualTypeOf<RequestInit>();
    });
  });

  describe('Type Inference', () => {
    it('should infer return types correctly', () => {
      const syncMiddleware = (init: RequestInit): RequestInit => init;
      expectTypeOf(syncMiddleware).toMatchTypeOf<IFejMiddleware>();

      const asyncMiddleware = async (init: RequestInit): Promise<RequestInit> => init;
      expectTypeOf(asyncMiddleware).toMatchTypeOf<IFejAsyncMiddleware>();
    });

    it('should allow middleware to modify specific properties', () => {
      const addAuthHeader: IFejMiddleware = (init) => ({
        ...init,
        headers: {
          ...(init.headers as Record<string, string>),
          Authorization: 'Bearer token',
        },
      });

      expectTypeOf(addAuthHeader).toBeCallableWith({ method: 'GET' });
      expectTypeOf(addAuthHeader).returns.toEqualTypeOf<RequestInit>();
    });

    it('should allow async middleware with external API calls', async () => {
      const fetchToken = async (): Promise<string> => 'token123';

      const addAuthHeader: IFejAsyncMiddleware = async (init) => {
        const token = await fetchToken();
        return {
          ...init,
          headers: {
            ...(init.headers as Record<string, string>),
            Authorization: `Bearer ${token}`,
          },
        };
      };

      expectTypeOf(addAuthHeader).toBeCallableWith({ method: 'GET' });
      expectTypeOf(addAuthHeader).returns.toEqualTypeOf<Promise<RequestInit>>();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty RequestInit', () => {
      const middleware: IFejMiddleware = (init) => init;
      expectTypeOf(middleware).toBeCallableWith({});
    });

    it('should handle partial RequestInit', () => {
      const middleware: IFejMiddleware = (init) => ({
        ...init,
        method: 'POST',
      });

      expectTypeOf(middleware).toBeCallableWith({ headers: { 'X-Custom': 'value' } });
    });

    it('should preserve type safety with nested objects', () => {
      const middleware: IFejMiddleware = (init) => {
        const headers: Record<string, string> = {};
        if (init.headers) {
          Object.assign(headers, init.headers);
        }
        headers['X-Added'] = 'value';

        return {
          ...init,
          headers,
        };
      };

      expectTypeOf(middleware).toBeCallableWith({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Error Cases', () => {
    it('should not accept incorrect middleware signature', () => {
      // @ts-expect-error - wrong parameter type
      const invalidMiddleware1: IFejMiddleware = (init: string) => ({});

      // @ts-expect-error - wrong return type
      const invalidMiddleware2: IFejMiddleware = (init: RequestInit) => 'string';

      // @ts-expect-error - async middleware cannot be sync type
      const invalidMiddleware3: IFejMiddleware = async (init: RequestInit) => init;

      // Suppress unused variable warnings
      void invalidMiddleware1;
      void invalidMiddleware2;
      void invalidMiddleware3;
    });

    it('should not accept non-Promise return for async middleware', () => {
      // @ts-expect-error - must return Promise
      const invalidAsyncMiddleware: IFejAsyncMiddleware = (init: RequestInit) => init;

      void invalidAsyncMiddleware;
    });
  });
});
