/**
 * A2A Logs Viewer - Terminal-style Log Viewer with Syntax Highlighting
 * Professional log viewer with real-time streaming, filtering, and search capabilities
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  Chip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface A2ALog {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: string;
  message: string;
  metadata?: any;
  agentId?: string;
  correlationId?: string;
}

interface A2ALogsViewerProps {
  logs: A2ALog[];
  height?: number;
  searchEnabled?: boolean;
  filters?: string[];
  autoScroll?: boolean;
  showMetadata?: boolean;
  maxLines?: number;
}

export function A2ALogsViewer({
  logs,
  height = 400,
  searchEnabled = true,
  filters = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
  autoScroll = true,
  showMetadata = true,
  maxLines = 1000
}: A2ALogsViewerProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<string>('ALL');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  
  // UI states
  const [isPaused, setIsPaused] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const [showComponent, setShowComponent] = useState(true);
  const [viewMode, setViewMode] = useState<'terminal' | 'structured'>('terminal');
  const [wrapLines, setWrapLines] = useState(false);
  
  // Refs
  const logContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(autoScroll);
  
  // Log level configuration
  const logLevelConfig = {
    'DEBUG': { 
      color: '#757575', 
      backgroundColor: 'rgba(117, 117, 117, 0.1)',
      icon: '🔍',
      priority: 0
    },
    'INFO': { 
      color: '#2196f3', 
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      icon: 'ℹ️',
      priority: 1
    },
    'WARN': { 
      color: '#ff9800', 
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      icon: '⚠️',
      priority: 2
    },
    'ERROR': { 
      color: '#f44336', 
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      icon: '❌',
      priority: 3
    },
    'FATAL': { 
      color: '#d32f2f', 
      backgroundColor: 'rgba(211, 47, 47, 0.1)',
      icon: '💀',
      priority: 4
    }
  };

  /**
   * Get unique components and agents from logs
   */
  const { uniqueComponents, uniqueAgents } = useMemo(() => {
    const components = new Set<string>();
    const agents = new Set<string>();
    
    logs.forEach(log => {
      components.add(log.component);
      if (log.agentId) agents.add(log.agentId);
    });
    
    return {
      uniqueComponents: Array.from(components).sort(),
      uniqueAgents: Array.from(agents).sort()
    };
  }, [logs]);

  /**
   * Filter and process logs
   */
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Level filter
    if (logLevel !== 'ALL') {
      const minPriority = logLevelConfig[logLevel as keyof typeof logLevelConfig]?.priority ?? 0;
      filtered = filtered.filter(log => 
        logLevelConfig[log.level].priority >= minPriority
      );
    }

    // Component filter
    if (componentFilter !== 'all') {
      filtered = filtered.filter(log => log.component === componentFilter);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(log => log.agentId === agentFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.component.toLowerCase().includes(term) ||
        (log.agentId && log.agentId.toLowerCase().includes(term)) ||
        (log.correlationId && log.correlationId.toLowerCase().includes(term)) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(term))
      );
    }

    // Limit to maxLines for performance
    if (filtered.length > maxLines) {
      filtered = filtered.slice(-maxLines);
    }

    // Sort by timestamp (oldest first for logs)
    return filtered.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [logs, logLevel, componentFilter, agentFilter, searchTerm, maxLines]);

  /**
   * Calculate log statistics
   */
  const logStats = useMemo(() => {
    const stats = {
      total: filteredLogs.length,
      byLevel: {} as Record<string, number>,
      errorRate: 0,
      recentCount: 0
    };

    // Count by level
    filteredLogs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    // Calculate error rate
    const errorLogs = (stats.byLevel.ERROR || 0) + (stats.byLevel.FATAL || 0);
    stats.errorRate = stats.total > 0 ? errorLogs / stats.total : 0;

    // Count recent logs (last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    stats.recentCount = filteredLogs.filter(log => 
      new Date(log.timestamp) > oneMinuteAgo
    ).length;

    return stats;
  }, [filteredLogs]);

  /**
   * Auto-scroll to bottom when new logs arrive
   */
  useEffect(() => {
    if (!isPaused && shouldScrollRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, isPaused]);

  /**
   * Update scroll behavior
   */
  useEffect(() => {
    shouldScrollRef.current = autoScroll && !isPaused;
  }, [autoScroll, isPaused]);

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm:ss.SSS');
  };

  /**
   * Export logs
   */
  const handleExportLogs = () => {
    const logText = filteredLogs.map(log => {
      const timestamp = formatTimestamp(log.timestamp);
      const level = log.level.padEnd(5);
      const component = `[${log.component}]`.padEnd(20);
      const agentInfo = log.agentId ? ` {${log.agentId}}` : '';
      const corrInfo = log.correlationId ? ` (${log.correlationId})` : '';
      
      return `${timestamp} ${level} ${component}${agentInfo}${corrInfo} ${log.message}`;
    }).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a2a-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Clear search and filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setLogLevel('ALL');
    setComponentFilter('all');
    setAgentFilter('all');
  };

  /**
   * Render log line in terminal style
   */
  const renderTerminalLogLine = (log: A2ALog, index: number) => {
    const config = logLevelConfig[log.level];
    
    return (
      <Box
        key={`${log.id}-${index}`}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          py: 0.25,
          px: 1,
          borderLeft: `2px solid ${config.color}`,
          backgroundColor: config.backgroundColor,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: 1.4,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          wordBreak: wrapLines ? 'break-word' : 'normal',
          whiteSpace: wrapLines ? 'pre-wrap' : 'nowrap',
          overflow: wrapLines ? 'visible' : 'hidden'
        }}
      >
        {showTimestamp && (
          <Typography
            component="span"
            sx={{ 
              color: '#666',
              minWidth: '80px',
              mr: 1,
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            {formatTimestamp(log.timestamp)}
          </Typography>
        )}
        
        {showLevel && (
          <Typography
            component="span"
            sx={{ 
              color: config.color,
              minWidth: '50px',
              mr: 1,
              fontWeight: 'bold',
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            {log.level}
          </Typography>
        )}
        
        {showComponent && (
          <Typography
            component="span"
            sx={{ 
              color: '#4fc3f7',
              minWidth: '120px',
              mr: 1,
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            [{log.component}]
          </Typography>
        )}
        
        {log.agentId && (
          <Typography
            component="span"
            sx={{ 
              color: '#9c27b0',
              mr: 1,
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            {`{${log.agentId}}`}
          </Typography>
        )}
        
        <Typography
          component="span"
          sx={{ 
            color: '#fff',
            flexGrow: 1,
            fontSize: 'inherit',
            fontFamily: 'inherit'
          }}
        >
          {log.message}
        </Typography>
        
        {log.correlationId && (
          <Typography
            component="span"
            sx={{ 
              color: '#ffb74d',
              ml: 1,
              fontSize: '10px',
              fontFamily: 'inherit'
            }}
          >
            ({log.correlationId})
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Controls */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon />
            System Logs
            <Badge badgeContent={logStats.total} color="primary" />
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="terminal">
                <TerminalIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="structured">
                <CodeIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Tooltip title={isPaused ? "Resume Streaming" : "Pause Streaming"}>
              <IconButton 
                onClick={() => setIsPaused(!isPaused)}
                color={isPaused ? 'warning' : 'primary'}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Logs">
              <IconButton onClick={handleExportLogs}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Quick Stats */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {Object.entries(logStats.byLevel).map(([level, count]) => {
            const config = logLevelConfig[level as keyof typeof logLevelConfig];
            return (
              <Chip
                key={level}
                label={`${level}: ${count}`}
                size="small"
                sx={{ 
                  backgroundColor: config.backgroundColor,
                  color: config.color,
                  fontWeight: 'bold'
                }}
              />
            );
          })}
          <Chip
            label={`${logStats.recentCount}/min`}
            size="small"
            color="info"
            variant="outlined"
          />
          {logStats.errorRate > 0 && (
            <Chip
              label={`${(logStats.errorRate * 100).toFixed(1)}% Errors`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      {/* Filter Controls */}
      {searchEnabled && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={logLevel}
              label="Level"
              onChange={(e) => setLogLevel(e.target.value)}
            >
              <MenuItem value="ALL">All</MenuItem>
              {filters.map(level => (
                <MenuItem key={level} value={level}>
                  {logLevelConfig[level as keyof typeof logLevelConfig]?.icon} {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Component</InputLabel>
            <Select
              value={componentFilter}
              label="Component"
              onChange={(e) => setComponentFilter(e.target.value)}
            >
              <MenuItem value="all">All Components</MenuItem>
              {uniqueComponents.map(component => (
                <MenuItem key={component} value={component}>
                  {component}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {uniqueAgents.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Agent</InputLabel>
              <Select
                value={agentFilter}
                label="Agent"
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <MenuItem value="all">All Agents</MenuItem>
                {uniqueAgents.map(agent => (
                  <MenuItem key={agent} value={agent}>
                    {agent}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Tooltip title="Clear Filters">
            <IconButton onClick={clearFilters} color="error">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {/* Display Options */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showTimestamp}
              onChange={(e) => setShowTimestamp(e.target.checked)}
              size="small"
            />
          }
          label="Timestamp"
          componentsProps={{ typography: { variant: 'caption' } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showLevel}
              onChange={(e) => setShowLevel(e.target.checked)}
              size="small"
            />
          }
          label="Level"
          componentsProps={{ typography: { variant: 'caption' } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showComponent}
              onChange={(e) => setShowComponent(e.target.checked)}
              size="small"
            />
          }
          label="Component"
          componentsProps={{ typography: { variant: 'caption' } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={wrapLines}
              onChange={(e) => setWrapLines(e.target.checked)}
              size="small"
            />
          }
          label="Wrap Lines"
          componentsProps={{ typography: { variant: 'caption' } }}
        />
      </Stack>

      {/* Logs Display */}
      <Paper 
        variant="outlined"
        sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          backgroundColor: '#1e1e1e',
          color: '#ffffff'
        }}
      >
        <Box
          ref={logContainerRef}
          sx={{ 
            height: '100%',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#2e2e2e'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#555',
              borderRadius: '4px'
            }
          }}
        >
          {filteredLogs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {logs.length === 0 ? 'No logs available' : 'No logs match current filters'}
              </Typography>
            </Box>
          ) : (
            filteredLogs.map((log, index) => renderTerminalLogLine(log, index))
          )}
        </Box>
      </Paper>

      {/* Footer Status */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredLogs.length} of {logs.length} logs
          {isPaused && (
            <Chip 
              label="PAUSED" 
              size="small" 
              color="warning" 
              sx={{ ml: 1, fontSize: '10px', height: '18px' }} 
            />
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {logStats.recentCount} logs in the last minute
        </Typography>
      </Box>
    </Box>
  );
}