/**
 * Problem Analysis Panel Component
 * Interactive interface for problem decomposition and analysis
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Alert,
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Engineering as ProblemIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AccountTree as DecomposeIcon,
  Build as SolveIcon,
  Share as DelegateIcon,
  Assessment as ComplexityIcon,
  Link as DependencyIcon,
  Send as SubmitIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import type { ProblemDecomposition } from '@agents/edison/EdisonAgentTypes';

interface SubProblem {
  id: string;
  description: string;
  complexity: number;
  dependencies: string[];
  priority: number;
  expanded?: boolean;
  solutions?: string[];
}

interface ProblemAnalysisPanelProps {
  onAnalysisComplete?: (decomposition: ProblemDecomposition) => void;
  onSolveSubProblem?: (subProblemId: string) => void;
  onDelegateSubProblem?: (subProblemId: string, agent: string) => void;
}

export function ProblemAnalysisPanel({
  onAnalysisComplete,
  onSolveSubProblem,
  onDelegateSubProblem
}: ProblemAnalysisPanelProps) {
  const theme = useTheme();
  
  // State
  const [problemInput, setProblemInput] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [constraintInput, setConstraintInput] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [complexity, setComplexity] = useState(5);
  const [decompositionDepth, setDecompositionDepth] = useState(3);
  const [analyzing, setAnalyzing] = useState(false);
  const [decomposition, setDecomposition] = useState<ProblemDecomposition | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Handle problem analysis
  const handleAnalyzeProblem = async () => {
    if (!problemInput.trim()) {
      setError('Please enter a problem description');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/edison/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problemInput,
          constraints,
          objectives,
          complexity,
          decompositionDepth
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setDecomposition(result.analysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Add constraint
  const addConstraint = () => {
    if (constraintInput.trim()) {
      setConstraints([...constraints, constraintInput.trim()]);
      setConstraintInput('');
    }
  };

  // Add objective
  const addObjective = () => {
    if (objectiveInput.trim()) {
      setObjectives([...objectives, objectiveInput.trim()]);
      setObjectiveInput('');
    }
  };

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Clear form
  const clearForm = () => {
    setProblemInput('');
    setConstraints([]);
    setObjectives([]);
    setComplexity(5);
    setDecompositionDepth(3);
    setDecomposition(null);
    setExpandedNodes(new Set());
    setError(null);
  };

  // Get complexity color
  const getComplexityColor = (value: number) => {
    if (value <= 3) return theme.palette.success.main;
    if (value <= 7) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Render sub-problem tree
  const renderSubProblem = (subProblem: SubProblem, depth: number = 0) => {
    const isExpanded = expandedNodes.has(subProblem.id);
    const hasChildren = subProblem.dependencies.length > 0;
    
    return (
      <Box key={subProblem.id} sx={{ ml: depth * 3 }}>
        <Card 
          sx={{ 
            mb: 1, 
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" flex={1}>
                {hasChildren && (
                  <IconButton
                    size="small"
                    onClick={() => toggleNode(subProblem.id)}
                    sx={{ mr: 1 }}
                  >
                    {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                )}
                <ProblemIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Box flex={1}>
                  <Typography variant="body2">
                    {subProblem.description}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    <Chip
                      icon={<ComplexityIcon />}
                      label={`Complexity: ${subProblem.complexity}`}
                      size="small"
                      sx={{
                        bgcolor: alpha(getComplexityColor(subProblem.complexity), 0.1),
                        color: getComplexityColor(subProblem.complexity)
                      }}
                    />
                    <Chip
                      label={`Priority: ${(subProblem.priority * 100).toFixed(0)}%`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                <Tooltip title="Solve this sub-problem">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onSolveSubProblem?.(subProblem.id)}
                  >
                    <SolveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delegate to another agent">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => onDelegateSubProblem?.(subProblem.id, 'shaka')}
                  >
                    <DelegateIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        {hasChildren && isExpanded && (
          <Box sx={{ ml: 2, borderLeft: `2px solid ${theme.palette.divider}` }}>
            {subProblem.dependencies.map(depId => {
              const depProblem = decomposition?.subProblems.find(sp => sp.id === depId);
              return depProblem ? renderSubProblem(depProblem, depth + 1) : null;
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Problem Input Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Define Problem
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          value={problemInput}
          onChange={(e) => setProblemInput(e.target.value)}
          placeholder="Describe the problem you want Edison to analyze..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {/* Constraints */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Constraints
          </Typography>
          <Box display="flex" gap={1} mb={1}>
            <TextField
              size="small"
              value={constraintInput}
              onChange={(e) => setConstraintInput(e.target.value)}
              placeholder="Add constraint..."
              onKeyPress={(e) => e.key === 'Enter' && addConstraint()}
              sx={{ flex: 1 }}
            />
            <Button onClick={addConstraint} size="small">
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {constraints.map((constraint, index) => (
              <Chip
                key={index}
                label={constraint}
                onDelete={() => setConstraints(constraints.filter((_, i) => i !== index))}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        {/* Objectives */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Objectives
          </Typography>
          <Box display="flex" gap={1} mb={1}>
            <TextField
              size="small"
              value={objectiveInput}
              onChange={(e) => setObjectiveInput(e.target.value)}
              placeholder="Add objective..."
              onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              sx={{ flex: 1 }}
            />
            <Button onClick={addObjective} size="small">
              Add
            </Button>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {objectives.map((objective, index) => (
              <Chip
                key={index}
                label={objective}
                onDelete={() => setObjectives(objectives.filter((_, i) => i !== index))}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
        
        {/* Analysis Parameters */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Problem Complexity: {complexity}
            </Typography>
            <Slider
              value={complexity}
              onChange={(_, value) => setComplexity(value as number)}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
              sx={{
                color: getComplexityColor(complexity),
                '& .MuiSlider-thumb': {
                  backgroundColor: getComplexityColor(complexity)
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Decomposition Depth: {decompositionDepth}
            </Typography>
            <Slider
              value={decompositionDepth}
              onChange={(_, value) => setDecompositionDepth(value as number)}
              min={1}
              max={7}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
        
        {/* Action Buttons */}
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={handleAnalyzeProblem}
            disabled={!problemInput.trim() || analyzing}
            startIcon={analyzing ? <CircularProgress size={20} /> : <DecomposeIcon />}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Problem'}
          </Button>
          <Button
            variant="outlined"
            onClick={clearForm}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
        </Box>
      </Paper>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Decomposition Results */}
      {decomposition && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Problem Decomposition
          </Typography>
          
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Root Problem
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {decomposition.rootProblem}
            </Typography>
            <Chip
              label={`Total Complexity: ${decomposition.totalComplexity}`}
              color="primary"
              size="small"
            />
          </Box>
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Sub-Problems ({decomposition.subProblems.length})
          </Typography>
          
          <Box>
            {decomposition.subProblems
              .filter(sp => !sp.dependencies || sp.dependencies.length === 0)
              .map(sp => renderSubProblem(sp))}
          </Box>
          
          {/* Dependency Visualization Info */}
          <Box mt={3} p={2} bgcolor={alpha(theme.palette.info.main, 0.1)} borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              <DependencyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Click on sub-problems with expand icons to view their dependencies.
              Use the solve or delegate buttons to take action on specific sub-problems.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}