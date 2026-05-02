/**
 * NotificationFilters component.
 * Provides filter controls for notification type, items per page,
 * and displays active filter count.
 */

import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';

const NOTIFICATION_TYPES = [
  { value: '', label: 'All Types', icon: <FilterListIcon fontSize="small" /> },
  { value: 'Placement', label: 'Placement', icon: <WorkIcon fontSize="small" />, color: '#7C4DFF' },
  { value: 'Result', label: 'Result', icon: <SchoolIcon fontSize="small" />, color: '#00E5FF' },
  { value: 'Event', label: 'Event', icon: <EventIcon fontSize="small" />, color: '#69F0AE' },
];

const LIMIT_OPTIONS = [5, 10];

function NotificationFilters({ type, onTypeChange, limit, onLimitChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      id="notification-filters"
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Type filter */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Filter by Type
        </Typography>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(e, newType) => {
            if (newType !== null) onTypeChange(newType);
          }}
          size="small"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px !important',
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'rgba(124, 77, 255, 0.15)',
                borderColor: '#7C4DFF',
                color: '#B388FF',
              },
            },
          }}
        >
          {NOTIFICATION_TYPES.map(({ value, label, icon, color }) => (
            <ToggleButton
              key={value}
              value={value}
              id={`filter-type-${value || 'all'}`}
              sx={{
                gap: 0.5,
                '&.Mui-selected': {
                  bgcolor: color ? `${color}20` : undefined,
                  borderColor: color || undefined,
                  color: color || undefined,
                },
              }}
            >
              {icon}
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Limit selector */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="limit-label">Show</InputLabel>
        <Select
          labelId="limit-label"
          id="limit-select"
          value={limit}
          label="Show"
          onChange={(e) => onLimitChange(e.target.value)}
          sx={{
            '& .MuiSelect-select': {
              fontSize: '0.85rem',
            },
          }}
        >
          {LIMIT_OPTIONS.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt} items
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Active filter indicator */}
      {type && (
        <Chip
          label={`Filtered: ${type}`}
          size="small"
          onDelete={() => onTypeChange('')}
          sx={{ alignSelf: 'center' }}
        />
      )}
    </Box>
  );
}

export default React.memo(NotificationFilters);
