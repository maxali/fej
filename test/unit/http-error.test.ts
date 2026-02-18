import { describe, expect, it } from 'vitest';
import { FejHttpError } from '../../src/errors.js';
import { FejError } from '../../src/errors.js';

describe('FejHttpError', () => {
  const headers = new Headers({ 'content-type': 'application/json' });
  const error = new FejHttpError(
    'HTTP 404: Not Found',
    404,
    'Not Found',
    { error: 'resource not found' },
    headers
  );

  describe('instanceof chain', () => {
    it('is instanceof FejHttpError', () => {
      expect(error).toBeInstanceOf(FejHttpError);
    });

    it('is instanceof FejError', () => {
      expect(error).toBeInstanceOf(FejError);
    });

    it('is instanceof Error', () => {
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('properties', () => {
    it('.name is FejHttpError', () => {
      expect(error.name).toBe('FejHttpError');
    });

    it('.message contains the status info', () => {
      expect(error.message).toBe('HTTP 404: Not Found');
    });

    it('.status is the numeric status code', () => {
      expect(error.status).toBe(404);
    });

    it('.statusText is the status text', () => {
      expect(error.statusText).toBe('Not Found');
    });

    it('.data holds the parsed response body', () => {
      expect(error.data).toEqual({ error: 'resource not found' });
    });

    it('.headers is a Headers object', () => {
      expect(error.headers).toBeInstanceOf(Headers);
      expect(error.headers.get('content-type')).toBe('application/json');
    });

    it('.statusCode (inherited from FejError) equals status', () => {
      expect(error.statusCode).toBe(404);
    });
  });

  describe('error message format', () => {
    it('formats message as HTTP {status}: {statusText}', () => {
      expect(error.message).toBe('HTTP 404: Not Found');
    });
  });

  describe('with context', () => {
    it('when FejContext is passed, .context is accessible', () => {
      const context = {
        request: {
          url: 'https://api.example.com/resource',
          init: { method: 'GET' },
        },
        state: {},
      };

      const errorWithContext = new FejHttpError(
        'HTTP 404: Not Found',
        404,
        'Not Found',
        { error: 'resource not found' },
        headers,
        context
      );

      expect(errorWithContext.context).toBe(context);
      expect(errorWithContext.context?.request.url).toBe(
        'https://api.example.com/resource'
      );
    });
  });
});
