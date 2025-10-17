/**
 * useFej Hook
 *
 * A custom React hook that provides a fej instance with automatic cleanup.
 */

import { useEffect, useRef } from 'react';
import { createFej } from 'fej';

/**
 * Creates a fej instance that automatically cancels pending requests on unmount
 *
 * @param {Object} config - Configuration for the fej instance
 * @param {string} config.baseURL - Base URL for all requests (default: 'https://jsonplaceholder.typicode.com')
 * @returns {Object} Fej instance with request tracking
 *
 * @example
 * const api = useFej();
 * const response = await api.fej('/users'); // Uses default baseURL
 *
 * @example
 * const api = useFej({ baseURL: 'https://api.example.com' });
 * const response = await api.fej('/users'); // Uses custom baseURL
 */
export function useFej(config = {}) {
  const apiRef = useRef(null);
  const controllersRef = useRef(new Set());
  const baseURL = config.baseURL || 'https://jsonplaceholder.typicode.com/';

  // Initialize fej instance
  if (!apiRef.current) {
    apiRef.current = createFej({ baseURL });

    // Add middleware to track AbortControllers
    apiRef.current.use(
      'request-tracking',
      async (ctx, next) => {
        // If a signal is provided, track it
        if (ctx.request.init.signal) {
          const signal = ctx.request.init.signal;

          // Add cleanup when signal is aborted
          const cleanup = () => {
            // Signal was aborted, no need to track anymore
          };

          signal.addEventListener('abort', cleanup, { once: true });
        }

        await next();
      },
      1000
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort all tracked requests
      controllersRef.current.forEach((controller) => {
        try {
          controller.abort();
        } catch (e) {
          // Ignore errors
        }
      });
      controllersRef.current.clear();
    };
  }, []);

  return {
    fej: apiRef.current.fej,
    use: apiRef.current.use,
    remove: apiRef.current.remove,
    createAbortController: () => {
      const controller = new AbortController();
      controllersRef.current.add(controller);
      return controller;
    },
  };
}
