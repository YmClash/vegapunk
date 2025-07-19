/**
 * Dashboard Page
 * Main overview page showing system status and key metrics
 */

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useQuery, gql } from '@apollo/client';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// GraphQL Queries
const DASHBOARD_QUERY = gql`
  query DashboardData {
    systemStatus {
      overallHealth
      operationalMode
      systemLoad {
        currentLoadPercentage
        peakLoadThreshold
      }
    }
    systemMetrics(period: "24h") {
      taskMetrics {
        totalTasks
        completedTasks
        failedTasks
        averageCompletionTime
      }
      agentMetrics {
        activeAgents
        totalAgents
        averageWorkload
        averagePerformance
      }
    }
    agents(status: ACTIVE) {
      edges {
        node {
          id
          name
          type
          currentWorkload
          performance {
            successRate
            tasksCompleted
          }
        }
      }
    }
    recentTasks: tasks(limit: 10) {
      edges {
        node {
          id
          description
          status
          priority
          assignedAgent {
            name
          }
        }
      }
    }
  }
`;

const COLORS = ['#00E5FF', '#FF4081', '#69F0AE', '#FFB74D', '#40C4FF'];

export const DashboardPage: React.FC = () => {
  const { data, loading, error, refetch } = useQuery(DASHBOARD_QUERY, {
    pollInterval: 30000, // Refresh every 30 seconds
  });

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography color="error">Error loading dashboard: {error.message}</Typography>
      </Box>
    );
  }

  const systemStatus = data?.systemStatus;
  const metrics = data?.systemMetrics;
  const agents = data?.agents?.edges || [];
  const recentTasks = data?.recentTasks?.edges || [];

  // Mock time series data for charts
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    tasks: Math.floor(Math.random() * 100) + 50,
    load: Math.floor(Math.random() * 30) + 40,
    agents: Math.floor(Math.random() * 5) + 3,
  }));

  const agentPerformanceData = agents.map((edge: any) => ({
    name: edge.node.name,
    workload: Math.round(edge.node.currentWorkload * 100),
    success: Math.round(edge.node.performance.successRate * 100),
  }));

  const taskStatusData = [
    { name: 'Completed', value: metrics?.taskMetrics?.completedTasks || 0 },
    { name: 'Failed', value: metrics?.taskMetrics?.failedTasks || 0 },
    { name: 'In Progress', value: 10 }, // Mock value
    { name: 'Pending', value: 5 }, // Mock value
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          System Dashboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* System Health Card */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                <Typography variant="h3" component="div">
                  {Math.round((systemStatus?.overallHealth || 0) * 100)}%
                </Typography>
                <TrendingUpIcon sx={{ ml: 1, color: 'success.main' }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemStatus?.overallHealth * 100 || 0}
                sx={{ mb: 1 }}
              />
              <Chip
                label={systemStatus?.operationalMode || 'Normal'}
                color="primary"
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Active Agents Card */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Agents
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                <Typography variant="h3" component="div">
                  {metrics?.agentMetrics?.activeAgents || 0}
                </Typography>
                <Typography color="text.secondary" sx={{ ml: 1 }}>
                  / {metrics?.agentMetrics?.totalAgents || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(metrics?.agentMetrics?.activeAgents / metrics?.agentMetrics?.totalAgents) * 100 || 0}
                color="secondary"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Avg. Workload: {Math.round((metrics?.agentMetrics?.averageWorkload || 0) * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks Completed Card */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Tasks Completed
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                <Typography variant="h3" component="div">
                  {metrics?.taskMetrics?.completedTasks || 0}
                </Typography>
                <Typography color="text.secondary" sx={{ ml: 1 }}>
                  / {metrics?.taskMetrics?.totalTasks || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(metrics?.taskMetrics?.completedTasks / metrics?.taskMetrics?.totalTasks) * 100 || 0}
                color="success"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Success Rate: {100 - Math.round((metrics?.taskMetrics?.failedTasks / metrics?.taskMetrics?.totalTasks) * 100 || 0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Load Card */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                System Load
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                <Typography variant="h3" component="div">
                  {systemStatus?.systemLoad?.currentLoadPercentage || 0}%
                </Typography>
                {systemStatus?.systemLoad?.currentLoadPercentage > 70 ? (
                  <TrendingUpIcon sx={{ ml: 1, color: 'warning.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ ml: 1, color: 'success.main' }} />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={systemStatus?.systemLoad?.currentLoadPercentage || 0}
                color={systemStatus?.systemLoad?.currentLoadPercentage > 70 ? 'warning' : 'info'}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Peak Threshold: {systemStatus?.systemLoad?.peakLoadThreshold || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Activity Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Activity (24h)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#00E5FF"
                  fill="rgba(0, 229, 255, 0.2)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#FF4081"
                  fill="rgba(255, 64, 129, 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Task Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Agent Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agent Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="workload" fill="#00E5FF" name="Workload %" />
                <Bar dataKey="success" fill="#69F0AE" name="Success Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Tasks
              </Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recentTasks.map((edge: any) => (
                <Box
                  key={edge.node.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {edge.node.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Assigned to: {edge.node.assignedAgent?.name || 'Unassigned'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={edge.node.status}
                        size="small"
                        color={
                          edge.node.status === 'COMPLETED' ? 'success' :
                          edge.node.status === 'FAILED' ? 'error' :
                          edge.node.status === 'IN_PROGRESS' ? 'primary' : 'default'
                        }
                      />
                      <Chip
                        label={edge.node.priority}
                        size="small"
                        variant="outlined"
                        color={
                          edge.node.priority === 'CRITICAL' ? 'error' :
                          edge.node.priority === 'HIGH' ? 'warning' : 'default'
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};