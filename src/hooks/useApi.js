import { useState, useCallback } from 'react';
import { useAnalytics } from './useAnalytics.js';

// Custom hook for API calls with loading states and error handling
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { trackApiResponse } = useAnalytics();

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      onSuccess,
      onError,
      showLoading = true,
      endpoint = 'unknown',
      method = 'GET',
    } = options;

    if (showLoading) setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;

      // Track successful API response
      trackApiResponse(endpoint, method, 200, duration);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      const status = err.status || 500;

      // Track failed API response
      trackApiResponse(endpoint, method, status, duration, err.message);

      setError(err);

      if (onError) {
        onError(err);
      } else {
        console.error('API Error:', err);
      }

      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [trackApiResponse]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Hook for handling multiple API calls
export const useApiQueue = () => {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const { trackApiResponse } = useAnalytics();

  const addToQueue = useCallback((apiCall, options = {}) => {
    const queueItem = {
      id: Date.now() + Math.random(),
      apiCall,
      options,
      status: 'pending',
      result: null,
      error: null,
    };

    setQueue(prev => [...prev, queueItem]);
    return queueItem.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (processing) return;

    setProcessing(true);

    try {
      const pendingItems = queue.filter(item => item.status === 'pending');

      for (const item of pendingItems) {
        const startTime = Date.now();

        try {
          const result = await item.apiCall();
          const duration = Date.now() - startTime;

          // Track successful API response
          trackApiResponse(
            item.options.endpoint || 'queue',
            item.options.method || 'GET',
            200,
            duration
          );

          setQueue(prev => prev.map(queueItem =>
            queueItem.id === item.id
              ? { ...queueItem, status: 'completed', result }
              : queueItem
          ));

          if (item.options.onSuccess) {
            item.options.onSuccess(result);
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          const status = error.status || 500;

          // Track failed API response
          trackApiResponse(
            item.options.endpoint || 'queue',
            item.options.method || 'GET',
            status,
            duration,
            error.message
          );

          setQueue(prev => prev.map(queueItem =>
            queueItem.id === item.id
              ? { ...queueItem, status: 'failed', error }
              : queueItem
          ));

          if (item.options.onError) {
            item.options.onError(error);
          }
        }
      }
    } finally {
      setProcessing(false);
    }
  }, [queue, processing, trackApiResponse]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const removeFromQueue = useCallback((id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    queue,
    processing,
    addToQueue,
    processQueue,
    clearQueue,
    removeFromQueue,
  };
};

// Hook for caching API responses
export const useApiCache = (cacheKey, apiCall, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const {
    ttl = 5 * 60 * 1000, // 5 minutes default TTL
    staleWhileRevalidate = false,
  } = options;

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const cached = localStorage.getItem(`api_cache_${cacheKey}`);

    // Check if we have valid cached data
    if (!force && cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = now - timestamp;

        if (age < ttl) {
          setData(cachedData);
          setLastFetch(timestamp);
          return cachedData;
        }

        // If stale-while-revalidate is enabled, return stale data and fetch in background
        if (staleWhileRevalidate && age < ttl * 2) {
          setData(cachedData);
          setLastFetch(timestamp);
          // Continue to fetch fresh data below
        }
      } catch (err) {
        console.warn('Failed to parse cached data:', err);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      const timestamp = Date.now();

      // Cache the result
      localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify({
        data: result,
        timestamp,
      }));

      setData(result);
      setLastFetch(timestamp);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, apiCall, ttl, staleWhileRevalidate]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(`api_cache_${cacheKey}`);
    setData(null);
    setLastFetch(null);
  }, [cacheKey]);

  const isStale = useCallback(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > ttl;
  }, [lastFetch, ttl]);

  return {
    data,
    loading,
    error,
    lastFetch,
    fetchData,
    invalidateCache,
    isStale: isStale(),
  };
};