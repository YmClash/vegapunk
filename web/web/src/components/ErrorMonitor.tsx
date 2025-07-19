import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Build as RepairIcon,
  Healing as HealingIcon,
  Timeline as TimelineIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  details?: any;
  resolved?: boolean;
  resolvedAt?: string;
}

interface SystemHealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: string;
  canRecover: boolean;
}

export function ErrorMonitor() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | false>('errors');

  const fetchErrorData = async () => {
    setLoading(true);
    
    try {
      // Fetch error logs from chat logs with error type
      const logsResponse = await axios.get('http://localhost:8080/api/debug/logs?type=error&limit=50');
      
      // Convert chat logs to error logs format
      const errorLogsData = logsResponse.data.logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: 'error' as const,
        message: log.message,
        source: log.socketId ? 'WebSocket' : 'API',
        details: { socketId: log.socketId, responseTime: log.responseTime },
        resolved: false
      }));

      setErrorLogs(errorLogsData);

      // Simulate health checks (in real app, this would be separate endpoints)
      await performHealthChecks();
      
    } catch (err: any) {
      console.error('Failed to fetch error data:', err);
    } finally {
      setLoading(false);
    }
  };

  const performHealthChecks = async () => {
    const checks: SystemHealthCheck[] = [];
    
    try {
      // Check main health endpoint
      const healthResponse = await axios.get('http://localhost:8080/api/health');
      const health = healthResponse.data;
      
      checks.push({
        service: 'Dashboard API',
        status: health.status === 'OK' ? 'healthy' : 'error',
        message: health.status === 'OK' ? 'API responding normally' : 'API not responding',
        lastCheck: new Date().toISOString(),
        canRecover: true
      });

      checks.push({
        service: 'Ollama Service',
        status: health.services.ollama.status === 'healthy' ? 'healthy' : 'error',
        message: health.services.ollama.error || 'Ollama service operational',
        lastCheck: health.services.ollama.lastCheck,
        canRecover: true
      });

      checks.push({
        service: 'Chat Engine',
        status: health.services.chat === 'operational' ? 'healthy' : 'error',
        message: health.services.chat === 'operational' ? 'Chat engine ready' : 'Chat engine issues',
        lastCheck: new Date().toISOString(),
        canRecover: true
      });

      // Check WebSocket status
      const wsResponse = await axios.get('http://localhost:8080/api/debug/websockets');
      const wsData = wsResponse.data;
      
      checks.push({
        service: 'WebSocket Connections',
        status: wsData.stats.activeConnections > 0 ? 'healthy' : 'warning',
        message: `${wsData.stats.activeConnections} active connections`,
        lastCheck: wsData.timestamp,
        canRecover: false
      });

    } catch (error: any) {
      checks.push({
        service: 'System Health Check',
        status: 'error',
        message: 'Failed to perform health checks',
        lastCheck: new Date().toISOString(),
        canRecover: true
      });
    }

    setHealthChecks(checks);
  };

  const handleRecoveryAction = async (service: string) => {
    setLoading(true);
    
    try {
      switch (service) {
        case 'Ollama Service':
          // Try to reinitialize Ollama
          await axios.get('http://localhost:8080/api/debug/ollama');
          break;
        case 'Dashboard API':
          // Refresh health status
          await axios.get('http://localhost:8080/api/health');
          break;
        default:
          console.log(`No recovery action defined for ${service}`);
      }
      
      // Refresh health checks after recovery attempt
      await performHealthChecks();
      
    } catch (error) {
      console.error('Recovery action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const markErrorResolved = (errorId: string) => {
    setErrorLogs(prev => prev.map(error => 
      error.id === errorId 
        ? { ...error, resolved: true, resolvedAt: new Date().toISOString() }
        : error
    ));
  };

  const clearResolvedErrors = () => {
    setErrorLogs(prev => prev.filter(error => !error.resolved));
  };

  useEffect(() => {
    fetchErrorData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchErrorData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <BugIcon />;
    }
  };

  const filteredErrors = filterLevel === 'all' 
    ? errorLogs 
    : errorLogs.filter(error => error.level === filterLevel);

  const errorStats = {
    total: errorLogs.length,
    unresolved: errorLogs.filter(e => !e.resolved).length,
    resolved: errorLogs.filter(e => e.resolved).length,
    recentErrors: errorLogs.filter(e => {
      const errorTime = new Date(e.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return errorTime > oneHourAgo && !e.resolved;
    }).length
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <HealingIcon sx={{ mr: 1, color: 'primary.main' }} />
          Error Monitor & Recovery
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'filled' : 'outlined'}
            size="small"
          />
          <Tooltip title="Refresh Error Data">
            <IconButton onClick={fetchErrorData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Error Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'white', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" component="div">
                {errorStats.unresolved}
              </Typography>
              <Typography variant="body2">
                Unresolved Errors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" component="div">
                {errorStats.recentErrors}
              </Typography>
              <Typography variant="body2">
                Recent (1h)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" component="div">
                {errorStats.resolved}
              </Typography>
              <Typography variant="body2">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" component="div">
                {errorStats.total}
              </Typography>
              <Typography variant="body2">
                Total Errors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2}>
        {/* System Health Checks */}
        <Accordion expanded={expanded === 'health'} onChange={handleAccordionChange('health')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <HealingIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 500 }}>
                System Health Checks
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <Badge 
                  badgeContent={healthChecks.filter(c => c.status === 'error').length}
                  color="error"
                >
                  <Badge 
                    badgeContent={healthChecks.filter(c => c.status === 'warning').length}
                    color="warning"
                  >
                    <HealingIcon />
                  </Badge>
                </Badge>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {healthChecks.map((check) => (
                <Grid item xs={12} md={6} key={check.service}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {check.service}
                        </Typography>
                        {getStatusIcon(check.status)}
                      </Box>
                      
                      <Chip 
                        label={check.status}
                        color={getStatusColor(check.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {check.message}
                      </Typography>
                      
                      <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                        Last checked: {new Date(check.lastCheck).toLocaleString()}
                      </Typography>
                      
                      {check.status !== 'healthy' && check.canRecover && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RepairIcon />}
                          onClick={() => handleRecoveryAction(check.service)}
                          disabled={loading}
                        >
                          Attempt Recovery
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Error Logs */}
        <Accordion expanded={expanded === 'errors'} onChange={handleAccordionChange('errors')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <ErrorIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 500 }}>
                Error Logs ({filteredErrors.length})
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2, display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={filterLevel}
                    label="Filter"
                    onChange={(e) => setFilterLevel(e.target.value)}
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    <MenuItem value="error">Errors Only</MenuItem>
                    <MenuItem value="warning">Warnings Only</MenuItem>
                    <MenuItem value="info">Info Only</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearResolvedErrors}
                  disabled={errorStats.resolved === 0}
                >
                  Clear Resolved
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {filteredErrors.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredErrors.slice(0, 20).map((error) => (
                      <TableRow 
                        key={error.id} 
                        hover
                        sx={{ opacity: error.resolved ? 0.6 : 1 }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getLevelIcon(error.level)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {error.level}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={error.source}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              cursor: 'pointer',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onClick={() => setSelectedError(error)}
                          >
                            {error.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={error.resolved ? 'Resolved' : 'Open'}
                            color={error.resolved ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {!error.resolved && (
                            <Button
                              size="small"
                              onClick={() => markErrorResolved(error.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                No errors found matching the current filter
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Error Details Dialog */}
      <Dialog 
        open={!!selectedError} 
        onClose={() => setSelectedError(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Error Details</DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedError.message}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedError.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Source
                  </Typography>
                  <Typography variant="body1">
                    {selectedError.source}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedError.details && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Additional Details
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedError.details, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedError(null)}>Close</Button>
          {selectedError && !selectedError.resolved && (
            <Button 
              variant="contained"
              onClick={() => {
                markErrorResolved(selectedError.id);
                setSelectedError(null);
              }}
            >
              Mark as Resolved
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}