/**
 * Example: Testing Middleware
 *
 * Demonstrates how to test custom middleware in isolation and in combination.
 */

import { createFej } from 'fej';

// Helper assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// Test 1: Testing a Simple Middleware
console.log('Test 1: Testing Simple Middleware\n');

// Middleware to test: adds a custom header
function createCustomHeaderMiddleware(headerName, headerValue) {
  return async (ctx, next) => {
    const headers = new Headers(ctx.request.init.headers);
    headers.set(headerName, headerValue);
    ctx.request.init.headers = headers;
    await next();
  };
}

async function testCustomHeaderMiddleware() {
  const api = createFej();

  // Add the middleware to test
  api.use('custom-header', createCustomHeaderMiddleware('X-Test-Header', 'test-value'), 100);

  // Add a spy to capture the request
  let capturedHeaders;
  api.use(
    'spy',
    async (ctx, next) => {
      capturedHeaders = Object.fromEntries(new Headers(ctx.request.init.headers).entries());
      await next();
    },
    50
  );

  // Mock the response
  api.use(
    'mock',
    async (ctx) => {
      ctx.response = new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    1000
  );

  // Execute request
  await api.fej('https://example.com/test');

  // Assert
  assert(
    capturedHeaders['x-test-header'] === 'test-value',
    'Should add custom header to request'
  );
}

// Test 2: Testing Middleware Execution Order
console.log('\nTest 2: Testing Middleware Execution Order\n');

async function testMiddlewareOrder() {
  const api = createFej();
  const executionOrder = [];

  // Add middleware with different priorities
  api.use(
    'first',
    async (ctx, next) => {
      executionOrder.push('first-before');
      await next();
      executionOrder.push('first-after');
    },
    300
  );

  api.use(
    'second',
    async (ctx, next) => {
      executionOrder.push('second-before');
      await next();
      executionOrder.push('second-after');
    },
    200
  );

  api.use(
    'third',
    async (ctx, next) => {
      executionOrder.push('third-before');
      await next();
      executionOrder.push('third-after');
    },
    100
  );

  // Mock response
  api.use(
    'mock',
    async (ctx) => {
      executionOrder.push('mock');
      ctx.response = new Response(JSON.stringify({ ok: true }));
    },
    1000
  );

  await api.fej('https://example.com/test');

  // Assert execution order (higher priority runs first)
  const expected = [
    'mock', // priority 1000
    'first-before', // priority 300
    'second-before', // priority 200
    'third-before', // priority 100
    'third-after',
    'second-after',
    'first-after',
  ];

  assert(
    JSON.stringify(executionOrder) === JSON.stringify(expected),
    'Middleware should execute in priority order'
  );

  console.log('Execution order:', executionOrder.join(' -> '));
}

// Test 3: Testing Error Handling in Middleware
console.log('\nTest 3: Testing Error Handling\n');

function createErrorHandlerMiddleware(onError) {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      onError(error);
      throw error;
    }
  };
}

async function testErrorHandling() {
  const api = createFej();
  let errorCaught = false;
  let errorMessage = '';

  // Add error handler
  api.use(
    'error-handler',
    createErrorHandlerMiddleware((error) => {
      errorCaught = true;
      errorMessage = error.message;
    }),
    300
  );

  // Add middleware that throws
  api.use(
    'thrower',
    async () => {
      throw new Error('Test error');
    },
    100
  );

  try {
    await api.fej('https://example.com/test');
  } catch (error) {
    // Expected
  }

  assert(errorCaught === true, 'Error handler should catch the error');
  assert(errorMessage === 'Test error', 'Should capture correct error message');
}

// Test 4: Testing Middleware Context Modification
console.log('\nTest 4: Testing Context Modification\n');

function createUrlModifierMiddleware(addParam) {
  return async (ctx, next) => {
    const url = new URL(ctx.request.url);
    url.searchParams.set('modified', addParam);
    ctx.request.url = url.toString();
    await next();
  };
}

async function testContextModification() {
  const api = createFej();
  let finalUrl = '';

  // Add URL modifier
  api.use('url-modifier', createUrlModifierMiddleware('true'), 100);

  // Spy to capture modified URL
  api.use(
    'spy',
    async (ctx, next) => {
      finalUrl = ctx.request.url;
      await next();
    },
    50
  );

  // Mock
  api.use(
    'mock',
    async (ctx) => {
      ctx.response = new Response(JSON.stringify({ ok: true }));
    },
    1000
  );

  await api.fej('https://example.com/test?foo=bar');

  assert(finalUrl.includes('modified=true'), 'Should add modified parameter');
  assert(finalUrl.includes('foo=bar'), 'Should preserve existing parameters');
}

// Test 5: Testing Async Middleware
console.log('\nTest 5: Testing Async Middleware\n');

function createDelayMiddleware(delayMs) {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    ctx.response.headers.set('X-Duration', duration.toString());
  };
}

async function testAsyncMiddleware() {
  const api = createFej();

  // Add delay tracking middleware
  api.use('delay', createDelayMiddleware(), 100);

  // Mock with artificial delay
  api.use(
    'mock',
    async (ctx) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      ctx.response = new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    },
    1000
  );

  const response = await api.fej('https://example.com/test');
  const duration = parseInt(response.headers.get('X-Duration'));

  assert(duration >= 50, 'Duration should be at least 50ms');
  console.log(`Request took ${duration}ms`);
}

// Test 6: Testing Middleware Removal
console.log('\nTest 6: Testing Middleware Removal\n');

async function testMiddlewareRemoval() {
  const api = createFej();
  let middlewareExecuted = false;

  // Add middleware
  api.use(
    'test',
    async (ctx, next) => {
      middlewareExecuted = true;
      await next();
    },
    100
  );

  // Mock
  api.use(
    'mock',
    async (ctx) => {
      ctx.response = new Response(JSON.stringify({ ok: true }));
    },
    1000
  );

  // Test with middleware
  await api.fej('https://example.com/test1');
  assert(middlewareExecuted === true, 'Middleware should execute');

  // Remove middleware
  middlewareExecuted = false;
  api.remove('test');

  // Test without middleware
  await api.fej('https://example.com/test2');
  assert(middlewareExecuted === false, 'Middleware should not execute after removal');
}

// Test 7: Testing Middleware Chain Interruption
console.log('\nTest 7: Testing Chain Interruption\n');

async function testChainInterruption() {
  const api = createFej();
  let secondMiddlewareExecuted = false;

  // First middleware - doesn't call next()
  api.use(
    'first',
    async (ctx) => {
      ctx.response = new Response(JSON.stringify({ intercepted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      // Don't call next() - interrupt the chain
    },
    200
  );

  // Second middleware - should not execute
  api.use(
    'second',
    async (ctx, next) => {
      secondMiddlewareExecuted = true;
      await next();
    },
    100
  );

  const response = await api.fej('https://example.com/test');
  const data = await response.json();

  assert(data.intercepted === true, 'Should return intercepted response');
  assert(secondMiddlewareExecuted === false, 'Second middleware should not execute');
}

// Test 8: Testing Middleware with Multiple Instances
console.log('\nTest 8: Testing Multiple Instances\n');

async function testMultipleInstances() {
  const api1 = createFej();
  const api2 = createFej();

  let api1MiddlewareExecuted = false;
  let api2MiddlewareExecuted = false;

  // Add middleware to api1 only
  api1.use(
    'test',
    async (ctx, next) => {
      api1MiddlewareExecuted = true;
      await next();
    },
    100
  );

  // Add different middleware to api2
  api2.use(
    'test',
    async (ctx, next) => {
      api2MiddlewareExecuted = true;
      await next();
    },
    100
  );

  // Mock both
  const mockMiddleware = async (ctx) => {
    ctx.response = new Response(JSON.stringify({ ok: true }));
  };
  api1.use('mock', mockMiddleware, 1000);
  api2.use('mock', mockMiddleware, 1000);

  // Test api1
  await api1.fej('https://example.com/test');
  assert(api1MiddlewareExecuted === true, 'api1 middleware should execute');
  assert(api2MiddlewareExecuted === false, 'api2 middleware should not execute');

  // Reset and test api2
  api1MiddlewareExecuted = false;
  await api2.fej('https://example.com/test');
  assert(api1MiddlewareExecuted === false, 'api1 middleware should not execute');
  assert(api2MiddlewareExecuted === true, 'api2 middleware should execute');
}

// Run all tests
async function runTests() {
  console.log('=== Testing Middleware Tests ===\n');

  try {
    await testCustomHeaderMiddleware();
    await testMiddlewareOrder();
    await testErrorHandling();
    await testContextModification();
    await testAsyncMiddleware();
    await testMiddlewareRemoval();
    await testChainInterruption();
    await testMultipleInstances();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
