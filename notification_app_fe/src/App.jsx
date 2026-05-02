/**
 * App - Root component for the Campus Notification System.
 * Sets up MUI theme, routing, and global state coordination.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box } from '@mui/material';
import theme from './theme';
import Navbar from './components/Navbar';
import AllNotificationsPage from './pages/AllNotificationsPage';
import PriorityInboxPage from './pages/PriorityInboxPage';
import { getViewedIds, getUnviewedCount } from './utils/viewedTracker';
import { fetchNotifications } from './api/notificationApi';
import { createLogger } from './utils/logger';

const logger = createLogger('component');

function App() {
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate unviewed count on mount and when viewed state changes
  const updateUnviewedCount = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      const viewedIds = getViewedIds();
      const count = (data.notifications || []).filter((n) => !viewedIds.has(n.ID)).length;
      setUnviewedCount(count);
    } catch (err) {
      // Silently handle — badge shows 0
      console.error('Failed to update unviewed count:', err);
    }
  }, []);

  useEffect(() => {
    updateUnviewedCount();
    logger.info('App initialized successfully');
  }, [updateUnviewedCount, refreshKey]);

  const handleViewedChange = useCallback(() => {
    updateUnviewedCount();
  }, [updateUnviewedCount]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    logger.info('Manual refresh triggered');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar unviewedCount={unviewedCount} onRefresh={handleRefresh} />
          <Container
            maxWidth="md"
            sx={{
              py: { xs: 2, sm: 3 },
              px: { xs: 1.5, sm: 3 },
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <AllNotificationsPage
                    key={refreshKey}
                    onViewedChange={handleViewedChange}
                  />
                }
              />
              <Route
                path="/priority"
                element={
                  <PriorityInboxPage
                    key={refreshKey}
                    onViewedChange={handleViewedChange}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
