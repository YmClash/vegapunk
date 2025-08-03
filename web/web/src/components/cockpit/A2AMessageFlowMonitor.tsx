/**
 * A2A Message Flow Monitor - Real-time Message Timeline with Advanced Filtering
 * Professional message flow visualization with interactive timeline and detailed analytics
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Stack,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment
} from '@mui/material';
import {
  Circle,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  Message as MessageIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface MessageFlow {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  type: 'TASK_REQUEST' | 'CAPABILITY_REQUEST' | 'HEALTH_CHECK' | 'ERROR_REPORT' | 'AGENT_ANNOUNCE';
  status: 'sent' | 'delivered' | 'processed' | 'failed';
  payload: any;
  latency?: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MessageFlowStats {
  totalMessages: number;
  successRate: number;
  averageLatency: number;
  errorCount: number;
  messagesByType: Record<string, number>;
  messagesByStatus: Record<string, number>;
  throughput: number;
}

interface A2AMessageFlowMonitorProps {
  messages: MessageFlow[];
  height?: number;
  autoScroll?: boolean;
  onMessageSelect?: (message: MessageFlow) => void;
  showDetails?: boolean;
}

export function A2AMessageFlowMonitor({
  messages,
  height = 300,
  autoScroll = true,
  onMessageSelect,
  showDetails = true
}: A2AMessageFlowMonitorProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('1h');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  
  // UI states
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs for auto-scroll
  const listRef = useRef<HTMLDivElement>(null);
  
  // Message type colors and icons
  const messageConfig = {
    'TASK_REQUEST': { color: '#2196f3', icon: '📋', label: 'Task Request' },
    'CAPABILITY_REQUEST': { color: '#4caf50', icon: '🔍', label: 'Capability' },
    'HEALTH_CHECK': { color: '#ff9800', icon: '❤️', label: 'Health Check' },
    'ERROR_REPORT': { color: '#f44336', icon: '⚠️', label: 'Error Report' },
    'AGENT_ANNOUNCE': { color: '#9c27b0', icon: '📢', label: 'Announcement' }
  };

  const statusConfig = {
    'sent': { color: '#2196f3', icon: '📤', label: 'Sent' },
    'delivered': { color: '#ff9800', icon: '🚚', label: 'Delivered' },
    'processed': { color: '#4caf50', icon: '✅', label: 'Processed' },
    'failed': { color: '#f44336', icon: '❌', label: 'Failed' }
  };

  const priorityConfig = {
    'low': { color: '#757575', label: 'Low' },
    'medium': { color: '#2196f3', label: 'Medium' },
    'high': { color: '#ff9800', label: 'High' },
    'critical': { color: '#f44336', label: 'Critical' }
  };

  /**
   * Get unique agents from messages
   */
  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    messages.forEach(msg => {
      agents.add(msg.from);
      agents.add(msg.to);
    });
    return Array.from(agents).sort();
  }, [messages]);

  /**
   * Filter messages based on current filters
   */
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Time range filter
    if (timeRangeFilter !== 'all') {
      const now = new Date();
      const timeRange = {
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000
      }[timeRangeFilter] || Infinity;
      
      filtered = filtered.filter(msg => 
        now.getTime() - new Date(msg.timestamp).getTime() < timeRange
      );
    }

    // Type filter
    if (messageTypeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.type === messageTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(msg => msg.priority === priorityFilter);
    }

    // Agent filter
    if (selectedAgent !== 'all') {
      filtered = filtered.filter(msg => 
        msg.from === selectedAgent || msg.to === selectedAgent
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.from.toLowerCase().includes(term) ||
        msg.to.toLowerCase().includes(term) ||
        msg.type.toLowerCase().includes(term) ||
        JSON.stringify(msg.payload).toLowerCase().includes(term)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [messages, searchTerm, messageTypeFilter, statusFilter, priorityFilter, timeRangeFilter, selectedAgent]);

  /**
   * Calculate message flow statistics
   */
  const messageStats = useMemo((): MessageFlowStats => {
    const stats: MessageFlowStats = {
      totalMessages: filteredMessages.length,
      successRate: 0,
      averageLatency: 0,
      errorCount: 0,
      messagesByType: {},
      messagesByStatus: {},
      throughput: 0
    };

    if (filteredMessages.length === 0) return stats;

    // Calculate success rate
    const successfulMessages = filteredMessages.filter(msg => 
      msg.status === 'processed' || msg.status === 'delivered'
    ).length;
    stats.successRate = successfulMessages / filteredMessages.length;

    // Calculate average latency
    const messagesWithLatency = filteredMessages.filter(msg => msg.latency !== undefined);
    if (messagesWithLatency.length > 0) {
      stats.averageLatency = messagesWithLatency.reduce((sum, msg) => 
        sum + (msg.latency || 0), 0
      ) / messagesWithLatency.length;
    }

    // Count errors
    stats.errorCount = filteredMessages.filter(msg => msg.status === 'failed').length;

    // Group by type
    filteredMessages.forEach(msg => {
      stats.messagesByType[msg.type] = (stats.messagesByType[msg.type] || 0) + 1;
      stats.messagesByStatus[msg.status] = (stats.messagesByStatus[msg.status] || 0) + 1;
    });

    // Calculate throughput (messages per minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentMessages = filteredMessages.filter(msg => 
      new Date(msg.timestamp) > oneMinuteAgo
    );
    stats.throughput = recentMessages.length;

    return stats;
  }, [filteredMessages]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  /**
   * Handle message expansion
   */
  const handleMessageToggle = (messageId: string) => {
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setMessageTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTimeRangeFilter('1h');
    setSelectedAgent('all');
  };

  /**
   * Format message size
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Stats */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            Message Flow
            <Badge badgeContent={messageStats.totalMessages} color="primary" />
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <MessageIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="timeline">
                <TimelineIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Tooltip title="Toggle Filters">
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Quick Stats */}
        <Stack direction="row" spacing={2}>
          <Chip
            icon={<SuccessIcon />}
            label={`${(messageStats.successRate * 100).toFixed(1)}% Success`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<TimeIcon />}
            label={`${messageStats.averageLatency.toFixed(0)}ms Avg`}
            color="info"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<ErrorIcon />}
            label={`${messageStats.errorCount} Errors`}
            color="error"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<TrendingUpIcon />}
            label={`${messageStats.throughput}/min`}
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <TextField
                size="small"
                placeholder="Search messages..."
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
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Message Type</InputLabel>
                <Select
                  value={messageTypeFilter}
                  label="Message Type"
                  onChange={(e) => setMessageTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {Object.entries(messageConfig).map(([type, config]) => (
                    <MenuItem key={type} value={type}>
                      {config.icon} {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <MenuItem key={status} value={status}>
                      {config.icon} {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priority</MenuItem>
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <MenuItem key={priority} value={priority}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRangeFilter}
                  label="Time Range"
                  onChange={(e) => setTimeRangeFilter(e.target.value)}
                >
                  <MenuItem value="5m">Last 5 min</MenuItem>
                  <MenuItem value="1h">Last hour</MenuItem>
                  <MenuItem value="24h">Last 24h</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={selectedAgent}
                  label="Agent"
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <MenuItem value="all">All Agents</MenuItem>
                  {uniqueAgents.map(agent => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Tooltip title="Clear All Filters">
                <IconButton onClick={clearFilters} color="error">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Message List */}
      <Paper 
        variant="outlined"
        sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          ref={listRef}
          sx={{ 
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: '#fafafa'
          }}
        >
          <List dense>
            {filteredMessages.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {messages.length === 0 ? 'No messages to display' : 'No messages match current filters'}
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              filteredMessages.map((message, index) => {
                const messageTypeConfig = messageConfig[message.type];
                const statusTypeConfig = statusConfig[message.status];
                const priorityTypeConfig = priorityConfig[message.priority];
                const isExpanded = expandedMessage === message.id;

                return (
                  <React.Fragment key={message.id}>
                    <ListItem
                      button
                      onClick={() => handleMessageToggle(message.id)}
                      sx={{
                        borderLeft: `4px solid ${messageTypeConfig.color}`,
                        backgroundColor: isExpanded ? 'action.selected' : 'transparent',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Circle 
                          sx={{ 
                            color: statusTypeConfig.color,
                            fontSize: '12px'
                          }} 
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: '60px' }}>
                              {format(new Date(message.timestamp), 'HH:mm:ss.SSS')}
                            </Typography>
                            
                            <Chip 
                              label={messageTypeConfig.label}
                              size="small"
                              sx={{ 
                                fontSize: '10px',
                                height: '20px',
                                backgroundColor: messageTypeConfig.color,
                                color: 'white'
                              }}
                            />
                            
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {message.from} → {message.to}
                            </Typography>
                            
                            <Chip 
                              label={priorityTypeConfig.label}
                              size="small"
                              color={message.priority === 'critical' ? 'error' : 
                                     message.priority === 'high' ? 'warning' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '10px', height: '18px' }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              Status: {statusTypeConfig.label}
                            </Typography>
                            {message.latency && (
                              <>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {message.latency}ms
                                </Typography>
                              </>
                            )}
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatSize(message.size)}
                            </Typography>
                          </Stack>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {onMessageSelect && (
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMessageSelect(message);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          )}
                          <IconButton size="small">
                            <ExpandMoreIcon 
                              sx={{ 
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }}
                            />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {/* Expanded Details */}
                    {isExpanded && showDetails && (
                      <Box sx={{ px: 2, pb: 2, backgroundColor: 'grey.50' }}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Message Details
                            </Typography>
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">ID:</Typography>
                                <Typography variant="body2" fontFamily="monospace">{message.id}</Typography>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Timestamp:</Typography>
                                <Typography variant="body2">{format(new Date(message.timestamp), 'PPpp')}</Typography>
                              </Stack>
                              {message.latency && (
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="body2" color="text.secondary">Latency:</Typography>
                                  <Typography variant="body2">{message.latency}ms</Typography>
                                </Stack>
                              )}
                              <Divider />
                              <Typography variant="subtitle2" gutterBottom>
                                Payload
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 1, backgroundColor: 'grey.100' }}>
                                <Typography variant="body2" fontFamily="monospace" fontSize="11px">
                                  {JSON.stringify(message.payload, null, 2)}
                                </Typography>
                              </Paper>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Box>

        {/* Message Flow Progress Bar */}
        {filteredMessages.length > 0 && (
          <Box sx={{ p: 1, backgroundColor: 'white', borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredMessages.length} of {messages.length} messages
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Success Rate: {(messageStats.successRate * 100).toFixed(1)}%
              </Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={messageStats.successRate * 100}
              color={messageStats.successRate > 0.9 ? 'success' : messageStats.successRate > 0.7 ? 'warning' : 'error'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}