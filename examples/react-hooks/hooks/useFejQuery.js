/**
 * useFejQuery Hook
 *
 * A React hook for fetching data with built-in loading and error states.
 * Similar to React Query or SWR but using fej.
 */

import { useState, useEffect, useCallback } from 'react';
import { useFej } from './useFej.js';

/**
 * Fetches data with automatic loading and error state management
 *
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options and hook configuration
 * @param {boolean} options.enabled - Whether to automatically fetch (default: true)
 * @param {Array} options.deps - Dependencies array for refetching
 * @param {Function} options.onSuccess - Callback when data is fetched successfully
 * @param {Function} options.onError - Callback when an error occurs
 * @returns {Object} Query state and utilities
 *
 * @example
 * const { data, loading, error, refetch } = useFejQuery('https://api.example.com/users');
 */
export function useFejQuery(url, options = {}) {
  const {
    enabled = true,
    deps = [],
    onSuccess,
    onError,
    ...fetchOptions
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const api = useFej();

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    const controller = api.createAbortController();

    try {
      const response = await api.fej(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Don't set error if request was cancelled
      if (err.name !== 'AbortError') {
        setError(err);

        if (onError) {
          onError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
}
