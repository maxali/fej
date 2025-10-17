/**
 * Example 4: Multiple Instances
 *
 * Demonstrates creating multiple fej instances with different configurations.
 * Each instance has its own middleware and configuration.
 */

import { createFej } from 'fej';

// Create different API clients for different services
const userApi = createFej();
const postsApi = createFej();

// Add custom middleware to userApi
userApi.use('user-headers', async (ctx, next) => {
  const headers = new Headers(ctx.request.init.headers);
  headers.set('X-Service', 'users');
  ctx.request.init.headers = headers;
  await next();
});

// Add custom middleware to postsApi
postsApi.use('posts-headers', async (ctx, next) => {
  const headers = new Headers(ctx.request.init.headers);
  headers.set('X-Service', 'posts');
  ctx.request.init.headers = headers;
  await next();
});

async function demonstrateMultipleInstances() {
  try {
    // Fetch using userApi
    console.log('📡 Fetching from userApi...');
    const userResponse = await userApi.fej('https://jsonplaceholder.typicode.com/users/1');
    const user = await userResponse.json();
    console.log('User:', user.name);

    // Fetch using postsApi
    console.log('\n📡 Fetching from postsApi...');
    const postsResponse = await postsApi.fej('https://jsonplaceholder.typicode.com/posts?userId=1');
    const posts = await postsResponse.json();
    console.log(`Posts: ${posts.length} posts found`);

    console.log('\n✅ Both instances work independently with their own middleware!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
demonstrateMultipleInstances();
