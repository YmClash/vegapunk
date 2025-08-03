import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
  LinearProgress,
  Button,
  Alert,
  Tooltip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ShakaStatus {
  isActive: boolean;
  isAnalyzing: boolean;
  lastActivity: string;
  ethicalScore: number;
  alertsCount: number;
  analysisCount: number;
  uptime: number;
  health: 'healthy' | 'warning' | 'error';
  healthDetails: any;
}

interface Alert {
  id: string;
  type: 'ethical' | 'security' | 'performance' | 'behavior' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export function ShakaMonitor() {
  const theme = useTheme();
  const [status, setStatus] = useState<ShakaStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({
    alerts: false,
    details: false,
    metrics: true
  });

  // Fetch ShakaAgent status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/agents/shaka/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Fetch recent alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/agents/shaka/alerts?timeWindow=300000'); // 5 minutes
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Toggle ShakaAgent active state
  const toggleAgent = async () => {
    if (!status) return;
    
    try {
      const response = await fetch('/api/agents/shaka/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !status.isActive })
      });
      
      if (!response.ok) throw new Error('Failed to toggle agent');
      
      // Refresh status after toggle
      await fetchStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchAlerts()]);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  if (loading && !status) {
    return (
      <Card>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <PsychologyIcon color="primary" />
              <Typography variant="h6">ShakaAgent Monitor</Typography>
            </Box>
          }
        />
        <CardContent>
          <Box display="flex" justifyContent="center" p={2}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <PsychologyIcon color="primary" />
              <Typography variant="h6">ShakaAgent Monitor</Typography>
            </Box>
          }
          action={
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Alert severity="error">
            Failed to connect to ShakaAgent: {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">🧠 ShakaAgent Monitor</Typography>
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh status">
              <IconButton onClick={() => Promise.all([fetchStatus(), fetchAlerts()])}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {status && (
              <Chip
                icon={getHealthIcon(status.health)}
                label={status.health.toUpperCase()}
                color={status.health === 'healthy' ? 'success' : 
                       status.health === 'warning' ? 'warning' : 'error'}
                size="small"
              />
            )}
          </Box>
        }
      />
      
      <CardContent>
        {status && (
          <Grid container spacing={3}>
            {/* Agent Control */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={status.isActive}
                      onChange={toggleAgent}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight="medium">
                      {status.isActive ? '🟢 Agent Active' : '🔴 Agent Inactive'}
                    </Typography>
                  }
                />
                
                {status.isAnalyzing && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress sx={{ width: 100, height: 6, borderRadius: 3 }} />
                    <Typography variant="body2" color="primary">
                      Analyzing...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Key Metrics */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="text"
                onClick={() => setExpanded(prev => ({ ...prev, metrics: !prev.metrics }))}
                endIcon={expanded.metrics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  Key Metrics
                </Typography>
              </Button>
              
              <Collapse in={expanded.metrics}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={1}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {Math.round(status.ethicalScore * 100)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ethical Score
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={1}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {status.analysisCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Analyses
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={1}>
                      <Typography variant="h4" color={alerts.length > 0 ? 'warning.main' : 'success.main'} fontWeight="bold">
                        {status.alertsCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recent Alerts
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={1}>
                      <Typography variant="h4" color="text.primary" fontWeight="bold">
                        {formatUptime(status.uptime)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uptime
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setExpanded(prev => ({ ...prev, alerts: !prev.alerts }))}
                  endIcon={expanded.alerts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ justifyContent: 'space-between', textTransform: 'none' }}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    Recent Alerts ({alerts.length})
                  </Typography>
                </Button>
                
                <Collapse in={expanded.alerts}>
                  <List dense>
                    {alerts.slice(0, 5).map((alert) => (
                      <ListItem key={alert.id} divider>
                        <ListItemIcon>
                          {alert.severity === 'critical' && <ErrorIcon color="error" />}
                          {alert.severity === 'error' && <ErrorIcon color="error" />}
                          {alert.severity === 'warning' && <WarningIcon color="warning" />}
                          {alert.severity === 'info' && <InfoIcon color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.message}
                          secondary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={alert.type} 
                                size="small" 
                                variant="outlined"
                              />
                              <Typography variant="caption">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Grid>
            )}

            {/* System Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Button
                fullWidth
                variant="text"
                onClick={() => setExpanded(prev => ({ ...prev, details: !prev.details }))}
                endIcon={expanded.details ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  System Details
                </Typography>
              </Button>
              
              <Collapse in={expanded.details}>
                <Box sx={{ mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Activity:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(status.lastActivity).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Health Status:
                      </Typography>
                      <Typography variant="body2" color={getHealthColor(status.health)}>
                        {status.health}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}