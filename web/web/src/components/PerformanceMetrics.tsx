import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  DataUsage as DataIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import axios from 'axios';

interface PerformanceData {
  timestamp: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
  ollama: {
    status: string;
    responseTime?: number;
    modelsCount: number;
  };
  websockets: {
    activeConnections: number;
    totalMessages: number;
    avgMessagesPerConnection: number;
  };
  chat: {
    totalLogs: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

interface MetricHistory {
  timestamp: string;
  value: number;
}

export function PerformanceMetrics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<MetricHistory[]>([]);
  const [responseTimeHistory, setResponseTimeHistory] = useState<MetricHistory[]>([]);
  const [connectionsHistory, setConnectionsHistory] = useState<MetricHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState<string | false>('overview');

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data from multiple endpoints
      const [healthResponse, systemResponse, ollamaResponse, wsResponse, logsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/health'),
        axios.get('http://localhost:8080/api/debug/system'),
        axios.get('http://localhost:8080/api/debug/ollama'),
        axios.get('http://localhost:8080/api/debug/websockets'),
        axios.get('http://localhost:8080/api/debug/logs?limit=100')
      ]);

      const health = healthResponse.data;
      const system = systemResponse.data;
      const ollama = ollamaResponse.data;
      const ws = wsResponse.data;
      const logs = logsResponse.data;

      // Calculate metrics
      const errorLogs = logs.logs.filter((log: any) => log.type === 'error');
      const botLogs = logs.logs.filter((log: any) => log.type === 'bot' && log.responseTime);
      const avgResponseTime = botLogs.length > 0 
        ? botLogs.reduce((sum: number, log: any) => sum + (log.responseTime || 0), 0) / botLogs.length
        : 0;

      const perfData: PerformanceData = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: system.uptime,
          memory: {
            used: system.memory.heapUsed,
            total: system.memory.heapTotal,
            percentage: (system.memory.heapUsed / system.memory.heapTotal) * 100
          },
          cpu: system.cpu
        },
        ollama: {
          status: ollama.status,
          responseTime: ollama.responseTime,
          modelsCount: ollama.models?.length || 0
        },
        websockets: {
          activeConnections: ws.stats.activeConnections,
          totalMessages: ws.stats.totalMessages,
          avgMessagesPerConnection: ws.stats.avgMessagesPerConnection
        },
        chat: {
          totalLogs: logs.total,
          errorRate: logs.total > 0 ? (errorLogs.length / logs.total) * 100 : 0,
          avgResponseTime
        }
      };

      setPerformanceData(perfData);

      // Update history arrays (keep last 20 data points)
      const timestamp = new Date().toISOString();
      
      setMemoryHistory(prev => [
        ...prev.slice(-19),
        { timestamp, value: perfData.system.memory.percentage }
      ]);

      if (perfData.ollama.responseTime) {
        setResponseTimeHistory(prev => [
          ...prev.slice(-19),
          { timestamp, value: perfData.ollama.responseTime! }
        ]);
      }

      setConnectionsHistory(prev => [
        ...prev.slice(-19),
        { timestamp, value: perfData.websockets.activeConnections }
      ]);

    } catch (err: any) {
      console.error('Failed to fetch performance data:', err);
      setError('Failed to fetch performance metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getPerformanceScore = () => {
    if (!performanceData) return 0;
    
    let score = 100;
    
    // Memory usage penalty
    if (performanceData.system.memory.percentage > 80) score -= 20;
    else if (performanceData.system.memory.percentage > 60) score -= 10;
    
    // Response time penalty
    if (performanceData.ollama.responseTime) {
      if (performanceData.ollama.responseTime > 2000) score -= 15;
      else if (performanceData.ollama.responseTime > 1000) score -= 8;
    }
    
    // Error rate penalty
    if (performanceData.chat.errorRate > 10) score -= 25;
    else if (performanceData.chat.errorRate > 5) score -= 10;
    
    // Ollama status penalty
    if (performanceData.ollama.status !== 'healthy') score -= 30;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const SimpleChart = ({ data, label, color, unit = '' }: { 
    data: MetricHistory[], 
    label: string, 
    color: string,
    unit?: string 
  }) => {
    if (data.length < 2) return <Typography color="text.secondary">Insufficient data</Typography>;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        <Box sx={{ height: 100, position: 'relative', bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
          <svg width="100%" height="100%" viewBox="0 0 300 80">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 280 + 10;
                const y = 70 - ((point.value - minValue) / (range || 1)) * 60;
                return `${x},${y}`;
              }).join(' ')}
            />
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 280 + 10;
              const y = 70 - ((point.value - minValue) / (range || 1)) * 60;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={color}
                />
              );
            })}
          </svg>
          <Typography 
            variant="caption" 
            sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'white', px: 1, borderRadius: 1 }}
          >
            {data[data.length - 1]?.value.toFixed(1)}{unit}
          </Typography>
        </Box>
      </Box>
    );
  };

  if (!performanceData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Loading performance metrics...
        </Typography>
      </Box>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <ChartIcon sx={{ mr: 1, color: 'primary.main' }} />
          Performance Metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={`Score: ${performanceScore}%`}
            color={getScoreColor(performanceScore)}
            variant="filled"
          />
          <Chip 
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'filled' : 'outlined'}
            size="small"
          />
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={fetchPerformanceData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Performance Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <MemoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                {performanceData.system.memory.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Memory Usage
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={performanceData.system.memory.percentage}
                sx={{ mt: 1 }}
                color={performanceData.system.memory.percentage > 80 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                {performanceData.ollama.responseTime ? `${performanceData.ollama.responseTime}ms` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <TimelineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                {formatUptime(performanceData.system.uptime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <DataIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                {performanceData.chat.errorRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Error Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2}>
        {/* Performance Charts */}
        <Accordion expanded={expanded === 'charts'} onChange={handleAccordionChange('charts')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 500 }}>
                Performance Charts (Last 20 data points)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <SimpleChart 
                  data={memoryHistory} 
                  label="Memory Usage" 
                  color="#1976d2"
                  unit="%"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <SimpleChart 
                  data={responseTimeHistory} 
                  label="Response Time" 
                  color="#dc004e"
                  unit="ms"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <SimpleChart 
                  data={connectionsHistory} 
                  label="Active Connections" 
                  color="#2e7d32"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Detailed Metrics */}
        <Accordion expanded={expanded === 'details'} onChange={handleAccordionChange('details')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <DataIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 500 }}>
                Detailed Metrics
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>System Metrics</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Memory Used</TableCell>
                        <TableCell align="right">{formatBytes(performanceData.system.memory.used)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Memory Total</TableCell>
                        <TableCell align="right">{formatBytes(performanceData.system.memory.total)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>System Uptime</TableCell>
                        <TableCell align="right">{formatUptime(performanceData.system.uptime)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>CPU User Time</TableCell>
                        <TableCell align="right">{performanceData.system.cpu.user.toLocaleString()}μs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>CPU System Time</TableCell>
                        <TableCell align="right">{performanceData.system.cpu.system.toLocaleString()}μs</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Service Metrics</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Ollama Status</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={performanceData.ollama.status}
                            color={performanceData.ollama.status === 'healthy' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Available Models</TableCell>
                        <TableCell align="right">{performanceData.ollama.modelsCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Active WebSocket Connections</TableCell>
                        <TableCell align="right">{performanceData.websockets.activeConnections}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total Messages</TableCell>
                        <TableCell align="right">{performanceData.websockets.totalMessages}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Chat Logs</TableCell>
                        <TableCell align="right">{performanceData.chat.totalLogs}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Response Time</TableCell>
                        <TableCell align="right">{performanceData.chat.avgResponseTime.toFixed(0)}ms</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Last Updated */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(performanceData.timestamp).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}