/**
 * Example: Integration Testing
 *
 * Demonstrates integration testing with real HTTP requests to a public API.
 * These tests verify that fej works correctly with actual network calls.
 */

import { createFej } from 'fej';
import { createBearerTokenMiddleware, createRetryMiddleware } from 'fej/middleware';

// Helper assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

// We'll use JSONPlaceholder as our test API
const BASE_URL = 'https://jsonplaceholder.typicode.com';

// Test 1: Basic GET Request
console.log('Test 1: Basic GET Request\n');

async function testBasicGet() {
  const api = createFej();
  const response = await api.fej(`${BASE_URL}/users/1`);

  assert(response.ok === true, 'Response should be ok');
  assert(response.status === 200, 'Status should be 200');

  const user = await response.json();
  assert(typeof user.id === 'number', 'User should have an id');
  assert(typeof user.name === 'string', 'User should have a name');
  assert(typeof user.email === 'string', 'User should have an email');

  console.log(`Fetched user: ${user.name}`);
}

// Test 2: POST Request
console.log('\nTest 2: POST Request\n');

async function testPost() {
  const api = createFej();
  const newPost = {
    title: 'Test Post',
    body: 'This is a test post',
    userId: 1,
  };

  const response = await api.fej(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPost),
  });

  assert(response.ok === true, 'Response should be ok');
  assert(response.status === 201, 'Status should be 201 (Created)');

  const createdPost = await response.json();
  assert(createdPost.title === newPost.title, 'Title should match');
  assert(createdPost.body === newPost.body, 'Body should match');
  assert(createdPost.userId === newPost.userId, 'UserId should match');

  console.log(`Created post with ID: ${createdPost.id}`);
}

// Test 3: Request with Middleware
console.log('\nTest 3: Request with Middleware\n');

async function testWithMiddleware() {
  const api = createFej();

  // Add logging middleware
  const logs = [];
  api.use(
    'logger',
    async (ctx, next) => {
      const start = Date.now();
      logs.push({ type: 'request', url: ctx.request.url });
      await next();
      const duration = Date.now() - start;
      logs.push({ type: 'response', status: ctx.response.status, duration });
    },
    100
  );

  const response = await api.fej(`${BASE_URL}/posts/1`);
  const post = await response.json();

  assert(logs.length === 2, 'Should have 2 log entries');
  assert(logs[0].type === 'request', 'First log should be request');
  assert(logs[1].type === 'response', 'Second log should be response');
  assert(logs[1].status === 200, 'Response status should be 200');
  assert(typeof logs[1].duration === 'number', 'Should log duration');

  console.log(`Request took ${logs[1].duration}ms`);
}

// Test 4: Error Handling (404)
console.log('\nTest 4: Error Handling (404)\n');

async function testNotFound() {
  const api = createFej();
  const response = await api.fej(`${BASE_URL}/posts/99999`);

  assert(response.ok === false, 'Response should not be ok');
  assert(response.status === 404, 'Status should be 404');

  console.log('Correctly handled 404 response');
}

// Test 5: Multiple Parallel Requests
console.log('\nTest 5: Multiple Parallel Requests\n');

async function testParallelRequests() {
  const api = createFej();

  const start = Date.now();
  const promises = [
    api.fej(`${BASE_URL}/users/1`),
    api.fej(`${BASE_URL}/users/2`),
    api.fej(`${BASE_URL}/users/3`),
  ];

  const responses = await Promise.all(promises);
  const duration = Date.now() - start;

  assert(responses.length === 3, 'Should have 3 responses');
  assert(responses.every((r) => r.ok), 'All responses should be ok');

  const users = await Promise.all(responses.map((r) => r.json()));
  assert(users[0].id === 1, 'First user should have id 1');
  assert(users[1].id === 2, 'Second user should have id 2');
  assert(users[2].id === 3, 'Third user should have id 3');

  console.log(`3 parallel requests completed in ${duration}ms`);
}

// Test 6: Request Cancellation
console.log('\nTest 6: Request Cancellation\n');

async function testCancellation() {
  const api = createFej();
  const controller = new AbortController();

  // Start request
  const promise = api.fej(`${BASE_URL}/posts`, {
    signal: controller.signal,
  });

  // Cancel immediately
  controller.abort();

  try {
    await promise;
    assert(false, 'Should have thrown AbortError');
  } catch (error) {
    assert(error.name === 'AbortError', 'Should throw AbortError');
    console.log('Successfully cancelled request');
  }
}

// Test 7: Custom Headers
console.log('\nTest 7: Custom Headers\n');

async function testCustomHeaders() {
  const api = createFej();

  const customHeaders = {
    'X-Custom-Header': 'test-value',
    'X-Request-ID': `req-${Date.now()}`,
  };

  const response = await api.fej(`${BASE_URL}/users/1`, {
    headers: customHeaders,
  });

  assert(response.ok === true, 'Request with custom headers should succeed');

  // Note: We can't verify the request headers were sent (JSONPlaceholder doesn't echo them),
  // but we can verify the request succeeded
  const user = await response.json();
  assert(user.id === 1, 'Should fetch correct user');

  console.log('Custom headers request succeeded');
}

// Test 8: Authentication Middleware Integration
console.log('\nTest 8: Authentication Middleware\n');

async function testAuthMiddleware() {
  const api = createFej();

  // Add bearer token middleware
  api.use(
    'auth',
    createBearerTokenMiddleware({
      token: 'test-token-12345',
    }),
    100
  );

  // Spy to verify auth header was added
  let authHeaderAdded = false;
  api.use(
    'spy',
    async (ctx, next) => {
      const headers = new Headers(ctx.request.init.headers);
      if (headers.get('Authorization') === 'Bearer test-token-12345') {
        authHeaderAdded = true;
      }
      await next();
    },
    50
  );

  const response = await api.fej(`${BASE_URL}/posts/1`);
  assert(response.ok === true, 'Request should succeed');
  assert(authHeaderAdded === true, 'Auth header should be added');

  console.log('Auth middleware correctly added bearer token');
}

// Test 9: Pagination
console.log('\nTest 9: Pagination\n');

async function testPagination() {
  const api = createFej();

  // Fetch first page
  const page1Response = await api.fej(`${BASE_URL}/posts?_page=1&_limit=10`);
  const page1 = await page1Response.json();

  // Fetch second page
  const page2Response = await api.fej(`${BASE_URL}/posts?_page=2&_limit=10`);
  const page2 = await page2Response.json();

  assert(Array.isArray(page1), 'Page 1 should be an array');
  assert(Array.isArray(page2), 'Page 2 should be an array');
  assert(page1.length <= 10, 'Page 1 should have at most 10 items');
  assert(page2.length <= 10, 'Page 2 should have at most 10 items');

  // Verify different results
  assert(page1[0].id !== page2[0].id, 'Pages should have different posts');

  console.log(`Fetched ${page1.length + page2.length} posts across 2 pages`);
}

// Test 10: Query Parameters
console.log('\nTest 10: Query Parameters\n');

async function testQueryParams() {
  const api = createFej();

  // Add middleware to add query params
  api.use(
    'query-params',
    async (ctx, next) => {
      const url = new URL(ctx.request.url);
      url.searchParams.set('userId', '1');
      ctx.request.url = url.toString();
      await next();
    },
    100
  );

  const response = await api.fej(`${BASE_URL}/posts`);
  const posts = await response.json();

  assert(Array.isArray(posts), 'Response should be an array');
  assert(posts.every((post) => post.userId === 1), 'All posts should belong to user 1');

  console.log(`Fetched ${posts.length} posts for user 1`);
}

// Test 11: Multiple Instances with Different Configs
console.log('\nTest 11: Multiple Instances\n');

async function testMultipleInstances() {
  const api1 = createFej();
  const api2 = createFej();

  // Add different middleware to each instance
  api1.use(
    'header',
    async (ctx, next) => {
      const headers = new Headers(ctx.request.init.headers);
      headers.set('X-Instance', 'api1');
      ctx.request.init.headers = headers;
      await next();
    },
    100
  );

  api2.use(
    'header',
    async (ctx, next) => {
      const headers = new Headers(ctx.request.init.headers);
      headers.set('X-Instance', 'api2');
      ctx.request.init.headers = headers;
      await next();
    },
    100
  );

  // Both should work independently
  const [response1, response2] = await Promise.all([
    api1.fej(`${BASE_URL}/users/1`),
    api2.fej(`${BASE_URL}/users/2`),
  ]);

  assert(response1.ok === true, 'api1 request should succeed');
  assert(response2.ok === true, 'api2 request should succeed');

  const user1 = await response1.json();
  const user2 = await response2.json();

  assert(user1.id === 1, 'api1 should fetch user 1');
  assert(user2.id === 2, 'api2 should fetch user 2');

  console.log('Both instances work independently');
}

// Test 12: Real-world Scenario - Complete CRUD Operations
console.log('\nTest 12: Complete CRUD Operations\n');

async function testCrudOperations() {
  const api = createFej();

  // CREATE
  const createResponse = await api.fej(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Integration Test Post',
      body: 'Testing CRUD operations',
      userId: 1,
    }),
  });
  const created = await createResponse.json();
  assert(createResponse.status === 201, 'CREATE should return 201');

  // READ
  const readResponse = await api.fej(`${BASE_URL}/posts/${created.id}`);
  const read = await readResponse.json();
  assert(readResponse.ok === true, 'READ should succeed');

  // UPDATE
  const updateResponse = await api.fej(`${BASE_URL}/posts/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...read,
      title: 'Updated Title',
    }),
  });
  const updated = await updateResponse.json();
  assert(updated.title === 'Updated Title', 'UPDATE should modify title');

  // DELETE
  const deleteResponse = await api.fej(`${BASE_URL}/posts/${created.id}`, {
    method: 'DELETE',
  });
  assert(deleteResponse.ok === true, 'DELETE should succeed');

  console.log('Complete CRUD cycle executed successfully');
}

// Run all tests
async function runTests() {
  console.log('=== Integration Testing Tests ===\n');
  console.log('Note: These tests make real HTTP requests to JSONPlaceholder API\n');

  try {
    await testBasicGet();
    await testPost();
    await testWithMiddleware();
    await testNotFound();
    await testParallelRequests();
    await testCancellation();
    await testCustomHeaders();
    await testAuthMiddleware();
    await testPagination();
    await testQueryParams();
    await testMultipleInstances();
    await testCrudOperations();

    console.log('\n✅ All integration tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
