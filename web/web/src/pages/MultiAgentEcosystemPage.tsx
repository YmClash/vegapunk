/**
 * Multi-Agent Ecosystem Page - Unified A2A + LangGraph + MCP Dashboard
 * Complete overview of the tri-protocol agent ecosystem
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  AccountTree as EcosystemIcon,
  Refresh as RefreshIcon,
  HealthAndSafety as HealthIcon,
  Speed as PerformanceIcon,
  Timeline as WorkflowIcon,
  Public as ProtocolIcon,
  Psychology as AgentIcon,
  Build as ToolIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Import our monitoring components
import { A2ANetworkMonitor } from '../components/A2ANetworkMonitor';
import { LangGraphWorkflowMonitor } from '../components/LangGraphWorkflowMonitor';
import { MCPResourcesDashboard } from '../components/MCPResourcesDashboard';

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  protocols: {
    a2a: boolean;
    langGraph: boolean;
    mcp: boolean;
  };
  bridges: {
    a2aLangGraph: boolean;
    langGraphMcp: boolean;
  };
  metrics: {
    totalWorkflows: number;
    successRate: number;
    averageExecutionTime: number;
    activeAgents: number;
    availableTools: number;
    availableResources: number;
  };
  timestamp: string;
}

interface EcosystemMetrics {
  protocols: {
    a2a: {
      onlineAgents: number;
      totalCapabilities: number;
      messagesPerMinute: number;
      networkHealth: number;
    };
    langGraph: {
      activeWorkflows: number;
      completedWorkflows: number;
      successRate: number;
      averageExecutionTime: number;
    };
    mcp: {
      availableTools: number;
      availableResources: number;
      executionsPerMinute: number;
      toolSuccessRate: number;
    };
  };
  performance: {
    totalThroughput: number;
    systemLoad: number;
    responseTime: number;
    errorRate: number;
  };
}

export function MultiAgentEcosystemPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch ecosystem data
   */
  const fetchEcosystemData = useCallback(async () => {
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockSystemHealth: SystemHealthStatus = {
        overall: 'healthy',
        protocols: {
          a2a: true,
          langGraph: true,
          mcp: true
        },
        bridges: {
          a2aLangGraph: true,
          langGraphMcp: true
        },
        metrics: {
          totalWorkflows: 245,
          successRate: 0.94,
          averageExecutionTime: 15234,
          activeAgents: 2,
          availableTools: 2,
          availableResources: 3
        },
        timestamp: new Date().toISOString()
      };

      const mockEcosystemMetrics: EcosystemMetrics = {
        protocols: {
          a2a: {
            onlineAgents: 2,
            totalCapabilities: 6,
            messagesPerMinute: 12.3,
            networkHealth: 0.98
          },
          langGraph: {
            activeWorkflows: 1,
            completedWorkflows: 220,
            successRate: 0.94,
            averageExecutionTime: 15234
          },
          mcp: {
            availableTools: 2,
            availableResources: 3,
            executionsPerMinute: 8.7,
            toolSuccessRate: 0.96
          }
        },
        performance: {
          totalThroughput: 156.3,
          systemLoad: 34.2,
          responseTime: 2847,
          errorRate: 0.06
        }
      };

      setSystemHealth(mockSystemHealth);
      setEcosystemMetrics(mockEcosystemMetrics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch ecosystem data');
      console.error('Ecosystem data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchEcosystemData();

    if (autoRefresh) {
      const interval = setInterval(fetchEcosystemData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchEcosystemData]);

  /**
   * Get health status icon and color
   */
  const getHealthDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return { icon: <HealthyIcon color="success" />, color: 'success.main', text: 'Healthy' };
      case 'degraded':
        return { icon: <DegradedIcon color="warning" />, color: 'warning.main', text: 'Degraded' };
      case 'unhealthy':
        return { icon: <UnhealthyIcon color="error" />, color: 'error.main', text: 'Unhealthy' };
      default:
        return { icon: <InfoIcon />, color: 'grey.500', text: 'Unknown' };
    }
  };

  /**
   * Format execution time
   */
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Get system load color
   */
  const getLoadColor = (load: number): 'success' | 'warning' | 'error' => {
    if (load < 50) return 'success';
    if (load < 80) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Multi-Agent Ecosystem...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchEcosystemData} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  const healthDisplay = systemHealth ? getHealthDisplay(systemHealth.overall) : getHealthDisplay('unknown');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <EcosystemIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Multi-Agent Ecosystem
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              A2A + LangGraph + MCP Tri-Protocol Dashboard
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {healthDisplay.icon}
            <Typography variant="h6" color={healthDisplay.color}>
              {healthDisplay.text}
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
          <IconButton onClick={fetchEcosystemData}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* System Overview */}
      <Grid container spacing={3} mb={4}>
        {/* Overall System Health */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                  <HealthIcon color="primary" />
                  System Health
                </Typography>
                {healthDisplay.icon}
              </Box>
              
              <List dense>
                <ListItem disablePadding>
                  <ListItemIcon>
                    <ProtocolIcon color={systemHealth?.protocols.a2a ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="A2A Protocol"
                    secondary={systemHealth?.protocols.a2a ? 'Online' : 'Offline'}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon>
                    <WorkflowIcon color={systemHealth?.protocols.langGraph ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="LangGraph"
                    secondary={systemHealth?.protocols.langGraph ? 'Online' : 'Offline'}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon>
                    <ToolIcon color={systemHealth?.protocols.mcp ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="MCP Protocol"
                    secondary={systemHealth?.protocols.mcp ? 'Online' : 'Offline'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <PerformanceIcon color="secondary" />
                Performance
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">System Load</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {ecosystemMetrics?.performance.systemLoad.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={ecosystemMetrics?.performance.systemLoad || 0}
                  color={getLoadColor(ecosystemMetrics?.performance.systemLoad || 0)}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Response Time: {formatExecutionTime(ecosystemMetrics?.performance.responseTime || 0)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Throughput: {ecosystemMetrics?.performance.totalThroughput.toFixed(1)} ops/min
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Network */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <AgentIcon color="info" />
                Agent Network
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Online Agents</Typography>
                <Typography variant="h4" color="info.main">
                  {ecosystemMetrics?.protocols.a2a.onlineAgents || 0}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Capabilities</Typography>
                <Typography variant="h6">
                  {ecosystemMetrics?.protocols.a2a.totalCapabilities || 0}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Messages/min</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {ecosystemMetrics?.protocols.a2a.messagesPerMinute.toFixed(1) || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Activity */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <WorkflowIcon color="warning" />
                Workflows
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Active</Typography>
                <Typography variant="h4" color="warning.main">
                  {ecosystemMetrics?.protocols.langGraph.activeWorkflows || 0}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Success Rate</Typography>
                <Typography variant="h6" color="success.main">
                  {((ecosystemMetrics?.protocols.langGraph.successRate || 0) * 100).toFixed(1)}%
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Completed Total</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {ecosystemMetrics?.protocols.langGraph.completedWorkflows || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Protocol Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <ProtocolIcon color="primary" />
                A2A Protocol Status
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip 
                  label={`${ecosystemMetrics?.protocols.a2a.onlineAgents || 0} Agents`}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`${ecosystemMetrics?.protocols.a2a.totalCapabilities || 0} Capabilities`}
                  color="secondary"
                  size="small"
                />
                <Chip 
                  label={`${((ecosystemMetrics?.protocols.a2a.networkHealth || 0) * 100).toFixed(0)}% Health`}
                  color="success"
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Agent discovery, capability matching, and intelligent message routing active. 
                Network health at {((ecosystemMetrics?.protocols.a2a.networkHealth || 0) * 100).toFixed(1)}%.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <WorkflowIcon color="warning" />
                LangGraph Status
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip 
                  label={`${ecosystemMetrics?.protocols.langGraph.activeWorkflows || 0} Active`}
                  color="warning"
                  size="small"
                />
                <Chip 
                  label={`${((ecosystemMetrics?.protocols.langGraph.successRate || 0) * 100).toFixed(0)}% Success`}
                  color="success"
                  size="small"
                />
                <Chip 
                  label={formatExecutionTime(ecosystemMetrics?.protocols.langGraph.averageExecutionTime || 0)}
                  color="info"
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Multi-agent workflows with supervisor coordination and intelligent handoffs. 
                {ecosystemMetrics?.protocols.langGraph.completedWorkflows || 0} workflows completed total.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}>
                <ToolIcon color="secondary" />
                MCP Protocol Status
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip 
                  label={`${ecosystemMetrics?.protocols.mcp.availableTools || 0} Tools`}
                  color="secondary"
                  size="small"
                />
                <Chip 
                  label={`${ecosystemMetrics?.protocols.mcp.availableResources || 0} Resources`}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`${((ecosystemMetrics?.protocols.mcp.toolSuccessRate || 0) * 100).toFixed(0)}% Success`}
                  color="success"
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Standardized tool and resource access with {ecosystemMetrics?.protocols.mcp.executionsPerMinute.toFixed(1)} 
                executions per minute. External connectivity operational.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Monitoring Tabs */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab 
              label="A2A Network Monitor" 
              icon={<ProtocolIcon />}
              iconPosition="start"
            />
            <Tab 
              label="LangGraph Workflows" 
              icon={<WorkflowIcon />}
              iconPosition="start"
            />
            <Tab 
              label="MCP Resources" 
              icon={<ToolIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <A2ANetworkMonitor />}
          {activeTab === 1 && <LangGraphWorkflowMonitor />}
          {activeTab === 2 && <MCPResourcesDashboard />}
        </Box>
      </Paper>

      {/* Footer */}
      <Box mt={4} py={2} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Multi-Agent Ecosystem • Tri-Protocol Architecture • A2A + LangGraph + MCP
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'Never'}
        </Typography>
      </Box>
    </Container>
  );
}