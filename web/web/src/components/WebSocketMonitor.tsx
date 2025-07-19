import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cable as CableIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  Timeline as TimelineIcon,
  Message as MessageIcon,
  Computer as ComputerIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SocketConnection {
  id: string;
  connectedAt: string;
  disconnectedAt?: string;
  isActive: boolean;
  messagesCount: number;
  lastActivity: string;
  userAgent?: string;
  remoteAddress?: string;
}

interface WebSocketStats {
  activeConnections: number;
  totalConnections: number;
  totalMessages: number;
  avgMessagesPerConnection: number;
}

interface WebSocketData {
  stats: WebSocketStats;
  activeConnections: SocketConnection[];
  connectionHistory: SocketConnection[];
  timestamp: string;
}

export function WebSocketMonitor() {
  const [webSocketData, setWebSocketData] = useState<WebSocketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState<string | false>('stats');

  const fetchWebSocketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:8080/api/debug/websockets');
      setWebSocketData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch WebSocket data:', err);
      setError('Failed to fetch WebSocket information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebSocketData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchWebSocketData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getConnectionColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <CableIcon sx={{ mr: 1, color: 'primary.main' }} />
          WebSocket Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'filled' : 'outlined'}
            size="small"
          />
          <Tooltip title="Refresh WebSocket Data">
            <IconButton onClick={fetchWebSocketData} disabled={loading}>
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

      {webSocketData && (
        <Box>
          {/* Stats Overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'success.light', color: 'white', textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" component="div">
                    {webSocketData.stats.activeConnections}
                  </Typography>
                  <Typography variant="body2">
                    Active Connections
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'info.light', color: 'white', textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" component="div">
                    {webSocketData.stats.totalConnections}
                  </Typography>
                  <Typography variant="body2">
                    Total Connections
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'secondary.light', color: 'white', textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" component="div">
                    {webSocketData.stats.totalMessages}
                  </Typography>
                  <Typography variant="body2">
                    Total Messages
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'warning.light', color: 'white', textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h4" component="div">
                    {webSocketData.stats.avgMessagesPerConnection}
                  </Typography>
                  <Typography variant="body2">
                    Avg Msgs/Connection
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Information */}
          <Paper elevation={2}>
            {/* Active Connections */}
            <Accordion expanded={expanded === 'active'} onChange={handleAccordionChange('active')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <CircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography sx={{ fontWeight: 500 }}>
                    Active Connections ({webSocketData.activeConnections.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {webSocketData.activeConnections.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Connection ID</TableCell>
                          <TableCell>Connected</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Messages</TableCell>
                          <TableCell>Last Activity</TableCell>
                          <TableCell>Browser</TableCell>
                          <TableCell>IP Address</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {webSocketData.activeConnections.map((connection) => (
                          <TableRow key={connection.id} hover>
                            <TableCell>
                              <Chip 
                                label={connection.id.substring(0, 8)}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {new Date(connection.connectedAt).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDuration(connection.connectedAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={connection.messagesCount}
                                size="small"
                                color="secondary"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {new Date(connection.lastActivity).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatUserAgent(connection.userAgent)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {connection.remoteAddress || 'Unknown'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                    No active connections
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Connection History */}
            <Accordion expanded={expanded === 'history'} onChange={handleAccordionChange('history')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  <Typography sx={{ fontWeight: 500 }}>
                    Recent Connection History ({webSocketData.connectionHistory.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {webSocketData.connectionHistory.length > 0 ? (
                  <List dense>
                    {webSocketData.connectionHistory.map((connection, index) => (
                      <React.Fragment key={connection.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Avatar 
                              sx={{ 
                                bgcolor: getConnectionColor(connection.isActive) + '.main',
                                width: 32, 
                                height: 32 
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={connection.id.substring(0, 8)}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="body2">
                                  {formatUserAgent(connection.userAgent)}
                                </Typography>
                                <Chip 
                                  label={`${connection.messagesCount} msgs`}
                                  size="small"
                                  color="secondary"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption">
                                  Connected: {new Date(connection.connectedAt).toLocaleString()}
                                </Typography>
                                {connection.disconnectedAt && (
                                  <Typography variant="caption" display="block">
                                    Disconnected: {new Date(connection.disconnectedAt).toLocaleString()}
                                  </Typography>
                                )}
                                <Typography variant="caption" display="block">
                                  Duration: {formatDuration(connection.connectedAt, connection.disconnectedAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < webSocketData.connectionHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                    No connection history available
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Last Updated */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(webSocketData.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}