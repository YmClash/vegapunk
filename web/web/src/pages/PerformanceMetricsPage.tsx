import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { PerformanceMetrics } from '../components/PerformanceMetrics';

export function PerformanceMetricsPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          📊 Performance Metrics & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive performance monitoring with real-time metrics, historical data analysis, 
          and visual performance charts. Track system performance, memory usage, response times, 
          and overall system health with advanced analytics and scoring algorithms.
        </Typography>
        
        <PerformanceMetrics />
      </Box>
    </Container>
  );
}