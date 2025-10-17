/**
 * useFejMutation Hook
 *
 * A React hook for mutations (POST, PUT, PATCH, DELETE) with optimistic updates.
 */

import { useState, useCallback } from 'react';
import { useFej } from './useFej.js';

/**
 * Creates a mutation function with loading and error states
 *
 * @param {string} url - The URL to send the mutation to
 * @param {Object} options - Mutation options
 * @param {string} options.method - HTTP method (POST, PUT, PATCH, DELETE)
 * @param {Function} options.onSuccess - Callback when mutation succeeds
 * @param {Function} options.onError - Callback when mutation fails
 * @param {Function} options.onMutate - Callback before mutation (for optimistic updates)
 * @returns {Object} Mutation state and mutate function
 *
 * @example
 * const { mutate, loading, error } = useFejMutation('/api/posts', {
 *   method: 'POST',
 *   onSuccess: (data) => console.log('Created:', data),
 * });
 *
 * mutate({ title: 'New Post', body: 'Content' });
 */
export function useFejMutation(url, options = {}) {
  const {
    method = 'POST',
    onSuccess,
    onError,
    onMutate,
    ...fetchOptions
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useFej();

  const mutate = useCallback(async (variables) => {
    setLoading(true);
    setError(null);

    // Call onMutate for optimistic updates
    let context;
    if (onMutate) {
      context = await onMutate(variables);
    }

    try {
      const response = await api.fej(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        body: JSON.stringify(variables),
        ...fetchOptions,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      if (onSuccess) {
        onSuccess(result, variables, context);
      }

      return result;
    } catch (err) {
      setError(err);

      if (onError) {
        onError(err, variables, context);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method, onSuccess, onError, onMutate]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
}
