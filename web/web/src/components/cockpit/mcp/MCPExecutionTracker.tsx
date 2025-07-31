/**
 * MCP Execution Tracker - Advanced Execution Monitoring & Analytics
 * Real-time execution tracking with performance analytics and debugging
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';

import {
  FlashOn as ExecutionIcon,
  PlayArrow as RunningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Pause as PausedIcon,
  Replay as ReplayIcon,
  Visibility as ViewIcon,
  Assessment as AnalyticsIcon,
  Timeline as TimelineIcon,
  Speed as PerformanceIcon,
  BugReport as DebugIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Stop as StopIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface Execution {
  id: string;
  toolId: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  parameters: { [key: string]: any };
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    stackTrace?: string;
  };
  metadata: {
    userId?: string;
    sessionId?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    retryCount: number;
    parentExecutionId?: string;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkIO: number;
    diskIO: number;
    queueTime: number;
    executionTime: number;
  };
  logs: {
    timestamp: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    message: string;
  }[];
}

interface ExecutionMetrics {
  totalExecutions: number;
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  throughput: number; // executions per minute
  resourceUsage: {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    peakMemoryUsage: number;
    totalNetworkIO: number;
  };
  queueMetrics: {
    currentQueueSize: number;
    averageQueueTime: number;
    maxQueueTime: number;
  };
  errorAnalysis: {
    topErrors: { code: string; count: number; message: string }[];
    errorRate: number;
    criticalErrors: number;
  };
}

interface ExecutionTrend {
  timestamp: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  errors: number;
}

export function MCPExecutionTracker() {
  // State management
  const [activeExecutions, setActiveExecutions] = useState<Execution[]>([]);
  const [executionHistory, setExecutionHistory] = useState<Execution[]>([]);
  const [executionMetrics, setExecutionMetrics] = useState<ExecutionMetrics | null>(null);
  const [executionTrends, setExecutionTrends] = useState<ExecutionTrend[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [executionDetailsOpen, setExecutionDetailsOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Mock execution generator
   */
  const generateMockExecution = useCallback((): Execution => {
    const tools = ['file-reader', 'data-analyzer', 'secure-encryptor', 'network-monitor', 'legacy-converter'];
    const statuses: Execution['status'][] = ['pending', 'running', 'completed', 'failed'];
    const priorities: Execution['metadata']['priority'][] = ['low', 'normal', 'high', 'critical'];
    
    const toolId = tools[Math.floor(Math.random() * tools.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const startTime = new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString();
    const duration = status === 'completed' || status === 'failed' ? Math.floor(Math.random() * 10000) : undefined;
    const endTime = duration ? new Date(new Date(startTime).getTime() + duration).toISOString() : undefined;

    return {
      id: `exec_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      toolId,
      toolName: toolId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      status,
      startTime,
      endTime,
      duration,
      parameters: {
        input: `sample_${Math.random().toString(36).substr(2, 8)}`,
        options: { format: 'json', validate: true }
      },
      result: status === 'completed' ? { success: true, data: 'Mock result data' } : undefined,
      error: status === 'failed' ? {
        code: 'EXEC_ERROR',
        message: 'Mock execution error for demonstration',
        details: { errorType: 'ValidationError' }
      } : undefined,
      metadata: {
        userId: `user_${Math.floor(Math.random() * 100)}`,
        sessionId: `session_${Math.random().toString(36).substr(2, 8)}`,
        priority,
        retryCount: Math.floor(Math.random() * 3),
        parentExecutionId: Math.random() > 0.7 ? `parent_${Math.random().toString(36).substr(2, 8)}` : undefined
      },
      performance: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        networkIO: Math.random() * 1024 * 1024, // bytes
        diskIO: Math.random() * 1024 * 1024, // bytes
        queueTime: Math.random() * 5000, // ms
        executionTime: duration || Math.random() * 5000 // ms
      },
      logs: [
        {
          timestamp: startTime,
          level: 'INFO',
          message: 'Execution started'
        },
        {
          timestamp: new Date(new Date(startTime).getTime() + 1000).toISOString(),
          level: 'DEBUG',
          message: 'Processing parameters'
        },
        ...(status === 'failed' ? [{
          timestamp: endTime || new Date().toISOString(),
          level: 'ERROR' as const,
          message: 'Execution failed with error'
        }] : [])
      ]
    };
  }, []);

  /**
   * Fetch execution data
   */
  const fetchExecutionData = useCallback(async () => {
    try {
      // Mock data for development - replace with actual API calls
      const mockActiveExecutions = Array.from({ length: 3 }, () => {
        const exec = generateMockExecution();
        exec.status = Math.random() > 0.5 ? 'running' : 'pending';
        return exec;
      });

      const mockExecutionHistory = Array.from({ length: 20 }, () => generateMockExecution());

      const mockExecutionMetrics: ExecutionMetrics = {
        totalExecutions: 2847,
        activeExecutions: mockActiveExecutions.length,
        completedExecutions: 2578,
        failedExecutions: 145,
        averageExecutionTime: 2847,
        successRate: 0.95,
        throughput: 12.5,
        resourceUsage: {
          avgCpuUsage: 23.4,
          avgMemoryUsage: 45.2,
          peakMemoryUsage: 78.9,
          totalNetworkIO: 1024 * 1024 * 156 // bytes
        },
        queueMetrics: {
          currentQueueSize: 5,
          averageQueueTime: 1245,
          maxQueueTime: 8934
        },
        errorAnalysis: {
          topErrors: [
            { code: 'TIMEOUT_ERROR', count: 45, message: 'Execution timeout' },
            { code: 'VALIDATION_ERROR', count: 32, message: 'Parameter validation failed' },
            { code: 'RESOURCE_ERROR', count: 28, message: 'Resource unavailable' }
          ],
          errorRate: 0.05,
          criticalErrors: 12
        }
      };

      const mockExecutionTrends: ExecutionTrend[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        executions: Math.floor(Math.random() * 50) + 10,
        successRate: 0.9 + Math.random() * 0.1,
        avgDuration: 2000 + Math.random() * 3000,
        errors: Math.floor(Math.random() * 5)
      }));

      setActiveExecutions(mockActiveExecutions);
      setExecutionHistory(mockExecutionHistory);
      setExecutionMetrics(mockExecutionMetrics);
      setExecutionTrends(mockExecutionTrends);
      setError(null);

    } catch (err) {
      setError('Failed to fetch execution data');
      console.error('Execution data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockExecution]);

  /**
   * Real-time execution updates simulation
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate execution status updates
      setActiveExecutions(prev => {
        const updated = prev.map(exec => {
          if (exec.status === 'running' && Math.random() > 0.7) {
            const completed = Math.random() > 0.2;
            return {
              ...exec,
              status: completed ? 'completed' : 'failed',
              endTime: new Date().toISOString(),
              duration: Date.now() - new Date(exec.startTime).getTime(),
              result: completed ? { success: true, data: 'Completed successfully' } : undefined,
              error: !completed ? {
                code: 'RUNTIME_ERROR',
                message: 'Execution failed during processing'
              } : undefined
            };
          }
          return exec;
        });

        // Move completed/failed executions to history
        const stillActive = updated.filter(exec => exec.status === 'running' || exec.status === 'pending');
        const completed = updated.filter(exec => exec.status === 'completed' || exec.status === 'failed');
        
        if (completed.length > 0) {
          setExecutionHistory(prevHistory => [...completed, ...prevHistory.slice(0, 49)]);
        }

        // Add new executions occasionally
        if (stillActive.length < 5 && Math.random() > 0.8) {
          const newExec = generateMockExecution();
          newExec.status = 'pending';
          return [...stillActive, newExec];
        }

        return stillActive;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [generateMockExecution]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchExecutionData();
    const interval = setInterval(fetchExecutionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchExecutionData]);

  /**
   * Get status styling
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <PendingIcon color="warning" />, color: 'warning.main', text: 'Pending' };
      case 'running':
        return { icon: <RunningIcon color="info" />, color: 'info.main', text: 'Running' };
      case 'completed':
        return { icon: <SuccessIcon color="success" />, color: 'success.main', text: 'Completed' };
      case 'failed':
        return { icon: <ErrorIcon color="error" />, color: 'error.main', text: 'Failed' };
      case 'cancelled':
        return { icon: <StopIcon color="action" />, color: 'grey.500', text: 'Cancelled' };
      default:
        return { icon: <InfoIcon />, color: 'grey.500', text: 'Unknown' };
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <ExecutionIcon color="primary" />
        ⚡ MCP Execution Tracker
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Execution Metrics Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {executionMetrics?.activeExecutions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {executionMetrics?.successRate ? (executionMetrics.successRate * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {executionMetrics?.averageExecutionTime ? formatDuration(executionMetrics.averageExecutionTime) : '0ms'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {executionMetrics?.throughput.toFixed(1) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Executions/min
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Executions */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <TimelineIcon color="info" />
            Active Executions ({activeExecutions.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {activeExecutions.length === 0 ? (
            <Alert severity="info">
              No active executions at the moment
            </Alert>
          ) : (
            <List>
              {activeExecutions.map((execution) => {
                const statusDisplay = getStatusDisplay(execution.status);
                const runtime = Date.now() - new Date(execution.startTime).getTime();
                
                return (
                  <ListItem key={execution.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {statusDisplay.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {execution.toolName}
                          </Typography>
                          <Chip 
                            label={execution.metadata.priority} 
                            size="small" 
                            color={getPriorityColor(execution.metadata.priority) as any}
                          />
                          {execution.status === 'running' && (
                            <CircularProgress size={16} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Status: {statusDisplay.text} • Runtime: {formatDuration(runtime)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Started: {new Date(execution.startTime).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedExecution(execution);
                            setExecutionDetailsOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Options">
                        <IconButton size="small">
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Execution History */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon color="secondary" />
            Recent Execution History
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tool</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executionHistory.slice(0, 10).map((execution) => {
                  const statusDisplay = getStatusDisplay(execution.status);
                  
                  return (
                    <TableRow key={execution.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {execution.toolName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {execution.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {statusDisplay.icon}
                          <Typography variant="body2" color={statusDisplay.color}>
                            {statusDisplay.text}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {execution.duration ? formatDuration(execution.duration) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(execution.startTime).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={execution.metadata.priority} 
                          size="small" 
                          color={getPriorityColor(execution.metadata.priority) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedExecution(execution);
                                setExecutionDetailsOpen(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {execution.status === 'failed' && (
                            <Tooltip title="Debug">
                              <IconButton size="small" color="error">
                                <DebugIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Replay">
                            <IconButton size="small" color="primary">
                              <ReplayIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Execution Details Dialog */}
      <Dialog 
        open={executionDetailsOpen} 
        onClose={() => setExecutionDetailsOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Execution Details: {selectedExecution?.toolName}
        </DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Execution ID:</Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {selectedExecution.id}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Tool:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedExecution.toolName}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Status:</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusDisplay(selectedExecution.status).icon}
                          <Typography variant="body2" color={getStatusDisplay(selectedExecution.status).color}>
                            {getStatusDisplay(selectedExecution.status).text}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Priority:</Typography>
                        <Chip 
                          label={selectedExecution.metadata.priority} 
                          size="small" 
                          color={getPriorityColor(selectedExecution.metadata.priority) as any}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Duration:</Typography>
                        <Typography variant="body2">
                          {selectedExecution.duration ? formatDuration(selectedExecution.duration) : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">CPU Usage</Typography>
                          <Typography variant="body2">{selectedExecution.performance.cpuUsage.toFixed(1)}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedExecution.performance.cpuUsage} 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Memory Usage</Typography>
                          <Typography variant="body2">{selectedExecution.performance.memoryUsage.toFixed(1)}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedExecution.performance.memoryUsage} 
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Stack direction="row" spacing={2}>
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary">
                            Queue Time
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatDuration(selectedExecution.performance.queueTime)}
                          </Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary">
                            Execution Time
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatDuration(selectedExecution.performance.executionTime)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Parameters */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Parameters
                    </Typography>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: '#f5f5f5',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}
                    >
                      <pre>{JSON.stringify(selectedExecution.parameters, null, 2)}</pre>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>

              {/* Result/Error */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedExecution.error ? 'Error Details' : 'Result'}
                    </Typography>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: selectedExecution.error ? '#ffebee' : '#f5f5f5',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}
                    >
                      <pre>
                        {selectedExecution.error 
                          ? JSON.stringify(selectedExecution.error, null, 2)
                          : JSON.stringify(selectedExecution.result, null, 2)
                        }
                      </pre>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>

              {/* Execution Logs */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Execution Logs
                    </Typography>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        backgroundColor: '#1e1e1e',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}
                    >
                      {selectedExecution.logs.map((log, index) => (
                        <Box key={index} sx={{ p: 1, display: 'flex', gap: 2 }}>
                          <Typography variant="caption" sx={{ color: '#888888', minWidth: '80px' }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              minWidth: '50px',
                              color: log.level === 'ERROR' ? '#ff5252' : 
                                     log.level === 'WARN' ? '#ff9800' : 
                                     log.level === 'INFO' ? '#2196f3' : '#9e9e9e'
                            }}
                          >
                            {log.level}
                          </Typography>
                          <Typography variant="caption">
                            {log.message}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecutionDetailsOpen(false)}>
            Close
          </Button>
          {selectedExecution?.status === 'failed' && (
            <Button variant="contained" color="primary" startIcon={<ReplayIcon />}>
              Retry Execution
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}