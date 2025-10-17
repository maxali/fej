/**
 * Simple Real-World Example: API Client with fej
 *
 * This example demonstrates:
 * - Authentication with bearer tokens
 * - Request logging
 * - Error handling and retries
 * - Using the instance-based approach (v2 pattern)
 */

import { createFej } from 'fej';
import {
  createBearerTokenMiddleware,
  createLoggerMiddleware,
  createRetryMiddleware,
  createErrorMiddleware,
} from 'fej/middleware';

// Create an API client instance
const api = createFej();

// Add authentication middleware (priority: 100, runs early)
api.use(
  'auth',
  createBearerTokenMiddleware({
    token: 'your-api-token-here',
  }),
  100
);

// Add logging middleware (priority: 50)
api.use(
  'logger',
  createLoggerMiddleware({
    format: 'detailed',
  }),
  50
);

// Add retry middleware for failed requests (priority: 200, runs very early)
api.use(
  'retry',
  createRetryMiddleware({
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
  }),
  200
);

// Add error handling middleware (priority: 300, runs first to catch all errors)
api.use(
  'error',
  createErrorMiddleware((error) => {
    console.error('API Error:', error.message);
  }),
  300
);

// Example 1: Fetch users
async function getUsers() {
  try {
    const response = await api.fej('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    console.log('Users:', users.slice(0, 3)); // Show first 3 users
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// Example 2: Create a new post
async function createPost(title, body, userId) {
  try {
    const response = await api.fej('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        userId,
      }),
    });
    const post = await response.json();
    console.log('Created post:', post);
    return post;
  } catch (error) {
    console.error('Failed to create post:', error);
  }
}

// Example 3: Custom middleware for request timing
api.use(
  'timing',
  async (ctx, next) => {
    const startTime = Date.now();
    console.log(`[Timing] Starting request to: ${ctx.request.url}`);

    // Add start time header
    const headers = new Headers(ctx.request.init.headers);
    headers.set('X-Request-Start', startTime.toString());
    ctx.request.init.headers = headers;

    // Call next middleware
    await next();

    // Log duration after request completes
    const duration = Date.now() - startTime;
    console.log(`[Timing] Request completed in ${duration}ms`);
  },
  10
);

// Run examples
async function runExamples() {
  console.log('=== Fej API Client Example ===\n');

  console.log('1. Fetching users...');
  await getUsers();

  console.log('\n2. Creating a post...');
  await createPost('Hello from fej!', 'This is a test post using fej middleware', 1);

  console.log('\n=== Examples Complete ===');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
