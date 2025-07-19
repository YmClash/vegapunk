import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Alert,
  CircularProgress,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  GitHub as GitHubIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatInterface } from './components/ChatInterface';
import { SystemStatus } from './components/SystemStatus';
import { DebugDashboard } from './components/DebugDashboard';
import { VegapunkTheme } from './theme/VegapunkTheme';
import axios from 'axios';

interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    dashboard: string;
    chat: string;
    ollama: {
      status: string;
      version?: string;
      models?: string[];
      error?: string;
      lastCheck: string;
    };
  };
}

function App() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const theme = React.useMemo(
    () => darkMode ? VegapunkTheme : createTheme({ palette: { mode: 'light' } }),
    [darkMode]
  );

  useEffect(() => {
    checkSystemHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/health');
      setSystemHealth(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Initializing Vegapunk Dashboard...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* App Bar */}
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                🤖 Vegapunk
              </Typography>
              <Typography variant="subtitle2" sx={{ ml: 2, color: 'text.secondary' }}>
                Agentic AI Dashboard
              </Typography>
            </Box>
            <Tooltip title="Toggle dark mode">
              <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="View on GitHub">
              <IconButton 
                href="https://github.com/vegapunk"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Multi-Agent AI System
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Phase 1: Dashboard + Ollama Chat Integration
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && !systemHealth && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}. Please ensure the backend server is running at http://localhost:8080
            </Alert>
          )}

          {/* System Status */}
          <SystemStatus 
            health={systemHealth} 
            error={error} 
            onRefresh={checkSystemHealth} 
          />

          {/* Chat Interface */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              💬 Chat with Vegapunk
            </Typography>
            <ChatInterface />
          </Paper>

          {/* Debug Dashboard - Phase 2 */}
          <Box sx={{ mt: 4 }}>
            <DebugDashboard />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;