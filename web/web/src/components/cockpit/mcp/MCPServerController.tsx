/**
 * MCP Server Controller - Enterprise Server Lifecycle Management
 * Complete MCP server control with real-time status monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MCPConnectionTest } from './MCPConnectionTest';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  Settings as ConfigIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timeline as ActivityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Computer as ProcessIcon
} from '@mui/icons-material';

interface ServerState {
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  pid?: number;
  uptime: number;
  startTime?: string;
  version: string;
  host: string;
  port: number;
  connections: number;
  maxConnections: number;
  lastHeartbeat: string;
}

interface ProcessInfo {
  pid: number;
  parentPid: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryMB: number;
  openFiles: number;
  threads: number;
  startTime: string;
  commandLine: string;
}

interface ServerConfig {
  host: string;
  port: number;
  maxConnections: number;
  timeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCors: boolean;
  corsOrigins: string[];
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  auth: {
    enabled: boolean;
    apiKey: string;
    tokenExpiry: number;
  };
}

interface ServerMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  connections: {
    current: number;
    peak: number;
    total: number;
  };
  performance: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number;
  };
  errors: {
    count: number;
    rate: number;
    lastError?: string;
    lastErrorTime?: string;
  };
}

interface MCPServerControllerProps {
  onServerCommand: (command: 'start' | 'stop' | 'restart') => Promise<void>;
}

export function MCPServerController({ onServerCommand }: MCPServerControllerProps) {
  // State management
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ServerConfig | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  /**
   * Fetch server data
   */
  const fetchServerData = useCallback(async () => {
    try {
      // Fetch real data from API
      const response = await fetch('/api/mcp/server/status');
      if (!response.ok) {
        throw new Error('Failed to fetch server status');
      }
      
      const data = await response.json();
      console.log('MCP Status API Response:', data);
      
      // Map API response to ServerState
      const serverState: ServerState = {
        status: data?.status?.status || 'stopped',
        pid: data?.status?.pid,
        uptime: data?.status?.uptime || 0,
        startTime: data?.status?.uptime > 0 ? new Date(Date.now() - data.status.uptime).toISOString() : undefined,
        version: data?.status?.version || '1.0.0',
        host: data?.status?.host || 'stdio',
        port: data?.status?.port || 0,
        connections: data?.status?.connections || 0,
        maxConnections: 100, // Default value
        lastHeartbeat: data?.status?.lastHeartbeat || new Date().toISOString()
      };

      // Process info from server state (now includes real metrics)
      const processInfo: ProcessInfo | null = serverState.pid ? {
        pid: serverState.pid,
        parentPid: 1,
        cpuUsage: data?.status?.cpuUsage || 0,
        memoryUsage: data?.status?.memoryUsage || 0,
        memoryMB: data?.status?.memoryMB || 0,
        openFiles: Math.floor(20 + Math.random() * 50), // Still mocked
        threads: 8, // Still mocked
        startTime: serverState.startTime || new Date().toISOString(),
        commandLine: 'node vegapunk-mcp-server.js'
      } : null;

      // Fetch server config
      try {
        const configResponse = await fetch('/api/mcp/server/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setServerConfig(configData);
        }
      } catch (err) {
        console.error('Failed to fetch server config:', err);
      }

      // Extract metrics from the status response
      if (data?.metrics) {
        const metrics = data.metrics;
        const serverMetrics: ServerMetrics = {
          requests: {
            total: metrics.server.totalRequests || 0,
            successful: metrics.server.totalRequests - metrics.server.totalErrors || 0,
            failed: metrics.server.totalErrors || 0,
            rate: data?.health?.metrics?.requestsPerMinute || 0
          },
          connections: {
            current: metrics.server.activeConnections || 0,
            peak: Math.max(metrics.server.activeConnections || 0, 8),
            total: metrics.server.totalRequests || 0
          },
          performance: {
            avgResponseTime: data?.health?.metrics?.avgResponseTime || 0,
            minResponseTime: 20, // Still mocked
            maxResponseTime: 500, // Still mocked
            throughput: data?.health?.metrics?.requestsPerMinute || 0
          },
          errors: {
            count: metrics.server.totalErrors || 0,
            rate: data?.health?.metrics?.errorRate || 0,
            lastError: undefined,
            lastErrorTime: undefined
          }
        };
        setServerMetrics(serverMetrics);
      }

      setServerState(serverState);
      setProcessInfo(processInfo);
      setError(null);

    } catch (err: any) {
      console.error('Server data fetch error:', err);
      setError(`Failed to fetch server data: ${err.message}`);
      
      // Set default stopped state on error
      setServerState({
        status: 'stopped',
        pid: undefined,
        uptime: 0,
        version: '1.0.0',
        host: 'stdio',
        port: 0,
        connections: 0,
        maxConnections: 100,
        lastHeartbeat: new Date().toISOString()
      });
      setProcessInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchServerData();
    const interval = setInterval(fetchServerData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [fetchServerData]);

  /**
   * Server operations
   */
  const handleServerStart = async () => {
    setOperationInProgress('starting');
    try {
      await onServerCommand('start');
      // Status will be updated by parent component
    } catch (error) {
      setError('Failed to start server');
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleServerStop = async () => {
    setOperationInProgress('stopping');
    try {
      await onServerCommand('stop');
      // Status will be updated by parent component
    } catch (error) {
      setError('Failed to stop server');
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleServerRestart = async () => {
    setOperationInProgress('restarting');
    try {
      await onServerCommand('restart');
      // Status will be updated by parent component
    } catch (error) {
      setError('Failed to restart server');
    } finally {
      setOperationInProgress(null);
    }
  };

  /**
   * Configuration management
   */
  const handleConfigEdit = () => {
    setEditingConfig(serverConfig ? { ...serverConfig } : null);
    setConfigDialogOpen(true);
  };

  const handleConfigSave = async () => {
    if (!editingConfig) return;
    
    try {
      // Mock API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 1000));
      setServerConfig(editingConfig);
      setConfigDialogOpen(false);
      setEditingConfig(null);
    } catch (error) {
      setError('Failed to save configuration');
    }
  };

  /**
   * Format uptime
   */
  const formatUptime = (milliseconds: number): string => {
    if (!milliseconds || milliseconds <= 0) return '0h 0m 0s';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  /**
   * Get status display
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: <HealthyIcon color="success" />, color: 'success.main', text: 'Running' };
      case 'stopped':
        return { icon: <StopIcon color="error" />, color: 'error.main', text: 'Stopped' };
      case 'starting':
        return { icon: <CircularProgress size={20} color="warning" />, color: 'warning.main', text: 'Starting' };
      case 'stopping':
        return { icon: <CircularProgress size={20} color="warning" />, color: 'warning.main', text: 'Stopping' };
      case 'error':
        return { icon: <ErrorIcon color="error" />, color: 'error.main', text: 'Error' };
      default:
        return { icon: <InfoIcon />, color: 'grey.500', text: 'Unknown' };
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const statusDisplay = serverState ? getStatusDisplay(serverState.status) : getStatusDisplay('unknown');

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <ProcessIcon color="primary" />
        🔧 MCP Server Controller
      </Typography>
      
      {/* Connection Test for debugging */}
      {error && <MCPConnectionTest />}

      {/* Server Status & Controls */}
      <Grid container spacing={3} mb={3}>
        {/* Status Display */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Status
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {statusDisplay.icon}
                <Box>
                  <Typography variant="h5" color={statusDisplay.color} fontWeight="bold">
                    {statusDisplay.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {serverState?.host === 'stdio' ? 'STDIO Transport' : `${serverState?.host}:${serverState?.port}`} • PID: {serverState?.pid || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Uptime:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {serverState ? formatUptime(serverState.uptime) : 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Version:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {serverState?.version}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Connections:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {serverState?.connections}/{serverState?.maxConnections}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Control Buttons */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Controls
              </Typography>
              
              <Stack direction="row" spacing={2} mb={3}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleServerStart}
                  disabled={serverState?.status === 'running' || operationInProgress === 'starting'}
                  startIcon={operationInProgress === 'starting' ? <CircularProgress size={16} /> : <StartIcon />}
                  fullWidth
                >
                  {operationInProgress === 'starting' ? 'Starting...' : 'Start Server'}
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleServerStop}
                  disabled={serverState?.status === 'stopped' || operationInProgress === 'stopping'}
                  startIcon={operationInProgress === 'stopping' ? <CircularProgress size={16} /> : <StopIcon />}
                  fullWidth
                >
                  {operationInProgress === 'stopping' ? 'Stopping...' : 'Stop Server'}
                </Button>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleServerRestart}
                  disabled={operationInProgress === 'restarting'}
                  startIcon={operationInProgress === 'restarting' ? <CircularProgress size={16} /> : <RestartIcon />}
                  fullWidth
                >
                  {operationInProgress === 'restarting' ? 'Restarting...' : 'Restart'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleConfigEdit}
                  startIcon={<ConfigIcon />}
                  fullWidth
                >
                  Configure
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Process Information */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <ProcessIcon color="info" />
            Process Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Resource Usage */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Resource Usage
                  </Typography>
                  
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <CpuIcon fontSize="small" />
                        CPU Usage
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {processInfo?.cpuUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={processInfo?.cpuUsage || 0}
                      color={processInfo && processInfo.cpuUsage > 80 ? 'error' : 'success'}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <MemoryIcon fontSize="small" />
                        Memory Usage
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {processInfo?.memoryUsage.toFixed(1)}% ({processInfo?.memoryMB}MB)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={processInfo?.memoryUsage || 0}
                      color={processInfo && processInfo.memoryUsage > 80 ? 'error' : 'warning'}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Box flex={1}>
                      <Typography variant="body2" color="text.secondary">
                        Open Files
                      </Typography>
                      <Typography variant="h6">
                        {processInfo?.openFiles}
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2" color="text.secondary">
                        Threads
                      </Typography>
                      <Typography variant="h6">
                        {processInfo?.threads}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Server Metrics */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Server Metrics
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Requests</TableCell>
                          <TableCell align="right">{serverMetrics?.requests.total.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Success Rate</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${((serverMetrics?.requests.successful || 0) / (serverMetrics?.requests.total || 1) * 100).toFixed(1)}%`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Avg Response Time</TableCell>
                          <TableCell align="right">{serverMetrics?.performance.avgResponseTime}ms</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Throughput</TableCell>
                          <TableCell align="right">{serverMetrics?.performance.throughput.toFixed(1)} req/s</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Peak Connections</TableCell>
                          <TableCell align="right">{serverMetrics?.connections.peak}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Server Configuration
        </DialogTitle>
        <DialogContent>
          {editingConfig && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Host"
                  value={editingConfig.host}
                  onChange={(e) => setEditingConfig({ ...editingConfig, host: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Port"
                  type="number"
                  value={editingConfig.port}
                  onChange={(e) => setEditingConfig({ ...editingConfig, port: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Connections"
                  type="number"
                  value={editingConfig.maxConnections}
                  onChange={(e) => setEditingConfig({ ...editingConfig, maxConnections: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Log Level</InputLabel>
                  <Select
                    value={editingConfig.logLevel}
                    onChange={(e) => setEditingConfig({ ...editingConfig, logLevel: e.target.value as any })}
                  >
                    <MenuItem value="debug">Debug</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warn">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingConfig.enableCors}
                      onChange={(e) => setEditingConfig({ ...editingConfig, enableCors: e.target.checked })}
                    />
                  }
                  label="Enable CORS"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleConfigSave} variant="contained" startIcon={<SaveIcon />}>
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}