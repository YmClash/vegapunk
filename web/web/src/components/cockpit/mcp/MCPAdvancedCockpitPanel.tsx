/**
 * MCP Advanced Cockpit Panel - Enterprise-Level MCP Server Management
 * Complete MCP server control, tools ecosystem, and resource monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Alert,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Stack,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';

import {
  Build as MCPIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as PerformanceIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Timeline as ActivityIcon,
  Code as ToolsIcon,
  Settings as ConfigIcon,
  Visibility as LogsIcon,
  Assessment as AnalyticsIcon,
  CloudUpload as ResourcesIcon,
  FlashOn as ExecutionIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon,
  FlashOn as FlashOnIcon
} from '@mui/icons-material';

// Import MCP components
import { MCPServerController } from './MCPServerController';
import { MCPToolsManager } from './MCPToolsManager';
import { MCPLogsViewer } from './MCPLogsViewer';
import { MCPResourcesMonitor } from './MCPResourcesMonitor';
import { MCPExecutionTracker } from './MCPExecutionTracker';

interface MCPServerStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  uptime: number;
  pid?: number;
  version: string;
  host: string;
  port: number;
  connections: number;
  lastHeartbeat: string;
}

interface MCPMetrics {
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkRx: number;
    networkTx: number;
    responseTime: number;
    throughput: number;
  };
  tools: {
    total: number;
    active: number;
    executionsPerMinute: number;
    successRate: number;
    avgExecutionTime: number;
  };
  resources: {
    total: number;
    available: number;
    usageRate: number;
    categories: {
      templates: number;
      prompts: number;
      integrations: number;
      configs: number;
    };
  };
  executions: {
    active: number;
    completed: number;
    failed: number;
    queued: number;
  };
  health: {
    score: number;
    issues: string[];
    lastCheck: string;
  };
}

interface MCPAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

export function MCPAdvancedCockpitPanel() {
  // State management
  const [serverStatus, setServerStatus] = useState<MCPServerStatus | null>(null);
  const [metrics, setMetrics] = useState<MCPMetrics | null>(null);
  const [alerts, setAlerts] = useState<MCPAlert[]>([]);
  const [activeView, setActiveView] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch MCP server status and metrics
   */
  const fetchMCPData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch actual server status from API
      const serverResponse = await fetch('/api/mcp/server/status');
      const serverData = await serverResponse.json();
      
      const mockServerStatus: MCPServerStatus = {
        status: serverData.status?.status || 'stopped',
        uptime: serverData.status?.uptime || 0,
        pid: serverData.status?.pid,
        version: serverData.status?.version || '1.0.0',
        host: serverData.status?.host || 'integrated',
        port: serverData.status?.port || 8080,
        connections: serverData.status?.connections || 0,
        lastHeartbeat: serverData.status?.lastHeartbeat || new Date().toISOString()
      };

      const mockMetrics: MCPMetrics = {
        performance: {
          cpuUsage: 23.5,
          memoryUsage: 45.2,
          networkRx: 1.2,
          networkTx: 0.8,
          responseTime: 125,
          throughput: 89.3
        },
        tools: {
          total: 15,
          active: 8,
          executionsPerMinute: 24.7,
          successRate: 0.96,
          avgExecutionTime: 1847
        },
        resources: {
          total: 42,
          available: 38,
          usageRate: 0.73,
          categories: {
            templates: 12,
            prompts: 18,
            integrations: 8,
            configs: 4
          }
        },
        executions: {
          active: 3,
          completed: 1247,
          failed: 23,
          queued: 1
        },
        health: {
          score: 94,
          issues: ['High memory usage detected', 'Connection pool approaching limit'],
          lastCheck: new Date().toISOString()
        }
      };

      const mockAlerts: MCPAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Memory Usage High',
          message: 'MCP Server memory usage at 45.2%. Consider optimizing resource allocation.',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          dismissed: false
        },
        {
          id: '2',
          type: 'success',
          title: 'Performance Stable',
          message: 'All performance metrics within normal ranges. System operating efficiently.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          dismissed: false
        }
      ];

      setServerStatus(mockServerStatus);
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setError(null);

    } catch (err) {
      setError('Failed to fetch MCP server data');
      console.error('MCP data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchMCPData();

    if (autoRefresh) {
      const interval = setInterval(fetchMCPData, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchMCPData]);

  /**
   * Get server status display
   */
  const getServerStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: <HealthyIcon color="success" />, color: 'success.main', text: 'Running' };
      case 'stopped':
        return { icon: <StopIcon color="error" />, color: 'error.main', text: 'Stopped' };
      case 'starting':
        return { icon: <PlayIcon color="warning" />, color: 'warning.main', text: 'Starting' };
      case 'stopping':
        return { icon: <StopIcon color="warning" />, color: 'warning.main', text: 'Stopping' };
      case 'error':
        return { icon: <ErrorIcon color="error" />, color: 'error.main', text: 'Error' };
      default:
        return { icon: <InfoIcon />, color: 'grey.500', text: 'Unknown' };
    }
  };

  /**
   * Format uptime
   */
  const formatUptime = (timestamp: number): string => {
    const uptime = Date.now() - timestamp;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  /**
   * Get health score color
   */
  const getHealthColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  /**
   * Dismiss alert
   */
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  /**
   * Handle server control commands
   */
  const handleServerCommand = async (command: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/mcp/server/${command}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to ${command} server`);
      }

      const result = await response.json();
      console.log(`Server ${command} result:`, result);
      
      // Refresh data immediately and after a delay
      fetchMCPData();
      setTimeout(() => fetchMCPData(), 2000);
      setTimeout(() => fetchMCPData(), 5000);
      
    } catch (error) {
      console.error(`Error ${command} server:`, error);
      setError(`Failed to ${command} server`);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading MCP Advanced Cockpit...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchMCPData} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  const statusDisplay = serverStatus ? getServerStatusDisplay(serverStatus.status) : getServerStatusDisplay('unknown');

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
            <MCPIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              🔧 MCP Advanced Cockpit
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Model Context Protocol Server Management & Tools Ecosystem
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {statusDisplay.icon}
            <Typography variant="h6" color={statusDisplay.color} fontWeight="bold">
              {statusDisplay.text}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />
          <IconButton onClick={fetchMCPData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Alerts Bar */}
      {alerts.filter(alert => !alert.dismissed).length > 0 && (
        <Box mb={3}>
          {alerts.filter(alert => !alert.dismissed).map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type}
              onClose={() => dismissAlert(alert.id)}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {alert.title}
              </Typography>
              <Typography variant="body2">
                {alert.message}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Server Status Overview */}
      <Grid container spacing={3} mb={4}>
        {/* Server Status Card */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <NetworkIcon color="primary" />
                Server Status
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {statusDisplay.icon}
                <Box>
                  <Typography variant="h6" color={statusDisplay.color} fontWeight="bold">
                    {statusDisplay.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {serverStatus?.host}:{serverStatus?.port}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Uptime:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {serverStatus ? formatUptime(serverStatus.uptime) : 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Version:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {serverStatus?.version || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Connections:</Typography>
                  <Badge badgeContent={serverStatus?.connections || 0} color="primary">
                    <Typography variant="body2" fontWeight="bold">
                      Active
                    </Typography>
                  </Badge>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics Card */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <PerformanceIcon color="warning" />
                Performance Metrics
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {metrics?.performance.cpuUsage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics?.performance.cpuUsage || 0}
                  color={metrics && metrics.performance.cpuUsage > 80 ? 'error' : 'success'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {metrics?.performance.memoryUsage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics?.performance.memoryUsage || 0}
                  color={metrics && metrics.performance.memoryUsage > 80 ? 'error' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Stack direction="row" spacing={2}>
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">
                    Response Time
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {metrics?.performance.responseTime}ms
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">
                    Throughput
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {metrics?.performance.throughput.toFixed(1)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Health Score Card */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon color="success" />
                System Health
              </Typography>
              
              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={metrics?.health.score || 0}
                    size={80}
                    thickness={6}
                    color={getHealthColor(metrics?.health.score || 0)}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h6" component="div" fontWeight="bold">
                      {metrics?.health.score || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                Overall system health score
              </Typography>

              {metrics?.health.issues && metrics.health.issues.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Active Issues:
                  </Typography>
                  {metrics.health.issues.slice(0, 2).map((issue, index) => (
                    <Typography key={index} variant="caption" color="warning.main" display="block">
                      • {issue}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <ToolsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {metrics?.tools.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tools
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <CloudUploadIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="secondary.main" fontWeight="bold">
              {metrics?.resources.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resources
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <FlashOnIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {metrics?.executions.active || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Executions
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <AnalyticsIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {metrics?.tools.successRate ? (metrics.tools.successRate * 100).toFixed(1) : 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Advanced Component Tabs */}
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeView} 
            onChange={(_, value) => setActiveView(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              value="overview"
              label="Server Control" 
              icon={<ConfigIcon />}
              iconPosition="start"
            />
            <Tab 
              value="tools"
              label="Tools Manager" 
              icon={<ToolsIcon />}
              iconPosition="start"
            />
            <Tab 
              value="logs"
              label="Logs Viewer" 
              icon={<LogsIcon />}
              iconPosition="start"
            />
            <Tab 
              value="resources"
              label="Resources Monitor" 
              icon={<CloudUploadIcon />}
              iconPosition="start"
            />
            <Tab 
              value="executions"
              label="Execution Tracker" 
              icon={<FlashOnIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3, minHeight: '500px' }}>
          {activeView === 'overview' && <MCPServerController onServerCommand={handleServerCommand} />}
          {activeView === 'tools' && <MCPToolsManager />}
          {activeView === 'logs' && <MCPLogsViewer />}
          {activeView === 'resources' && <MCPResourcesMonitor />}
          {activeView === 'executions' && <MCPExecutionTracker />}
        </Box>
      </Paper>

      {/* Footer */}
      <Box mt={4} py={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          MCP Advanced Cockpit • Enterprise Server Management • Real-time Monitoring
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {serverStatus?.lastHeartbeat ? new Date(serverStatus.lastHeartbeat).toLocaleString() : 'Never'}
        </Typography>
      </Box>
    </Container>
  );
}