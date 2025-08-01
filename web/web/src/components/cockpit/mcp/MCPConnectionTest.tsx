import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

export function MCPConnectionTest() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp/server/status');
      const text = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response text:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
      
      const data = JSON.parse(text);
      setStatus(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Box p={2}>
      <Typography variant="h6">MCP Connection Test</Typography>
      <Button onClick={testConnection} disabled={loading}>
        Test Connection
      </Button>
      {loading && <Typography>Loading...</Typography>}
      {error && (
        <Typography color="error">Error: {error}</Typography>
      )}
      {status && (
        <pre>{JSON.stringify(status, null, 2)}</pre>
      )}
    </Box>
  );
}