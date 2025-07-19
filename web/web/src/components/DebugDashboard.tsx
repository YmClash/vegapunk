import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Computer as ComputerIcon,
  CloudQueue as CloudIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import axios from 'axios';
import { OllamaMonitor } from './OllamaMonitor';
import { ChatLogsViewer } from './ChatLogsViewer';

interface SystemInfo {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
}

interface OllamaDebugInfo {
  status: string;
  version?: string;
  models?: string[];
  error?: string;
  lastCheck: string;
  timestamp: string;
}

export function DebugDashboard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [ollamaInfo, setOllamaInfo] = useState<OllamaDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSystemInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/debug/system');
      setSystemInfo(response.data);
    } catch (err: any) {
      console.error('Failed to fetch system info:', err);
      setError('Failed to fetch system information');
    }
  };

  const fetchOllamaInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/debug/ollama');
      setOllamaInfo(response.data);
    } catch (err: any) {
      console.error('Failed to fetch Ollama info:', err);
      setError('Failed to fetch Ollama information');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchSystemInfo(),
      fetchOllamaInfo()
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getMemoryUsagePercentage = () => {
    if (!systemInfo) return 0;
    return (systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          🔧 Debug Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'filled' : 'outlined'}
          />
          <Tooltip title="Refresh Now">
            <IconButton onClick={fetchAllData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ComputerIcon sx={{ mr: 1 }} />
              System Overview
            </Typography>
            
            {systemInfo ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Uptime</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatUptime(systemInfo.uptime)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Node.js Version</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemInfo.nodeVersion}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Platform</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemInfo.platform} ({systemInfo.arch})
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Process ID</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemInfo.pid}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <LinearProgress />
            )}
          </Paper>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MemoryIcon sx={{ mr: 1 }} />
              Memory Usage
            </Typography>
            
            {systemInfo ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Heap Usage</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {getMemoryUsagePercentage().toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getMemoryUsagePercentage()} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color={getMemoryUsagePercentage() > 80 ? 'error' : getMemoryUsagePercentage() > 60 ? 'warning' : 'primary'}
                  />
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>RSS</TableCell>
                        <TableCell align="right">{formatBytes(systemInfo.memory.rss)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Heap Total</TableCell>
                        <TableCell align="right">{formatBytes(systemInfo.memory.heapTotal)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Heap Used</TableCell>
                        <TableCell align="right">{formatBytes(systemInfo.memory.heapUsed)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>External</TableCell>
                        <TableCell align="right">{formatBytes(systemInfo.memory.external)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <LinearProgress />
            )}
          </Paper>
        </Grid>

        {/* Advanced Ollama Monitor */}
        <Grid item xs={12}>
          <OllamaMonitor />
        </Grid>

        {/* Chat Logs Viewer */}
        <Grid item xs={12}>
          <ChatLogsViewer />
        </Grid>
      </Grid>
    </Box>
  );
}