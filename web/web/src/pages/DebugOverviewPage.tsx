import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { DebugDashboard } from '../components/DebugDashboard';

export function DebugOverviewPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          🔧 Debug Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive system monitoring and debugging dashboard with real-time insights.
        </Typography>
        
        <DebugDashboard />
      </Box>
    </Container>
  );
}