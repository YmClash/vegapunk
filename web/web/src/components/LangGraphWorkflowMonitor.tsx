/**
 * LangGraph Workflow Monitor - Real-time workflow execution visualization
 * Shows workflow status, agent transitions, execution metrics, and decision points
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import {
  AccountTree as WorkflowIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  Speed as PerformanceIcon,
  Psychology as AgentIcon,
  SwapHoriz as HandoffIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  TrendingUp as MetricsIcon,
  Route as PathIcon
} from '@mui/icons-material';

interface WorkflowExecution {
  workflowId: string;
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  currentStep: number;
  totalSteps: number;
  agentPath: string[];
  executionTime: number;
  metadata: {
    message: string;
    userId?: string;
    protocolsUsed: string[];
    handoffs: number;
  };
}

interface GraphNode {
  nodeId: string;
  agentId: string;
  name: string;
  type: 'supervisor' | 'agent' | 'tool' | 'condition';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  executionTime?: number;
  input?: any;
  output?: any;
  error?: string;
}

interface GraphTransition {
  from: string;
  to: string;
  condition?: string;
  timestamp: string;
  reason: string;
  confidence?: number;
}

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  successRate: number;
  mostUsedAgents: Array<{ agentId: string; count: number }>;
  averageHandoffs: number;
}

export function LangGraphWorkflowMonitor() {
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowExecution[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowExecution[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowDetails, setWorkflowDetails] = useState<{
    nodes: GraphNode[];
    transitions: GraphTransition[];
  } | null>(null);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  /**
   * Fetch workflow data
   */
  const fetchWorkflowData = useCallback(async () => {
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockActiveWorkflows: WorkflowExecution[] = [
        {
          workflowId: 'wf-001',
          sessionId: 'session-123',
          status: 'running',
          startTime: new Date(Date.now() - 30000).toISOString(),
          currentStep: 2,
          totalSteps: 4,
          agentPath: ['supervisor', 'vegapunk-001'],
          executionTime: 30000,
          metadata: {
            message: 'Analyze the ethical implications of AI surveillance',
            userId: 'user-001',
            protocolsUsed: ['A2A', 'LangGraph'],
            handoffs: 1
          }
        }
      ];

      const mockRecentWorkflows: WorkflowExecution[] = [
        {
          workflowId: 'wf-002',
          sessionId: 'session-122',
          status: 'completed',
          startTime: new Date(Date.now() - 120000).toISOString(),
          endTime: new Date(Date.now() - 90000).toISOString(),
          currentStep: 4,
          totalSteps: 4,
          agentPath: ['supervisor', 'vegapunk-001', 'shaka-001'],
          executionTime: 30000,
          metadata: {
            message: 'Help me optimize my database queries',
            protocolsUsed: ['A2A', 'LangGraph'],
            handoffs: 1
          }
        },
        {
          workflowId: 'wf-003',
          sessionId: 'session-121',
          status: 'failed',
          startTime: new Date(Date.now() - 180000).toISOString(),
          endTime: new Date(Date.now() - 160000).toISOString(),
          currentStep: 2,
          totalSteps: 4,
          agentPath: ['supervisor', 'vegapunk-001'],
          executionTime: 20000,
          metadata: {
            message: 'Complex technical analysis request',
            protocolsUsed: ['A2A', 'LangGraph'],
            handoffs: 0
          }
        }
      ];

      const mockWorkflowDetails = {
        nodes: [
          {
            nodeId: 'supervisor',
            agentId: 'supervisor-001',
            name: 'Workflow Supervisor',
            type: 'supervisor' as const,
            status: 'completed' as const,
            startTime: new Date(Date.now() - 30000).toISOString(),
            endTime: new Date(Date.now() - 28000).toISOString(),
            executionTime: 2000,
            output: { selectedAgent: 'vegapunk-001', confidence: 0.85 }
          },
          {
            nodeId: 'vegapunk-node',
            agentId: 'vegapunk-001',
            name: 'Vegapunk Technical Support',
            type: 'agent' as const,
            status: 'running' as const,
            startTime: new Date(Date.now() - 28000).toISOString(),
            executionTime: 28000
          }
        ],
        transitions: [
          {
            from: 'supervisor',
            to: 'vegapunk-node',
            timestamp: new Date(Date.now() - 28000).toISOString(),
            reason: 'Technical support capability match',
            confidence: 0.85
          }
        ]
      };

      const mockMetrics: WorkflowMetrics = {
        totalWorkflows: 245,
        activeWorkflows: 1,
        completedWorkflows: 220,
        failedWorkflows: 24,
        averageExecutionTime: 15234,
        successRate: 0.902,
        mostUsedAgents: [
          { agentId: 'vegapunk-001', count: 156 },
          { agentId: 'shaka-001', count: 89 }
        ],
        averageHandoffs: 1.2
      };

      setActiveWorkflows(mockActiveWorkflows);
      setRecentWorkflows(mockRecentWorkflows);
      setWorkflowDetails(mockWorkflowDetails);
      setMetrics(mockMetrics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch workflow data');
      console.error('Workflow data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchWorkflowData();

    if (autoRefresh) {
      const interval = setInterval(fetchWorkflowData, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchWorkflowData]);

  /**
   * Get status color for workflow
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  /**
   * Get status icon for workflow
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CircularProgress size={16} />;
      case 'completed': return <CompleteIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'paused': return <WarningIcon color="warning" />;
      default: return <TimerIcon />;
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
   * Calculate progress percentage
   */
  const getProgress = (currentStep: number, totalSteps: number): number => {
    return totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Workflow Monitor...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchWorkflowData} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <WorkflowIcon color="primary" />
          <Typography variant="h6">
            LangGraph Workflow Monitor
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
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
          <IconButton onClick={fetchWorkflowData} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Metrics Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info">
                    {metrics?.activeWorkflows || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Workflows
                  </Typography>
                </Box>
                <WorkflowIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="success">
                    {((metrics?.successRate || 0) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
                <MetricsIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="secondary">
                    {formatExecutionTime(metrics?.averageExecutionTime || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration
                  </Typography>
                </Box>
                <TimerIcon color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="warning">
                    {metrics?.averageHandoffs.toFixed(1) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Handoffs
                  </Typography>
                </Box>
                <HandoffIcon color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Workflows */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <WorkflowIcon />
                Active Workflows
              </Typography>
              
              {activeWorkflows.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No active workflows
                </Typography>
              ) : (
                <List>
                  {activeWorkflows.map((workflow) => (
                    <ListItem key={workflow.workflowId} divider>
                      <ListItemIcon>
                        {getStatusIcon(workflow.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {workflow.workflowId}
                            </Typography>
                            <Chip
                              label={workflow.status}
                              size="small"
                              color={getStatusColor(workflow.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {workflow.metadata.message}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Typography variant="caption">
                                Step {workflow.currentStep}/{workflow.totalSteps}
                              </Typography>
                              <Typography variant="caption">
                                {formatExecutionTime(workflow.executionTime)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getProgress(workflow.currentStep, workflow.totalSteps)}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Workflows */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <PathIcon />
                Recent Workflows
              </Typography>
              
              <List>
                {recentWorkflows.map((workflow) => (
                  <ListItem
                    key={workflow.workflowId}
                    onClick={() => setExpandedWorkflow(
                      expandedWorkflow === workflow.workflowId ? null : workflow.workflowId
                    )}
                    divider
                    sx={{ cursor: 'pointer' }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(workflow.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {workflow.workflowId}
                            </Typography>
                            <Chip
                              label={workflow.status}
                              size="small"
                              color={getStatusColor(workflow.status) as any}
                            />
                          </Box>
                          {expandedWorkflow === workflow.workflowId ? <CollapseIcon /> : <ExpandIcon />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {workflow.metadata.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatExecutionTime(workflow.executionTime)} • 
                            {workflow.agentPath.length} agents • 
                            {workflow.metadata.handoffs} handoffs
                          </Typography>
                          
                          <Collapse in={expandedWorkflow === workflow.workflowId}>
                            <Box mt={2}>
                              <Typography variant="caption" fontWeight="bold">
                                Agent Path:
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                                {workflow.agentPath.map((agent, index) => (
                                  <React.Fragment key={agent}>
                                    <Chip
                                      label={agent}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                    {index < workflow.agentPath.length - 1 && (
                                      <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                                        →
                                      </Typography>
                                    )}
                                  </React.Fragment>
                                ))}
                              </Box>
                              
                              <Box mt={1}>
                                <Typography variant="caption" fontWeight="bold">
                                  Protocols Used:
                                </Typography>
                                <Box display="flex" gap={0.5} mt={0.5}>
                                  {workflow.metadata.protocolsUsed.map((protocol) => (
                                    <Chip
                                      key={protocol}
                                      label={protocol}
                                      size="small"
                                      variant="filled"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                          </Collapse>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Execution Details */}
        {workflowDetails && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                  <AgentIcon />
                  Workflow Execution Timeline
                </Typography>
                
                <Timeline>
                  {workflowDetails.nodes.map((node, index) => (
                    <TimelineItem key={node.nodeId}>
                      <TimelineOppositeContent color="text.secondary">
                        {node.startTime ? new Date(node.startTime).toLocaleTimeString() : 'Pending'}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getStatusColor(node.status) as any}>
                          {getStatusIcon(node.status)}
                        </TimelineDot>
                        {index < workflowDetails.nodes.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6" component="span">
                          {node.name}
                        </Typography>
                        <Typography color="text.secondary">
                          {node.type} • {node.status}
                        </Typography>
                        {node.executionTime && (
                          <Typography variant="body2" color="text.secondary">
                            Duration: {formatExecutionTime(node.executionTime)}
                          </Typography>
                        )}
                        {node.output && (
                          <Box mt={1}>
                            <Typography variant="caption" fontWeight="bold">
                              Output:
                            </Typography>
                            <Typography variant="caption" display="block">
                              {JSON.stringify(node.output, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}