import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { WebSocketMonitor } from '../components/WebSocketMonitor';

export function WebSocketMonitorPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          📡 WebSocket Connection Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Real-time monitoring of WebSocket connections with detailed tracking of active sessions, 
          connection history, message statistics, and client information. Monitor connection 
          durations, message counts, and network activity patterns.
        </Typography>
        
        <WebSocketMonitor />
      </Box>
    </Container>
  );
}