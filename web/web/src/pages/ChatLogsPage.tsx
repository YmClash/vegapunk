import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { ChatLogsViewer } from '../components/ChatLogsViewer';

export function ChatLogsPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          💬 Chat Logs Viewer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive chat log analysis with real-time filtering, search capabilities, 
          and detailed message tracking. Monitor user interactions, bot responses, 
          system events, and error logs with timestamps and performance metrics.
        </Typography>
        
        <ChatLogsViewer />
      </Box>
    </Container>
  );
}