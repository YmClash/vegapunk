/**
 * Metrics Page
 * Real-time system metrics and performance monitoring
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Assignment as TaskIcon,
  Groups as CollaborationIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { RealtimeChart } from '../../components/RealtimeChart';
import { SystemHealthIndicator } from '../../components/SystemHealthIndicator';
import { MetricsCard } from '../../components/MetricsCard';

export const MetricsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [metricView, setMetricView] = useState('overview');
  
  const { metrics, events, isConnected } = useRealtimeMetrics({
    enableNotifications: true,
  });

  // Calculate system health status
  const getSystemStatus = () => {
    if (metrics.errorRate > 0.05) return 'critical';
    if (metrics.systemLoad > 80 || metrics.errorRate > 0.02) return 'warning';
    return 'healthy';
  };

  const systemHealth = 100 - (metrics.errorRate * 100) - Math.max(0, metrics.systemLoad - 70);
  const systemStatus = getSystemStatus();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          System Metrics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={metricView}
            exclusive
            onChange={(_, value) => value && setMetricView(value)}
            size="small"
          >
            <ToggleButton value="overview">Overview</ToggleButton>
            <ToggleButton value="agents">Agents</ToggleButton>
            <ToggleButton value="tasks">Tasks</ToggleButton>
            <ToggleButton value="performance">Performance</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color={isConnected ? 'success.main' : 'error.main'}>
          {isConnected ? '● Connected to real-time updates' : '○ Disconnected from real-time updates'}
        </Typography>
      </Box>

      {metricView === 'overview' && (
        <Grid container spacing={3}>
          {/* System Health */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <SystemHealthIndicator
                health={systemHealth / 100}
                status={systemStatus}
                size="medium"
                animate
              />
            </Paper>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <MetricsCard
                  title="System Load"
                  value={metrics.systemLoad}
                  unit="%"
                  trend={-5}
                  icon={<SpeedIcon />}
                  color="#00E5FF"
                  animate
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricsCard
                  title="Active Agents"
                  value={metrics.activeAgents}
                  trend={12}
                  icon={<MemoryIcon />}
                  color="#FF4081"
                  animate
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricsCard
                  title="Tasks in Progress"
                  value={metrics.tasksInProgress}
                  trend={8}
                  icon={<TaskIcon />}
                  color="#69F0AE"
                  animate
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricsCard
                  title="Avg Response Time"
                  value={metrics.averageResponseTime}
                  unit="ms"
                  trend={-15}
                  icon={<TimelineIcon />}
                  color="#FFB74D"
                  animate
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Real-time Charts */}
          <Grid item xs={12} md={8}>
            <RealtimeChart
              title="System Performance"
              data={[]}
              lines={[
                { dataKey: 'load', color: '#00E5FF', name: 'System Load %' },
                { dataKey: 'agents', color: '#FF4081', name: 'Active Agents' },
                { dataKey: 'tasks', color: '#69F0AE', name: 'Tasks/min' },
              ]}
              height={400}
              updateInterval={1000}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <RealtimeChart
              title="Error Rate"
              data={[]}
              lines={[
                { dataKey: 'errors', color: '#FF5252', name: 'Error Rate %', type: 'area' },
              ]}
              height={400}
              updateInterval={2000}
            />
          </Grid>

          {/* Recent Events */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent System Events
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {events.map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      borderLeft: 4,
                      borderColor: 
                        event.severity === 'CRITICAL' ? 'error.main' :
                        event.severity === 'WARNING' ? 'warning.main' : 'info.main',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Typography variant="body1">
                          {event.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.timestamp.toLocaleTimeString()} - {event.type}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 
                            event.severity === 'CRITICAL' ? 'error.main' :
                            event.severity === 'WARNING' ? 'warning.main' : 'info.main',
                        }}
                      >
                        {event.severity}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {metricView === 'agents' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RealtimeChart
              title="Agent Performance Comparison"
              data={[]}
              lines={[
                { dataKey: 'atlas', color: '#00E5FF', name: 'Atlas' },
                { dataKey: 'edison', color: '#FF4081', name: 'Edison' },
                { dataKey: 'pythagoras', color: '#69F0AE', name: 'Pythagoras' },
                { dataKey: 'lilith', color: '#FFB74D', name: 'Lilith' },
                { dataKey: 'york', color: '#40C4FF', name: 'York' },
              ]}
              height={400}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <RealtimeChart
              title="Agent Workload Distribution"
              data={[]}
              lines={[
                { dataKey: 'workload', color: '#00E5FF', name: 'Average Workload %', type: 'area' },
              ]}
              height={300}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <RealtimeChart
              title="Agent Memory Usage"
              data={[]}
              lines={[
                { dataKey: 'memory', color: '#FF4081', name: 'Memory MB', type: 'area' },
              ]}
              height={300}
            />
          </Grid>
        </Grid>
      )}

      {metricView === 'tasks' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="Total Tasks Today"
              value={1234}
              trend={15}
              icon={<TaskIcon />}
              color="#69F0AE"
              animate
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="Success Rate"
              value={96.5}
              unit="%"
              trend={2}
              icon={<TimelineIcon />}
              color="#00E5FF"
              animate
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="Avg Completion Time"
              value={342}
              unit="ms"
              trend={-8}
              icon={<SpeedIcon />}
              color="#FF4081"
              animate
            />
          </Grid>

          <Grid item xs={12}>
            <RealtimeChart
              title="Task Throughput"
              data={[]}
              lines={[
                { dataKey: 'created', color: '#00E5FF', name: 'Created' },
                { dataKey: 'completed', color: '#69F0AE', name: 'Completed' },
                { dataKey: 'failed', color: '#FF5252', name: 'Failed' },
              ]}
              height={400}
            />
          </Grid>
        </Grid>
      )}

      {metricView === 'performance' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <RealtimeChart
              title="Response Time Distribution"
              data={[]}
              lines={[
                { dataKey: 'p50', color: '#69F0AE', name: 'p50' },
                { dataKey: 'p95', color: '#FFB74D', name: 'p95' },
                { dataKey: 'p99', color: '#FF5252', name: 'p99' },
              ]}
              height={350}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <RealtimeChart
              title="Resource Utilization"
              data={[]}
              lines={[
                { dataKey: 'cpu', color: '#00E5FF', name: 'CPU %' },
                { dataKey: 'memory', color: '#FF4081', name: 'Memory %' },
                { dataKey: 'network', color: '#40C4FF', name: 'Network %' },
              ]}
              height={350}
            />
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      99.9%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime (30d)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      1.2M
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests Handled
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#69F0AE' }}>
                      0.02%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#FFB74D' }}>
                      85%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resource Efficiency
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};