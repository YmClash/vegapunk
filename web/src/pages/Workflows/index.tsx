/**
 * Workflows Page
 * Create and manage LangGraph workflows for multi-agent orchestration
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccountTree as WorkflowIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CreateWorkflowDialog } from './CreateWorkflowDialog';
import { WorkflowExecutionDialog } from './WorkflowExecutionDialog';
import { AgentNode } from './AgentNode';

// GraphQL Queries and Mutations
const WORKFLOWS_QUERY = gql`
  query GetWorkflows($status: WorkflowStatus) {
    workflows(status: $status) {
      edges {
        node {
          id
          name
          description
          status
          graph {
            nodes {
              id
              type
              agentType
              config
            }
            edges {
              from
              to
              condition
            }
            entryPoint
          }
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const EXECUTE_WORKFLOW_MUTATION = gql`
  mutation ExecuteWorkflow($id: UUID!, $input: JSON) {
    executeWorkflow(id: $id, input: $input) {
      id
      status
      startedAt
    }
  }
`;

const PAUSE_WORKFLOW_MUTATION = gql`
  mutation PauseWorkflow($id: UUID!) {
    pauseWorkflow(id: $id) {
      id
      status
    }
  }
`;

const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

export const WorkflowsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuWorkflow, setMenuWorkflow] = useState<any>(null);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data, loading, error, refetch } = useQuery(WORKFLOWS_QUERY, {
    pollInterval: 30000,
  });

  const [executeWorkflow] = useMutation(EXECUTE_WORKFLOW_MUTATION);
  const [pauseWorkflow] = useMutation(PAUSE_WORKFLOW_MUTATION);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleWorkflowSelect = (workflow: any) => {
    setSelectedWorkflow(workflow);
    
    // Convert workflow graph to ReactFlow format
    const flowNodes: Node[] = workflow.graph.nodes.map((node: any) => ({
      id: node.id,
      type: 'agent',
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: {
        label: node.id,
        agentType: node.agentType,
        config: node.config,
      },
    }));

    const flowEdges: Edge[] = workflow.graph.edges.map((edge: any, index: number) => ({
      id: `e${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.condition,
      animated: workflow.status === 'ACTIVE',
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handleExecuteWorkflow = async (workflow: any) => {
    try {
      await executeWorkflow({ variables: { id: workflow.id } });
      setExecutionDialogOpen(true);
      refetch();
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const handlePauseWorkflow = async (workflow: any) => {
    try {
      await pauseWorkflow({ variables: { id: workflow.id } });
      refetch();
    } catch (error) {
      console.error('Error pausing workflow:', error);
    }
  };

  const filteredWorkflows = data?.workflows?.edges?.filter((edge: any) => {
    const workflow = edge.node;
    return workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const statusColors: Record<string, any> = {
    DRAFT: 'default',
    ACTIVE: 'primary',
    PAUSED: 'warning',
    COMPLETED: 'success',
    FAILED: 'error',
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 3 }}>
      {/* Workflows List */}
      <Box sx={{ width: 350, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Workflows
          </Typography>
          <TextField
            placeholder="Search workflows..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Workflow
        </Button>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading && <Typography>Loading workflows...</Typography>}
          {error && <Typography color="error">Error: {error.message}</Typography>}
          
          {filteredWorkflows.map((edge: any) => {
            const workflow = edge.node;
            return (
              <Card
                key={workflow.id}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  bgcolor: selectedWorkflow?.id === workflow.id ? 'action.selected' : 'background.paper',
                }}
                onClick={() => handleWorkflowSelect(workflow)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {workflow.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {workflow.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={workflow.status}
                          size="small"
                          color={statusColors[workflow.status]}
                        />
                        <Chip
                          label={`${workflow.graph.nodes.length} nodes`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                        setMenuWorkflow(workflow);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Workflow Visualization */}
      <Paper sx={{ flexGrow: 1, p: 2 }}>
        {selectedWorkflow ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {selectedWorkflow.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedWorkflow.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedWorkflow.status === 'DRAFT' && (
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => handleExecuteWorkflow(selectedWorkflow)}
                  >
                    Execute
                  </Button>
                )}
                {selectedWorkflow.status === 'ACTIVE' && (
                  <Button
                    variant="contained"
                    startIcon={<PauseIcon />}
                    onClick={() => handlePauseWorkflow(selectedWorkflow)}
                    color="warning"
                  >
                    Pause
                  </Button>
                )}
                <Tooltip title="Edit Workflow">
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ height: 'calc(100% - 80px)', bgcolor: 'background.default', borderRadius: 2 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <WorkflowIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Select a workflow to view its graph
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleExecuteWorkflow(menuWorkflow);
            setAnchorEl(null);
          }}
          disabled={menuWorkflow?.status !== 'DRAFT'}
        >
          <PlayIcon sx={{ mr: 1 }} /> Execute
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle edit
            setAnchorEl(null);
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle delete
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreateWorkflowDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      <WorkflowExecutionDialog
        open={executionDialogOpen}
        onClose={() => setExecutionDialogOpen(false)}
        workflow={selectedWorkflow}
      />
    </Box>
  );
};