import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { OllamaMonitor } from '../components/OllamaMonitor';

export function OllamaMonitorPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          🤖 Ollama Service Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Monitor your Ollama LLM service with detailed status information, model management, 
          and performance metrics. Track connection health, response times, and available models.
        </Typography>
        
        <OllamaMonitor />
      </Box>
    </Container>
  );
}