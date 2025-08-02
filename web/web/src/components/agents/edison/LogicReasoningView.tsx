/**
 * Logic Reasoning View Component
 * Visualize and interact with logical reasoning processes
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Psychology as DeductiveIcon,
  TrendingUp as InductiveIcon,
  EmojiObjects as AbductiveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  ExpandMore as ExpandIcon,
  CheckCircle as ValidIcon,
  Cancel as InvalidIcon,
  Help as UncertainIcon,
  Warning as FallacyIcon,
  AccountTree as DiagramIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { ReasoningProcess } from '@agents/edison/EdisonAgentTypes';

interface LogicReasoningViewProps {
  onReasoningComplete?: (process: ReasoningProcess) => void;
}

type ReasoningType = 'deductive' | 'inductive' | 'abductive';

interface ReasoningStep {
  step: number;
  description: string;
  rule: string;
  confidence: number;
}

interface Conclusion {
  statement: string;
  confidence: number;
  validity: 'valid' | 'invalid' | 'uncertain';
  reasoning_chain?: string[];
}

interface Fallacy {
  type: string;
  description: string;
  location: string;
}

export function LogicReasoningView({ onReasoningComplete }: LogicReasoningViewProps) {
  const theme = useTheme();
  
  // State
  const [reasoningType, setReasoningType] = useState<ReasoningType>('deductive');
  const [premises, setPremises] = useState<string[]>([]);
  const [premiseInput, setPremiseInput] = useState('');
  const [goal, setGoal] = useState('');
  const [reasoning, setReasoning] = useState(false);
  const [reasoningProcess, setReasoningProcess] = useState<ReasoningProcess | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Add premise
  const addPremise = () => {
    if (premiseInput.trim()) {
      setPremises([...premises, premiseInput.trim()]);
      setPremiseInput('');
    }
  };

  // Remove premise
  const removePremise = (index: number) => {
    setPremises(premises.filter((_, i) => i !== index));
  };

  // Perform reasoning
  const performReasoning = async () => {
    if (premises.length === 0) {
      setError('Please add at least one premise');
      return;
    }

    setReasoning(true);
    setError(null);
    setActiveStep(0);

    try {
      const response = await fetch('/api/agents/edison/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premises,
          type: reasoningType,
          goal: goal || undefined,
          checkConsistency: true,
          detectFallacies: true
        })
      });

      if (!response.ok) {
        throw new Error('Reasoning failed');
      }

      const result = await response.json();
      setReasoningProcess(result.reasoning);
      
      if (onReasoningComplete) {
        onReasoningComplete(result.reasoning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reasoning failed');
    } finally {
      setReasoning(false);
    }
  };

  // Get reasoning type info
  const getReasoningTypeInfo = (type: ReasoningType) => {
    switch (type) {
      case 'deductive':
        return {
          icon: <DeductiveIcon />,
          title: 'Deductive Reasoning',
          description: 'Draw specific conclusions from general premises',
          example: 'All humans are mortal → Socrates is human → Therefore, Socrates is mortal'
        };
      case 'inductive':
        return {
          icon: <InductiveIcon />,
          title: 'Inductive Reasoning',
          description: 'Infer general patterns from specific observations',
          example: 'Swan 1 is white → Swan 2 is white → Therefore, all swans are white (probable)'
        };
      case 'abductive':
        return {
          icon: <AbductiveIcon />,
          title: 'Abductive Reasoning',
          description: 'Find the best explanation for observed evidence',
          example: 'The grass is wet → It probably rained (best explanation)'
        };
    }
  };

  // Get validity color
  const getValidityColor = (validity: string) => {
    switch (validity) {
      case 'valid': return theme.palette.success.main;
      case 'invalid': return theme.palette.error.main;
      default: return theme.palette.warning.main;
    }
  };

  // Get validity icon
  const getValidityIcon = (validity: string) => {
    switch (validity) {
      case 'valid': return <ValidIcon />;
      case 'invalid': return <InvalidIcon />;
      default: return <UncertainIcon />;
    }
  };

  const typeInfo = getReasoningTypeInfo(reasoningType);

  return (
    <Box>
      {/* Reasoning Type Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Reasoning Type
        </Typography>
        
        <ToggleButtonGroup
          value={reasoningType}
          exclusive
          onChange={(_, value) => value && setReasoningType(value)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="deductive">
            <DeductiveIcon sx={{ mr: 1 }} />
            Deductive
          </ToggleButton>
          <ToggleButton value="inductive">
            <InductiveIcon sx={{ mr: 1 }} />
            Inductive
          </ToggleButton>
          <ToggleButton value="abductive">
            <AbductiveIcon sx={{ mr: 1 }} />
            Abductive
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Alert severity="info" icon={typeInfo.icon}>
          <Typography variant="subtitle2">{typeInfo.title}</Typography>
          <Typography variant="body2">{typeInfo.description}</Typography>
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Example: {typeInfo.example}
          </Typography>
        </Alert>
      </Paper>

      {/* Premises Input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {reasoningType === 'deductive' ? 'Premises' : 
           reasoningType === 'inductive' ? 'Observations' : 'Evidence'}
        </Typography>
        
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            value={premiseInput}
            onChange={(e) => setPremiseInput(e.target.value)}
            placeholder={
              reasoningType === 'deductive' ? 'Enter a premise...' :
              reasoningType === 'inductive' ? 'Enter an observation...' :
              'Enter evidence...'
            }
            onKeyPress={(e) => e.key === 'Enter' && addPremise()}
          />
          <Button
            variant="contained"
            onClick={addPremise}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
        
        <List>
          {premises.map((premise, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Chip label={`P${index + 1}`} size="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={premise} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => removePremise(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        
        {premises.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center">
            No {reasoningType === 'deductive' ? 'premises' : 
                reasoningType === 'inductive' ? 'observations' : 'evidence'} added yet
          </Typography>
        )}
        
        {/* Optional Goal */}
        <Box mt={2}>
          <TextField
            fullWidth
            label="Goal (Optional)"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What conclusion are you trying to reach?"
            variant="outlined"
          />
        </Box>
        
        <Box mt={3}>
          <Button
            variant="contained"
            onClick={performReasoning}
            disabled={premises.length === 0 || reasoning}
            startIcon={reasoning ? <CircularProgress size={20} /> : <RunIcon />}
            fullWidth
          >
            {reasoning ? 'Performing Reasoning...' : `Perform ${typeInfo.title}`}
          </Button>
        </Box>
      </Paper>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Reasoning Process Results */}
      {reasoningProcess && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reasoning Process
          </Typography>
          
          {/* Reasoning Steps */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>Reasoning Steps</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper activeStep={activeStep} orientation="vertical">
                {reasoningProcess.steps.map((step, index) => (
                  <Step key={index} expanded>
                    <StepLabel
                      onClick={() => setActiveStep(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      Step {step.step}: {step.description}
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Rule Applied: {step.rule}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Typography variant="caption">Confidence:</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={step.confidence * 100}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {(step.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </AccordionDetails>
          </Accordion>
          
          {/* Conclusions */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography>
                Conclusions ({reasoningProcess.conclusions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {reasoningProcess.conclusions.map((conclusion, index) => (
                  <Grid item xs={12} key={index}>
                    <Card sx={{ 
                      bgcolor: alpha(getValidityColor(conclusion.validity), 0.05),
                      border: `1px solid ${getValidityColor(conclusion.validity)}`
                    }}>
                      <CardContent>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box sx={{ color: getValidityColor(conclusion.validity) }}>
                            {getValidityIcon(conclusion.validity)}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body1">
                              {conclusion.statement}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Chip
                                label={conclusion.validity}
                                size="small"
                                sx={{
                                  bgcolor: getValidityColor(conclusion.validity),
                                  color: 'white'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Confidence: {(conclusion.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Overall Confidence */}
          <Box mt={3} p={2} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>
              Overall Reasoning Confidence
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={reasoningProcess.confidence * 100}
                sx={{ flex: 1, height: 10, borderRadius: 5 }}
              />
              <Typography variant="h6" color="primary">
                {(reasoningProcess.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
          
          {/* Reasoning Diagram */}
          {reasoningProcess.diagram && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                <DiagramIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Reasoning Flow Diagram
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <pre style={{ 
                  margin: 0, 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto'
                }}>
                  {reasoningProcess.diagram}
                </pre>
              </Paper>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}