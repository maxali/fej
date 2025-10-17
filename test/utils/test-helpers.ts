/**
 * Test utilities and helpers for fej test suite
 */

/**
 * Mock fetch function that captures requests
 */
export interface MockFetchCall {
  input: RequestInfo;
  init?: RequestInit;
}

export interface MockFetchResponse {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  delay?: number;
}

/**
 * Creates a mock fetch function that records calls and returns configured responses
 */
export function createMockFetch(
  response: MockFetchResponse = {}
): {
  mock: typeof fetch;
  calls: MockFetchCall[];
  reset: () => void;
} {
  const calls: MockFetchCall[] = [];

  const mock = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    calls.push({ input, init });

    // Simulate network delay if specified
    if (response.delay) {
      await new Promise((resolve) => setTimeout(resolve, response.delay));
    }

    const responseHeaders = new Headers(response.headers || {});

    return new Response(response.body || '{}', {
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      headers: responseHeaders,
    });
  };

  const reset = () => {
    calls.length = 0;
  };

  return { mock: mock as typeof fetch, calls, reset };
}

/**
 * Creates a mock fetch that throws an error
 */
export function createErrorFetch(error: Error): typeof fetch {
  return async () => {
    throw error;
  };
}

/**
 * Creates a mock fetch that times out after specified duration
 */
export function createTimeoutFetch(delay: number): typeof fetch {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    throw new Error('Network timeout');
  };
}

/**
 * Helper to extract headers from RequestInit
 */
export function extractHeaders(init?: RequestInit): Record<string, string> {
  if (!init?.headers) return {};

  if (init.headers instanceof Headers) {
    const result: Record<string, string> = {};
    init.headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(init.headers)) {
    const result: Record<string, string> = {};
    init.headers.forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  }

  return init.headers as Record<string, string>;
}

/**
 * Helper to compare headers (case-insensitive)
 */
export function compareHeaders(
  actual: Record<string, string> | Headers,
  expected: Record<string, string>
): boolean {
  const actualHeaders = actual instanceof Headers
    ? extractHeaders({ headers: actual })
    : actual;

  const actualKeys = Object.keys(actualHeaders).map(k => k.toLowerCase()).sort();
  const expectedKeys = Object.keys(expected).map(k => k.toLowerCase()).sort();

  if (actualKeys.length !== expectedKeys.length) return false;

  return expectedKeys.every((key) => {
    const actualValue = Object.keys(actualHeaders).find(k => k.toLowerCase() === key);
    if (!actualValue) return false;
    return actualHeaders[actualValue] === expected[Object.keys(expected).find(k => k.toLowerCase() === key)!];
  });
}

/**
 * Creates a delay promise for testing async behavior
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to test deprecation warnings
 */
export interface CapturedWarning {
  message: string;
  args: unknown[];
}

export function captureConsoleWarnings(): {
  warnings: CapturedWarning[];
  restore: () => void;
} {
  const warnings: CapturedWarning[] = [];
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    warnings.push({
      message: args.join(' '),
      args,
    });
  };

  return {
    warnings,
    restore: () => {
      console.warn = originalWarn;
    },
  };
}

/**
 * Helper to test middleware execution order
 */
export interface MiddlewareExecutionTrace {
  name: string;
  timestamp: number;
  input: RequestInit;
  output: RequestInit;
}

export function createTracingMiddleware(name: string, traces: MiddlewareExecutionTrace[]) {
  return (init: RequestInit): RequestInit => {
    const output = { ...init, [`X-Trace-${name}`]: 'executed' };
    traces.push({
      name,
      timestamp: Date.now(),
      input: init,
      output,
    });
    return output;
  };
}

export function createAsyncTracingMiddleware(
  name: string,
  traces: MiddlewareExecutionTrace[],
  delay?: number
) {
  return async (init: RequestInit): Promise<RequestInit> => {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const output = { ...init, [`X-Trace-${name}`]: 'executed' };
    traces.push({
      name,
      timestamp: Date.now(),
      input: init,
      output,
    });
    return output;
  };
}

/**
 * Helper to create a Headers object from plain object
 */
export function createHeaders(headers: Record<string, string>): Headers {
  const h = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    h.set(key, value);
  });
  return h;
}

/**
 * Helper to test that middleware chain maintains order
 */
export function verifyExecutionOrder(traces: MiddlewareExecutionTrace[]): boolean {
  for (let i = 1; i < traces.length; i++) {
    if (traces[i].timestamp < traces[i - 1].timestamp) {
      return false;
    }
  }
  return true;
}
