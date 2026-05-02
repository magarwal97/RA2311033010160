/**
 * Custom hook for fetching and managing notifications.
 * Handles loading states, error handling, and refetch logic.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications } from '../api/notificationApi';
import { createLogger } from '../utils/logger';

const logger = createLogger('hook');

/**
 * Hook for fetching notifications with query parameters.
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.limit] - Max results
 * @param {number} [params.page] - Page number
 * @param {string} [params.notification_type] - Type filter
 * @returns {Object} { notifications, loading, error, refetch }
 */
export function useNotifications(params = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications(params);
      const items = data.notifications || [];
      setNotifications(items);
      logger.info(`Fetched ${items.length} notifications`);
    } catch (err) {
      setError(err.message);
      logger.error(`Fetch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.page, params.notification_type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchData,
  };
}
