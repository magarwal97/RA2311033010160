/**
 * NotificationCard component.
 * Displays a single notification with type badge, message, timestamp,
 * and new/viewed indicator.
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Type configuration with icons and colors
const TYPE_CONFIG = {
  Placement: {
    icon: <WorkIcon fontSize="small" />,
    color: '#7C4DFF',
    bg: 'rgba(124, 77, 255, 0.12)',
    label: 'Placement',
  },
  Result: {
    icon: <SchoolIcon fontSize="small" />,
    color: '#00E5FF',
    bg: 'rgba(0, 229, 255, 0.12)',
    label: 'Result',
  },
  Event: {
    icon: <EventIcon fontSize="small" />,
    color: '#69F0AE',
    bg: 'rgba(105, 240, 174, 0.12)',
    label: 'Event',
  },
};

/**
 * Format timestamp to a human-readable relative or absolute format.
 * @param {string} timestamp - Timestamp string
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationCard({ notification, isNew, onMarkViewed, showPriority, rank }) {
  const config = TYPE_CONFIG[notification.Type] || TYPE_CONFIG.Event;

  return (
    <Card
      id={`notification-${notification.ID}`}
      sx={{
        position: 'relative',
        borderLeft: `3px solid ${config.color}`,
        opacity: isNew ? 1 : 0.75,
        bgcolor: isNew ? 'background.paper' : 'rgba(18, 24, 41, 0.5)',
        '&:hover': {
          opacity: 1,
        },
      }}
    >
      {/* New indicator dot */}
      {isNew && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: config.color,
            boxShadow: `0 0 8px ${config.color}`,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1, transform: 'scale(1)' },
              '50%': { opacity: 0.5, transform: 'scale(1.3)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        />
      )}

      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Rank badge for priority view */}
          {rank && (
            <Box
              sx={{
                minWidth: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: config.bg,
                color: config.color,
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {rank}
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Chip
                icon={config.icon}
                label={config.label}
                size="small"
                sx={{
                  bgcolor: config.bg,
                  color: config.color,
                  '& .MuiChip-icon': { color: config.color },
                  height: 24,
                  fontSize: '0.75rem',
                }}
              />
              {isNew && (
                <Chip
                  icon={<FiberNewIcon />}
                  label="New"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 82, 82, 0.12)',
                    color: '#FF5252',
                    '& .MuiChip-icon': { color: '#FF5252' },
                    height: 24,
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {showPriority && notification.priority && (
                <Chip
                  label={`Priority: ${notification.priority}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body1"
              sx={{
                fontWeight: isNew ? 600 : 400,
                color: isNew ? 'text.primary' : 'text.secondary',
                mb: 0.5,
              }}
            >
              {notification.Message}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatTime(notification.Timestamp)}
              </Typography>
            </Box>
          </Box>

          {/* Mark as viewed button */}
          {isNew && onMarkViewed && (
            <Tooltip title="Mark as viewed" arrow>
              <IconButton
                id={`mark-viewed-${notification.ID}`}
                size="small"
                onClick={() => onMarkViewed(notification.ID)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: config.color },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default React.memo(NotificationCard);
