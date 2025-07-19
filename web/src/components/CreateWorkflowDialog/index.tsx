/**
 * Create Workflow Dialog Component
 * Dialog for creating new agent workflows
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountTree as WorkflowIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useSnackbar } from 'notistack';

const CREATE_WORKFLOW_MUTATION = gql`
  mutation CreateWorkflow($input: CreateWorkflowInput!) {
    createWorkflow(input: $input) {
      id
      name
      description
      nodes {
        id
        agentId
        agentName
        config
      }
      edges {
        id
        source
        target
        condition
      }
      status
      createdAt
    }
  }
`;

const GET_AGENTS_QUERY = gql`
  query GetAgents {
    agents {
      id
      name
      type
      capabilities
    }
  }
`;

interface CreateWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (workflow: any) => void;
}

interface WorkflowNode {
  id: string;
  agentId: string;
  agentName: string;
  config: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface WorkflowFormData {
  name: string;
  description: string;
  type: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config: Record<string, any>;
}

const WORKFLOW_TYPES = [
  { value: 'sequential', label: 'Sequential', description: 'Agents execute one after another' },
  { value: 'parallel', label: 'Parallel', description: 'Agents execute simultaneously' },
  { value: 'conditional', label: 'Conditional', description: 'Dynamic flow based on conditions' },
  { value: 'iterative', label: 'Iterative', description: 'Repeating workflow patterns' },
];

export const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    type: 'sequential',
    nodes: [],
    edges: [],
    config: {
      timeout: 300000,
      retries: 3,
      errorHandling: 'continue',
    },
  });

  const { data: agentsData } = useQuery(GET_AGENTS_QUERY);

  const [createWorkflow, { loading, error }] = useMutation(CREATE_WORKFLOW_MUTATION, {
    onCompleted: (data) => {
      enqueueSnackbar(`Workflow ${data.createWorkflow.name} created successfully`, {
        variant: 'success',
      });
      onCreated?.(data.createWorkflow);
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create workflow: ${error.message}`, {
        variant: 'error',
      });
    },
  });

  const handleClose = () => {
    setActiveTab(0);
    setFormData({
      name: '',
      description: '',
      type: 'sequential',
      nodes: [],
      edges: [],
      config: {
        timeout: 300000,
        retries: 3,
        errorHandling: 'continue',
      },
    });
    onClose();
  };

  const handleAddNode = (agent: any) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      config: {},
    };

    setFormData((prev) => {
      const nodes = [...prev.nodes, newNode];
      
      // Auto-create edges for sequential workflows
      if (prev.type === 'sequential' && prev.nodes.length > 0) {
        const lastNode = prev.nodes[prev.nodes.length - 1];
        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: lastNode.id,
          target: newNode.id,
        };
        return { ...prev, nodes, edges: [...prev.edges, newEdge] };
      }
      
      return { ...prev, nodes };
    });
  };

  const handleRemoveNode = (nodeId: string) => {
    setFormData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
  };

  const handleSubmit = () => {
    createWorkflow({
      variables: {
        input: {
          ...formData,
          config: JSON.stringify(formData.config),
        },
      },
    });
  };

  const isValid = formData.name && formData.nodes.length > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkflowIcon color="primary" />
            <Typography variant="h6">Create New Workflow</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
          <Tab label="Basic Info" />
          <Tab label="Workflow Design" disabled={!formData.name} />
          <Tab label="Configuration" disabled={!formData.name || formData.nodes.length === 0} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Workflow Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="A unique name for your workflow"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Describe the purpose of this workflow"
            />

            <FormControl fullWidth required>
              <InputLabel>Workflow Type</InputLabel>
              <Select
                value={formData.type}
                label="Workflow Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {WORKFLOW_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Available Agents
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List>
                  {agentsData?.agents.map((agent: any) => (
                    <ListItem key={agent.id}>
                      <ListItemText
                        primary={agent.name}
                        secondary={`Type: ${agent.type} • ${agent.capabilities.length} capabilities`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleAddNode(agent)}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Workflow Nodes ({formData.nodes.length})
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                {formData.nodes.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Add agents from the left panel to build your workflow
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {formData.nodes.map((node, index) => (
                      <React.Fragment key={node.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Typography variant="h6" color="primary">
                              {index + 1}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={node.agentName}
                            secondary={`Agent ID: ${node.agentId}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveNode(node.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < formData.nodes.length - 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                            <ArrowIcon color="action" />
                          </Box>
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>

              {formData.type === 'conditional' && formData.nodes.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Conditions for branching can be configured after workflow creation
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle1">Workflow Configuration</Typography>

            <TextField
              label="Timeout (ms)"
              type="number"
              value={formData.config.timeout}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, timeout: parseInt(e.target.value) },
              })}
              fullWidth
              helperText="Maximum time for workflow execution"
            />

            <TextField
              label="Max Retries"
              type="number"
              value={formData.config.retries}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, retries: parseInt(e.target.value) },
              })}
              fullWidth
              inputProps={{ min: 0, max: 10 }}
              helperText="Number of retry attempts on failure"
            />

            <FormControl fullWidth>
              <InputLabel>Error Handling</InputLabel>
              <Select
                value={formData.config.errorHandling}
                label="Error Handling"
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, errorHandling: e.target.value },
                })}
              >
                <MenuItem value="continue">Continue on Error</MenuItem>
                <MenuItem value="stop">Stop on Error</MenuItem>
                <MenuItem value="rollback">Rollback on Error</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Workflow Summary
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  <strong>Name:</strong> {formData.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {WORKFLOW_TYPES.find(t => t.value === formData.type)?.label}
                </Typography>
                <Typography variant="body2">
                  <strong>Agents:</strong> {formData.nodes.map(n => n.agentName).join(' → ')}
                </Typography>
                <Typography variant="body2">
                  <strong>Timeout:</strong> {formData.config.timeout / 1000}s
                </Typography>
                <Typography variant="body2">
                  <strong>Error Handling:</strong> {formData.config.errorHandling}
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {activeTab > 0 && (
          <Button onClick={() => setActiveTab(activeTab - 1)}>Back</Button>
        )}
        {activeTab < 2 ? (
          <Button
            variant="contained"
            onClick={() => setActiveTab(activeTab + 1)}
            disabled={
              (activeTab === 0 && !formData.name) ||
              (activeTab === 1 && formData.nodes.length === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !isValid}
            startIcon={<WorkflowIcon />}
          >
            Create Workflow
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};