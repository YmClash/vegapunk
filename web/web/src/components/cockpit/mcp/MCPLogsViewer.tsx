/**
 * MCP Logs Viewer - Professional Real-time Log Streaming Interface
 * Terminal-style log viewer with advanced filtering and export capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Grid,
  Card,
  CardContent
} from '@mui/material';

import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  Terminal as TerminalIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as DebugIcon,
  Code as CodeIcon,
  Schedule as TimeIcon,
  Computer as ServerIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  message: string;
  metadata?: {
    userId?: string;
    requestId?: string;
    duration?: number;
    statusCode?: number;
    [key: string]: any;
  };
  stackTrace?: string;
}

interface LogFilters {
  level: string;
  component: string;
  search: string;
  startTime?: string;
  endTime?: string;
}

interface LogStats {
  total: number;
  byLevel: { [key: string]: number };
  byComponent: { [key: string]: number };
  recentErrors: LogEntry[];
  lastUpdate: string;
}

export function MCPLogsViewer() {
  // State management
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    level: 'all',
    component: 'all',
    search: ''
  });
  const [isStreaming, setIsStreaming] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogEntries, setMaxLogEntries] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Menu states
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Mock log generation for development
   */
  const generateMockLog = useCallback((): LogEntry => {
    const levels: LogEntry['level'][] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const components = ['mcp-server', 'tool-executor', 'connection-pool', 'auth-service', 'resource-manager'];
    const messages = [
      'Successfully processed tool execution request',
      'Connection established with client',
      'Resource allocation completed',
      'Authentication token validated',
      'Tool registration updated',
      'High memory usage detected in worker process',
      'Connection timeout occurred for client session',
      'Failed to validate authentication token',
      'Critical error in tool execution pipeline',
      'Database connection pool exhausted'
    ];

    const level = levels[Math.floor(Math.random() * levels.length)];
    const component = components[Math.floor(Math.random() * components.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata: {
        requestId: `req_${Math.random().toString(36).substr(2, 8)}`,
        duration: Math.floor(Math.random() * 5000),
        statusCode: level === 'ERROR' ? 500 : 200
      },
      stackTrace: level === 'ERROR' ? 'Error stack trace would appear here...' : undefined
    };
  }, []);

  /**
   * Fetch logs data
   */
  const fetchLogsData = useCallback(async () => {
    try {
      // Mock data for development - replace with actual API calls
      const mockLogs = Array.from({ length: 50 }, () => generateMockLog());
      
      const mockStats: LogStats = {
        total: mockLogs.length,
        byLevel: {
          DEBUG: mockLogs.filter(l => l.level === 'DEBUG').length,
          INFO: mockLogs.filter(l => l.level === 'INFO').length,
          WARN: mockLogs.filter(l => l.level === 'WARN').length,
          ERROR: mockLogs.filter(l => l.level === 'ERROR').length
        },
        byComponent: {
          'mcp-server': mockLogs.filter(l => l.component === 'mcp-server').length,
          'tool-executor': mockLogs.filter(l => l.component === 'tool-executor').length,
          'connection-pool': mockLogs.filter(l => l.component === 'connection-pool').length,
          'auth-service': mockLogs.filter(l => l.component === 'auth-service').length,
          'resource-manager': mockLogs.filter(l => l.component === 'resource-manager').length
        },
        recentErrors: mockLogs.filter(l => l.level === 'ERROR').slice(0, 5),
        lastUpdate: new Date().toISOString()
      };

      setLogs(mockLogs);
      setLogStats(mockStats);
      setError(null);

    } catch (err) {
      setError('Failed to fetch logs data');
      console.error('Logs data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockLog]);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    if (autoScroll && isStreaming) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll, isStreaming]);

  /**
   * Apply filters
   */
  useEffect(() => {
    const filtered = logs.filter(log => {
      const matchesLevel = filters.level === 'all' || log.level === filters.level;
      const matchesComponent = filters.component === 'all' || log.component === filters.component;
      const matchesSearch = !filters.search || 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.component.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesLevel && matchesComponent && matchesSearch;
    });
    
    setFilteredLogs(filtered);
  }, [logs, filters]);

  /**
   * Streaming simulation
   */
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        const newLog = generateMockLog();
        setLogs(prevLogs => {
          const updatedLogs = [newLog, ...prevLogs.slice(0, maxLogEntries - 1)];
          return updatedLogs;
        });
      }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

      return () => clearInterval(interval);
    }
  }, [isStreaming, maxLogEntries, generateMockLog]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchLogsData();
  }, [fetchLogsData]);

  /**
   * Get log level styling
   */
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'ERROR':
        return { color: '#ff5252', fontWeight: 'bold' };
      case 'WARN':
        return { color: '#ff9800', fontWeight: 'bold' };
      case 'INFO':
        return { color: '#2196f3', fontWeight: 'normal' };
      case 'DEBUG':
        return { color: '#9e9e9e', fontWeight: 'normal' };
      default:
        return { color: '#ffffff', fontWeight: 'normal' };
    }
  };

  /**
   * Get log level Icon
   */
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <ErrorIcon sx={{ fontSize: 16, color: '#ff5252' }} />;
      case 'WARN':
        return <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
      case 'INFO':
        return <InfoIcon sx={{ fontSize: 16, color: '#2196f3' }} />;
      case 'DEBUG':
        return <DebugIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />;
      default:
        return <CodeIcon sx={{ fontSize: 16 }} />;
    }
  };

  /**
   * Export logs
   */
  const handleExportLogs = (format: 'txt' | 'json' | 'csv') => {
    const dataStr = format === 'json' 
      ? JSON.stringify(filteredLogs, null, 2)
      : format === 'csv'
        ? 'Timestamp,Level,Component,Message\n' + 
          filteredLogs.map(log => 
            `${log.timestamp},${log.level},${log.component},"${log.message.replace(/"/g, '""')}"`
          ).join('\n')
        : filteredLogs.map(log => 
            `[${log.timestamp}] ${log.level.padEnd(5)} ${log.component.padEnd(15)} ${log.message}`
          ).join('\n');
    
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcp-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
  };

  /**
   * Clear logs
   */
  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: isFullscreen ? '100vh' : 'auto' }}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <TerminalIcon color="primary" />
        📝 MCP Server Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Log Statistics */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total Logs
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {logStats?.total.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Errors
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {logStats?.byLevel.ERROR || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Warnings
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="warning.main">
                {logStats?.byLevel.WARN || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Filtered
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {filteredLogs.length.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          
          {/* Level Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                label="Level"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="DEBUG">Debug</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="WARN">Warning</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Component Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Component</InputLabel>
              <Select
                value={filters.component}
                onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                label="Component"
              >
                <MenuItem value="all">All Components</MenuItem>
                <MenuItem value="mcp-server">MCP Server</MenuItem>
                <MenuItem value="tool-executor">Tool Executor</MenuItem>
                <MenuItem value="connection-pool">Connection Pool</MenuItem>
                <MenuItem value="auth-service">Auth Service</MenuItem>
                <MenuItem value="resource-manager">Resource Manager</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Controls */}
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Scroll"
                sx={{ mr: 1 }}
              />
              
              <Tooltip title={isStreaming ? 'Pause Streaming' : 'Resume Streaming'}>
                <IconButton
                  onClick={() => setIsStreaming(!isStreaming)}
                  color={isStreaming ? 'warning' : 'success'}
                  size="small"
                >
                  {isStreaming ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Clear Logs">
                <IconButton onClick={handleClearLogs} color="error" size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Export Logs">
                <IconButton
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Settings">
                <IconButton
                  onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                  size="small"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <IconButton
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  size="small"
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Logs Display */}
      <Paper 
        elevation={3} 
        sx={{ 
          height: isFullscreen ? 'calc(100vh - 200px)' : '600px',
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '13px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            backgroundColor: '#333333',
            p: 1,
            borderBottom: '1px solid #555555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Chip 
              icon={<TerminalIcon />}
              label="MCP Server Console"
              size="small"
              sx={{ backgroundColor: '#444444', color: '#ffffff' }}
            />
            <Badge 
              badgeContent={filteredLogs.length} 
              color="primary"
              max={9999}
            >
              <Typography variant="caption">
                Filtered Entries
              </Typography>
            </Badge>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {isStreaming && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={12} sx={{ color: '#4caf50' }} />
                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                  LIVE
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Logs Content */}
        <Box
          ref={logsContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#333333',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#666666',
              borderRadius: '4px',
            },
          }}
        >
          {filteredLogs.length === 0 ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%" 
              flexDirection="column"
              gap={2}
            >
              <TerminalIcon sx={{ fontSize: 48, color: '#666666' }} />
              <Typography variant="body1" color="#666666">
                No logs match the current filters
              </Typography>
            </Box>
          ) : (
            filteredLogs.map((log, index) => (
              <Box 
                key={log.id}
                sx={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  },
                  fontFamily: 'inherit'
                }}
              >
                {/* Timestamp */}
                <Typography
                  variant="caption"
                  sx={{
                    color: '#888888',
                    minWidth: '90px',
                    fontFamily: 'inherit',
                    fontSize: '12px'
                  }}
                >
                  {formatTimestamp(log.timestamp)}
                </Typography>
                
                {/* Level with Icon */}
                <Box display="flex" alignItems="center" gap={0.5} sx={{ minWidth: '70px' }}>
                  {getLogLevelIcon(log.level)}
                  <Typography
                    variant="caption"
                    sx={{
                      ...getLogLevelStyle(log.level),
                      fontFamily: 'inherit',
                      fontSize: '12px'
                    }}
                  >
                    {log.level}
                  </Typography>
                </Box>
                
                {/* Component */}
                <Typography
                  variant="caption"
                  sx={{
                    color: '#bbbbbb',
                    minWidth: '120px',
                    fontFamily: 'inherit',
                    fontSize: '12px'
                  }}
                >
                  [{log.component}]
                </Typography>
                
                {/* Message */}
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}
                >
                  {log.message}
                </Typography>
                
                {/* Metadata */}
                {log.metadata && (
                  <Box sx={{ minWidth: '80px', textAlign: 'right' }}>
                    {log.metadata.duration && (
                      <Chip
                        label={`${log.metadata.duration}ms`}
                        size="small"
                        sx={{ 
                          height: '18px',
                          fontSize: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff'
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            ))
          )}
          <div ref={logsEndRef} />
        </Box>
      </Paper>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuList>
          <MenuItem onClick={() => handleExportLogs('txt')}>
            <ListItemIcon><CodeIcon /></ListItemIcon>
            <ListItemText>Export as TXT</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportLogs('json')}>
            <ListItemIcon><CodeIcon /></ListItemIcon>
            <ListItemText>Export as JSON</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportLogs('csv')}>
            <ListItemIcon><CodeIcon /></ListItemIcon>
            <ListItemText>Export as CSV</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
      >
        <MenuList>
          <MenuItem onClick={() => setMaxLogEntries(500)}>
            <ListItemText>Max 500 entries</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setMaxLogEntries(1000)}>
            <ListItemText>Max 1000 entries</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setMaxLogEntries(2000)}>
            <ListItemText>Max 2000 entries</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}