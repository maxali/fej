/**
 * Example: API Key Authentication
 *
 * Demonstrates different ways to use API keys for authentication:
 * - Header-based API key
 * - Query parameter API key
 * - Custom API key middleware
 */

import { createFej } from 'fej';

// Example 1: API Key in Header
console.log('Example 1: API Key in Header\n');

const api1 = createFej();

// Middleware to add API key to headers
api1.use(
  'api-key-header',
  async (ctx, next) => {
    const headers = new Headers(ctx.request.init.headers);
    headers.set('X-API-Key', 'your-api-key-here');
    ctx.request.init.headers = headers;
    await next();
  },
  100
);

async function fetchWithHeaderApiKey() {
  try {
    const response = await api1.fej('https://jsonplaceholder.typicode.com/users');

    console.log('✅ Request sent with X-API-Key header');
    console.log('Status:', response.status);

    const users = await response.json();
    console.log(`Fetched ${users.length} users`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 2: API Key in Query Parameters
console.log('\nExample 2: API Key in Query Parameters\n');

const api2 = createFej();

// Middleware to add API key to query string
api2.use(
  'api-key-query',
  async (ctx, next) => {
    const url = new URL(ctx.request.url);
    url.searchParams.set('api_key', 'your-api-key-here');
    url.searchParams.set('client_id', 'your-client-id');
    ctx.request.url = url.toString();
    await next();
  },
  100
);

async function fetchWithQueryApiKey() {
  try {
    const response = await api2.fej('https://jsonplaceholder.typicode.com/posts?userId=1');

    console.log('✅ Request sent with API key in query params');
    console.log('Final URL:', response.url);

    const posts = await response.json();
    console.log(`Fetched ${posts.length} posts`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 3: Reusable API Key Middleware Factory
console.log('\nExample 3: Reusable API Key Middleware\n');

/**
 * Creates a reusable API key middleware
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - The API key
 * @param {string} options.location - Where to add the key: 'header' or 'query'
 * @param {string} options.headerName - Header name (if location is 'header')
 * @param {string} options.paramName - Query param name (if location is 'query')
 */
function createApiKeyMiddleware(options) {
  const { apiKey, location = 'header', headerName = 'X-API-Key', paramName = 'api_key' } = options;

  return async (ctx, next) => {
    if (location === 'header') {
      const headers = new Headers(ctx.request.init.headers);
      headers.set(headerName, apiKey);
      ctx.request.init.headers = headers;
    } else if (location === 'query') {
      const url = new URL(ctx.request.url);
      url.searchParams.set(paramName, apiKey);
      ctx.request.url = url.toString();
    }
    await next();
  };
}

// Use the reusable middleware for header-based API key
const api3 = createFej();
api3.use(
  'api-key',
  createApiKeyMiddleware({
    apiKey: 'my-custom-api-key',
    location: 'header',
    headerName: 'X-Custom-API-Key',
  }),
  100
);

// Use the reusable middleware for query-based API key
const api4 = createFej();
api4.use(
  'api-key',
  createApiKeyMiddleware({
    apiKey: 'my-query-api-key',
    location: 'query',
    paramName: 'apikey',
  }),
  100
);

async function demonstrateReusableMiddleware() {
  try {
    console.log('Using header-based API key:');
    const response1 = await api3.fej('https://jsonplaceholder.typicode.com/todos/1');
    const todo = await response1.json();
    console.log('✅ Header API key request successful:', todo.title);

    console.log('\nUsing query-based API key:');
    const response2 = await api4.fej('https://jsonplaceholder.typicode.com/comments?postId=1');
    const comments = await response2.json();
    console.log(`✅ Query API key request successful: ${comments.length} comments`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 4: Multiple API Keys (e.g., for different environments)
console.log('\nExample 4: Environment-based API Keys\n');

const environment = process.env.NODE_ENV || 'development';
const apiKeys = {
  development: 'dev-api-key-123',
  staging: 'staging-api-key-456',
  production: 'prod-api-key-789',
};

const api5 = createFej();
api5.use(
  'env-api-key',
  async (ctx, next) => {
    const headers = new Headers(ctx.request.init.headers);
    headers.set('X-API-Key', apiKeys[environment]);
    headers.set('X-Environment', environment);
    ctx.request.init.headers = headers;
    console.log(`🌍 Using ${environment} API key`);
    await next();
  },
  100
);

async function demonstrateEnvironmentKeys() {
  try {
    const response = await api5.fej('https://jsonplaceholder.typicode.com/albums/1');
    const album = await response.json();
    console.log('✅ Environment-based API key request successful:', album.title);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all examples
async function runExamples() {
  console.log('=== API Key Authentication Examples ===\n');

  await fetchWithHeaderApiKey();
  await fetchWithQueryApiKey();
  await demonstrateReusableMiddleware();
  await demonstrateEnvironmentKeys();

  console.log('\n=== Examples Complete ===');
}

runExamples();
