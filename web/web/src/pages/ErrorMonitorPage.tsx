import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { ErrorMonitor } from '../components/ErrorMonitor';

export function ErrorMonitorPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          🚨 Error Monitor & Recovery
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Advanced error monitoring and system recovery tools. Track system errors, 
          perform health checks, manage error resolution, and trigger automatic recovery 
          procedures. Monitor error rates, view detailed error logs, and maintain system stability.
        </Typography>
        
        <ErrorMonitor />
      </Box>
    </Container>
  );
}