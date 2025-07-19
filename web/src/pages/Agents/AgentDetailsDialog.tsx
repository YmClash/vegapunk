/**
 * Agent Details Dialog
 * Shows detailed information about a specific agent
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  Task as TaskIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AgentDetailsDialogProps {
  agent: any;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`agent-tabpanel-${index}`}
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const AgentDetailsDialog: React.FC<AgentDetailsDialogProps> = ({
  agent,
  open,
  onClose,
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  // Mock performance data
  const performanceData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    tasks: Math.floor(Math.random() * 20) + 5,
    success: Math.floor(Math.random() * 20) + 80,
    memory: Math.floor(Math.random() * 30) + 40,
  }));

  const agentTypeColor = {
    ATLAS: '#00E5FF',
    EDISON: '#FF4081',
    PYTHAGORAS: '#69F0AE',
    LILITH: '#FFB74D',
    YORK: '#40C4FF',
    SHAKA: '#B388FF',
  }[agent?.type] || '#00E5FF';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: agentTypeColor,
              width: 56,
              height: 56,
            }}
          >
            {agent?.type[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              {agent?.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={agent?.type}
                size="small"
                sx={{ bgcolor: agentTypeColor, color: 'white' }}
              />
              <Chip
                label={agent?.status}
                size="small"
                color={agent?.status === 'ACTIVE' ? 'success' : 'default'}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab label="Performance" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Tasks" icon={<TaskIcon />} iconPosition="start" />
          <Tab label="Memory" icon={<MemoryIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Agent Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>{agent?.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>{agent?.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <Chip
                          label={agent?.status}
                          size="small"
                          color={agent?.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Current Workload</TableCell>
                      <TableCell>{Math.round(agent?.currentWorkload * 100)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Efficiency Rating</TableCell>
                      <TableCell>{Math.round(agent?.performance?.efficiencyRating * 100)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Success Rate
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(agent?.performance?.successRate * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={agent?.performance?.successRate * 100}
                      color="success"
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Task Time
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(agent?.performance?.averageTaskTime)}ms
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (1000 - agent?.performance?.averageTaskTime) / 10)}
                      color="primary"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                    <Typography variant="h4">
                      {agent?.performance?.tasksCompleted}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Capabilities
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {agent?.capabilities?.map((capability: string) => (
                    <Chip
                      key={capability}
                      label={capability}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance History (24h)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#00E5FF"
                  strokeWidth={2}
                  name="Tasks Completed"
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#69F0AE"
                  strokeWidth={2}
                  name="Success Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agent?.tasks?.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.id.slice(0, 8)}...</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        size="small"
                        color={
                          task.status === 'COMPLETED' ? 'success' :
                          task.status === 'FAILED' ? 'error' :
                          task.status === 'IN_PROGRESS' ? 'primary' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority || 'MEDIUM'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Memory Usage Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1F3A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#FF4081"
                  fill="rgba(255, 64, 129, 0.2)"
                  strokeWidth={2}
                  name="Memory Usage %"
                />
              </AreaChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Memory
                  </Typography>
                  <Typography variant="h5">
                    {agent?.memoryUsage?.total} MB
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Memory Limit
                  </Typography>
                  <Typography variant="h5">
                    {agent?.memoryUsage?.limit} MB
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};