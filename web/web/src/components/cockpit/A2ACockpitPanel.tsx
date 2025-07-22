/**
 * A2A Advanced Cockpit Panel - Enterprise-Level Monitoring Interface
 * Professional A2A Protocol cockpit with network visualization, message flow, logs, and reports
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Alert,
  Fade,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  NetworkCheck as NetworkIcon,
  Message as MessageIcon,
  Assessment as ReportsIcon,
  Speed as PerformanceIcon,
  Visibility as MonitorIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Timeline as FlowIcon,
  Psychology as AgentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Import advanced visualization components (to be created)
import { A2ANetworkVisualization } from './A2ANetworkVisualization';
import { A2AMessageFlowMonitor } from './A2AMessageFlowMonitor';
import { A2ALogsViewer } from './A2ALogsViewer';
import { A2AReportsViewer } from './A2AReportsViewer';
import { A2APerformanceMetrics } from './A2APerformanceMetrics';

// Types for A2A Cockpit data structures
interface NetworkTopology {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'degraded';
    capabilities: string[];
    position?: { x: number; y: number };
    metrics: {
      messagesSent: number;
      messagesReceived: number;
      responseTime: number;
      successRate: number;
    };
  }>;
  links: Array<{
    source: string;
    target: string;
    strength: number;
    messageCount: number;
    latency: number;
  }>;
}

interface MessageFlow {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  type: 'TASK_REQUEST' | 'CAPABILITY_REQUEST' | 'HEALTH_CHECK' | 'ERROR_REPORT' | 'AGENT_ANNOUNCE';
  status: 'sent' | 'delivered' | 'processed' | 'failed';
  payload: any;
  latency?: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

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

interface A2ALog {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: string;
  message: string;
  metadata?: any;
  agentId?: string;
  correlationId?: string;
}

interface A2AReport {
  id: string;
  title: string;
  type: 'performance' | 'communication' | 'reliability' | 'security';
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  data: any;
  summary?: string;
}

export function A2ACockpitPanel() {
  // State management for cockpit data
  const [networkTopology, setNetworkTopology] = useState<NetworkTopology | null>(null);
  const [messageFlow, setMessageFlow] = useState<MessageFlow[]>([]);
  const [a2aMetrics, setA2AMetrics] = useState<A2AMetrics | null>(null);
  const [systemLogs, setSystemLogs] = useState<A2ALog[]>([]);
  const [reports, setReports] = useState<A2AReport[]>([]);
  
  // UI state
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  // Animation and real-time refs
  const intervalRef = useRef<NodeJS.Timeout>();
  const messageAnimationRef = useRef<number>();

  /**
   * Fetch A2A cockpit data from backend
   */
  const fetchCockpitData = useCallback(async () => {
    try {
      setError(null);

      // Simulate API calls with comprehensive mock data
      // In production, these would be actual API endpoints
      const mockNetworkTopology: NetworkTopology = {
        nodes: [
          {
            id: 'vegapunk-main',
            name: 'VegapunkAgent',
            type: 'VegapunkAgent',
            status: 'online',
            capabilities: ['task-coordination', 'resource-management', 'system-monitoring'],
            position: { x: 300, y: 200 },
            metrics: {
              messagesSent: 1247,
              messagesReceived: 982,
              responseTime: 45,
              successRate: 0.98
            }
          },
          {
            id: 'shaka-ethics',
            name: 'ShakaAgent',
            type: 'EthicsAgent',
            status: 'online',
            capabilities: ['ethical-analysis', 'conflict-resolution', 'proactive-monitoring', 'consultation'],
            position: { x: 500, y: 300 },
            metrics: {
              messagesSent: 867,
              messagesReceived: 1123,
              responseTime: 32,
              successRate: 0.96
            }
          },
          {
            id: 'atlas-security',
            name: 'AtlasAgent',
            type: 'SecurityAgent',
            status: 'degraded',
            capabilities: ['security-analysis', 'threat-detection', 'vulnerability-assessment'],
            position: { x: 200, y: 400 },
            metrics: {
              messagesSent: 234,
              messagesReceived: 345,
              responseTime: 78,
              successRate: 0.89
            }
          },
          {
            id: 'edison-creative',
            name: 'EdisonAgent',
            type: 'CreativeAgent',
            status: 'offline',
            capabilities: ['creative-ideation', 'innovation-analysis', 'solution-generation'],
            position: { x: 400, y: 150 },
            metrics: {
              messagesSent: 0,
              messagesReceived: 0,
              responseTime: 0,
              successRate: 0
            }
          }
        ],
        links: [
          { source: 'vegapunk-main', target: 'shaka-ethics', strength: 0.8, messageCount: 456, latency: 12 },
          { source: 'vegapunk-main', target: 'atlas-security', strength: 0.6, messageCount: 234, latency: 23 },
          { source: 'shaka-ethics', target: 'atlas-security', strength: 0.4, messageCount: 123, latency: 18 },
          { source: 'vegapunk-main', target: 'edison-creative', strength: 0.1, messageCount: 0, latency: 999 }
        ]
      };

      const mockMessageFlow: MessageFlow[] = [
        {
          id: 'msg-001',
          timestamp: new Date(Date.now() - 5000).toISOString(),
          from: 'vegapunk-main',
          to: 'shaka-ethics',
          type: 'TASK_REQUEST',
          status: 'processed',
          payload: { task: 'ethical-review', content: 'user-privacy-policy' },
          latency: 45,
          size: 2048,
          priority: 'high'
        },
        {
          id: 'msg-002',
          timestamp: new Date(Date.now() - 3000).toISOString(),
          from: 'shaka-ethics',
          to: 'vegapunk-main',
          type: 'CAPABILITY_REQUEST',
          status: 'delivered',
          payload: { capability: 'resource-allocation', priority: 'medium' },
          latency: 23,
          size: 1024,
          priority: 'medium'
        },
        {
          id: 'msg-003',
          timestamp: new Date(Date.now() - 1000).toISOString(),
          from: 'atlas-security',
          to: 'vegapunk-main',
          type: 'ERROR_REPORT',
          status: 'failed',
          payload: { error: 'authentication-timeout', severity: 'warning' },
          latency: 156,
          size: 512,
          priority: 'critical'
        }
      ];

      const mockA2AMetrics: A2AMetrics = {
        network: {
          totalAgents: 4,
          onlineAgents: 2,
          totalCapabilities: 10,
          networkHealth: 0.78,
          discoveryLatency: 156,
          routingEfficiency: 0.94
        },
        communication: {
          messagesPerSecond: 12.4,
          averageLatency: 34.5,
          successRate: 0.96,
          errorRate: 0.04,
          bandwidthUsage: 45.2,
          queueDepth: 7
        },
        performance: {
          cpuUsage: 34.2,
          memoryUsage: 67.8,
          responseTime: 2847,
          throughput: 156.3,
          concurrentConnections: 12
        },
        security: {
          authenticatedAgents: 2,
          securityAlerts: 1,
          encryptionStatus: true,
          lastSecurityScan: new Date(Date.now() - 3600000).toISOString()
        }
      };

      const mockSystemLogs: A2ALog[] = [
        {
          id: 'log-001',
          timestamp: new Date(Date.now() - 2000).toISOString(),
          level: 'INFO',
          component: 'A2AProtocol',
          message: 'Agent vegapunk-main successfully registered with 3 capabilities',
          agentId: 'vegapunk-main',
          correlationId: 'reg-001'
        },
        {
          id: 'log-002',
          timestamp: new Date(Date.now() - 5000).toISOString(),
          level: 'WARN',
          component: 'MessageRouter',
          message: 'High latency detected for atlas-security agent (156ms)',
          agentId: 'atlas-security',
          correlationId: 'perf-warn-001'
        },
        {
          id: 'log-003',
          timestamp: new Date(Date.now() - 8000).toISOString(),
          level: 'ERROR',
          component: 'AgentRegistry',
          message: 'Agent edison-creative failed health check - marking as offline',
          agentId: 'edison-creative',
          correlationId: 'health-err-001'
        }
      ];

      const mockReports: A2AReport[] = [
        {
          id: 'report-001',
          title: 'Daily Performance Report',
          type: 'performance',
          generatedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          data: { avgResponseTime: 45.2, successRate: 0.96, throughput: 1234 },
          summary: 'Network performance stable with 96% success rate'
        },
        {
          id: 'report-002',
          title: 'Agent Communication Analysis',
          type: 'communication',
          generatedAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
          data: { totalMessages: 2456, topCommunicators: ['vegapunk-main', 'shaka-ethics'] },
          summary: 'High communication efficiency between ethics and main agents'
        }
      ];

      // Update all state
      setNetworkTopology(mockNetworkTopology);
      setMessageFlow(mockMessageFlow);
      setA2AMetrics(mockA2AMetrics);
      setSystemLogs(mockSystemLogs);
      setReports(mockReports);
      setLastUpdate(new Date());

    } catch (err) {
      setError('Failed to fetch A2A cockpit data');
      console.error('A2A Cockpit data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Real-time monitoring effect
   */
  useEffect(() => {
    fetchCockpitData();

    if (isMonitoring) {
      intervalRef.current = setInterval(() => {
        fetchCockpitData();
      }, 5000); // Update every 5 seconds for real-time feel
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, fetchCockpitData]);

  /**
   * Toggle monitoring
   */
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    setIsLoading(true);
    fetchCockpitData();
  };

  /**
   * Get status color for metrics
   */
  const getStatusColor = (value: number, type: 'health' | 'performance' | 'error'): 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'health':
        if (value >= 0.9) return 'success';
        if (value >= 0.7) return 'warning';
        return 'error';
      case 'performance':
        if (value <= 50) return 'success';
        if (value <= 80) return 'warning';
        return 'error';
      case 'error':
        if (value <= 0.05) return 'success';
        if (value <= 0.1) return 'warning';
        return 'error';
      default:
        return 'success';
    }
  };

  /**
   * Format metrics for display
   */
  const formatMetric = (value: number, unit: string): string => {
    if (unit === '%') return `${(value * 100).toFixed(1)}%`;
    if (unit === 'ms') return `${value.toFixed(0)}ms`;
    if (unit === 'MB') return `${value.toFixed(1)}MB`;
    return value.toFixed(1) + unit;
  };

  if (isLoading && !a2aMetrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading A2A Advanced Cockpit...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error && !a2aMetrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Cockpit Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MonitorIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🚀 A2A Advanced Cockpit
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enterprise-level Agent Network Monitoring • Real-time Analytics
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={isMonitoring ? <PlayIcon /> : <PauseIcon />}
            label={isMonitoring ? 'Live Monitoring' : 'Paused'}
            color={isMonitoring ? 'success' : 'warning'}
            variant={isMonitoring ? 'filled' : 'outlined'}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={toggleMonitoring}
                color="primary"
              />
            }
            label="Real-time"
            labelPlacement="start"
          />
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Network Health */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Network Health
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" 
                    color={`${getStatusColor(a2aMetrics?.network.networkHealth || 0, 'health')}.main`}>
                    {formatMetric(a2aMetrics?.network.networkHealth || 0, '%')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a2aMetrics?.network.onlineAgents || 0}/{a2aMetrics?.network.totalAgents || 0} Agents Online
                  </Typography>
                </Box>
                <NetworkIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Throughput */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Messages/sec
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {a2aMetrics?.communication.messagesPerSecond.toFixed(1) || '0.0'}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main">
                      +15% from last hour
                    </Typography>
                  </Stack>
                </Box>
                <MessageIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Success Rate */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" 
                    color={`${getStatusColor(a2aMetrics?.communication.successRate || 0, 'health')}.main`}>
                    {formatMetric(a2aMetrics?.communication.successRate || 0, '%')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Queue Depth: {a2aMetrics?.communication.queueDepth || 0}
                  </Typography>
                </Box>
                <SuccessIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* System Load */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    System Load
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" 
                    color={`${getStatusColor(a2aMetrics?.performance.cpuUsage || 0, 'performance')}.main`}>
                    {formatMetric(a2aMetrics?.performance.cpuUsage || 0, '%')}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={a2aMetrics?.performance.cpuUsage || 0}
                    color={getStatusColor(a2aMetrics?.performance.cpuUsage || 0, 'performance')}
                    sx={{ mt: 1, width: '100%' }}
                  />
                </Box>
                <PerformanceIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Cockpit Grid */}
      <Grid container spacing={3}>
        {/* Real-time Network Topology */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3, height: '600px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔗 A2A Network Topology
              <Badge badgeContent={a2aMetrics?.network.onlineAgents || 0} color="primary">
                <NetworkIcon />
              </Badge>
            </Typography>
            <A2ANetworkVisualization
              topology={networkTopology}
              messageFlow={messageFlow}
              height={520}
              onNodeSelect={setSelectedAgent}
              selectedNode={selectedAgent}
            />
          </Paper>
        </Grid>

        {/* Agent Status Panel */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <A2APerformanceMetrics metrics={a2aMetrics} height={280} />
            
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                🔍 Network Insights
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Discovery Latency
                  </Typography>
                  <Typography variant="h6">
                    {formatMetric(a2aMetrics?.network.discoveryLatency || 0, 'ms')}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Routing Efficiency
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatMetric(a2aMetrics?.network.routingEfficiency || 0, '%')}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Security Status
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SecurityIcon color={a2aMetrics?.security.encryptionStatus ? 'success' : 'error'} />
                    <Typography variant="body2">
                      {a2aMetrics?.security.encryptionStatus ? 'Encrypted' : 'Not Encrypted'}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Message Flow Monitor */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📡 Message Flow Monitor
              <Badge badgeContent={messageFlow.length} color="secondary">
                <FlowIcon />
              </Badge>
            </Typography>
            <A2AMessageFlowMonitor
              messages={messageFlow}
              height={320}
              autoScroll={isMonitoring}
              onMessageSelect={(msg) => console.log('Selected message:', msg)}
            />
          </Paper>
        </Grid>

        {/* System Logs Viewer */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 A2A System Logs
              <Badge badgeContent={systemLogs.filter(log => log.level === 'ERROR').length} color="error">
                <AnalyticsIcon />
              </Badge>
            </Typography>
            <A2ALogsViewer
              logs={systemLogs}
              height={320}
              searchEnabled={true}
              filters={['DEBUG', 'INFO', 'WARN', 'ERROR']}
              autoScroll={isMonitoring}
            />
          </Paper>
        </Grid>

        {/* Reports Dashboard - Élargi pour plus d'espace */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '600px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 A2A Reports Dashboard
              <Badge badgeContent={reports.length} color="info">
                <ReportsIcon />
              </Badge>
            </Typography>
            <A2AReportsViewer
              reports={reports}
              height={520}
              onReportSelect={(report) => console.log('Selected report:', report)}
              onGenerateReport={(type) => console.log('Generate report:', type)}
            />
          </Paper>
        </Grid>

        {/* Network Insights Panel - Repositionné à côté des Reports */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '600px' }}>
            <Typography variant="h6" gutterBottom>
              🔍 Network Insights
            </Typography>
            <Stack spacing={3} sx={{ height: 540, overflow: 'auto' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Discovery Latency
                </Typography>
                <Typography variant="h4" color="info.main">
                  {formatMetric(a2aMetrics?.network.discoveryLatency || 0, 'ms')}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Routing Efficiency
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatMetric(a2aMetrics?.network.routingEfficiency || 0, '%')}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Security Status
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SecurityIcon color={a2aMetrics?.security.encryptionStatus ? 'success' : 'error'} />
                  <Typography variant="body2">
                    {a2aMetrics?.security.encryptionStatus ? 'Encrypted' : 'Not Encrypted'}
                  </Typography>
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Active Connections
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {a2aMetrics?.performance.concurrentConnections || 0}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Messages/sec
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {a2aMetrics?.communication.messagesPerSecond.toFixed(1) || '0.0'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Alert Center - Repositionné en bas sur toute la largeur */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Paper elevation={3} sx={{ p: 3, height: '300px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🚨 Alert Center & System Status
              <Badge badgeContent={a2aMetrics?.security.securityAlerts || 0} color="warning">
                <WarningIcon />
              </Badge>
            </Typography>
            <Grid container spacing={2} sx={{ height: 220 }}>
              {/* Alerts Column */}
              <Grid item xs={12} md={8}>
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                  <Stack spacing={2}>
                    {a2aMetrics?.security.securityAlerts ? (
                      <Alert severity="warning" icon={<WarningIcon />}>
                        High latency detected on atlas-security agent (156ms)
                      </Alert>
                    ) : null}
                    
                    {a2aMetrics?.network.networkHealth && a2aMetrics.network.networkHealth < 0.9 && (
                      <Alert severity="info" icon={<InfoIcon />}>
                        Network health degraded: Only {a2aMetrics.network.onlineAgents} of {a2aMetrics.network.totalAgents} agents online
                      </Alert>
                    )}
                    
                    <Alert severity="success" icon={<SuccessIcon />}>
                      A2A Protocol operating normally with {formatMetric(a2aMetrics?.communication.successRate || 0, '%')} success rate
                    </Alert>
                  </Stack>
                </Box>
              </Grid>
              
              {/* Quick Stats Column */}
              <Grid item xs={12} md={4}>
                <Box sx={{ height: '100%', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    System Overview
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Uptime:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">99.8%</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Total Messages:</Typography>
                      <Typography variant="body2" fontWeight="bold">2,456</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Error Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {formatMetric(a2aMetrics?.communication.errorRate || 0, '%')}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Avg Latency:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="info.main">
                        {formatMetric(a2aMetrics?.communication.averageLatency || 0, 'ms')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Status */}
      <Box sx={{ mt: 4, py: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          A2A Advanced Cockpit • Enterprise Monitoring • Real-time Analytics
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdate.toLocaleString()} • 
          Next update: {isMonitoring ? 'in 5 seconds' : 'paused'}
        </Typography>
      </Box>
    </Box>
  );
}