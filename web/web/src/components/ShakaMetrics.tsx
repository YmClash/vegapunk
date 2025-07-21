import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Psychology as PsychologyIcon,
  Gavel as GavelIcon,
  Balance as BalanceIcon,
  Favorite as FavoriteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ShakaMetrics {
  ethicalAnalyses: number;
  conflictsResolved: number;
  alertsGenerated: number;
  averageEthicalScore: number;
  interventionRate: number;
  responseTime: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  activeConflictsCount: number;
  uptime: number;
  avgResponseTime: number;
  ethicalComplianceLevel: string;
}

interface Policy {
  id: string;
  name: string;
  framework: string;
  priority: number;
}

export function ShakaMetrics() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<ShakaMetrics | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/agents/shaka/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/agents/shaka/policies');
      if (!response.ok) throw new Error('Failed to fetch policies');
      const data = await response.json();
      setPolicies(data.data.policies || []);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchPolicies()]);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);


  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'utilitarian': return <BalanceIcon />;
      case 'deontological': return <GavelIcon />;
      case 'virtue_ethics': return <PsychologyIcon />;
      case 'care_ethics': return <FavoriteIcon />;
      default: return <AnalyticsIcon />;
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6">ShakaAgent Metrics</Typography>
            </Box>
          }
        />
        <CardContent>
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6">ShakaAgent Metrics</Typography>
            </Box>
          }
          action={
            <IconButton onClick={() => Promise.all([fetchMetrics(), fetchPolicies()])}>
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Alert severity="error">
            Failed to load metrics: {error}
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
            <AnalyticsIcon color="primary" />
            <Typography variant="h6">📊 ShakaAgent Metrics</Typography>
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh metrics">
              <IconButton onClick={() => Promise.all([fetchMetrics(), fetchPolicies()])}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {metrics && (
              <Chip
                label={metrics.ethicalComplianceLevel.toUpperCase()}
                color={metrics.ethicalComplianceLevel === 'excellent' ? 'success' :
                       metrics.ethicalComplianceLevel === 'good' ? 'success' :
                       metrics.ethicalComplianceLevel === 'acceptable' ? 'warning' : 'error'}
                size="small"
              />
            )}
          </Box>
        }
        subheader="Real-time ethical analysis and performance metrics"
      />
      
      <CardContent>
        {metrics && (
          <Grid container spacing={3}>
            {/* Key Performance Indicators */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                🎯 Key Performance Indicators
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {Math.round(metrics.averageEthicalScore * 100)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Average Ethical Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.averageEthicalScore * 100}
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                      color={metrics.averageEthicalScore >= 0.8 ? 'success' : 
                             metrics.averageEthicalScore >= 0.6 ? 'warning' : 'error'}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {metrics.ethicalAnalyses}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Analyses
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <TrendingUpIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main" ml={0.5}>
                        Active
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {formatResponseTime(metrics.avgResponseTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <SpeedIcon color={metrics.avgResponseTime < 2000 ? 'success' : 'warning'} fontSize="small" />
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {formatUptime(metrics.uptime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uptime
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <TimerIcon color="info" fontSize="small" />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Activity Metrics */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                🔄 Activity Metrics
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AnalyticsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ethical Analyses"
                      secondary={`${metrics.ethicalAnalyses} completed`}
                    />
                    <Typography variant="h6" color="primary">
                      {metrics.ethicalAnalyses}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Conflicts Resolved"
                      secondary={`${metrics.conflictsResolved} successfully`}
                    />
                    <Typography variant="h6" color="success.main">
                      {metrics.conflictsResolved}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Alerts Generated"
                      secondary={`${metrics.alertsGenerated} total alerts`}
                    />
                    <Typography variant="h6" color="warning.main">
                      {metrics.alertsGenerated}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Active Conflicts"
                      secondary={`${metrics.activeConflictsCount} requiring attention`}
                    />
                    <Typography variant="h6" color={metrics.activeConflictsCount > 0 ? 'error.main' : 'success.main'}>
                      {metrics.activeConflictsCount}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Alert Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                🚨 Alert Distribution
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  By Type
                </Typography>
                {Object.entries(metrics.alertsByType || {}).map(([type, count]) => (
                  <Box key={type} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {type}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / Math.max(...Object.values(metrics.alertsByType || {}), 1)) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  By Severity
                </Typography>
                {Object.entries(metrics.alertsBySeverity || {}).map(([severity, count]) => (
                  <Box key={severity} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Chip
                        label={severity}
                        size="small"
                        color={severity === 'critical' ? 'error' : 
                               severity === 'error' ? 'error' : 
                               severity === 'warning' ? 'warning' : 'info'}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / Math.max(...Object.values(metrics.alertsBySeverity || {}), 1)) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                      color={severity === 'critical' ? 'error' : 
                             severity === 'error' ? 'error' : 
                             severity === 'warning' ? 'warning' : 'info'}
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Ethical Policies */}
            {policies.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="medium">
                  📋 Active Ethical Policies ({policies.length})
                </Typography>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {policies.slice(0, 8).map((policy) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={policy.id}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {getFrameworkIcon(policy.framework)}
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {policy.name}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={policy.framework.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={`P${policy.priority}`}
                              size="small"
                              color={policy.priority >= 8 ? 'error' : 
                                     policy.priority >= 6 ? 'warning' : 'default'}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  {policies.length > 8 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Showing 8 of {policies.length} policies
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}