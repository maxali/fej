/**
 * Example: Basic Error Handling
 *
 * Demonstrates how to handle different types of errors:
 * - Network errors (connection failed, timeout)
 * - HTTP errors (4xx, 5xx status codes)
 * - Parsing errors (invalid JSON)
 */

import { createFej } from 'fej';

const api = createFej();

// Example 1: Handling Network Errors
console.log('Example 1: Network Errors\n');

async function handleNetworkError() {
  try {
    // This will fail because the domain doesn't exist
    const response = await api.fej('https://this-domain-does-not-exist-12345.com');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('❌ Network error: Could not connect to server');
      console.log('   This could be due to:');
      console.log('   - No internet connection');
      console.log('   - Server is down');
      console.log('   - Invalid domain');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Example 2: Handling HTTP Errors
console.log('\nExample 2: HTTP Errors\n');

async function handleHttpError() {
  try {
    // This endpoint returns a 404
    const response = await api.fej('https://jsonplaceholder.typicode.com/posts/999999');

    if (!response.ok) {
      // Handle different HTTP error codes
      if (response.status === 404) {
        console.log('❌ Resource not found (404)');
      } else if (response.status >= 400 && response.status < 500) {
        console.log(`❌ Client error (${response.status})`);
      } else if (response.status >= 500) {
        console.log(`❌ Server error (${response.status})`);
      }

      // You can still read the error response body
      try {
        const errorBody = await response.text();
        if (errorBody) {
          console.log('Error details:', errorBody);
        }
      } catch (e) {
        // Ignore parsing errors
      }

      return;
    }

    const data = await response.json();
    console.log('✅ Success:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 3: Handling JSON Parsing Errors
console.log('\nExample 3: JSON Parsing Errors\n');

async function handleParsingError() {
  try {
    // Create a mock response with invalid JSON
    const mockApi = createFej();
    mockApi.use('mock-invalid-json', async (ctx, next) => {
      // Create a mock response with invalid JSON
      ctx.response = new Response('This is not JSON', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }, 1000);

    const response = await mockApi.fej('https://example.com');

    if (response.ok) {
      try {
        const data = await response.json();
        console.log(data);
      } catch (parseError) {
        console.log('❌ JSON parsing error');
        console.log('   The server returned invalid JSON');
        console.log('   You can still read it as text:');

        // Try reading as text instead
        const text = await response.text();
        console.log('   Response text:', text);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 4: Comprehensive Error Handler
console.log('\nExample 4: Comprehensive Error Handler\n');

/**
 * A reusable error handler that categorizes and handles different error types
 */
async function safeRequest(url, options = {}) {
  try {
    const response = await api.fej(url, options);

    // Check HTTP status
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    // Try to parse JSON
    try {
      return await response.json();
    } catch (parseError) {
      console.warn('⚠️  Response is not JSON, returning text');
      return await response.text();
    }
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Network error:', error.message);
      throw new Error('Network connection failed');
    }

    // Abort errors
    if (error.name === 'AbortError') {
      console.error('❌ Request was cancelled');
      throw error;
    }

    // HTTP errors (from our check above)
    if (error.status) {
      console.error(`❌ HTTP error ${error.status}:`, error.message);
      throw error;
    }

    // Unknown errors
    console.error('❌ Unexpected error:', error);
    throw error;
  }
}

async function demonstrateComprehensiveHandler() {
  // Test with successful request
  try {
    console.log('Testing successful request:');
    const data = await safeRequest('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ Success:', data.name);
  } catch (error) {
    console.log('Failed:', error.message);
  }

  // Test with 404
  try {
    console.log('\nTesting 404 error:');
    await safeRequest('https://jsonplaceholder.typicode.com/users/99999');
  } catch (error) {
    console.log('Caught error:', error.message);
  }
}

// Example 5: Error with Context
console.log('\nExample 5: Errors with Context\n');

class ApiError extends Error {
  constructor(message, { status, url, method, requestId } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.method = method;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      url: this.url,
      method: this.method,
      requestId: this.requestId,
      timestamp: this.timestamp,
    };
  }
}

async function demonstrateContextualErrors() {
  try {
    const requestId = `req-${Date.now()}`;
    const response = await api.fej('https://jsonplaceholder.typicode.com/invalid', {
      headers: { 'X-Request-ID': requestId },
    });

    if (!response.ok) {
      throw new ApiError('Request failed', {
        status: response.status,
        url: response.url,
        method: 'GET',
        requestId,
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.log('❌ API Error with context:');
      console.log(JSON.stringify(error.toJSON(), null, 2));
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run all examples
async function runExamples() {
  console.log('=== Error Handling Examples ===\n');

  await handleNetworkError();
  await handleHttpError();
  await handleParsingError();
  await demonstrateComprehensiveHandler();
  await demonstrateContextualErrors();

  console.log('\n=== Examples Complete ===');
}

runExamples();
