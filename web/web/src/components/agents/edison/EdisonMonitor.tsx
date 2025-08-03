/**
 * Edison Monitor Component
 * Real-time monitoring dashboard for Edison Agent innovation and logic activities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  LightbulbOutlined as InnovationIcon,
  Psychology as LogicIcon,
  Science as ResearchIcon,
  Engineering as ProblemIcon,
  AutoAwesome as BreakthroughIcon,
  TrendingUp as MetricsIcon,
  Groups as CollaborationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
// Types for Edison monitoring
interface EdisonStatus {
  status: string;
  problemsSolved: number;
  innovationScore: number;
  reasoningType: string;
  activeProblems: number;
  currentStage?: string;
}

interface InnovationMetrics {
  totalInnovations: number;
  breakthroughCount: number;
  averageNoveltyScore: number;
  averageFeasibilityScore: number;
  averageImpactScore: number;
}

interface ActiveProblem {
  id: string;
  description: string;
  complexity: number;
  status: 'analyzing' | 'solving' | 'solved';
  progress: number;
}

interface Innovation {
  id: string;
  title: string;
  score: number;
  type: 'breakthrough' | 'incremental' | 'disruptive';
  timestamp: Date;
}

export function EdisonMonitor() {
  const theme = useTheme();
  
  // State
  const [status, setStatus] = useState<EdisonStatus | null>(null);
  const [metrics, setMetrics] = useState<InnovationMetrics | null>(null);
  const [activeProblems, setActiveProblems] = useState<ActiveProblem[]>([]);
  const [recentInnovations, setRecentInnovations] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Edison status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/agents/edison/status');
      if (!response.ok) throw new Error('Failed to fetch Edison status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch innovation metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/agents/edison/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchMetrics()]);
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time updates with polling
  useEffect(() => {
    // Fetch active problems periodically
    const fetchActiveProblems = async () => {
      try {
        const response = await fetch('/api/agents/edison/analyze');
        if (response.ok) {
          // For now, we'll use mock data as the endpoint might not return active problems list
          // In a real implementation, this would come from the backend
        }
      } catch (err) {
        console.error('Failed to fetch active problems:', err);
      }
    };

    const interval = setInterval(() => {
      fetchStatus();
      fetchMetrics();
      fetchActiveProblems();
    }, 10000); // Refresh every 10 seconds for more real-time feel

    return () => clearInterval(interval);
  }, []);

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'busy': return theme.palette.warning.main;
      case 'idle': return theme.palette.info.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Innovation type color
  const getInnovationColor = (type: string) => {
    switch (type) {
      case 'breakthrough': return theme.palette.error.main;
      case 'disruptive': return theme.palette.warning.main;
      case 'incremental': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          💡 Edison Innovation Monitor
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { fetchStatus(); fetchMetrics(); }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Status Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InnovationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Status Overview</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Agent Status
                </Typography>
                <Chip
                  label={status?.status || 'Unknown'}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(status?.status || ''),
                    color: 'white'
                  }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Problems Solved
                  </Typography>
                  <Typography variant="h4">
                    {status?.problemsSolved || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Innovation Score
                  </Typography>
                  <Typography variant="h4">
                    {((status?.innovationScore || 0) * 100).toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thinking Mode
                </Typography>
                <Chip
                  icon={<LogicIcon />}
                  label={status?.reasoningType || 'Mixed'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Problems */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ProblemIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="h6">Active Problem Analysis</Typography>
                <Chip
                  label={status?.activeProblems || 0}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>

              {activeProblems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No active problems being analyzed
                </Typography>
              ) : (
                <List dense>
                  {activeProblems.map((problem) => (
                    <ListItem key={problem.id}>
                      <ListItemIcon>
                        <ProblemIcon color={problem.status === 'solved' ? 'success' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={problem.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" component="span">
                              Complexity: {problem.complexity}/10
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={problem.progress}
                              sx={{ mt: 0.5 }}
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

        {/* Innovation Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MetricsIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                <Typography variant="h6">Innovation Metrics</Typography>
              </Box>

              {metrics && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h3" color="primary">
                        {metrics.totalInnovations}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Innovations
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h3" color="secondary">
                        {metrics.breakthroughCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Breakthroughs
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Novelty
                    </Typography>
                    <Typography variant="h6">
                      {(metrics.averageNoveltyScore * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Feasibility
                    </Typography>
                    <Typography variant="h6">
                      {(metrics.averageFeasibilityScore * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Impact
                    </Typography>
                    <Typography variant="h6">
                      {(metrics.averageImpactScore * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Innovations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BreakthroughIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                <Typography variant="h6">Recent Innovations</Typography>
              </Box>

              {recentInnovations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent innovations
                </Typography>
              ) : (
                <List dense>
                  {recentInnovations.map((innovation) => (
                    <ListItem key={innovation.id}>
                      <ListItemIcon>
                        <InnovationIcon 
                          sx={{ color: getInnovationColor(innovation.type) }} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={innovation.title}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={innovation.type}
                              size="small"
                              sx={{
                                backgroundColor: getInnovationColor(innovation.type),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                            <Typography variant="caption">
                              Score: {(innovation.score * 100).toFixed(0)}%
                            </Typography>
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

        {/* Innovation Pipeline */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ResearchIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="h6">Innovation Pipeline</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                {['Analysis', 'Ideation', 'Validation', 'Implementation'].map((stage, index) => (
                  <Box key={stage} flex={1} textAlign="center">
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: status?.currentStage === stage.toLowerCase() 
                          ? theme.palette.primary.main 
                          : theme.palette.grey[300],
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="caption">{stage}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}