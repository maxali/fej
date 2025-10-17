/**
 * Example: Bearer Token Authentication
 *
 * Demonstrates how to add bearer token authentication to all requests
 * using middleware.
 */

import { createFej } from 'fej';
import { createBearerTokenMiddleware } from 'fej/middleware';

// Example 1: Using the built-in bearer token middleware
console.log('Example 1: Built-in Bearer Token Middleware\n');

const api1 = createFej();

// Add bearer token middleware
api1.use(
  'auth',
  createBearerTokenMiddleware({
    token: 'your-secret-token-here',
  }),
  100 // High priority to run early
);

async function fetchWithBearerToken() {
  try {
    // The bearer token will be automatically added to this request
    const response = await api1.fej('https://jsonplaceholder.typicode.com/posts/1');

    console.log('✅ Request sent with Authorization header');
    console.log('Status:', response.status);

    const data = await response.json();
    console.log('Data received:', data.title);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 2: Custom bearer token middleware with dynamic tokens
console.log('\nExample 2: Dynamic Token (e.g., from login)\n');

const api2 = createFej();

// Simulate a token store (in real apps, this might be localStorage, cookies, etc.)
let currentToken = null;

// Custom middleware for dynamic token
api2.use(
  'dynamic-auth',
  async (ctx, next) => {
    if (currentToken) {
      const headers = new Headers(ctx.request.init.headers);
      headers.set('Authorization', `Bearer ${currentToken}`);
      ctx.request.init.headers = headers;
      console.log(`🔑 Added token to request: ${currentToken.substring(0, 10)}...`);
    }
    await next();
  },
  100
);

async function demonstrateDynamicToken() {
  // Simulate login
  console.log('📝 Simulating login...');
  currentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.token';

  // Make authenticated request
  const response = await api2.fej('https://jsonplaceholder.typicode.com/users/1');
  const user = await response.json();
  console.log('✅ Authenticated request successful:', user.name);

  // Simulate logout
  console.log('\n🚪 Simulating logout...');
  currentToken = null;

  // This request will not have a token
  const response2 = await api2.fej('https://jsonplaceholder.typicode.com/users/2');
  console.log('✅ Unauthenticated request sent (no token added)');
}

// Example 3: Token refresh pattern
console.log('\nExample 3: Token Refresh Pattern\n');

const api3 = createFej();

let accessToken = 'initial-token';
let refreshToken = 'refresh-token';

api3.use(
  'token-refresh',
  async (ctx, next) => {
    // Add access token
    const headers = new Headers(ctx.request.init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    ctx.request.init.headers = headers;

    // Make the request
    await next();

    // Check if we got a 401 (unauthorized)
    if (ctx.response && ctx.response.status === 401) {
      console.log('🔄 Token expired, refreshing...');

      // Simulate token refresh (in real apps, call your refresh endpoint)
      accessToken = `refreshed-token-${Date.now()}`;

      console.log(`✅ Token refreshed: ${accessToken.substring(0, 20)}...`);

      // Retry the request with new token
      headers.set('Authorization', `Bearer ${accessToken}`);
      ctx.request.init.headers = headers;

      // Make request again
      ctx.response = await fetch(ctx.request.url, ctx.request.init);
    }
  },
  100
);

async function demonstrateTokenRefresh() {
  try {
    const response = await api3.fej('https://jsonplaceholder.typicode.com/posts/1');
    const data = await response.json();
    console.log('✅ Request successful with token refresh handling');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all examples
async function runExamples() {
  console.log('=== Bearer Token Authentication Examples ===\n');

  await fetchWithBearerToken();
  await demonstrateDynamicToken();
  await demonstrateTokenRefresh();

  console.log('\n=== Examples Complete ===');
}

runExamples();
