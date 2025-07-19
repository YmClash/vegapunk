/**
 * Analytics Dashboard Component
 * Advanced analytics visualization with privacy controls
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  GroupWork as FederatedIcon,
  Speed as PerformanceIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Lock as PrivacyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSnackbar } from 'notistack';

// GraphQL Queries
const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview($timeRange: String!) {
    analyticsOverview(timeRange: $timeRange) {
      systemMetrics {
        timestamp
        activeAgents
        totalTasks
        completedTasks
        failedTasks
        averageTaskDuration
        systemLoad
        errorRate
        throughput
        latency {
          p50
          p90
          p95
          p99
        }
      }
      agentMetrics {
        agentId
        agentName
        taskCount
        successRate
        averageResponseTime
        resourceUsage {
          cpu
          memory
          tokens
        }
        performance {
          accuracy
          efficiency
          innovation
          collaboration
        }
      }
      insights {
        id
        type
        severity
        title
        description
        recommendations
        impactScore
        confidence
        timestamp
      }
    }
  }
`;

const GET_FEDERATED_STATS = gql`
  query GetFederatedLearningStats {
    federatedLearningStats {
      totalModels
      activeRounds
      totalRounds
      averageRoundDuration
      averageParticipants
      convergenceRate
      privacyBudgetUsed
    }
  }
`;

const GET_PRIVACY_AUDIT = gql`
  query GetPrivacyAudit {
    privacyAudit {
      globalPrivacyBudget
      entities {
        entity
        budgetUsed
        budgetRemaining
      }
      queries {
        queryId
        timestamp
        privacyGuarantee {
          epsilon
          delta
          mechanism
        }
        accuracy
      }
    }
  }
`;

const EXPORT_ANALYTICS = gql`
  mutation ExportAnalytics($format: String!) {
    exportAnalytics(format: $format) {
      url
      filename
    }
  }
`;

interface AnalyticsDashboardProps {
  embedded?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ embedded = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [privacyMode, setPrivacyMode] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Queries
  const { data: analyticsData, loading, refetch } = useQuery(GET_ANALYTICS_OVERVIEW, {
    variables: { timeRange },
    pollInterval: 30000, // Update every 30 seconds
  });

  const { data: federatedData } = useQuery(GET_FEDERATED_STATS, {
    pollInterval: 60000,
  });

  const { data: privacyData } = useQuery(GET_PRIVACY_AUDIT);

  const [exportAnalytics] = useMutation(EXPORT_ANALYTICS, {
    onCompleted: (data) => {
      enqueueSnackbar('Analytics exported successfully', { variant: 'success' });
      // Download file
      window.open(data.exportAnalytics.url, '_blank');
    },
  });

  const overview = analyticsData?.analyticsOverview;
  const systemMetrics = overview?.systemMetrics || [];
  const agentMetrics = overview?.agentMetrics || [];
  const insights = overview?.insights || [];

  // Calculate aggregated metrics
  const totalTasks = systemMetrics.reduce((sum: number, m: any) => sum + m.totalTasks, 0);
  const avgSuccessRate = agentMetrics.reduce((sum: number, m: any) => sum + m.successRate, 0) / agentMetrics.length || 0;
  const totalTokensUsed = agentMetrics.reduce((sum: number, m: any) => sum + m.resourceUsage.tokens, 0);

  // Colors for charts
  const COLORS = ['#00E5FF', '#FF4081', '#69F0AE', '#FFB74D', '#40C4FF', '#FF5252'];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Tasks</Typography>
            </Box>
            <Typography variant="h3">{totalTasks.toLocaleString()}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendIcon color="success" fontSize="small" />
              <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                +12% from last period
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PerformanceIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Success Rate</Typography>
            </Box>
            <Typography variant="h3">{(avgSuccessRate * 100).toFixed(1)}%</Typography>
            <LinearProgress
              variant="determinate"
              value={avgSuccessRate * 100}
              sx={{ mt: 2, height: 8, borderRadius: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FederatedIcon sx={{ mr: 1, color: '#69F0AE' }} />
              <Typography variant="h6">Active Agents</Typography>
            </Box>
            <Typography variant="h3">{agentMetrics.length}</Typography>
            <Box sx={{ mt: 1 }}>
              {agentMetrics.slice(0, 3).map((agent: any) => (
                <Chip
                  key={agent.agentId}
                  label={agent.agentName}
                  size="small"
                  sx={{ mr: 0.5, mt: 0.5 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: '#FFB74D' }} />
              <Typography variant="h6">Privacy Budget</Typography>
            </Box>
            <Typography variant="h3">
              {privacyData?.privacyAudit.globalPrivacyBudget || 10}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <PrivacyIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                {privacyMode ? 'Privacy Enhanced' : 'Standard Mode'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* System Performance Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            System Performance Over Time
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={systemMetrics}>
              <defs>
                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#69F0AE" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#69F0AE" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="systemLoad"
                stroke="#00E5FF"
                fill="url(#colorLoad)"
                name="System Load %"
              />
              <Area
                type="monotone"
                dataKey="throughput"
                stroke="#69F0AE"
                fill="url(#colorThroughput)"
                name="Throughput"
              />
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#FF5252"
                strokeWidth={2}
                name="Error Rate"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Latest Insights */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Latest Insights
          </Typography>
          {insights.map((insight: any) => (
            <Alert
              key={insight.id}
              severity={insight.severity}
              sx={{ mb: 2 }}
              action={
                <Tooltip title={`Confidence: ${(insight.confidence * 100).toFixed(0)}%`}>
                  <InfoIcon />
                </Tooltip>
              }
            >
              <Typography variant="subtitle2">{insight.title}</Typography>
              <Typography variant="body2">{insight.description}</Typography>
            </Alert>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAgentAnalyticsTab = () => (
    <Grid container spacing={3}>
      {/* Agent Selection */}
      <Grid item xs={12}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Agent</InputLabel>
          <Select
            value={selectedAgent}
            label="Select Agent"
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <MenuItem value="all">All Agents</MenuItem>
            {agentMetrics.map((agent: any) => (
              <MenuItem key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Agent Performance Radar */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Agent Performance Profile
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart
              data={agentMetrics
                .filter((a: any) => selectedAgent === 'all' || a.agentId === selectedAgent)
                .map((agent: any) => ({
                  metric: agent.agentName,
                  accuracy: agent.performance.accuracy * 100,
                  efficiency: agent.performance.efficiency * 100,
                  innovation: agent.performance.innovation * 100,
                  collaboration: agent.performance.collaboration * 100,
                }))}
            >
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.5)"
              />
              <Radar
                name="Accuracy"
                dataKey="accuracy"
                stroke="#00E5FF"
                fill="#00E5FF"
                fillOpacity={0.3}
              />
              <Radar
                name="Efficiency"
                dataKey="efficiency"
                stroke="#FF4081"
                fill="#FF4081"
                fillOpacity={0.3}
              />
              <Radar
                name="Innovation"
                dataKey="innovation"
                stroke="#69F0AE"
                fill="#69F0AE"
                fillOpacity={0.3}
              />
              <Radar
                name="Collaboration"
                dataKey="collaboration"
                stroke="#FFB74D"
                fill="#FFB74D"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Resource Usage */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Resource Utilization
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={agentMetrics
                .filter((a: any) => selectedAgent === 'all' || a.agentId === selectedAgent)
                .map((agent: any) => ({
                  name: agent.agentName,
                  cpu: agent.resourceUsage.cpu,
                  memory: agent.resourceUsage.memory,
                  tokens: agent.resourceUsage.tokens / 1000, // Convert to thousands
                }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <Legend />
              <Bar dataKey="cpu" fill="#00E5FF" name="CPU %" />
              <Bar dataKey="memory" fill="#FF4081" name="Memory %" />
              <Bar dataKey="tokens" fill="#69F0AE" name="Tokens (K)" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Task Distribution */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Task Distribution by Agent
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={agentMetrics.map((agent: any, index: number) => ({
                  name: agent.agentName,
                  value: agent.taskCount,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {agentMetrics.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFederatedLearningTab = () => (
    <Grid container spacing={3}>
      {/* Federated Learning Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Federated Learning Status
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Active Rounds
              </Typography>
              <Typography variant="h4">
                {federatedData?.federatedLearningStats.activeRounds || 0}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Models
              </Typography>
              <Typography variant="h4">
                {federatedData?.federatedLearningStats.totalModels || 0}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Convergence Rate
              </Typography>
              <Typography variant="h4">
                {((federatedData?.federatedLearningStats.convergenceRate || 0) * 100).toFixed(2)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Privacy Budget Usage */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Privacy Budget Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={privacyData?.privacyAudit.entities || []}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
              <YAxis dataKey="entity" type="category" stroke="rgba(255,255,255,0.5)" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <Legend />
              <Bar dataKey="budgetUsed" fill="#FF5252" name="Used" />
              <Bar dataKey="budgetRemaining" fill="#69F0AE" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {!embedded && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={privacyMode}
                  onChange={(e) => setPrivacyMode(e.target.checked)}
                />
              }
              label="Privacy Mode"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => exportAnalytics({ variables: { format: 'json' } })}
            >
              Export
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Overview" />
          <Tab label="Agent Analytics" />
          <Tab label="Federated Learning" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderAgentAnalyticsTab()}
          {activeTab === 2 && renderFederatedLearningTab()}
        </>
      )}
    </Box>
  );
};