/**
 * Example: Mocking Requests
 *
 * Demonstrates different strategies for mocking HTTP requests when testing
 * applications that use fej.
 *
 * Note: These examples use plain JavaScript assertions for simplicity.
 * In real projects, use a testing framework like Vitest, Jest, or Mocha.
 */

import { createFej } from 'fej';

// Helper assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// Strategy 1: Mock Middleware
console.log('Strategy 1: Mock Middleware\n');

async function testWithMockMiddleware() {
  const api = createFej();

  // Add mock middleware that intercepts all requests
  api.use(
    'mock',
    async (ctx, next) => {
      // Mock response for specific URL
      if (ctx.request.url.includes('/users')) {
        ctx.response = new Response(
          JSON.stringify([
            { id: 1, name: 'Test User' },
            { id: 2, name: 'Another User' },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        return; // Don't call next() - skip actual fetch
      }

      // For other URLs, proceed normally
      await next();
    },
    1000 // Very high priority to intercept first
  );

  // Test the mocked request
  const response = await api.fej('https://api.example.com/users');
  const users = await response.json();

  assert(users.length === 2, 'Should return 2 mocked users');
  assert(users[0].name === 'Test User', 'First user should be "Test User"');
}

// Strategy 2: Conditional Mocking (only in test environment)
console.log('\nStrategy 2: Conditional Mocking\n');

async function testWithConditionalMocking() {
  const isTest = process.env.NODE_ENV === 'test';
  const api = createFej();

  if (isTest) {
    // Mock data store
    const mockData = {
      '/posts/1': { id: 1, title: 'Mock Post', body: 'This is a mock' },
      '/users/1': { id: 1, name: 'Mock User', email: 'mock@example.com' },
    };

    api.use(
      'test-mock',
      async (ctx, next) => {
        const url = new URL(ctx.request.url);
        const mockKey = url.pathname;

        if (mockData[mockKey]) {
          console.log(`🎭 Mocking request to ${mockKey}`);
          ctx.response = new Response(JSON.stringify(mockData[mockKey]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
          return;
        }

        await next();
      },
      1000
    );
  }

  const response = await api.fej('https://api.example.com/posts/1');
  const post = await response.json();

  assert(post.title === 'Mock Post', 'Should return mocked post');
}

// Strategy 3: Mock Factory Pattern
console.log('\nStrategy 3: Mock Factory Pattern\n');

/**
 * Creates a mock middleware factory for testing
 */
function createMockMiddleware(mockResponses = {}) {
  return async (ctx, next) => {
    const url = new URL(ctx.request.url);
    const method = ctx.request.init.method || 'GET';
    const key = `${method} ${url.pathname}`;

    if (mockResponses[key]) {
      const mockResponse = mockResponses[key];

      // Handle function mocks (for dynamic responses)
      if (typeof mockResponse === 'function') {
        const result = await mockResponse(ctx);
        ctx.response = new Response(JSON.stringify(result.data), {
          status: result.status || 200,
          headers: result.headers || { 'Content-Type': 'application/json' },
        });
        return;
      }

      // Handle object mocks
      ctx.response = new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }

    await next();
  };
}

async function testWithMockFactory() {
  const api = createFej();

  api.use(
    'mock',
    createMockMiddleware({
      'GET /posts': [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }],
      'POST /posts': async (ctx) => {
        // Dynamic mock based on request
        const body = await ctx.request.init.body;
        return {
          status: 201,
          data: { id: 3, ...JSON.parse(body) },
        };
      },
      'GET /posts/1': { id: 1, title: 'Post 1', body: 'Content here' },
    }),
    1000
  );

  // Test GET
  const response1 = await api.fej('https://api.example.com/posts');
  const posts = await response1.json();
  assert(posts.length === 2, 'Should return 2 posts');

  // Test POST with dynamic mock
  const response2 = await api.fej('https://api.example.com/posts', {
    method: 'POST',
    body: JSON.stringify({ title: 'New Post' }),
  });
  const newPost = await response2.json();
  assert(newPost.id === 3, 'Should create post with id 3');
  assert(newPost.title === 'New Post', 'Should have correct title');
}

// Strategy 4: Testing Error Scenarios
console.log('\nStrategy 4: Testing Error Scenarios\n');

async function testErrorScenarios() {
  const api = createFej();

  // Mock different error responses
  api.use(
    'error-mock',
    async (ctx, next) => {
      const url = new URL(ctx.request.url);

      // Mock 404
      if (url.pathname === '/not-found') {
        ctx.response = new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        });
        return;
      }

      // Mock 500
      if (url.pathname === '/server-error') {
        ctx.response = new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        });
        return;
      }

      // Mock network error
      if (url.pathname === '/network-error') {
        throw new TypeError('Failed to fetch');
      }

      await next();
    },
    1000
  );

  // Test 404
  const response404 = await api.fej('https://api.example.com/not-found');
  assert(response404.status === 404, 'Should return 404');

  // Test 500
  const response500 = await api.fej('https://api.example.com/server-error');
  assert(response500.status === 500, 'Should return 500');

  // Test network error
  try {
    await api.fej('https://api.example.com/network-error');
    assert(false, 'Should throw network error');
  } catch (error) {
    assert(error.name === 'TypeError', 'Should throw TypeError for network error');
  }
}

// Strategy 5: Spy Pattern (tracking calls)
console.log('\nStrategy 5: Spy Pattern\n');

class RequestSpy {
  constructor() {
    this.calls = [];
  }

  createMiddleware() {
    return async (ctx, next) => {
      // Record the call
      this.calls.push({
        url: ctx.request.url,
        method: ctx.request.init.method || 'GET',
        headers: Object.fromEntries(new Headers(ctx.request.init.headers).entries()),
        body: ctx.request.init.body,
        timestamp: Date.now(),
      });

      await next();
    };
  }

  getCallCount() {
    return this.calls.length;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  wasCalledWith(url, method = 'GET') {
    return this.calls.some((call) => call.url.includes(url) && call.method === method);
  }

  reset() {
    this.calls = [];
  }
}

async function testWithSpy() {
  const api = createFej();
  const spy = new RequestSpy();

  // Add spy middleware
  api.use('spy', spy.createMiddleware(), 500);

  // Add mock middleware to prevent actual requests
  api.use(
    'mock',
    async (ctx) => {
      ctx.response = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    1000
  );

  // Make some requests
  await api.fej('https://api.example.com/users');
  await api.fej('https://api.example.com/posts', { method: 'POST' });

  // Assert on spy
  assert(spy.getCallCount() === 2, 'Should have recorded 2 calls');
  assert(spy.wasCalledWith('/users', 'GET'), 'Should have called /users with GET');
  assert(spy.wasCalledWith('/posts', 'POST'), 'Should have called /posts with POST');

  const lastCall = spy.getLastCall();
  assert(lastCall.url.includes('/posts'), 'Last call should be to /posts');
}

// Run all tests
async function runTests() {
  console.log('=== Mocking Requests Tests ===\n');

  try {
    await testWithMockMiddleware();
    await testWithConditionalMocking();
    await testWithMockFactory();
    await testErrorScenarios();
    await testWithSpy();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
