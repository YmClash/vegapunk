/**
 * Analytics Page
 * Main analytics page with advanced visualizations
 */

import React from 'react';
import { Box } from '@mui/material';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';

export const AnalyticsPage: React.FC = () => {
  return (
    <Box>
      <AnalyticsDashboard />
    </Box>
  );
};