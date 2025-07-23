/**
 * Agent Handoff Monitor - Advanced SupervisorAgent Handoff Intelligence
 * Professional handoff monitoring with SupervisorAgent decision logic, performance analytics, and context transfer tracking
 */

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
  Tooltip,
  Badge,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  SwapHoriz as HandoffIcon,
  ArrowForward as ArrowForwardIcon,
  Psychology as SupervisorIcon,
  Speed as PerformanceIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TrendIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as AgentIcon,
  DataObject as ContextIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// TypeScript interfaces
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
  supervisorDecision?: {
    strategy: string;
    reasoning: string;
    alternativesConsidered: string[];
    confidenceFactors: Record<string, number>;
  };
  performanceImpact?: {
    executionTimeChange: number;
    resourceUtilization: number;
    qualityImprovement: number;
  };
}

interface HandoffMetrics {
  totalHandoffs: number;
  successRate: number;
  averageLatency: number;
  averageConfidence?: number;
  topReasons?: Array<{ reason: string; count: number; successRate: number }>;
  agentPerformance?: Record<string, { handoffsFrom: number; handoffsTo: number; successRate: number }>;
}

interface AgentHandoffMonitorProps {
  handoffs: AgentHandoff[];
  metrics: HandoffMetrics;
  maxHandoffs?: number;
}

export function AgentHandoffMonitor({
  handoffs,
  metrics,
  maxHandoffs = 20
}: AgentHandoffMonitorProps) {
  const [selectedHandoff, setSelectedHandoff] = useState<AgentHandoff | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  /**
   * Get agent color based on agent name
   */
  const getAgentColor = (agentName: string): string => {
    const colors: Record<string, string> = {
      'SupervisorAgent': '#1976d2',    // Blue
      'ShakaAgent': '#388e3c',         // Green  
      'AtlasAgent': '#f57c00',         // Orange
      'EdisonAgent': '#7b1fa2',        // Purple
      'default': '#757575'             // Gray
    };
    
    return colors[agentName] || colors.default;
  };

  /**
   * Get confidence level indicator
   */
  const getConfidenceLevel = (confidence: number): { color: string; label: string } => {
    if (confidence >= 0.9) return { color: 'success.main', label: 'Very High' };
    if (confidence >= 0.75) return { color: 'info.main', label: 'High' };
    if (confidence >= 0.5) return { color: 'warning.main', label: 'Medium' };
    return { color: 'error.main', label: 'Low' };
  };

  /**
   * Get handoff reason priority
   */
  const getReasonPriority = (reason: string): 'high' | 'medium' | 'low' => {
    const highPriority = ['specialized_execution_required', 'critical_security_analysis', 'emergency_response'];
    const mediumPriority = ['capability_match', 'workload_balance', 'expertise_optimization'];
    
    if (highPriority.some(priority => reason.includes(priority))) return 'high';
    if (mediumPriority.some(priority => reason.includes(priority))) return 'medium';
    return 'low';
  };

  /**
   * Format handoff reason for display
   */
  const formatHandoffReason = (reason: string): string => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  /**
   * Calculate handoff trend
   */
  const calculateHandoffTrend = (): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
    if (handoffs.length < 2) return { direction: 'stable', percentage: 0 };
    
    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    
    const recentHandoffs = handoffs.filter(h => new Date(h.timestamp).getTime() > oneHourAgo).length;
    const previousHandoffs = handoffs.filter(h => {
      const time = new Date(h.timestamp).getTime();
      return time > twoHoursAgo && time <= oneHourAgo;
    }).length;

    if (previousHandoffs === 0) return { direction: 'stable', percentage: 0 };
    
    const change = ((recentHandoffs - previousHandoffs) / previousHandoffs) * 100;
    
    if (Math.abs(change) < 10) return { direction: 'stable', percentage: change };
    return { direction: change > 0 ? 'up' : 'down', percentage: Math.abs(change) };
  };

  const trend = calculateHandoffTrend();
  const displayedHandoffs = handoffs.slice(0, maxHandoffs);

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      {/* Handoff Metrics Overview */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {metrics.totalHandoffs}
                </Typography>
                <Box>
                  {trend.direction === 'up' && <TrendingUpIcon color="success" fontSize="small" />}
                  {trend.direction === 'down' && <TrendingDownIcon color="error" fontSize="small" />}
                  {trend.direction === 'stable' && <TrendIcon color="info" fontSize="small" />}
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Total Handoffs
              </Typography>
              {trend.percentage > 0 && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {trend.direction === 'up' ? '+' : ''}{trend.percentage.toFixed(1)}% vs last hour
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {(metrics.successRate * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Success Rate
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.successRate * 100}
                  color="success"
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Card variant="outlined">
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
            <PerformanceIcon color="info" fontSize="small" />
            Handoff Performance
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  {metrics.averageLatency.toFixed(0)}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Latency
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  {metrics.averageConfidence ? (metrics.averageConfidence * 100).toFixed(0) + '%' : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Confidence
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  {displayedHandoffs.filter(h => h.success).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recent Success
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Handoffs List */}
      <Paper variant="outlined" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <HandoffIcon color="primary" fontSize="small" />
            Recent Agent Handoffs
            <Badge badgeContent={displayedHandoffs.length} color="primary" sx={{ ml: 1 }} />
          </Typography>
        </Box>
        
        <Box sx={{ height: 250, overflow: 'auto' }}>
          {displayedHandoffs.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'text.secondary'
            }}>
              <HandoffIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body2">
                No recent handoffs
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ py: 0 }}>
              {displayedHandoffs.map((handoff, index) => {
                const confidenceLevel = getConfidenceLevel(handoff.confidence);
                const reasonPriority = getReasonPriority(handoff.reason);
                const isSelected = selectedHandoff?.id === handoff.id;

                return (
                  <React.Fragment key={handoff.id}>
                    <ListItem
                      button
                      onClick={() => setSelectedHandoff(isSelected ? null : handoff)}
                      selected={isSelected}
                      sx={{ 
                        py: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: getAgentColor(handoff.fromAgent),
                            fontSize: '0.8rem'
                          }}
                        >
                          {handoff.fromAgent.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="500">
                              {handoff.fromAgent}
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight="500">
                              {handoff.toAgent}
                            </Typography>
                            
                            <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
                              <Chip
                                label={formatHandoffReason(handoff.reason)}
                                size="small"
                                color={reasonPriority === 'high' ? 'error' : reasonPriority === 'medium' ? 'warning' : 'info'}
                                sx={{ fontSize: '0.6rem', height: 18 }}
                              />
                              
                              <Chip
                                label={handoff.success ? 'Success' : 'Failed'}
                                size="small"
                                color={handoff.success ? 'success' : 'error'}
                                sx={{ fontSize: '0.6rem', height: 18 }}
                              />
                            </Stack>
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(handoff.timestamp), 'HH:mm:ss')} • 
                              Duration: {handoff.duration}ms • 
                              Confidence: {(handoff.confidence * 100).toFixed(0)}%
                            </Typography>
                            
                            <Tooltip title={`Confidence: ${confidenceLevel.label}`}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: confidenceLevel.color
                                }}
                              />
                            </Tooltip>
                          </Stack>
                        }
                      />
                    </ListItem>

                    {/* Expanded Handoff Details */}
                    {isSelected && (
                      <Box sx={{ px: 2, pb: 2, bgcolor: 'action.hover' }}>
                        <Stack spacing={2}>
                          {/* Supervisor Decision Details */}
                          {handoff.supervisorDecision && (
                            <Accordion size="small">
                              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
                                <Typography variant="caption" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                  <SupervisorIcon fontSize="small" color="primary" />
                                  Supervisor Decision Logic
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ py: 1 }}>
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" fontWeight="bold">Strategy:</Typography>
                                    <Typography variant="caption" display="block">
                                      {handoff.supervisorDecision.strategy}
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="caption" fontWeight="bold">Reasoning:</Typography>
                                    <Typography variant="caption" display="block">
                                      {handoff.supervisorDecision.reasoning}
                                    </Typography>
                                  </Box>
                                  
                                  {handoff.supervisorDecision.alternativesConsidered.length > 0 && (
                                    <Box>
                                      <Typography variant="caption" fontWeight="bold">Alternatives Considered:</Typography>
                                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                        {handoff.supervisorDecision.alternativesConsidered.map((alt, i) => (
                                          <Chip key={i} label={alt} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {/* Context Transfer Details */}
                          <Accordion size="small">
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <ContextIcon fontSize="small" color="secondary" />
                                Context Transfer ({Object.keys(handoff.contextTransferred).length} fields)
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ py: 1 }}>
                              <Paper 
                                variant="outlined" 
                                sx={{ p: 1, bgcolor: '#f9f9f9', maxHeight: 120, overflow: 'auto' }}
                              >
                                <pre style={{ 
                                  fontSize: '10px', 
                                  margin: 0, 
                                  fontFamily: 'Monaco, monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all'
                                }}>
                                  {JSON.stringify(handoff.contextTransferred, null, 2)}
                                </pre>
                              </Paper>
                            </AccordionDetails>
                          </Accordion>

                          {/* Performance Impact */}
                          {handoff.performanceImpact && (
                            <Box>
                              <Typography variant="caption" fontWeight="bold" display="flex" alignItems="center" gap={1} mb={1}>
                                <AnalyticsIcon fontSize="small" color="info" />
                                Performance Impact
                              </Typography>
                              
                              <Grid container spacing={1}>
                                <Grid item xs={4}>
                                  <Box textAlign="center">
                                    <Typography variant="caption" fontWeight="bold" color="info.main">
                                      {handoff.performanceImpact.executionTimeChange > 0 ? '+' : ''}
                                      {handoff.performanceImpact.executionTimeChange}%
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Execution Time
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={4}>
                                  <Box textAlign="center">
                                    <Typography variant="caption" fontWeight="bold" color="warning.main">
                                      {handoff.performanceImpact.resourceUtilization}%
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Resource Usage
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={4}>
                                  <Box textAlign="center">
                                    <Typography variant="caption" fontWeight="bold" color="success.main">
                                      +{handoff.performanceImpact.qualityImprovement}%
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Quality Gain
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}
                    
                    {index < displayedHandoffs.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}