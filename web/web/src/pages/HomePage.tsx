import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { ChatInterface } from '../components/ChatInterface';
import { SystemStatus } from '../components/SystemStatus';
import { ModelSelector } from '../components/ModelSelector';
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
      currentModel?: string;
      defaultModel?: string;
      availableModels?: string[];
      totalModels?: number;
      error?: string;
      lastCheck: string;
    };
  };
  system?: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
    };
  };
}

export function HomePage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/health');
      setSystemHealth(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service');
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🤖 Vegapunk
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Multi-Agent AI System
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Autonomous Agentic Intelligence Platform inspired by One Piece
          </Typography>
          
          {/* Status Chips */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Phase 2: Complete" color="success" variant="filled" />
            <Chip label="Debug Interface" color="info" variant="outlined" />
            <Chip label="Real-time Monitoring" color="secondary" variant="outlined" />
          </Box>
        </Box>

        {/* Quick Stats */}
        {systemHealth && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6">
                    {systemHealth.services.ollama.totalModels || 0}
                  </Typography>
                  <Typography variant="body2">
                    AI Models
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6">
                    {systemHealth.services.ollama.status === 'healthy' ? 'Online' : 'Offline'}
                  </Typography>
                  <Typography variant="body2">
                    LLM Service
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6">
                    {systemHealth.system ? Math.floor(systemHealth.system.uptime / 3600) : 0}h
                  </Typography>
                  <Typography variant="body2">
                    Uptime
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6">
                    {systemHealth.status}
                  </Typography>
                  <Typography variant="body2">
                    System Status
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

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

        {/* Model Selection */}
        <Box sx={{ mt: 3 }}>
          <ModelSelector />
        </Box>

        {/* Chat Interface */}
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center',
            fontWeight: 600
          }}>
            💬 Chat with Vegapunk
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Interact with your AI agents through this intelligent chat interface. 
            Switch models, monitor performance, and explore the capabilities of your agentic system.
          </Typography>
          <ChatInterface />
        </Paper>

        {/* Navigation Hint */}
        <Paper variant="outlined" sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            🧭 Explore the Debug Interface
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use the navigation menu on the left to access detailed monitoring and debugging tools:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>Debug Overview</strong> - System dashboard
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>Ollama Monitor</strong> - LLM service details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>Chat Logs</strong> - Message history & analysis
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>WebSocket Monitor</strong> - Connection tracking
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>Error Monitor</strong> - System health & recovery
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">
                <strong>Performance</strong> - Metrics & visualizations
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}