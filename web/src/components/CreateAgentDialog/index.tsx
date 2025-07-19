/**
 * Create Agent Dialog Component
 * Dialog for creating new agent instances
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
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';
import { useSnackbar } from 'notistack';

const CREATE_AGENT_MUTATION = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      id
      name
      type
      status
      capabilities
      memory
      dependencies
    }
  }
`;

interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (agent: any) => void;
}

interface AgentFormData {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  memory: {
    type: string;
    size: number;
  };
  dependencies: string[];
  configuration: Record<string, any>;
}

const AGENT_TYPES = [
  { value: 'atlas', label: 'Atlas (Knowledge)', icon: '🗺️' },
  { value: 'edison', label: 'Edison (Creativity)', icon: '💡' },
  { value: 'pythagoras', label: 'Pythagoras (Logic)', icon: '🧮' },
  { value: 'lilith', label: 'Lilith (Desire)', icon: '🔥' },
  { value: 'shaka', label: 'Shaka (Violence)', icon: '⚔️' },
  { value: 'york', label: 'York (Greed)', icon: '💰' },
  { value: 'custom', label: 'Custom Agent', icon: '🔧' },
];

const CAPABILITY_OPTIONS = [
  'reasoning',
  'planning',
  'learning',
  'memory_management',
  'tool_usage',
  'collaboration',
  'self_reflection',
  'error_recovery',
  'resource_optimization',
  'pattern_recognition',
];

export const CreateAgentDialog: React.FC<CreateAgentDialogProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: '',
    description: '',
    capabilities: [],
    memory: {
      type: 'in-memory',
      size: 100,
    },
    dependencies: [],
    configuration: {},
  });

  const [createAgent, { loading, error }] = useMutation(CREATE_AGENT_MUTATION, {
    onCompleted: (data) => {
      enqueueSnackbar(`Agent ${data.createAgent.name} created successfully`, {
        variant: 'success',
      });
      onCreated?.(data.createAgent);
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar(`Failed to create agent: ${error.message}`, {
        variant: 'error',
      });
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      type: '',
      description: '',
      capabilities: [],
      memory: {
        type: 'in-memory',
        size: 100,
      },
      dependencies: [],
      configuration: {},
    });
    onClose();
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    createAgent({
      variables: {
        input: {
          ...formData,
          configuration: JSON.stringify(formData.configuration),
        },
      },
    });
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.name && formData.type;
      case 1:
        return formData.capabilities.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const steps = ['Basic Information', 'Capabilities', 'Configuration'];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">Create New Agent</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Agent Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                helperText="A unique name for your agent"
              />

              <FormControl fullWidth required>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Agent Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {AGENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the type of agent to create</FormHelperText>
              </FormControl>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                helperText="Describe the purpose and functionality of this agent"
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Capabilities</InputLabel>
                <Select
                  multiple
                  value={formData.capabilities}
                  onChange={(e) => setFormData({ ...formData, capabilities: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {CAPABILITY_OPTIONS.map((capability) => (
                    <MenuItem key={capability} value={capability}>
                      {capability.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the capabilities this agent should have</FormHelperText>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Memory Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Memory Type</InputLabel>
                    <Select
                      value={formData.memory.type}
                      label="Memory Type"
                      onChange={(e) => setFormData({
                        ...formData,
                        memory: { ...formData.memory, type: e.target.value },
                      })}
                    >
                      <MenuItem value="in-memory">In-Memory</MenuItem>
                      <MenuItem value="persistent">Persistent</MenuItem>
                      <MenuItem value="distributed">Distributed</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Memory Size (MB)"
                    type="number"
                    value={formData.memory.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      memory: { ...formData.memory, size: parseInt(e.target.value) },
                    })}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>

              <TextField
                label="Dependencies"
                value={formData.dependencies.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  dependencies: e.target.value.split(',').map(d => d.trim()).filter(Boolean),
                })}
                fullWidth
                helperText="Comma-separated list of agent dependencies"
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                Configure additional settings for your agent. These can be modified later.
              </Alert>

              <TextField
                label="LLM Model"
                value={formData.configuration.model || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, model: e.target.value },
                })}
                fullWidth
                helperText="The language model to use (e.g., gpt-4, claude-3)"
              />

              <TextField
                label="Temperature"
                type="number"
                value={formData.configuration.temperature || 0.7}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, temperature: parseFloat(e.target.value) },
                })}
                fullWidth
                inputProps={{ min: 0, max: 2, step: 0.1 }}
                helperText="Controls randomness in responses (0-2)"
              />

              <TextField
                label="Max Tokens"
                type="number"
                value={formData.configuration.maxTokens || 2000}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, maxTokens: parseInt(e.target.value) },
                })}
                fullWidth
                helperText="Maximum number of tokens to generate"
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Agent Preview
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {AGENT_TYPES.find(t => t.value === formData.type)?.label}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Capabilities:</strong> {formData.capabilities.join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Memory:</strong> {formData.memory.type} ({formData.memory.size} MB)
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !isStepValid()}
            startIcon={<CodeIcon />}
          >
            Create Agent
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};