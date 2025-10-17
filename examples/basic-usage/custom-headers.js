/**
 * Example 3: Custom Headers
 *
 * Demonstrates adding custom headers to requests.
 */

import { createFej } from 'fej';

// Create a fej instance
const api = createFej();

async function fetchWithCustomHeaders() {
  try {
    // Make a request with custom headers
    const response = await api.fej('https://jsonplaceholder.typicode.com/posts/1', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Custom-Header': 'my-custom-value',
        'X-Request-ID': `req-${Date.now()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const post = await response.json();

    console.log('✅ Request with custom headers successful:');
    console.log('Post:', post);

    // Show response headers
    console.log('\n📋 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    return post;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
fetchWithCustomHeaders();
