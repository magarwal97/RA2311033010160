/**
 * Navigation bar component.
 * Features app title, page navigation tabs, and notification count badge.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Badge,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InboxIcon from '@mui/icons-material/Inbox';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';

function Navbar({ unviewedCount, onRefresh }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine active tab from URL
  const currentTab = location.pathname === '/priority' ? 1 : 0;

  const handleTabChange = (event, newValue) => {
    navigate(newValue === 0 ? '/' : '/priority');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
        {/* Logo and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <Badge
            badgeContent={unviewedCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                fontWeight: 700,
              },
            }}
          >
            <NotificationsActiveIcon
              sx={{
                color: 'primary.main',
                fontSize: 28,
              }}
            />
          </Badge>
          {!isMobile && (
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Campus Notifications
            </Typography>
          )}
        </Box>

        {/* Navigation tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            flex: 1,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 48,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            id="tab-all-notifications"
            icon={<InboxIcon fontSize="small" />}
            iconPosition="start"
            label={isMobile ? 'All' : 'All Notifications'}
          />
          <Tab
            id="tab-priority-inbox"
            icon={<StarIcon fontSize="small" />}
            iconPosition="start"
            label={isMobile ? 'Priority' : 'Priority Inbox'}
          />
        </Tabs>

        {/* Refresh button */}
        <Tooltip title="Refresh notifications" arrow>
          <IconButton
            id="refresh-button"
            onClick={onRefresh}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(Navbar);
