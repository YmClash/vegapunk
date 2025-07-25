import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudQueue as CloudIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as ModelIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import axios from 'axios';

interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

interface OllamaStatus {
  status: string;
  version?: string;
  models?: string[];
  runningModels?: RunningModel[];
  currentModel?: string;
  defaultModel?: string;
  error?: string;
  lastCheck: string;
  timestamp: string;
  connectionTime?: number;
  responseTime?: number;
}

export function OllamaMonitor() {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [connectionHistory, setConnectionHistory] = useState<{ timestamp: string; status: string; responseTime?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | false>('status');

  const fetchOllamaStatus = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await axios.get('http://localhost:8080/api/debug/ollama');
      const responseTime = Date.now() - startTime;
      
      const statusData = {
        ...response.data,
        responseTime
      };
      
      setOllamaStatus(statusData);
      
      // Add to connection history
      setConnectionHistory(prev => [{
        timestamp: new Date().toISOString(),
        status: statusData.status,
        responseTime
      }, ...prev.slice(0, 9)]); // Keep last 10 entries
      
    } catch (error: any) {
      console.error('Failed to fetch Ollama status:', error);
      
      setConnectionHistory(prev => [{
        timestamp: new Date().toISOString(),
        status: 'error',
        responseTime: undefined
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOllamaStatus();
    const interval = setInterval(fetchOllamaStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <SuccessIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="warning" />;
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const getAverageResponseTime = () => {
    const validTimes = connectionHistory
      .filter(h => h.responseTime !== undefined)
      .map(h => h.responseTime!);
    
    if (validTimes.length === 0) return 0;
    return Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
  };

  const getUptime = () => {
    const healthyConnections = connectionHistory.filter(h => h.status === 'healthy').length;
    const totalConnections = connectionHistory.length;
    if (totalConnections === 0) return 100;
    return Math.round((healthyConnections / totalConnections) * 100);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
          Ollama Service Monitor
        </Typography>
        <Tooltip title="Refresh Status">
          <IconButton onClick={fetchOllamaStatus} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: ollamaStatus?.status === 'healthy' ? 'success.light' : 'error.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" component="div">
                {ollamaStatus?.status === 'healthy' ? 'Online' : 'Offline'}
              </Typography>
              <Typography variant="body2">
                Service Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" component="div">
                {ollamaStatus?.models?.length || 0}
              </Typography>
              <Typography variant="body2">
                Models Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" component="div">
                {formatResponseTime(ollamaStatus?.responseTime)}
              </Typography>
              <Typography variant="body2">
                Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" component="div">
                {getUptime()}%
              </Typography>
              <Typography variant="body2">
                Uptime (last 10 checks)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Information */}
      <Paper elevation={2}>
        {/* Service Status */}
        <Accordion expanded={expanded === 'status'} onChange={handleAccordionChange('status')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {getStatusIcon(ollamaStatus?.status || 'unknown')}
              <Typography sx={{ ml: 1, fontWeight: 500 }}>
                Service Status & Information
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <Chip 
                  label={ollamaStatus?.status || 'Unknown'}
                  color={getStatusColor(ollamaStatus?.status || 'unknown')}
                  size="small"
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {ollamaStatus ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Connection Info</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>
                          <Chip 
                            label={ollamaStatus.status}
                            color={getStatusColor(ollamaStatus.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>{ollamaStatus.version || 'Unknown'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last Check</TableCell>
                        <TableCell>{new Date(ollamaStatus.lastCheck).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Response Time</TableCell>
                        <TableCell>{formatResponseTime(ollamaStatus.responseTime)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Current Model</TableCell>
                        <TableCell>
                          <Chip 
                            label={ollamaStatus.currentModel || 'Unknown'}
                            color="primary"
                            size="small"
                            icon={<ModelIcon />}
                          />
                        </TableCell>
                      </TableRow>
                      {ollamaStatus.defaultModel && ollamaStatus.defaultModel !== ollamaStatus.currentModel && (
                        <TableRow>
                          <TableCell>Default Model</TableCell>
                          <TableCell>
                            <Chip 
                              label={ollamaStatus.defaultModel}
                              color="secondary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Performance</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Average Response Time: {formatResponseTime(getAverageResponseTime())}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((getAverageResponseTime() / 1000) * 100, 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Service Uptime: {getUptime()}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUptime()}
                      color={getUptime() > 90 ? 'success' : getUptime() > 70 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <LinearProgress />
            )}
            
            {ollamaStatus?.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <strong>Error:</strong> {ollamaStatus.error}
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Running Models with Performance */}
        <Accordion expanded={expanded === 'running'} onChange={handleAccordionChange('running')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <SpeedIcon sx={{ color: 'success.main' }} />
              <Typography sx={{ ml: 1, fontWeight: 500 }}>
                Running Models & Performance
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <Badge badgeContent={ollamaStatus?.runningModels?.length || 0} color="success">
                  <SpeedIcon />
                </Badge>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {ollamaStatus?.runningModels && ollamaStatus.runningModels.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Model Name</strong></TableCell>
                      <TableCell><strong>Size</strong></TableCell>
                      <TableCell><strong>VRAM Usage</strong></TableCell>
                      <TableCell><strong>Format</strong></TableCell>
                      <TableCell><strong>Parameter Size</strong></TableCell>
                      <TableCell><strong>Expires</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ollamaStatus.runningModels.map((model, index) => {
                      const formatBytes = (bytes: number) => {
                        const sizes = ['B', 'KB', 'MB', 'GB'];
                        if (bytes === 0) return '0 B';
                        const i = Math.floor(Math.log(bytes) / Math.log(1024));
                        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
                      };

                      const formatExpiry = (expiresAt: string) => {
                        const now = new Date();
                        const expiry = new Date(expiresAt);
                        const diffMs = expiry.getTime() - now.getTime();
                        const diffMins = Math.round(diffMs / (1000 * 60));
                        
                        if (diffMins <= 0) return 'Expired';
                        if (diffMins < 60) return `${diffMins}m`;
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        return `${hours}h ${mins}m`;
                      };

                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={model.name}
                                size="small"
                                color={model.name === ollamaStatus.currentModel ? 'primary' : 'default'}
                                variant={model.name === ollamaStatus.currentModel ? 'filled' : 'outlined'}
                              />
                              {model.name === ollamaStatus.currentModel && (
                                <Chip label="Active" size="small" color="success" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {formatBytes(model.size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontFamily="monospace">
                                {formatBytes(model.size_vram)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((model.size_vram / model.size) * 100, 100)}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                                color="info"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={model.details.format}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {model.details.parameter_size}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={formatExpiry(model.expires_at).includes('Expired') ? 'error' : 'text.primary'}
                            >
                              {formatExpiry(model.expires_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                <strong>No models currently running</strong>
                <br />
                Models will appear here when they are actively loaded in memory. 
                Try sending a chat message to load the current model.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Available Models */}
        <Accordion expanded={expanded === 'models'} onChange={handleAccordionChange('models')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <ModelIcon />
              <Typography sx={{ ml: 1, fontWeight: 500 }}>
                Available Models
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <Badge badgeContent={ollamaStatus?.models?.length || 0} color="primary">
                  <ModelIcon />
                </Badge>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {ollamaStatus?.models && ollamaStatus.models.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {ollamaStatus.models.map((model, index) => (
                  <Chip 
                    key={index}
                    label={model}
                    variant="outlined"
                    icon={<ModelIcon />}
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">
                No models available or failed to load
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Connection History */}
        <Accordion expanded={expanded === 'history'} onChange={handleAccordionChange('history')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <SpeedIcon />
              <Typography sx={{ ml: 1, fontWeight: 500 }}>
                Connection History (Last 10 checks)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {connectionHistory.map((entry, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getStatusIcon(entry.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span>{formatResponseTime(entry.responseTime)}</span>
                      </Box>
                    }
                    secondary={`Status: ${entry.status}`}
                  />
                </ListItem>
              ))}
              {connectionHistory.length === 0 && (
                <Typography color="text.secondary" textAlign="center">
                  No connection history available
                </Typography>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}