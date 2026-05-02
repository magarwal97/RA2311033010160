/**
 * AllNotificationsPage - Displays all notifications with filtering and pagination.
 * Features type filtering, limit control, pagination, new/viewed tracking.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Pagination,
  Skeleton,
  Alert,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import { useNotifications } from '../hooks/useNotifications';
import { getViewedIds, markAsViewed, markAllAsViewed } from '../utils/viewedTracker';
import { createLogger } from '../utils/logger';

const logger = createLogger('page');

function AllNotificationsPage({ onViewedChange }) {
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState(getViewedIds());

  // Build query params
  const params = useMemo(() => {
    const p = { limit, page };
    if (type) p.notification_type = type;
    return p;
  }, [type, limit, page]);

  const { notifications, loading, error, refetch } = useNotifications(params);

  // Log page view
  useEffect(() => {
    logger.info('All notifications page loaded');
  }, []);

  // Calculate unviewed count
  const unviewedCount = useMemo(() => {
    return notifications.filter((n) => !viewedIds.has(n.ID)).length;
  }, [notifications, viewedIds]);

  const handleMarkViewed = useCallback((id) => {
    markAsViewed(id);
    setViewedIds(getViewedIds());
    onViewedChange?.();
    logger.debug(`Marked notification viewed: ${id}`);
  }, [onViewedChange]);

  const handleMarkAllViewed = useCallback(() => {
    const ids = notifications.map((n) => n.ID);
    markAllAsViewed(ids);
    setViewedIds(getViewedIds());
    onViewedChange?.();
    logger.info('Marked all notifications viewed');
  }, [notifications, onViewedChange]);

  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    setPage(1); // Reset to first page
    logger.info(`Filter changed: type=${newType || 'all'}`);
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // Estimate total pages (API doesn't return total, so we use heuristic)
  const hasMorePages = notifications.length === limit;

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InboxIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            All Notifications
          </Typography>
          {unviewedCount > 0 && (
            <Chip
              label={`${unviewedCount} new`}
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Browse and manage all your campus notifications
        </Typography>
      </Box>

      {/* Filters */}
      <NotificationFilters
        type={type}
        onTypeChange={handleTypeChange}
        limit={limit}
        onLimitChange={handleLimitChange}
      />

      {/* Actions bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading...' : `Showing ${notifications.length} notifications (Page ${page})`}
        </Typography>
        {unviewedCount > 0 && (
          <Button
            id="mark-all-viewed-btn"
            size="small"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllViewed}
            sx={{ textTransform: 'none' }}
          >
            Mark all as viewed
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && (
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={80}
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}
            />
          ))}
        </Stack>
      )}

      {/* Notification list */}
      {!loading && !error && (
        <Stack spacing={1.5}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {type ? `No ${type} notifications available. Try a different filter.` : 'Check back later for new notifications.'}
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.ID}
                notification={notification}
                isNew={!viewedIds.has(notification.ID)}
                onMarkViewed={handleMarkViewed}
                showPriority={false}
              />
            ))
          )}
        </Stack>
      )}

      {/* Pagination */}
      {!loading && notifications.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            id="pagination"
            count={hasMorePages ? page + 1 : page}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
            showFirstButton
            showLastButton={false}
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default AllNotificationsPage;
