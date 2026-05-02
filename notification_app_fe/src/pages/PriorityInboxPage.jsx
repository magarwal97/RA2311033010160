/**
 * PriorityInboxPage - Displays top N priority notifications.
 * Uses priority algorithm: Placement > Result > Event + recency.
 * Supports type filtering and configurable N value.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Alert,
  Button,
  Chip,
  Divider,
  Slider,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import { useNotifications } from '../hooks/useNotifications';
import { getTopNPriority } from '../utils/priority';
import { getViewedIds, markAsViewed } from '../utils/viewedTracker';
import { createLogger } from '../utils/logger';

const logger = createLogger('page');

// Stats card component
function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 2,
        flex: 1,
        minWidth: 120,
      }}
    >
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function PriorityInboxPage({ onViewedChange }) {
  const [topN, setTopN] = useState(10);
  const [type, setType] = useState('');
  const [limit] = useState(10);
  const [viewedIds, setViewedIds] = useState(getViewedIds());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch all notifications (API defaults to 20)
  const params = useMemo(() => {
    const p = {};
    if (type) p.notification_type = type;
    return p;
  }, [type]);

  const { notifications, loading, error, refetch } = useNotifications(params);

  // Calculate priority
  const prioritized = useMemo(() => {
    return getTopNPriority(notifications, topN);
  }, [notifications, topN]);

  // Stats
  const stats = useMemo(() => {
    const counts = { Placement: 0, Result: 0, Event: 0 };
    prioritized.forEach((n) => {
      counts[n.Type] = (counts[n.Type] || 0) + 1;
    });
    return counts;
  }, [prioritized]);

  // Log page view
  useEffect(() => {
    logger.info('Priority inbox page loaded');
  }, []);

  const handleMarkViewed = useCallback((id) => {
    markAsViewed(id);
    setViewedIds(getViewedIds());
    onViewedChange?.();
  }, [onViewedChange]);

  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    logger.info(`Priority filter: type=${newType || 'all'}`);
  }, []);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <StarIcon sx={{ color: '#FFD740', fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            Priority Inbox
          </Typography>
          <Chip
            label={`Top ${topN}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 215, 64, 0.12)',
              color: '#FFD740',
              fontWeight: 700,
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Most important notifications ranked by type weight and recency
        </Typography>
      </Box>

      {/* Priority explanation */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'rgba(124, 77, 255, 0.05)',
          border: '1px solid rgba(124, 77, 255, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" color="primary.light">
            Priority Ranking
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          Notifications are scored using: <strong>Type Weight × 1000 + Recency Score</strong>.
          Placement (weight 3) &gt; Result (weight 2) &gt; Event (weight 1). Within the same type, newer notifications rank higher.
        </Typography>
      </Paper>

      {/* Top N slider */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Number of priority notifications to show
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
          <Slider
            id="top-n-slider"
            value={topN}
            onChange={(e, val) => setTopN(val)}
            min={5}
            max={20}
            step={5}
            marks={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 15, label: '15' },
              { value: 20, label: '20' },
            ]}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
        </Box>
      </Paper>

      {/* Type filter */}
      <NotificationFilters
        type={type}
        onTypeChange={handleTypeChange}
        limit={limit}
        onLimitChange={() => {}}
      />

      {/* Stats cards */}
      {!loading && prioritized.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, my: 2, flexWrap: 'wrap' }}>
          <StatCard
            icon={<WorkIcon />}
            label="Placements"
            value={stats.Placement}
            color="#7C4DFF"
          />
          <StatCard
            icon={<SchoolIcon />}
            label="Results"
            value={stats.Result}
            color="#00E5FF"
          />
          <StatCard
            icon={<EventIcon />}
            label="Events"
            value={stats.Event}
            color="#69F0AE"
          />
        </Box>
      )}

      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

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

      {/* Priority notification list */}
      {!loading && !error && (
        <Stack spacing={1.5}>
          {prioritized.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No priority notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {type ? `No ${type} notifications found. Try a different filter.` : 'No notifications available at the moment.'}
              </Typography>
            </Box>
          ) : (
            prioritized.map((notification, index) => (
              <NotificationCard
                key={notification.ID}
                notification={notification}
                isNew={!viewedIds.has(notification.ID)}
                onMarkViewed={handleMarkViewed}
                showPriority={true}
                rank={index + 1}
              />
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}

export default PriorityInboxPage;
