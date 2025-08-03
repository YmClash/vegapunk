/**
 * LangGraph Advanced Cockpit Panel - Enterprise-Level Workflow Orchestration Monitoring
 * Professional LangGraph workflow cockpit with graph visualization, dataflow tracing, handoff monitoring, and templates
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
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  AccountTree as WorkflowIcon,
  Timeline as DataFlowIcon,
  SwapHoriz as HandoffIcon,
  LibraryBooks as TemplatesIcon,
  Speed as PerformanceIcon,
  Visibility as MonitorIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Psychology as SupervisorIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Settings as ControlIcon,
  Dashboard as CockpitIcon
} from '@mui/icons-material';

// Import advanced LangGraph visualization components (to be created)
import { LangGraphWorkflowVisualization } from './LangGraphWorkflowVisualization';
import { DataFlowTracingVisualization } from './DataFlowTracingVisualization';
import { AgentHandoffMonitor } from './AgentHandoffMonitor';
import { WorkflowTemplateLibrary } from './WorkflowTemplateLibrary';

// TypeScript interfaces for LangGraph data structures
interface WorkflowExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentNode?: string;
  executionTrace: ExecutionStep[];
  supervisor: SupervisorAgent;
  agents: string[];
  metadata: Record<string, any>;
}

interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: Record<string, any>;
  agent?: string;
}

interface SupervisorAgent {
  id: string;
  name: string;
  decisionsCount: number;
  successRate: number;
  averageDecisionTime: number;
  currentStrategy: string;
}

interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: Record<string, any>;
}

interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'agent' | 'supervisor' | 'condition' | 'end';
  agent?: string;
  position: { x: number; y: number };
  metadata: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  metadata: Record<string, any>;
}

interface DataFlowTrace {
  id: string;
  workflowId: string;
  timestamp: string;
  nodeName: string;
  operation: string;
  dataSize: number;
  duration: number;
  isActive: boolean;
  dataPreview: Record<string, any>;
}

interface AgentHandoff {
  id: string;
  timestamp: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  confidence: number;
  duration: number;
  latency: number;
  success: boolean;
  contextTransferred: Record<string, any>;
}

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  successRate: number;
  averageExecutionTime: number;
  totalHandoffs: number;
  handoffSuccessRate: number;
  averageHandoffTime: number;
  supervisorEfficiency: number;
  dataFlowThroughput: number;
}

export function LangGraphCockpitPanel() {
  // State management for workflow monitoring
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow data state
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowExecution[]>([]);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowExecution[]>([]);
  const [currentGraph, setCurrentGraph] = useState<WorkflowGraph | null>(null);
  const [dataFlowTraces, setDataFlowTraces] = useState<DataFlowTrace[]>([]);
  const [recentHandoffs, setRecentHandoffs] = useState<AgentHandoff[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics | null>(null);

  // UI state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  /**
   * Fetch LangGraph workflow data - Mock implementation
   */
  const fetchWorkflowData = useCallback(async () => {
    if (!isMonitoring) return;

    setIsLoading(true);
    try {
      // Mock data - Replace with actual API calls
      const mockWorkflows: WorkflowExecution[] = [
        {
          id: 'workflow-001',
          name: 'Security Analysis Pipeline',
          status: 'running',
          startTime: new Date(Date.now() - 300000).toISOString(),
          currentNode: 'supervisor-analysis',
          executionTrace: [
            {
              id: 'step-1',
              nodeId: 'start',
              nodeName: 'Initialize',
              timestamp: new Date(Date.now() - 280000).toISOString(),
              duration: 1200,
              status: 'completed',
              data: { input: 'security-request' }
            },
            {
              id: 'step-2',
              nodeId: 'supervisor-analysis',
              nodeName: 'Supervisor Analysis',
              timestamp: new Date(Date.now() - 150000).toISOString(),
              duration: 0,
              status: 'running',
              data: { analysis: 'in-progress' },
              agent: 'SupervisorAgent'
            }
          ],
          supervisor: {
            id: 'supervisor-001',
            name: 'SupervisorAgent',
            decisionsCount: 247,
            successRate: 0.94,
            averageDecisionTime: 1847,
            currentStrategy: 'security-first'
          },
          agents: ['SupervisorAgent', 'ShakaAgent'],
          metadata: { priority: 'high', category: 'security' }
        }
      ];

      const mockGraph: WorkflowGraph = {
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'start',
            position: { x: 0, y: 0 },
            metadata: {}
          },
          {
            id: 'supervisor-analysis',
            name: 'Supervisor Analysis',
            type: 'supervisor',
            agent: 'SupervisorAgent',
            position: { x: 1, y: 0 },
            metadata: {}
          },
          {
            id: 'shaka-execution',
            name: 'Shaka Execution',
            type: 'agent',
            agent: 'ShakaAgent',
            position: { x: 2, y: 0 },
            metadata: {}
          },
          {
            id: 'end',
            name: 'End',
            type: 'end',
            position: { x: 3, y: 0 },
            metadata: {}
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start',
            target: 'supervisor-analysis',
            metadata: {}
          },
          {
            id: 'edge-2',
            source: 'supervisor-analysis',
            target: 'shaka-execution',
            condition: 'analysis_complete',
            metadata: {}
          },
          {
            id: 'edge-3',
            source: 'shaka-execution',
            target: 'end',
            metadata: {}
          }
        ],
        metadata: { version: '1.0', type: 'security-pipeline' }
      };

      const mockTraces: DataFlowTrace[] = [
        {
          id: 'trace-001',
          workflowId: 'workflow-001',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          nodeName: 'Supervisor Analysis',
          operation: 'data_transformation',
          dataSize: 2048,
          duration: 340,
          isActive: true,
          dataPreview: { type: 'security_analysis', confidence: 0.87 }
        },
        {
          id: 'trace-002',
          workflowId: 'workflow-001',
          timestamp: new Date(Date.now() - 90000).toISOString(),
          nodeName: 'Supervisor Analysis',
          operation: 'context_preparation',
          dataSize: 1024,
          duration: 180,
          isActive: false,
          dataPreview: { context: 'prepared', next_agent: 'ShakaAgent' }
        }
      ];

      const mockHandoffs: AgentHandoff[] = [
        {
          id: 'handoff-001',
          timestamp: new Date(Date.now() - 45000).toISOString(),
          fromAgent: 'SupervisorAgent',
          toAgent: 'ShakaAgent',
          reason: 'specialized_execution_required',
          confidence: 0.92,
          duration: 1200,
          latency: 45,
          success: true,
          contextTransferred: {
            task: 'security_analysis',
            priority: 'high',
            context_size: 2048
          }
        }
      ];

      const mockMetrics: WorkflowMetrics = {
        totalWorkflows: 1247,
        activeWorkflows: 1,
        completedWorkflows: 1189,
        successRate: 0.94,
        averageExecutionTime: 15234,
        totalHandoffs: 3456,
        handoffSuccessRate: 0.91,
        averageHandoffTime: 1847,
        supervisorEfficiency: 0.89,
        dataFlowThroughput: 156.7
      };

      // Update state
      setActiveWorkflows(mockWorkflows);
      setCurrentGraph(mockGraph);
      setDataFlowTraces(mockTraces);
      setRecentHandoffs(mockHandoffs);
      setWorkflowMetrics(mockMetrics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch workflow data');
      console.error('Workflow data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isMonitoring]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchWorkflowData();

    if (autoRefresh && isMonitoring) {
      const interval = setInterval(fetchWorkflowData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isMonitoring, refreshInterval, fetchWorkflowData]);

  /**
   * Format execution time helper
   */
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Get status color helper
   */
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Cockpit Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <CockpitIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              🔄 LangGraph Advanced Cockpit
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Workflow Orchestration Intelligence • Real-time Monitoring
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {/* View Mode Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              label="View Mode"
              onChange={(e) => setViewMode(e.target.value as 'overview' | 'detailed')}
            >
              <MenuItem value="overview">Overview</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          {/* Control Switches */}
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

          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={(e) => setIsMonitoring(e.target.checked)}
                size="small"
                color="success"
              />
            }
            label="Monitor"
          />

          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchWorkflowData} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {workflowMetrics?.activeWorkflows || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Workflows
              </Typography>
              <WorkflowIcon color="info" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {((workflowMetrics?.successRate || 0) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Success Rate
              </Typography>
              <SuccessIcon color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {workflowMetrics?.totalHandoffs || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Handoffs
              </Typography>
              <HandoffIcon color="secondary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {formatExecutionTime(workflowMetrics?.averageExecutionTime || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Execution
              </Typography>
              <PerformanceIcon color="warning" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {((workflowMetrics?.supervisorEfficiency || 0) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supervisor Efficiency
              </Typography>
              <SupervisorIcon color="primary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Cockpit Grid */}
      <Grid container spacing={3}>
        {/* Workflow Graph Visualization */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3, height: '600px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <WorkflowIcon color="primary" />
                Workflow Graph Execution
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={`${activeWorkflows.length} Active`}
                  color="info"
                  size="small"
                />
                <Chip 
                  label={isMonitoring ? 'Live' : 'Paused'}
                  color={isMonitoring ? 'success' : 'default'}
                  size="small"
                />
              </Stack>
            </Box>
            <LangGraphWorkflowVisualization
              workflows={activeWorkflows}
              topology={currentGraph}
              height={520}
              selectedWorkflow={selectedWorkflow}
              onWorkflowSelect={setSelectedWorkflow}
            />
          </Paper>
        </Grid>

        {/* Workflow Control Panel & Supervisor Status */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2} sx={{ height: '600px' }}>
            {/* Supervisor Status */}
            <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={2}>
                <SupervisorIcon color="primary" />
                Supervisor Status
              </Typography>
              
              {activeWorkflows.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {activeWorkflows[0].supervisor.name}
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Decisions</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {activeWorkflows[0].supervisor.decisionsCount}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Success Rate</Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {(activeWorkflows[0].supervisor.successRate * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Avg Decision Time</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatExecutionTime(activeWorkflows[0].supervisor.averageDecisionTime)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Current Strategy:
                      </Typography>
                      <Chip 
                        label={activeWorkflows[0].supervisor.currentStrategy}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Active Workflows Panel */}
            <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={2}>
                <MonitorIcon color="info" />
                Active Workflows
              </Typography>
              
              <Stack spacing={1}>
                {activeWorkflows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active workflows
                  </Typography>
                ) : (
                  activeWorkflows.map((workflow) => (
                    <Card 
                      key={workflow.id}
                      variant="outlined"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedWorkflow === workflow.id ? 'action.selected' : 'transparent'
                      }}
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {workflow.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Current: {workflow.currentNode}
                            </Typography>
                          </Box>
                          <Chip
                            label={workflow.status}
                            color={getStatusColor(workflow.status)}
                            size="small"
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* DataFlow Tracer */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={2}>
              <DataFlowIcon color="secondary" />
              DataFlow Tracer
            </Typography>
            <DataFlowTracingVisualization
              traces={dataFlowTraces}
              height={320}
            />
          </Paper>
        </Grid>

        {/* Agent Handoff Monitor */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={2}>
              <HandoffIcon color="warning" />
              Agent Handoff Monitor
            </Typography>
            <AgentHandoffMonitor
              handoffs={recentHandoffs}
              metrics={{
                totalHandoffs: workflowMetrics?.totalHandoffs || 0,
                successRate: workflowMetrics?.handoffSuccessRate || 0,
                averageLatency: workflowMetrics?.averageHandoffTime || 0
              }}
            />
          </Paper>
        </Grid>

        {/* Workflow Templates Library */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, height: '500px' }}>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={2}>
              <TemplatesIcon color="info" />
              Workflow Templates Library
            </Typography>
            <WorkflowTemplateLibrary
              onTemplateSelect={(template) => console.log('Template selected:', template)}
              onWorkflowDesign={() => console.log('Open workflow designer')}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}