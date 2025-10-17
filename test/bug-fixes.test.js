'use strict';

const { expect } = require('chai');
const Fej = require('../dist/index.js').default;

describe('Bug Fixes - Phase 1.1', () => {

  describe('Bug #1: Async middleware execution', () => {
    it('should execute async middleware functions (not await the array)', async () => {
      const fej = new Fej();
      let executionCount = 0;

      // Add async middleware that increments counter
      fej.addAsyncMiddleware(async (init) => {
        executionCount++;
        return { ...init, headers: { ...init.headers, 'X-Test-1': 'value1' } };
      });

      fej.addAsyncMiddleware(async (init) => {
        executionCount++;
        return { ...init, headers: { ...init.headers, 'X-Test-2': 'value2' } };
      });

      // Mock fetch to capture the final init
      let capturedInit;
      global.fetch = async (input, init) => {
        capturedInit = init;
        return new Response('{}', { status: 200 });
      };

      await fej.fej('http://example.com', {});

      // Verify middleware actually executed
      expect(executionCount).to.equal(2);
      expect(capturedInit.headers['X-Test-1']).to.equal('value1');
      expect(capturedInit.headers['X-Test-2']).to.equal('value2');
    });

    it('should execute async middleware in sequential order', async () => {
      const fej = new Fej();
      const executionOrder = [];

      fej.addAsyncMiddleware(async (init) => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 10));
        return init;
      });

      fej.addAsyncMiddleware(async (init) => {
        executionOrder.push(2);
        return init;
      });

      global.fetch = async () => new Response('{}');

      await fej.fej('http://example.com', {});

      expect(executionOrder).to.deep.equal([1, 2]);
    });

    it('should handle async middleware errors with context', async () => {
      const fej = new Fej();

      fej.addAsyncMiddleware(async (init) => {
        throw new Error('Test async error');
      });

      global.fetch = async () => new Response('{}');

      try {
        await fej.fej('http://example.com', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Async middleware execution failed');
        expect(error.message).to.include('Test async error');
      }
    });
  });

  describe('Bug #2: Remove async from addMiddleware', () => {
    it('addMiddleware should not return a promise', () => {
      const fej = new Fej();

      const result = fej.addMiddleware((init) => init);

      // Should be undefined (void), not a Promise
      expect(result).to.be.undefined;
    });

    it('should execute sync middleware immediately without await', async () => {
      const fej = new Fej();
      let executed = false;

      fej.addMiddleware((init) => {
        executed = true;
        return init;
      });

      global.fetch = async () => new Response('{}');

      await fej.fej('http://example.com', {});

      expect(executed).to.be.true;
    });
  });

  describe('Bug #3: Deep merge edge cases', () => {
    it('should handle null and undefined values', async () => {
      const fej = new Fej();

      fej.addMiddleware((init) => {
        return { ...init, nullValue: null, undefinedValue: undefined };
      });

      global.fetch = async (input, init) => {
        expect(init.nullValue).to.be.null;
        expect(init.undefinedValue).to.be.undefined;
        return new Response('{}');
      };

      await fej.fej('http://example.com', {});
    });

    it('should replace arrays instead of merging them', async () => {
      const fej = new Fej();

      // Initial request with array
      const initialInit = {
        headers: { 'Content-Type': 'application/json' },
        tags: ['tag1', 'tag2']
      };

      fej.addMiddleware((init) => {
        return { ...init, tags: ['tag3', 'tag4'] };
      });

      let capturedInit;
      global.fetch = async (input, init) => {
        capturedInit = init;
        return new Response('{}');
      };

      await fej.fej('http://example.com', initialInit);

      // Array should be replaced, not merged
      expect(capturedInit.tags).to.deep.equal(['tag3', 'tag4']);
    });

    it('should handle Headers objects correctly', async () => {
      const fej = new Fej();

      const initialHeaders = new Headers({
        'Content-Type': 'application/json',
        'X-Initial': 'value'
      });

      fej.addMiddleware((init) => {
        const newHeaders = new Headers(init.headers || {});
        newHeaders.set('Authorization', 'Bearer token123');
        return { ...init, headers: newHeaders };
      });

      let capturedInit;
      global.fetch = async (input, init) => {
        capturedInit = init;
        return new Response('{}');
      };

      await fej.fej('http://example.com', { headers: initialHeaders });

      // Should merge Headers properly
      expect(capturedInit.headers.get('Content-Type')).to.equal('application/json');
      expect(capturedInit.headers.get('X-Initial')).to.equal('value');
      expect(capturedInit.headers.get('Authorization')).to.equal('Bearer token123');
    });

    it('should merge nested objects correctly', async () => {
      const fej = new Fej();

      const initialInit = {
        custom: {
          level1: {
            level2: {
              value: 'original'
            }
          }
        }
      };

      fej.addMiddleware((init) => {
        return {
          ...init,
          custom: {
            ...init.custom,
            level1: {
              ...init.custom.level1,
              level2: {
                ...init.custom.level1.level2,
                value: 'updated',
                newValue: 'added'
              }
            }
          }
        };
      });

      let capturedInit;
      global.fetch = async (input, init) => {
        capturedInit = init;
        return new Response('{}');
      };

      await fej.fej('http://example.com', initialInit);

      expect(capturedInit.custom.level1.level2.value).to.equal('updated');
      expect(capturedInit.custom.level1.level2.newValue).to.equal('added');
    });

    it('should not mutate original init object', async () => {
      const fej = new Fej();

      const originalInit = {
        headers: { 'Content-Type': 'application/json' },
        custom: { value: 'original' }
      };

      fej.addMiddleware((init) => {
        return { ...init, custom: { ...init.custom, value: 'modified' } };
      });

      global.fetch = async () => new Response('{}');

      await fej.fej('http://example.com', originalInit);

      // Original should not be modified
      expect(originalInit.custom.value).to.equal('original');
    });
  });

  describe('Bug #4: Error boundaries', () => {
    it('should catch and wrap sync middleware errors', async () => {
      const fej = new Fej();

      fej.addMiddleware((init) => {
        throw new Error('Sync middleware error');
      });

      global.fetch = async () => new Response('{}');

      try {
        await fej.fej('http://example.com', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Middleware execution failed');
        expect(error.message).to.include('Sync middleware error');
      }
    });

    it('should catch and wrap async middleware errors', async () => {
      const fej = new Fej();

      fej.addAsyncMiddleware(async (init) => {
        throw new Error('Async middleware error');
      });

      global.fetch = async () => new Response('{}');

      try {
        await fej.fej('http://example.com', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Async middleware execution failed');
        expect(error.message).to.include('Async middleware error');
      }
    });

    it('should stop execution on first middleware error', async () => {
      const fej = new Fej();
      let secondMiddlewareExecuted = false;

      fej.addMiddleware((init) => {
        throw new Error('First middleware error');
      });

      fej.addMiddleware((init) => {
        secondMiddlewareExecuted = true;
        return init;
      });

      global.fetch = async () => new Response('{}');

      try {
        await fej.fej('http://example.com', {});
      } catch (error) {
        // Expected
      }

      expect(secondMiddlewareExecuted).to.be.false;
    });
  });

  describe('Integration: All fixes working together', () => {
    it('should handle complex scenario with sync and async middleware, arrays, headers, and error handling', async () => {
      const fej = new Fej();

      // Sync middleware with headers
      fej.addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Sync': 'sync-value'
          }
        };
      });

      // Async middleware with array replacement
      fej.addAsyncMiddleware(async (init) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Async': 'async-value'
          },
          tags: ['new-tag']
        };
      });

      // Another sync middleware
      fej.addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Final': 'final-value'
          }
        };
      });

      let capturedInit;
      global.fetch = async (input, init) => {
        capturedInit = init;
        return new Response('{}');
      };

      await fej.fej('http://example.com', {
        headers: { 'Content-Type': 'application/json' },
        tags: ['old-tag']
      });

      // All headers should be present
      expect(capturedInit.headers['Content-Type']).to.equal('application/json');
      expect(capturedInit.headers['X-Sync']).to.equal('sync-value');
      expect(capturedInit.headers['X-Async']).to.equal('async-value');
      expect(capturedInit.headers['X-Final']).to.equal('final-value');

      // Array should be replaced
      expect(capturedInit.tags).to.deep.equal(['new-tag']);
    });
  });
});
