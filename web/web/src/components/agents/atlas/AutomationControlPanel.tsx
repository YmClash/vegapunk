/**
 * AutomationControlPanel - Security Automation Management
 * Manages automated security tasks and schedules
 * Part of Tri-Protocol Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  AutoMode as AutoModeIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  Backup as BackupIcon,
  Policy as PolicyIcon,
  Assessment as AssessmentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface AutomationTask {
  id: string;
  name: string;
  type: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  successRate: number;
}

interface TaskExecution {
  taskId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  logs: string[];
}

export function AutomationControlPanel() {
  const theme = useTheme();
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    type: 'security_scan',
    schedule: 'daily',
  });
  const [executions, setExecutions] = useState<TaskExecution[]>([]);

  // Mock automation tasks
  const mockTasks: AutomationTask[] = [
    {
      id: 'auto-1',
      name: 'Daily Security Scan',
      type: 'security_scan',
      schedule: 'daily',
      enabled: true,
      lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      successRate: 0.98,
    },
    {
      id: 'auto-2',
      name: 'Vulnerability Assessment',
      type: 'vulnerability_scan',
      schedule: 'weekly',
      enabled: true,
      lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'idle',
      successRate: 0.95,
    },
    {
      id: 'auto-3',
      name: 'Security Policy Update',
      type: 'policy_update',
      schedule: 'hourly',
      enabled: false,
      lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'idle',
      successRate: 1.0,
    },
    {
      id: 'auto-4',
      name: 'System Backup',
      type: 'backup',
      schedule: 'daily',
      enabled: true,
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      status: 'idle',
      successRate: 0.99,
    },
  ];

  useEffect(() => {
    // Load tasks (using mock data for now)
    setTasks(mockTasks);
  }, []);

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    ));
  };

  const handleRunTask = async (taskId: string) => {
    // Update task status
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: 'running' as const } : task
    ));

    // Create execution record
    const execution: TaskExecution = {
      taskId,
      startTime: new Date().toISOString(),
      status: 'running',
      logs: ['Task started', 'Initializing security components...'],
    };
    setExecutions(prev => [...prev, execution]);

    // Simulate task completion after 3 seconds
    setTimeout(() => {
      setTasks(prev => prev.map(task =>
        task.id === taskId 
          ? { ...task, status: 'completed' as const, lastRun: new Date().toISOString() } 
          : task
      ));
      
      setExecutions(prev => prev.map(exec =>
        exec.taskId === taskId && exec.status === 'running'
          ? { 
              ...exec, 
              status: 'completed' as const, 
              endTime: new Date().toISOString(),
              logs: [...exec.logs, 'Task completed successfully']
            }
          : exec
      ));
    }, 3000);
  };

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/agents/atlas/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: newTask.type,
          schedule: newTask.schedule,
          parameters: { name: newTask.name },
        }),
      });

      const result = await response.json();
      
      // Add new task to list
      const task: AutomationTask = {
        id: result.id,
        name: newTask.name,
        type: newTask.type,
        schedule: newTask.schedule,
        enabled: true,
        nextRun: result.nextExecution || new Date().toISOString(),
        status: 'idle',
        successRate: 1.0,
      };
      
      setTasks(prev => [...prev, task]);
      setCreateDialog(false);
      setNewTask({ name: '', type: 'security_scan', schedule: 'daily' });
    } catch (error) {
      console.error('Failed to create automation task:', error);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'security_scan': return <SecurityIcon />;
      case 'vulnerability_scan': return <AssessmentIcon />;
      case 'policy_update': return <PolicyIcon />;
      case 'backup': return <BackupIcon />;
      default: return <AutoModeIcon />;
    }
  };

  const getScheduleChip = (schedule: string) => {
    const color = schedule === 'hourly' ? 'primary' : 
                  schedule === 'daily' ? 'success' : 
                  schedule === 'weekly' ? 'info' : 'default';
    return <Chip label={schedule.toUpperCase()} size="small" color={color as any} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <LinearProgress sx={{ width: 20, height: 20 }} />;
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return <TimerIcon color="action" />;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoModeIcon /> Security Automation
        </Typography>
        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Create Task
        </Button>
      </Box>

      {/* Automation Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Tasks
              </Typography>
              <Typography variant="h3">
                {tasks.filter(t => t.enabled).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {tasks.length} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Running Now
              </Typography>
              <Typography variant="h3">
                {tasks.filter(t => t.status === 'running').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                tasks executing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h3">
                {Math.round(tasks.reduce((sum, t) => sum + t.successRate, 0) / tasks.length * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Next Task
              </Typography>
              <Typography variant="h5">
                {(() => {
                  const nextTask = tasks
                    .filter(t => t.enabled)
                    .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0];
                  if (!nextTask) return 'None';
                  const timeUntil = new Date(nextTask.nextRun).getTime() - Date.now();
                  const hours = Math.floor(timeUntil / (1000 * 60 * 60));
                  return `${hours}h`;
                })()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                until next run
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task List */}
      <Paper elevation={3} sx={{ mt: 3 }}>
        <List>
          {tasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemIcon>
                  {getTaskIcon(task.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1">{task.name}</Typography>
                      {getScheduleChip(task.schedule)}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusIcon(task.status)}
                        <Typography variant="caption" color="text.secondary">
                          {task.status}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last run: {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Next run: {new Date(task.nextRun).toLocaleString()}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={task.successRate * 100}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        color={task.successRate > 0.9 ? 'success' : 'warning'}
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={task.enabled}
                        onChange={() => handleToggleTask(task.id)}
                      />
                    }
                    label="Enabled"
                  />
                  <Tooltip title="Run now">
                    <IconButton
                      onClick={() => handleRunTask(task.id)}
                      disabled={task.status === 'running' || !task.enabled}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Recent Executions */}
      {executions.length > 0 && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Executions
          </Typography>
          <List>
            {executions.slice(-5).reverse().map((exec, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={tasks.find(t => t.id === exec.taskId)?.name || 'Unknown Task'}
                  secondary={
                    <>
                      Started: {new Date(exec.startTime).toLocaleString()}
                      {exec.endTime && ` • Completed: ${new Date(exec.endTime).toLocaleString()}`}
                    </>
                  }
                />
                <Chip
                  label={exec.status.toUpperCase()}
                  size="small"
                  color={exec.status === 'completed' ? 'success' : exec.status === 'failed' ? 'error' : 'primary'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Automation Task</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                label="Task Type"
              >
                <MenuItem value="security_scan">Security Scan</MenuItem>
                <MenuItem value="vulnerability_scan">Vulnerability Assessment</MenuItem>
                <MenuItem value="policy_update">Policy Update</MenuItem>
                <MenuItem value="backup">System Backup</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Schedule</InputLabel>
              <Select
                value={newTask.schedule}
                onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                label="Schedule"
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="immediate">Run Immediately</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              Automated tasks will be executed with ethical oversight from ShakaAgent
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={!newTask.name}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}