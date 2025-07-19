/**
 * Material-UI Theme Configuration
 * Dark theme inspired by One Piece's Vegapunk aesthetic
 */

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF', // Cyan - representing advanced technology
      light: '#6EFFFF',
      dark: '#00B2CC',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF4081', // Pink - representing creativity
      light: '#FF79B0',
      dark: '#C60055',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5252',
      light: '#FF8A80',
      dark: '#C50E29',
    },
    warning: {
      main: '#FFB74D',
      light: '#FFE57F',
      dark: '#F57C00',
    },
    info: {
      main: '#40C4FF',
      light: '#80D8FF',
      dark: '#0091EA',
    },
    success: {
      main: '#69F0AE',
      light: '#B9F6CA',
      dark: '#00C853',
    },
    background: {
      default: '#0A0E27', // Deep space blue
      paper: '#1A1F3A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #00E5FF 30%, #00B2CC 90%)',
          boxShadow: '0 3px 5px 2px rgba(0, 229, 255, .3)',
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #FF4081 30%, #C60055 90%)',
          boxShadow: '0 3px 5px 2px rgba(255, 64, 129, .3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1F3A',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1A1F3A 0%, #141832 100%)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 229, 255, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0E27',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A0E27',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderLeft: '3px solid #00E5FF',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.2)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          color: '#00E5FF',
        },
        colorSecondary: {
          background: 'rgba(255, 64, 129, 0.1)',
          border: '1px solid rgba(255, 64, 129, 0.3)',
          color: '#FF4081',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #00E5FF 0%, #00B2CC 100%)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2A2F4A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          fontSize: '0.875rem',
        },
      },
    },
  },
});