/**
 * A2A Performance Metrics - Advanced Performance Dashboard with Real-time Gauges and Charts
 * Professional performance monitoring with interactive gauges, trend charts, and system health indicators
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface A2AMetrics {
  network: {
    totalAgents: number;
    onlineAgents: number;
    totalCapabilities: number;
    networkHealth: number;
    discoveryLatency: number;
    routingEfficiency: number;
  };
  communication: {
    messagesPerSecond: number;
    averageLatency: number;
    successRate: number;
    errorRate: number;
    bandwidthUsage: number;
    queueDepth: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    throughput: number;
    concurrentConnections: number;
  };
  security: {
    authenticatedAgents: number;
    securityAlerts: number;
    encryptionStatus: boolean;
    lastSecurityScan: string;
  };
}

interface A2APerformanceMetricsProps {
  metrics: A2AMetrics | null;
  height?: number;
  showTrends?: boolean;
  autoRefresh?: boolean;
  compactMode?: boolean;
}

export function A2APerformanceMetrics({
  metrics,
  height = 300,
  showTrends = true,
  autoRefresh = true,
  compactMode = false
}: A2APerformanceMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState({
    cpuUsage: 80,
    memoryUsage: 85,
    errorRate: 0.05,
    responseTime: 1000
  });

  /**
   * Calculate performance scores and health indicators
   */
  const performanceAnalysis = useMemo(() => {
    if (!metrics) return null;

    const scores = {
      network: 0,
      communication: 0,
      performance: 0,
      security: 0,
      overall: 0
    };

    // Network health score (0-100)
    scores.network = Math.round(
      (metrics.network.networkHealth * 0.4 +
       (metrics.network.onlineAgents / metrics.network.totalAgents) * 0.3 +
       (metrics.network.routingEfficiency) * 0.3) * 100
    );

    // Communication score (0-100)
    scores.communication = Math.round(
      (metrics.communication.successRate * 0.5 +
       (1 - Math.min(metrics.communication.averageLatency / 1000, 1)) * 0.3 +
       (1 - metrics.communication.errorRate) * 0.2) * 100
    );

    // Performance score (0-100)
    scores.performance = Math.round(
      ((100 - metrics.performance.cpuUsage) / 100 * 0.3 +
       (100 - metrics.performance.memoryUsage) / 100 * 0.3 +
       (1 - Math.min(metrics.performance.responseTime / 5000, 1)) * 0.4) * 100
    );

    // Security score (0-100)
    const authRatio = metrics.security.authenticatedAgents / metrics.network.onlineAgents;
    scores.security = Math.round(
      (authRatio * 0.4 +
       (metrics.security.encryptionStatus ? 1 : 0) * 0.4 +
       Math.max(0, 1 - metrics.security.securityAlerts / 10) * 0.2) * 100
    );

    // Overall score (weighted average)
    scores.overall = Math.round(
      (scores.network * 0.25 +
       scores.communication * 0.35 +
       scores.performance * 0.25 +
       scores.security * 0.15)
    );

    // Determine alerts
    const alerts = [];
    if (metrics.performance.cpuUsage > alertThresholds.cpuUsage) {
      alerts.push({ type: 'warning', message: `High CPU usage: ${metrics.performance.cpuUsage.toFixed(1)}%` });
    }
    if (metrics.performance.memoryUsage > alertThresholds.memoryUsage) {
      alerts.push({ type: 'warning', message: `High memory usage: ${metrics.performance.memoryUsage.toFixed(1)}%` });
    }
    if (metrics.communication.errorRate > alertThresholds.errorRate) {
      alerts.push({ type: 'error', message: `High error rate: ${(metrics.communication.errorRate * 100).toFixed(1)}%` });
    }
    if (metrics.performance.responseTime > alertThresholds.responseTime) {
      alerts.push({ type: 'warning', message: `Slow response time: ${metrics.performance.responseTime}ms` });
    }

    return { scores, alerts };
  }, [metrics, alertThresholds]);

  /**
   * Get color for metric values based on thresholds
   */
  const getMetricColor = (value: number, type: 'percentage' | 'inverse-percentage' | 'latency' | 'rate'): 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'percentage':
        if (value >= 90) return 'success';
        if (value >= 70) return 'warning';
        return 'error';
      case 'inverse-percentage':
        if (value <= 50) return 'success';
        if (value <= 80) return 'warning';
        return 'error';
      case 'latency':
        if (value <= 100) return 'success';
        if (value <= 500) return 'warning';
        return 'error';
      case 'rate':
        if (value >= 0.95) return 'success';
        if (value >= 0.85) return 'warning';
        return 'error';
      default:
        return 'success';
    }
  };

  /**
   * Render circular progress gauge
   */
  const renderCircularGauge = (
    value: number,
    label: string,
    color: 'success' | 'warning' | 'error' | 'primary' | 'secondary',
    suffix = '%'
  ) => (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={80}
          thickness={4}
          sx={{ color: 'grey.300' }}
        />
        <CircularProgress
          variant="determinate"
          value={Math.min(value, 100)}
          size={80}
          thickness={4}
          color={color}
          sx={{ position: 'absolute', left: 0 }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
            {value.toFixed(0)}{suffix}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );

  /**
   * Render linear progress metric
   */
  const renderLinearMetric = (
    value: number,
    label: string,
    unit: string,
    color: 'success' | 'warning' | 'error',
    max?: number
  ) => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold" color={`${color}.main`}>
          {value.toFixed(1)}{unit}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={max ? (value / max) * 100 : value}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );

  if (!metrics) {
    return (
      <Paper elevation={3} sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading performance metrics...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            Performance Metrics
            {performanceAnalysis && (
              <Chip
                label={`${performanceAnalysis.scores.overall}/100`}
                color={
                  performanceAnalysis.scores.overall >= 80 ? 'success' :
                  performanceAnalysis.scores.overall >= 60 ? 'warning' : 'error'
                }
                size="small"
              />
            )}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>View</InputLabel>
              <Select
                value={selectedMetric}
                label="View"
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="network">Network</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="security">Security</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Settings">
              <IconButton size="small" onClick={() => setShowAdvanced(!showAdvanced)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Alerts */}
      {performanceAnalysis?.alerts && performanceAnalysis.alerts.length > 0 && (
        <Box sx={{ p: 1 }}>
          <Stack spacing={1}>
            {performanceAnalysis.alerts.slice(0, 2).map((alert, index) => (
              <Alert key={index} severity={alert.type as 'warning' | 'error'} sx={{ py: 0 }}>
                <Typography variant="caption">{alert.message}</Typography>
              </Alert>
            ))}
          </Stack>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {selectedMetric === 'overview' && performanceAnalysis && (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              {renderCircularGauge(
                performanceAnalysis.scores.network,
                'Network Health',
                getMetricColor(performanceAnalysis.scores.network, 'percentage')
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderCircularGauge(
                performanceAnalysis.scores.communication,
                'Communication',
                getMetricColor(performanceAnalysis.scores.communication, 'percentage')
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderCircularGauge(
                performanceAnalysis.scores.performance,
                'Performance',
                getMetricColor(performanceAnalysis.scores.performance, 'percentage')
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderCircularGauge(
                performanceAnalysis.scores.security,
                'Security',
                getMetricColor(performanceAnalysis.scores.security, 'percentage')
              )}
            </Grid>
          </Grid>
        )}

        {selectedMetric === 'network' && (
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Network Status
                </Typography>
                
                {renderLinearMetric(
                  metrics.network.networkHealth * 100,
                  'Network Health',
                  '%',
                  getMetricColor(metrics.network.networkHealth * 100, 'percentage')
                )}
                
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="h4" color="primary">
                      {metrics.network.onlineAgents}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Online Agents
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="secondary">
                      {metrics.network.totalCapabilities}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Capabilities
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {metrics.network.discoveryLatency.toFixed(0)}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Discovery Latency
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {(metrics.network.routingEfficiency * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Routing Efficiency
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}

        {selectedMetric === 'performance' && (
          <Stack spacing={2}>
            {renderLinearMetric(
              metrics.performance.cpuUsage,
              'CPU Usage',
              '%',
              getMetricColor(metrics.performance.cpuUsage, 'inverse-percentage')
            )}
            
            {renderLinearMetric(
              metrics.performance.memoryUsage,
              'Memory Usage',
              '%',
              getMetricColor(metrics.performance.memoryUsage, 'inverse-percentage')
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color={`${getMetricColor(metrics.performance.responseTime, 'latency')}.main`}>
                    {metrics.performance.responseTime.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Response Time (ms)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    {metrics.performance.throughput.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Throughput (ops/min)
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary.main">
                    {metrics.performance.concurrentConnections}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Connections
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}

        {selectedMetric === 'security' && (
          <Stack spacing={2}>
            <Alert 
              severity={metrics.security.encryptionStatus ? 'success' : 'warning'}
              icon={metrics.security.encryptionStatus ? <HealthyIcon /> : <WarningIcon />}
            >
              Encryption is {metrics.security.encryptionStatus ? 'enabled' : 'disabled'}
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {metrics.security.authenticatedAgents}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Authenticated Agents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      color={metrics.security.securityAlerts > 0 ? 'error.main' : 'success.main'}
                    >
                      {metrics.security.securityAlerts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Security Alerts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Security Scan: {new Date(metrics.security.lastSecurityScan).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Real-time metrics • Updated every 5s
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Auto-refresh
            </Typography>
            <Switch checked={autoRefresh} size="small" />
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}