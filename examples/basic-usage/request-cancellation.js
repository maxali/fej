/**
 * Example 5: Request Cancellation
 *
 * Demonstrates how to cancel requests using AbortController.
 */

import { createFej } from 'fej';

const api = createFej();

async function demonstrateCancellation() {
  // Example 1: Manual cancellation with AbortController
  console.log('Example 1: Manual cancellation');
  const controller1 = new AbortController();

  // Start a request
  const request1 = api.fej('https://jsonplaceholder.typicode.com/users', {
    signal: controller1.signal,
  });

  // Cancel it immediately
  setTimeout(() => {
    console.log('⏱️  Cancelling request after 10ms...');
    controller1.abort();
  }, 10);

  try {
    await request1;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('✅ Request was successfully cancelled\n');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }

  // Example 2: Timeout pattern
  console.log('Example 2: Timeout pattern');
  const controller2 = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏱️  Request timed out after 5000ms');
    controller2.abort();
  }, 5000);

  try {
    const response = await api.fej('https://jsonplaceholder.typicode.com/users', {
      signal: controller2.signal,
    });

    // Clear timeout if request succeeds
    clearTimeout(timeoutId);

    const users = await response.json();
    console.log(`✅ Request succeeded before timeout: ${users.length} users\n`);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('❌ Request was cancelled due to timeout\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  // Example 3: Using fej's built-in abort controller tracking
  console.log('Example 3: Built-in tracking');
  const { controller, requestId } = api.createAbortController();

  const request3 = api.fej('https://jsonplaceholder.typicode.com/posts', {
    signal: controller.signal,
  });

  // Cancel using the request ID
  setTimeout(() => {
    console.log(`⏱️  Cancelling request ${requestId}...`);
    api.abortRequest(requestId);
  }, 10);

  try {
    await request3;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('✅ Request was successfully cancelled using request ID\n');
    }
  }

  // Example 4: Cancelling by tags
  console.log('Example 4: Cancelling by tags');
  const { controller: c1 } = api.createAbortController(undefined, ['dashboard']);
  const { controller: c2 } = api.createAbortController(undefined, ['dashboard']);

  const p1 = api.fej('https://jsonplaceholder.typicode.com/users', { signal: c1.signal });
  const p2 = api.fej('https://jsonplaceholder.typicode.com/posts', { signal: c2.signal });

  // Cancel all dashboard requests
  setTimeout(() => {
    const count = api.abortRequestsByTag('dashboard');
    console.log(`⏱️  Cancelled ${count} dashboard requests`);
  }, 10);

  try {
    await Promise.allSettled([p1, p2]);
    console.log('✅ All dashboard requests were cancelled\n');
  } catch (error) {
    // Errors are handled by allSettled
  }
}

// Run the examples
demonstrateCancellation();
