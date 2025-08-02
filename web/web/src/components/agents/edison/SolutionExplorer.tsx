/**
 * Solution Explorer Component
 * Explore, compare and manage innovative solutions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Switch,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Lightbulb as SolutionIcon,
  Compare as CompareIcon,
  Build as ImplementIcon,
  Science as RefineIcon,
  Groups as CollaborateIcon,
  CheckCircle as CheckIcon,
  Warning as RiskIcon,
  TrendingUp as ImpactIcon,
  Speed as FeasibilityIcon,
  AutoAwesome as NoveltyIcon,
  Timeline as RoadmapIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface Solution {
  id: string;
  title: string;
  description: string;
  technique: string;
  scores: {
    innovation: number;
    feasibility: number;
    impact: number;
  };
  implementation?: {
    phases: Array<{
      phase: string;
      duration: string;
      status: 'pending' | 'in_progress' | 'completed';
    }>;
    resources: string[];
    risks: string[];
  };
  status: 'proposed' | 'validated' | 'implementing' | 'completed';
  createdAt: string;
}

interface SolutionExplorerProps {
  problemId?: string;
  onImplement?: (solutionId: string) => void;
  onRefine?: (solutionId: string) => void;
  onCollaborate?: (solutionId: string) => void;
}

export function SolutionExplorer({
  problemId,
  onImplement,
  onRefine,
  onCollaborate
}: SolutionExplorerProps) {
  const theme = useTheme();
  
  // State
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedSolutions, setComparedSolutions] = useState<Set<string>>(new Set());
  const [filterTechnique, setFilterTechnique] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch solutions
  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const url = problemId 
          ? `/api/agents/edison/solutions?problemId=${problemId}`
          : '/api/agents/edison/solutions';
          
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch solutions');
        
        const data = await response.json();
        setSolutions(data.solutions);
      } catch (error) {
        console.error('Failed to fetch solutions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
    const interval = setInterval(fetchSolutions, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [problemId]);

  // Filter solutions
  const filteredSolutions = useMemo(() => {
    return solutions.filter(solution => {
      const avgScore = (solution.scores.innovation + 
                       solution.scores.feasibility + 
                       solution.scores.impact) / 3;
      
      if (avgScore < minScore) return false;
      if (filterTechnique !== 'all' && solution.technique !== filterTechnique) return false;
      
      return true;
    });
  }, [solutions, filterTechnique, minScore]);

  // Get unique techniques
  const techniques = useMemo(() => {
    const techs = new Set(solutions.map(s => s.technique));
    return Array.from(techs);
  }, [solutions]);

  // Toggle comparison
  const toggleComparison = (solutionId: string) => {
    const newCompared = new Set(comparedSolutions);
    if (newCompared.has(solutionId)) {
      newCompared.delete(solutionId);
    } else {
      newCompared.add(solutionId);
    }
    setComparedSolutions(newCompared);
  };

  // Handle solution selection
  const handleSolutionSelect = (solution: Solution) => {
    setSelectedSolution(solution);
    if (!comparisonMode) {
      setDetailsDialogOpen(true);
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'implementing': return theme.palette.info.main;
      case 'validated': return theme.palette.warning.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Render solution card
  const renderSolutionCard = (solution: Solution) => {
    const avgScore = (solution.scores.innovation + 
                     solution.scores.feasibility + 
                     solution.scores.impact) / 3;
    const isCompared = comparedSolutions.has(solution.id);
    
    return (
      <Grid item xs={12} md={6} lg={4} key={solution.id}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: isCompared ? `2px solid ${theme.palette.primary.main}` : undefined,
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}
          onClick={() => handleSolutionSelect(solution)}
        >
          <CardContent sx={{ flex: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="h6" component="h3">
                {solution.title}
              </Typography>
              {comparisonMode && (
                <Checkbox
                  checked={isCompared}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleComparison(solution.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {solution.description}
            </Typography>
            
            <Box display="flex" gap={1} mb={2}>
              <Chip
                label={solution.technique}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={solution.status}
                size="small"
                sx={{
                  bgcolor: alpha(getStatusColor(solution.status), 0.1),
                  color: getStatusColor(solution.status)
                }}
              />
            </Box>
            
            {/* Score Indicators */}
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <NoveltyIcon sx={{ color: getScoreColor(solution.scores.innovation) }} />
                  <Typography variant="caption" display="block">
                    Innovation
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(solution.scores.innovation * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <FeasibilityIcon sx={{ color: getScoreColor(solution.scores.feasibility) }} />
                  <Typography variant="caption" display="block">
                    Feasibility
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(solution.scores.feasibility * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <ImpactIcon sx={{ color: getScoreColor(solution.scores.impact) }} />
                  <Typography variant="caption" display="block">
                    Impact
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(solution.scores.impact * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Overall Score */}
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Overall Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={avgScore * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(avgScore)
                  }
                }}
              />
            </Box>
          </CardContent>
          
          <CardActions>
            <Button
              size="small"
              startIcon={<ImplementIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onImplement?.(solution.id);
              }}
            >
              Implement
            </Button>
            <Button
              size="small"
              startIcon={<RefineIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onRefine?.(solution.id);
              }}
            >
              Refine
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  // Render comparison matrix
  const renderComparisonMatrix = () => {
    const compared = Array.from(comparedSolutions).map(id => 
      solutions.find(s => s.id === id)!
    ).filter(Boolean);
    
    if (compared.length < 2) {
      return (
        <Alert severity="info">
          Select at least 2 solutions to compare
        </Alert>
      );
    }
    
    const criteria = ['Innovation', 'Feasibility', 'Impact', 'Overall'];
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Criteria</TableCell>
              {compared.map(sol => (
                <TableCell key={sol.id} align="center">
                  {sol.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {criteria.map(criterion => (
              <TableRow key={criterion}>
                <TableCell>{criterion}</TableCell>
                {compared.map(sol => {
                  let score;
                  switch (criterion) {
                    case 'Innovation':
                      score = sol.scores.innovation;
                      break;
                    case 'Feasibility':
                      score = sol.scores.feasibility;
                      break;
                    case 'Impact':
                      score = sol.scores.impact;
                      break;
                    default:
                      score = (sol.scores.innovation + 
                              sol.scores.feasibility + 
                              sol.scores.impact) / 3;
                  }
                  
                  return (
                    <TableCell key={sol.id} align="center">
                      <Rating
                        value={score * 5}
                        readOnly
                        precision={0.1}
                        size="small"
                      />
                      <Typography variant="body2">
                        {(score * 100).toFixed(0)}%
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Box p={2}>
          <Typography variant="subtitle2" gutterBottom>
            Recommendation
          </Typography>
          <Typography variant="body2">
            Based on the comparison, <strong>{compared[0].title}</strong> appears to 
            offer the best balance of innovation, feasibility, and impact.
          </Typography>
        </Box>
      </TableContainer>
    );
  };

  // Render solution details dialog
  const renderDetailsDialog = () => {
    if (!selectedSolution) return null;
    
    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedSolution.title}</Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Implementation" />
            <Tab label="Risks & Resources" />
          </Tabs>
          
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedSolution.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <NoveltyIcon color="primary" />
                    <Typography variant="subtitle2">Innovation</Typography>
                    <Typography variant="h4">
                      {(selectedSolution.scores.innovation * 100).toFixed(0)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <FeasibilityIcon color="secondary" />
                    <Typography variant="subtitle2">Feasibility</Typography>
                    <Typography variant="h4">
                      {(selectedSolution.scores.feasibility * 100).toFixed(0)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <ImpactIcon color="success" />
                    <Typography variant="subtitle2">Impact</Typography>
                    <Typography variant="h4">
                      {(selectedSolution.scores.impact * 100).toFixed(0)}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Technique Used
                </Typography>
                <Chip label={selectedSolution.technique} color="primary" />
              </Box>
            </Box>
          )}
          
          {/* Implementation Tab */}
          {activeTab === 1 && selectedSolution.implementation && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Implementation Roadmap
              </Typography>
              
              <List>
                {selectedSolution.implementation.phases.map((phase, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {phase.status === 'completed' ? (
                        <CheckIcon color="success" />
                      ) : phase.status === 'in_progress' ? (
                        <RoadmapIcon color="primary" />
                      ) : (
                        <RoadmapIcon color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={phase.phase}
                      secondary={`Duration: ${phase.duration}`}
                    />
                    <Chip
                      label={phase.status}
                      size="small"
                      color={phase.status === 'completed' ? 'success' : 
                             phase.status === 'in_progress' ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* Risks & Resources Tab */}
          {activeTab === 2 && selectedSolution.implementation && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Required Resources
              </Typography>
              <List dense>
                {selectedSolution.implementation.resources.map((resource, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={resource} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Identified Risks
              </Typography>
              <List dense>
                {selectedSolution.implementation.risks.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <RiskIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onCollaborate?.(selectedSolution.id)}>
            Collaborate
          </Button>
          <Button onClick={() => onRefine?.(selectedSolution.id)}>
            Refine
          </Button>
          <Button 
            variant="contained" 
            onClick={() => onImplement?.(selectedSolution.id)}
          >
            Implement
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                />
              }
              label="Comparison Mode"
            />
            
            {/* Filters would go here */}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {filteredSolutions.length} solutions found
          </Typography>
        </Box>
      </Paper>
      
      {/* Solutions Grid */}
      {!comparisonMode ? (
        <Grid container spacing={3}>
          {filteredSolutions.map(renderSolutionCard)}
        </Grid>
      ) : (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {filteredSolutions.map(renderSolutionCard)}
          </Grid>
          
          {comparedSolutions.size > 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Solution Comparison
              </Typography>
              {renderComparisonMatrix()}
            </Paper>
          )}
        </Box>
      )}
      
      {/* Details Dialog */}
      {renderDetailsDialog()}
    </Box>
  );
}