/**
 * A2A Network Monitor - Real-time visualization of agent network
 * Shows agent status, connections, message flow, and capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  AccountTree as NetworkIcon,
  Person as AgentIcon,
  Speed as PerformanceIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon,
  Psychology as CapabilityIcon,
  Timeline as FlowIcon,
  Settings as SettingsIcon,
  HealthAndSafety as HealthIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface AgentProfile {
  agentId: string;
  agentType: string;
  status: 'online' | 'offline' | 'busy' | 'maintenance' | 'error';
  capabilities: AgentCapability[];
  metadata: {
    version: string;
    location: string;
    load: number;
    uptime: number;
    performance_metrics?: {
      avg_response_time: number;
      success_rate: number;
      total_requests: number;
    };
  };
  lastSeen: string;
}

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: string;
  reliability: number;
  cost: number;
}

interface NetworkTopology {
  agents: AgentProfile[];
  connections: Record<string, string[]>;
  messageRoutes: Record<string, Route[]>;
  lastUpdated: string;
}

interface Route {
  agentId: string;
  capability: string;
  cost: number;
  reliability: number;
  responseTime: number;
  load: number;
}

interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  timestamp: string;
  priority: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
}

export function A2ANetworkMonitor() {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [recentMessages, setRecentMessages] = useState<A2AMessage[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  /**
   * Fetch network topology data
   */
  const fetchNetworkData = useCallback(async () => {
    try {
      // Simulate API calls - replace with actual endpoints
      const [topologyRes, messagesRes, statsRes] = await Promise.all([
        fetch('/api/a2a/topology').catch(() => ({ ok: false })),
        fetch('/api/a2a/messages/recent').catch(() => ({ ok: false })),
        fetch('/api/a2a/stats').catch(() => ({ ok: false }))
      ]);

      // Mock data for demonstration
      const mockTopology: NetworkTopology = {
        agents: [
          {
            agentId: 'vegapunk-001',
            agentType: 'TechnicalSupport',
            status: 'online',
            capabilities: [
              {
                id: 'tech-support',
                name: 'Technical Support',
                description: 'General technical assistance',
                category: 'support',
                reliability: 0.92,
                cost: 20
              },
              {
                id: 'llm-interaction',
                name: 'LLM Interaction',
                description: 'Multi-provider LLM communication',
                category: 'communication',
                reliability: 0.95,
                cost: 15
              }
            ],
            metadata: {
              version: '1.0.0',
              location: 'graph://vegapunk-001',
              load: 35,
              uptime: 3600000,
              performance_metrics: {
                avg_response_time: 2500,
                success_rate: 0.94,
                total_requests: 1247
              }
            },
            lastSeen: new Date().toISOString()
          },
          {
            agentId: 'shaka-001',
            agentType: 'EthicalAnalysis',
            status: 'online',
            capabilities: [
              {
                id: 'ethical-analysis',
                name: 'Ethical Analysis',
                description: 'Multi-framework ethical evaluation',
                category: 'analysis',
                reliability: 0.96,
                cost: 30
              },
              {
                id: 'conflict-resolution',
                name: 'Conflict Resolution',
                description: 'Ethical conflict resolution',
                category: 'analysis',
                reliability: 0.88,
                cost: 45
              }
            ],
            metadata: {
              version: '1.0.0',
              location: 'graph://shaka-001',
              load: 22,
              uptime: 3500000,
              performance_metrics: {
                avg_response_time: 4200,
                success_rate: 0.91,
                total_requests: 543
              }
            },
            lastSeen: new Date().toISOString()
          }
        ],
        connections: {
          'vegapunk-001': ['shaka-001'],
          'shaka-001': ['vegapunk-001']
        },
        messageRoutes: {},
        lastUpdated: new Date().toISOString()
      };

      const mockMessages: A2AMessage[] = [
        {
          id: 'msg-001',
          from: 'vegapunk-001',
          to: 'shaka-001',
          type: 'task_delegate',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          priority: 'normal',
          status: 'delivered'
        },
        {
          id: 'msg-002',
          from: 'shaka-001',
          to: 'vegapunk-001',
          type: 'task_response',
          timestamp: new Date(Date.now() - 15000).toISOString(),
          priority: 'normal',
          status: 'delivered'
        }
      ];

      const mockStats = {
        totalAgents: mockTopology.agents.length,
        onlineAgents: mockTopology.agents.filter(a => a.status === 'online').length,
        totalCapabilities: mockTopology.agents.reduce((sum, a) => sum + a.capabilities.length, 0),
        uniqueCapabilities: new Set(mockTopology.agents.flatMap(a => a.capabilities.map(c => c.name))).size,
        averageLoad: mockTopology.agents.reduce((sum, a) => sum + a.metadata.load, 0) / mockTopology.agents.length,
        totalMessages: 1247,
        messagesPerMinute: 12.3
      };

      setTopology(mockTopology);
      setRecentMessages(mockMessages);
      setNetworkStats(mockStats);
      setError(null);

    } catch (err) {
      setError('Failed to fetch network data');
      console.error('Network data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchNetworkData();

    if (autoRefresh) {
      const interval = setInterval(fetchNetworkData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchNetworkData]);

  /**
   * Get status color for agent
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      case 'maintenance': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  /**
   * Get status icon for agent
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <SuccessIcon color="success" />;
      case 'busy': return <WarningIcon color="warning" />;
      case 'offline': return <ErrorIcon color="error" />;
      case 'maintenance': return <SettingsIcon color="info" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <AgentIcon />;
    }
  };

  /**
   * Format uptime duration
   */
  const formatUptime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  /**
   * Format load percentage
   */
  const getLoadColor = (load: number): 'success' | 'warning' | 'error' => {
    if (load < 50) return 'success';
    if (load < 80) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading A2A Network Status...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchNetworkData} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <NetworkIcon color="primary" />
          <Typography variant="h6">
            A2A Network Monitor
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
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
          <IconButton onClick={fetchNetworkData} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Network Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary">
                    {networkStats?.onlineAgents || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online Agents
                  </Typography>
                </Box>
                <AgentIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="secondary">
                    {networkStats?.uniqueCapabilities || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capabilities
                  </Typography>
                </Box>
                <CapabilityIcon color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info">
                    {networkStats?.averageLoad?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Load
                  </Typography>
                </Box>
                <PerformanceIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="warning">
                    {networkStats?.messagesPerMinute?.toFixed(1) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Msg/Min
                  </Typography>
                </Box>
                <MessageIcon color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Agents List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <AgentIcon />
                Active Agents
              </Typography>
              
              <List>
                {topology?.agents.map((agent, index) => (
                  <React.Fragment key={agent.agentId}>
                    {index > 0 && <Divider />}
                    <ListItem
                      onClick={() => setSelectedAgent(
                        selectedAgent === agent.agentId ? null : agent.agentId
                      )}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemIcon>
                        <Badge
                          color={getStatusColor(agent.status) as any}
                          variant="dot"
                        >
                          {getStatusIcon(agent.status)}
                        </Badge>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {agent.agentId}
                            </Typography>
                            <Chip
                              label={agent.agentType}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${agent.metadata.load}% load`}
                              size="small"
                              color={getLoadColor(agent.metadata.load)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Uptime: {formatUptime(agent.metadata.uptime)} • 
                              Capabilities: {agent.capabilities.length} • 
                              Response: {agent.metadata.performance_metrics?.avg_response_time || 0}ms
                            </Typography>
                            
                            {selectedAgent === agent.agentId && (
                              <Box mt={1}>
                                <Typography variant="body2" fontWeight="bold" mb={1}>
                                  Capabilities:
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                  {agent.capabilities.map((cap) => (
                                    <Tooltip
                                      key={cap.id}
                                      title={`${cap.description} (Reliability: ${(cap.reliability * 100).toFixed(1)}%)`}
                                    >
                                      <Chip
                                        label={cap.name}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Messages */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <FlowIcon />
                Recent Messages
              </Typography>
              
              <List dense>
                {recentMessages.map((message) => (
                  <ListItem key={message.id}>
                    <ListItemIcon>
                      <MessageIcon color={message.status === 'delivered' ? 'success' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {message.from} → {message.to}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {message.type} • {message.priority}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={message.status}
                      size="small"
                      color={message.status === 'delivered' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Last updated: {topology?.lastUpdated ? new Date(topology.lastUpdated).toLocaleString() : 'Never'}
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1}>
          <HealthIcon color="success" fontSize="small" />
          <Typography variant="caption" color="success.main">
            Network Healthy
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}