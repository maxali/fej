/**
 * Example: Retry Logic
 *
 * Demonstrates how to implement retry logic for failed requests:
 * - Using built-in retry middleware
 * - Custom retry logic
 * - Exponential backoff
 * - Conditional retries
 */

import { createFej } from 'fej';
import { createRetryMiddleware } from 'fej/middleware';

// Example 1: Built-in Retry Middleware
console.log('Example 1: Built-in Retry Middleware\n');

const api1 = createFej();

api1.use(
  'retry',
  createRetryMiddleware({
    attempts: 3,
    delay: 1000, // 1 second
    backoff: 'exponential', // exponential backoff
    shouldRetry: (error, attempt) => {
      // Only retry on network errors or 5xx status codes
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log(`🔄 Network error, retrying (attempt ${attempt})...`);
        return true;
      }
      if (error.status >= 500) {
        console.log(`🔄 Server error ${error.status}, retrying (attempt ${attempt})...`);
        return true;
      }
      return false;
    },
  }),
  200
);

async function demonstrateBuiltInRetry() {
  try {
    console.log('Attempting request to non-existent domain...');
    const response = await api1.fej('https://this-will-fail-12345.com');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log('❌ All retry attempts failed');
  }
}

// Example 2: Custom Retry Logic
console.log('\nExample 2: Custom Retry Logic\n');

/**
 * Retry a request with custom logic
 * @param {Function} requestFn - Function that makes the request
 * @param {Object} options - Retry options
 */
async function retryRequest(requestFn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxAttempts && shouldRetry(error, attempt)) {
        console.log(`⏱️  Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffMultiplier; // Exponential backoff
      } else {
        break;
      }
    }
  }

  throw lastError;
}

const api2 = createFej();

async function demonstrateCustomRetry() {
  try {
    const data = await retryRequest(
      async () => {
        const response = await api2.fej('https://jsonplaceholder.typicode.com/posts/1');
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }
        return await response.json();
      },
      {
        maxAttempts: 3,
        initialDelay: 500,
        backoffMultiplier: 2,
        shouldRetry: (error) => {
          // Retry on 5xx errors or network errors
          return error.status >= 500 || error.name === 'TypeError';
        },
      }
    );

    console.log('✅ Request succeeded:', data.title);
  } catch (error) {
    console.log('❌ All retries failed:', error.message);
  }
}

// Example 3: Retry with Jitter
console.log('\nExample 3: Exponential Backoff with Jitter\n');

/**
 * Calculate delay with exponential backoff and jitter
 * Jitter helps prevent thundering herd problem
 */
function calculateDelayWithJitter(attempt, baseDelay = 1000, maxDelay = 30000) {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

  // Add jitter (random value between 0 and exponentialDelay)
  const jitter = Math.random() * exponentialDelay;

  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

async function demonstrateJitter() {
  console.log('Calculating delays with jitter:');
  for (let attempt = 1; attempt <= 5; attempt++) {
    const delay = calculateDelayWithJitter(attempt, 1000);
    console.log(`Attempt ${attempt}: ${Math.round(delay)}ms`);
  }
}

// Example 4: Conditional Retry (Rate Limiting)
console.log('\nExample 4: Rate Limit Retry\n');

const api4 = createFej();

api4.use(
  'rate-limit-retry',
  async (ctx, next) => {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      await next();

      // Check if we hit rate limit
      if (ctx.response && ctx.response.status === 429) {
        // Get retry-after header
        const retryAfter = ctx.response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;

        if (attempt < maxAttempts) {
          console.log(`⏱️  Rate limited (429). Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Reset response to retry
          ctx.response = null;
          continue;
        }
      }

      // If not rate limited or max attempts reached, break
      break;
    }
  },
  200
);

async function demonstrateRateLimitRetry() {
  try {
    // This is a mock - real APIs will return 429 when rate limited
    const response = await api4.fej('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    console.log(`✅ Fetched ${users.length} users`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Example 5: Retry with Circuit Breaker Pattern
console.log('\nExample 5: Circuit Breaker Pattern\n');

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log('⚠️  Circuit breaker is OPEN - request blocked');
        throw new Error('Circuit breaker is OPEN');
      }
      console.log('🔄 Circuit breaker entering HALF_OPEN state');
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      console.log('✅ Circuit breaker entering CLOSED state');
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      console.log(`❌ Circuit breaker OPEN (${this.failureCount} failures)`);
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 5000, // 5 seconds
});

const api5 = createFej();

async function demonstrateCircuitBreaker() {
  // Simulate multiple failing requests
  for (let i = 1; i <= 5; i++) {
    console.log(`\nRequest ${i}:`);
    try {
      await circuitBreaker.execute(async () => {
        const response = await api5.fej('https://this-will-fail-12345.com');
        return await response.json();
      });
    } catch (error) {
      console.log('Request failed');
    }
  }

  console.log('\n⏱️  Waiting 5 seconds for circuit breaker to reset...');
  await new Promise((resolve) => setTimeout(resolve, 5100));

  console.log('\nRequest after reset:');
  try {
    await circuitBreaker.execute(async () => {
      const response = await api5.fej('https://jsonplaceholder.typicode.com/users/1');
      const user = await response.json();
      console.log('✅ Request succeeded:', user.name);
      return user;
    });
  } catch (error) {
    console.log('Request failed');
  }
}

// Run all examples
async function runExamples() {
  console.log('=== Retry Logic Examples ===\n');

  await demonstrateBuiltInRetry();
  await demonstrateCustomRetry();
  await demonstrateJitter();
  await demonstrateRateLimitRetry();
  await demonstrateCircuitBreaker();

  console.log('\n=== Examples Complete ===');
}

runExamples();
