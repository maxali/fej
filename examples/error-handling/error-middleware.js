/**
 * Example: Error Middleware
 *
 * Demonstrates creating custom error handling middleware:
 * - Global error handler
 * - Error transformation
 * - Error logging
 * - Error recovery
 */

import { createFej } from 'fej';
import { createErrorMiddleware } from 'fej/middleware';

// Example 1: Built-in Error Middleware
console.log('Example 1: Built-in Error Middleware\n');

const api1 = createFej();

api1.use(
  'error-handler',
  createErrorMiddleware((error) => {
    console.error('🚨 Global error handler caught:', error.message);
  }),
  300 // High priority to catch all errors
);

async function demonstrateBuiltInError() {
  try {
    await api1.fej('https://this-will-fail.invalid');
  } catch (error) {
    console.log('✅ Error was handled by middleware and still propagated to catch block\n');
  }
}

// Example 2: Custom Error Transformation Middleware
console.log('Example 2: Error Transformation Middleware\n');

const api2 = createFej();

// Custom error class
class FejError extends Error {
  constructor(message, { code, status, details } = {}) {
    super(message);
    this.name = 'FejError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

api2.use(
  'error-transformer',
  async (ctx, next) => {
    try {
      await next();

      // Transform HTTP errors into FejError
      if (ctx.response && !ctx.response.ok) {
        throw new FejError('HTTP Error', {
          code: 'HTTP_ERROR',
          status: ctx.response.status,
          details: {
            url: ctx.response.url,
            statusText: ctx.response.statusText,
          },
        });
      }
    } catch (error) {
      // Transform different error types
      if (error instanceof FejError) {
        throw error;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new FejError('Network Error', {
          code: 'NETWORK_ERROR',
          details: {
            originalError: error.message,
          },
        });
      } else if (error.name === 'AbortError') {
        throw new FejError('Request Cancelled', {
          code: 'CANCELLED',
        });
      } else {
        throw new FejError('Unknown Error', {
          code: 'UNKNOWN',
          details: {
            originalError: error.message,
          },
        });
      }
    }
  },
  300
);

async function demonstrateErrorTransformation() {
  try {
    await api2.fej('https://jsonplaceholder.typicode.com/invalid-endpoint');
  } catch (error) {
    if (error instanceof FejError) {
      console.log('✅ Error was transformed into FejError:');
      console.log({
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        timestamp: error.timestamp,
      });
    }
  }
}

// Example 3: Error Logging Middleware
console.log('\nExample 3: Error Logging Middleware\n');

const api3 = createFej();

// Mock logger (in real apps, use winston, pino, etc.)
const logger = {
  error: (message, meta) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
};

api3.use(
  'error-logger',
  async (ctx, next) => {
    try {
      await next();

      // Log successful requests
      if (ctx.response && ctx.response.ok) {
        // Success - no logging needed (or log at debug level)
      }
    } catch (error) {
      // Log errors with context
      const errorLog = {
        error: error.message,
        url: ctx.request.url,
        method: ctx.request.init.method || 'GET',
        timestamp: new Date().toISOString(),
        stack: error.stack,
      };

      // Log based on error type
      if (error.status >= 500) {
        logger.error('Server error', errorLog);
      } else if (error.status >= 400) {
        logger.warn('Client error', errorLog);
      } else {
        logger.error('Request error', errorLog);
      }

      // Re-throw to propagate to next middleware
      throw error;
    }
  },
  300
);

async function demonstrateErrorLogging() {
  try {
    const response = await api3.fej('https://jsonplaceholder.typicode.com/posts/99999');
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
  } catch (error) {
    console.log('✅ Error was logged by middleware\n');
  }
}

// Example 4: Error Recovery Middleware
console.log('Example 4: Error Recovery Middleware\n');

const api4 = createFej();

api4.use(
  'error-recovery',
  async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      // Try to recover from certain errors
      if (error.status === 404) {
        console.log('⚠️  404 error - returning empty result');

        // Create a fallback response
        ctx.response = new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        // Don't re-throw - we've recovered
        return;
      }

      // Can't recover - re-throw
      throw error;
    }
  },
  300
);

async function demonstrateErrorRecovery() {
  const response = await api4.fej('https://jsonplaceholder.typicode.com/posts/99999');
  const data = await response.json();
  console.log('✅ Recovered from 404 with fallback:', data);
}

// Example 5: Comprehensive Error Middleware Stack
console.log('\nExample 5: Comprehensive Error Middleware Stack\n');

const api5 = createFej();

// 1. Error transformer (priority: 400)
api5.use(
  'transform',
  async (ctx, next) => {
    try {
      await next();
      if (ctx.response && !ctx.response.ok) {
        throw new FejError('HTTP Error', {
          code: 'HTTP_ERROR',
          status: ctx.response.status,
        });
      }
    } catch (error) {
      if (!(error instanceof FejError)) {
        throw new FejError(error.message, {
          code: 'UNKNOWN',
        });
      }
      throw error;
    }
  },
  400
);

// 2. Error logger (priority: 350)
api5.use(
  'log',
  async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      logger.error('Request failed', {
        error: error.message,
        code: error.code,
        url: ctx.request.url,
      });
      throw error;
    }
  },
  350
);

// 3. Error recovery (priority: 300)
api5.use(
  'recover',
  async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (error.code === 'HTTP_ERROR' && error.status === 404) {
        console.log('🔧 Attempting recovery from 404...');
        ctx.response = new Response(JSON.stringify({ recovered: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
        return;
      }
      throw error;
    }
  },
  300
);

// 4. Final error handler (priority: 250)
api5.use(
  'final',
  async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.log('🚨 Final error handler - error could not be recovered');
      throw error;
    }
  },
  250
);

async function demonstrateMiddlewareStack() {
  try {
    // Test 404 (should be recovered)
    console.log('Testing 404 (should recover):');
    const response1 = await api5.fej('https://jsonplaceholder.typicode.com/posts/99999');
    const data1 = await response1.json();
    console.log('Result:', data1);

    // Test network error (should not recover)
    console.log('\nTesting network error (should not recover):');
    await api5.fej('https://this-will-fail.invalid');
  } catch (error) {
    console.log('Caught unrecoverable error');
  }
}

// Run all examples
async function runExamples() {
  console.log('=== Error Middleware Examples ===\n');

  await demonstrateBuiltInError();
  await demonstrateErrorTransformation();
  await demonstrateErrorLogging();
  await demonstrateErrorRecovery();
  await demonstrateMiddlewareStack();

  console.log('\n=== Examples Complete ===');
}

runExamples();
