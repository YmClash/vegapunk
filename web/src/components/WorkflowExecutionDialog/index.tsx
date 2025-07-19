/**
 * Workflow Execution Dialog Component
 * Real-time workflow execution monitoring and control
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useMutation, useSubscription, gql } from '@apollo/client';
import { useSnackbar } from 'notistack';
import { useWorkflowExecution } from '../../hooks/useRealtimeMetrics';

const EXECUTE_WORKFLOW_MUTATION = gql`
  mutation ExecuteWorkflow($workflowId: UUID!, $input: JSON) {
    executeWorkflow(workflowId: $workflowId, input: $input) {
      executionId
      status
      startTime
    }
  }
`;

const PAUSE_WORKFLOW_MUTATION = gql`
  mutation PauseWorkflow($executionId: UUID!) {
    pauseWorkflow(executionId: $executionId) {
      success
      message
    }
  }
`;

const STOP_WORKFLOW_MUTATION = gql`
  mutation StopWorkflow($executionId: UUID!) {
    stopWorkflow(executionId: $executionId) {
      success
      message
    }
  }
`;

const WORKFLOW_EXECUTION_SUBSCRIPTION = gql`
  subscription OnWorkflowExecution($executionId: UUID!) {
    workflowExecution(executionId: $executionId) {
      executionId
      status
      currentNode
      progress
      nodes {
        nodeId
        agentName
        status
        startTime
        endTime
        output
        error
      }
      logs {
        timestamp
        level
        message
        nodeId
      }
      metrics {
        executionTime
        tokensUsed
        resourceUsage
      }
    }
  }
`;

interface WorkflowExecutionDialogProps {
  open: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    nodes: Array<{
      id: string;
      agentName: string;
    }>;
  };
}

interface ExecutionNode {
  nodeId: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  output?: any;
  error?: string;
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  nodeId?: string;
}

export const WorkflowExecutionDialog: React.FC<WorkflowExecutionDialogProps> = ({
  open,
  onClose,
  workflow,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [executionId, setExecutionId] = useState<string>('');
  const [inputData, setInputData] = useState<string>('{}');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState(false);

  const [executeWorkflow, { loading: executing }] = useMutation(EXECUTE_WORKFLOW_MUTATION, {
    onCompleted: (data) => {
      setExecutionId(data.executeWorkflow.executionId);
      enqueueSnackbar('Workflow execution started', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to start workflow: ${error.message}`, { variant: 'error' });
    },
  });

  const [pauseWorkflow] = useMutation(PAUSE_WORKFLOW_MUTATION);
  const [stopWorkflow] = useMutation(STOP_WORKFLOW_MUTATION);

  const { data: executionData, loading: executionLoading } = useSubscription(
    WORKFLOW_EXECUTION_SUBSCRIPTION,
    {
      variables: { executionId },
      skip: !executionId,
    }
  );

  const execution = executionData?.workflowExecution;

  const handleExecute = () => {
    try {
      const parsedInput = JSON.parse(inputData);
      executeWorkflow({
        variables: {
          workflowId: workflow.id,
          input: parsedInput,
        },
      });
    } catch (error) {
      enqueueSnackbar('Invalid JSON input', { variant: 'error' });
    }
  };

  const handlePause = () => {
    pauseWorkflow({ variables: { executionId } });
  };

  const handleStop = () => {
    stopWorkflow({ variables: { executionId } });
  };

  const handleClose = () => {
    setExecutionId('');
    setInputData('{}');
    setExpandedNodes(new Set());
    setShowLogs(false);
    onClose();
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      case 'skipped':
        return <WarningIcon color="warning" />;
      default:
        return <Box sx={{ width: 20, height: 20 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const currentNodeIndex = execution?.nodes.findIndex(
    (n: ExecutionNode) => n.nodeId === execution.currentNode
  ) ?? -1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Execute Workflow: {workflow.name}</Typography>
            {execution && (
              <Chip
                label={execution.status.toUpperCase()}
                size="small"
                color={getStatusColor(execution.status)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!executionId ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configure input data for the workflow execution (optional)
            </Alert>
            
            <TextField
              label="Input Data (JSON)"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              multiline
              rows={6}
              fullWidth
              placeholder='{\n  "key": "value"\n}'
              sx={{ fontFamily: 'monospace' }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Workflow Overview
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2">
                  This workflow contains {workflow.nodes.length} agents:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {workflow.nodes.map((node, index) => (
                    <Chip
                      key={node.id}
                      label={`${index + 1}. ${node.agentName}`}
                      size="small"
                      sx={{ mr: 1, mt: 0.5 }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        ) : (
          <Box>
            {execution && (
              <>
                {/* Progress Bar */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="body2">
                      {execution.progress}% ({execution.nodes.filter((n: ExecutionNode) => n.status === 'completed').length}/{execution.nodes.length} nodes)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={execution.progress}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>

                {/* Execution Metrics */}
                {execution.metrics && (
                  <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Paper sx={{ p: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Execution Time
                      </Typography>
                      <Typography variant="h6">
                        {(execution.metrics.executionTime / 1000).toFixed(2)}s
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tokens Used
                      </Typography>
                      <Typography variant="h6">
                        {execution.metrics.tokensUsed.toLocaleString()}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Resource Usage
                      </Typography>
                      <Typography variant="h6">
                        {execution.metrics.resourceUsage}%
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Node Execution Status */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Execution Steps</Typography>
                    <Button
                      size="small"
                      onClick={() => setShowLogs(!showLogs)}
                      startIcon={showLogs ? <CollapseIcon /> : <ExpandIcon />}
                    >
                      {showLogs ? 'Hide' : 'Show'} Logs
                    </Button>
                  </Box>

                  <Stepper activeStep={currentNodeIndex} orientation="vertical">
                    {execution.nodes.map((node: ExecutionNode, index: number) => (
                      <Step key={node.nodeId} completed={node.status === 'completed'}>
                        <StepLabel
                          icon={getNodeIcon(node.status)}
                          error={node.status === 'failed'}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{node.agentName}</Typography>
                            {node.status === 'running' && (
                              <Chip label="Running" size="small" color="primary" />
                            )}
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Box>
                            {node.startTime && (
                              <Typography variant="caption" color="text.secondary">
                                Started: {new Date(node.startTime).toLocaleTimeString()}
                                {node.endTime && ` • Duration: ${(
                                  (new Date(node.endTime).getTime() - new Date(node.startTime).getTime()) / 1000
                                ).toFixed(2)}s`}
                              </Typography>
                            )}
                            
                            {(node.output || node.error) && (
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  onClick={() => toggleNodeExpansion(node.nodeId)}
                                  startIcon={expandedNodes.has(node.nodeId) ? <CollapseIcon /> : <ExpandIcon />}
                                >
                                  {node.error ? 'Show Error' : 'Show Output'}
                                </Button>
                                <Collapse in={expandedNodes.has(node.nodeId)}>
                                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                                      {node.error || JSON.stringify(node.output, null, 2)}
                                    </pre>
                                  </Paper>
                                </Collapse>
                              </Box>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Execution Logs */}
                <Collapse in={showLogs}>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Execution Logs
                    </Typography>
                    <List dense>
                      {execution.logs.map((log: ExecutionLog, index: number) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                <Box component="span" sx={{ color: 
                                  log.level === 'error' ? 'error.main' :
                                  log.level === 'warning' ? 'warning.main' :
                                  'text.secondary'
                                }}>
                                  [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level.toUpperCase()}]
                                </Box>
                                {' '}{log.message}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Collapse>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!executionId ? (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={handleExecute}
              disabled={executing}
              startIcon={<PlayIcon />}
            >
              Execute Workflow
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>Close</Button>
            <Box sx={{ flex: 1 }} />
            {execution?.status === 'running' && (
              <>
                <Button
                  onClick={handlePause}
                  startIcon={<PauseIcon />}
                  color="warning"
                >
                  Pause
                </Button>
                <Button
                  onClick={handleStop}
                  startIcon={<StopIcon />}
                  color="error"
                >
                  Stop
                </Button>
              </>
            )}
            {execution?.status === 'completed' && (
              <Button
                variant="contained"
                onClick={() => {
                  setExecutionId('');
                  setExpandedNodes(new Set());
                }}
                startIcon={<RefreshIcon />}
              >
                Run Again
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};