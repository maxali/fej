/**
 * Integration tests with real local HTTP server
 * Tests complete request flow through middleware chain with actual HTTP
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';

describe('Integration Tests - Real HTTP Server', () => {
  let server: Server;
  let baseURL: string;
  let port: number;

  // Import functions dynamically to reset state between tests
  let fej: typeof import('../../src/index').fej;
  let addMiddleware: typeof import('../../src/index').addMiddleware;
  let addAsyncMiddleware: typeof import('../../src/index').addAsyncMiddleware;
  let FejModule: typeof import('../../src/index').default;
  let _clearMiddleware: typeof import('../../src/index')._clearMiddleware;

  beforeEach(async () => {
    // Import once (singleton pattern means we don't reset modules)
    if (!fej) {
      const module = await import('../../src/index');
      fej = module.fej;
      addMiddleware = module.addMiddleware;
      addAsyncMiddleware = module.addAsyncMiddleware;
      FejModule = module.default;
      _clearMiddleware = module._clearMiddleware;
    }

    // Clear middleware state before each test
    _clearMiddleware();
  });

  beforeAll(async () => {
    // Create a real HTTP server for testing
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      // Parse request and send appropriate response
      const url = new URL(req.url || '/', `http://localhost`);

      if (url.pathname === '/echo-headers') {
        // Echo back request headers as JSON
        const headers: Record<string, string | string[] | undefined> = {};
        Object.keys(req.headers).forEach((key) => {
          headers[key] = req.headers[key];
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ headers }));
        return;
      }

      if (url.pathname === '/echo-method') {
        // Echo back request method
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: req.method }));
        return;
      }

      if (url.pathname === '/echo-body') {
        // Echo back request body
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ body }));
        });
        return;
      }

      if (url.pathname === '/status/201') {
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ created: true }));
        return;
      }

      if (url.pathname === '/status/404') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      if (url.pathname === '/status/500') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
        return;
      }

      if (url.pathname === '/delay') {
        // Delayed response
        const delayMs = parseInt(url.searchParams.get('ms') || '100', 10);
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ delayed: true, ms: delayMs }));
        }, delayMs);
        return;
      }

      if (url.pathname === '/auth-required') {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ authenticated: true, token: authHeader }));
        return;
      }

      // Default response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'OK' }));
    });

    // Start server on random available port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          port = address.port;
          baseURL = `http://localhost:${port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close server
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('Basic Request Flow', () => {
    it('should make successful GET request to real server', async () => {
      

      const response = await fej(`${baseURL}/echo-method`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.method).toBe('GET');
    });

    it('should make successful POST request to real server', async () => {
      

      const response = await fej(`${baseURL}/echo-method`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.method).toBe('POST');
    });

    it('should send and receive body', async () => {
      

      const requestBody = JSON.stringify({ test: 'data' });
      const response = await fej(`${baseURL}/echo-body`, {
        method: 'POST',
        body: requestBody,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.body).toBe(requestBody);
    });

    it('should handle different status codes', async () => {
      

      const response201 = await fej(`${baseURL}/status/201`);
      expect(response201.status).toBe(201);

      const response404 = await fej(`${baseURL}/status/404`);
      expect(response404.status).toBe(404);

      const response500 = await fej(`${baseURL}/status/500`);
      expect(response500.status).toBe(500);
    });
  });

  describe('Middleware Chain with Real HTTP', () => {
    it('should execute single middleware and make real request', async () => {
      

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Custom-Header': 'middleware-value',
          },
        };
      });

      const response = await fej(`${baseURL}/echo-headers`);
      const data = await response.json();

      expect(data.headers['x-custom-header']).toBe('middleware-value');
    });

    it('should execute multiple middleware in order', async () => {
      

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Step-1': 'first',
          },
        };
      });

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Step-2': 'second',
          },
        };
      });

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Step-3': 'third',
          },
        };
      });

      const response = await fej(`${baseURL}/echo-headers`);
      const data = await response.json();

      expect(data.headers['x-step-1']).toBe('first');
      expect(data.headers['x-step-2']).toBe('second');
      expect(data.headers['x-step-3']).toBe('third');
    });

    it('should execute async middleware with real HTTP', async () => {
      

      addAsyncMiddleware(async (init) => {
        // Simulate async token fetch
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ...init,
          headers: {
            ...init.headers,
            Authorization: 'Bearer async-token',
          },
        };
      });

      const response = await fej(`${baseURL}/auth-required`);
      const data = await response.json();

      expect(data.authenticated).toBe(true);
      expect(data.token).toBe('Bearer async-token');
    });

    it('should execute sync and async middleware together', async () => {
      

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Sync': 'sync-value',
          },
        };
      });

      addAsyncMiddleware(async (init) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Async': 'async-value',
          },
        };
      });

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Final': 'final-value',
          },
        };
      });

      const response = await fej(`${baseURL}/echo-headers`);
      const data = await response.json();

      expect(data.headers['x-sync']).toBe('sync-value');
      expect(data.headers['x-async']).toBe('async-value');
      expect(data.headers['x-final']).toBe('final-value');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle authentication flow', async () => {
      

      // Middleware that adds authentication
      addAsyncMiddleware(async (init) => {
        // Simulate fetching token from storage
        const token = 'real-auth-token-123';
        await new Promise((resolve) => setTimeout(resolve, 5));

        return {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        };
      });

      const response = await fej(`${baseURL}/auth-required`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.authenticated).toBe(true);
    });

    it('should handle request logging', async () => {
      
      const logs: string[] = [];

      // Logging middleware
      addMiddleware((init) => {
        logs.push(`Request: ${init.method || 'GET'}`);
        return init;
      });

      await fej(`${baseURL}/echo-method`, { method: 'POST' });

      expect(logs).toContain('Request: POST');
    });

    it('should handle header transformation', async () => {
      

      // Add default headers
      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        };
      });

      // Add request ID
      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Request-ID': `req-${Date.now()}`,
          },
        };
      });

      const response = await fej(`${baseURL}/echo-headers`);
      const data = await response.json();

      expect(data.headers['content-type']).toBe('application/json');
      expect(data.headers['accept']).toBe('application/json');
      expect(data.headers['x-request-id']).toMatch(/^req-\d+$/);
    });

    it('should handle multiple concurrent requests', async () => {
      

      addMiddleware((init) => {
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Test': 'concurrent',
          },
        };
      });

      const requests = [
        fej(`${baseURL}/echo-headers`),
        fej(`${baseURL}/echo-method`, { method: 'POST' }),
        fej(`${baseURL}/status/201`),
      ];

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(3);
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(201);

      // Verify headers were added to all requests
      const data1 = await responses[0].json();
      expect(data1.headers['x-test']).toBe('concurrent');
    });

    it('should handle delayed responses', async () => {
      

      const startTime = Date.now();
      const response = await fej(`${baseURL}/delay?ms=50`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);

      const data = await response.json();
      expect(data.delayed).toBe(true);
    });
  });

  describe('Error Handling with Real HTTP', () => {
    it('should handle 404 errors', async () => {
      

      const response = await fej(`${baseURL}/status/404`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not found');
    });

    it('should handle 500 errors', async () => {
      

      const response = await fej(`${baseURL}/status/500`);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Server error');
    });

    it('should handle network errors gracefully', async () => {
      

      // Try to connect to a closed port
      await expect(
        fej(`http://localhost:99999/nonexistent`)
      ).rejects.toThrow();
    });

    it('should propagate middleware errors before making request', async () => {
      

      addMiddleware((init) => {
        throw new Error('Middleware error');
      });

      await expect(fej(`${baseURL}/echo-method`)).rejects.toThrow('Middleware execution failed');
    });
  });

  describe('Global Configuration with Real HTTP', () => {
    it('should apply global init to all requests', async () => {
      

      FejModule.setInit({
        headers: {
          'X-Global': 'global-value',
        },
      });

      const response = await fej(`${baseURL}/echo-headers`);
      const data = await response.json();

      expect(data.headers['x-global']).toBe('global-value');
    });

    it('should allow per-request override of global config', async () => {
      

      FejModule.setInit({
        headers: {
          'X-Header': 'global',
        },
      });

      const response = await fej(`${baseURL}/echo-headers`, {
        headers: {
          'X-Header': 'local',
        },
      });

      const data = await response.json();
      expect(data.headers['x-header']).toBe('local');
    });
  });
});
