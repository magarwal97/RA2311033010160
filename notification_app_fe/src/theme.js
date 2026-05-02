import { createTheme } from '@mui/material/styles';

/**
 * Custom Material UI theme for the Campus Notification app.
 * Uses a modern dark theme with vibrant accent colors.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C4DFF',
      light: '#B388FF',
      dark: '#651FFF',
    },
    secondary: {
      main: '#00E5FF',
      light: '#84FFFF',
      dark: '#00B8D4',
    },
    background: {
      default: '#0A0E1A',
      paper: '#121829',
    },
    success: {
      main: '#69F0AE',
    },
    warning: {
      main: '#FFD740',
    },
    error: {
      main: '#FF5252',
    },
    // Custom colors for notification types
    placement: {
      main: '#7C4DFF',
      bg: 'rgba(124, 77, 255, 0.12)',
    },
    result: {
      main: '#00E5FF',
      bg: 'rgba(0, 229, 255, 0.12)',
    },
    event: {
      main: '#69F0AE',
      bg: 'rgba(105, 240, 174, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    body2: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(124, 77, 255, 0.3)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(124, 77, 255, 0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 14, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
