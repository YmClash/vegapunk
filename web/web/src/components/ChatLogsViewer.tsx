import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  LinearProgress,
  Badge,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Person as UserIcon,
  SmartToy as BotIcon,
  Settings as SystemIcon,
  Error as ErrorIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ChatLog {
  id: string;
  timestamp: string;
  type: 'user' | 'bot' | 'system' | 'error';
  message: string;
  socketId?: string;
  responseTime?: number;
}

interface LogsResponse {
  logs: ChatLog[];
  total: number;
  limit: number;
}

export function ChatLogsViewer() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: '500', // Fetch more logs for local filtering
        ...(filterType !== 'all' && { type: filterType })
      });
      
      const response = await axios.get(`http://localhost:8080/api/debug/logs?${params}`);
      const data: LogsResponse = response.data;
      
      let filteredLogs = data.logs;
      
      // Client-side search filtering
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.socketId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setLogs(filteredLogs);
      setTotalLogs(data.total);
      setPage(0); // Reset to first page when data changes
      
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to fetch chat logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]); // Refetch when filter changes

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchLogs();
      } else if (searchTerm === '') {
        fetchLogs(); // Refresh when search is cleared
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filterType, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserIcon color="primary" />;
      case 'bot': return <BotIcon color="secondary" />;
      case 'system': return <SystemIcon color="info" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <ChatIcon />;
    }
  };

  const getLogChipColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'user': return 'primary';
      case 'bot': return 'secondary';
      case 'system': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatMessage = (message: string, type: string) => {
    const maxLength = type === 'error' ? 200 : 100;
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const getLogStats = () => {
    const stats = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return stats;
  };

  const stats = getLogStats();
  const displayedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <ChatIcon sx={{ mr: 1, color: 'primary.main' }} />
          Chat Logs Viewer
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'filled' : 'outlined'}
            size="small"
          />
          <Tooltip title="Refresh Logs">
            <IconButton onClick={fetchLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h6">{stats.user || 0}</Typography>
            <Typography variant="body2">User Messages</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
            <Typography variant="h6">{stats.bot || 0}</Typography>
            <Typography variant="body2">Bot Responses</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Typography variant="h6">{stats.system || 0}</Typography>
            <Typography variant="body2">System Events</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <Typography variant="h6">{stats.error || 0}</Typography>
            <Typography variant="body2">Errors</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="user">User Messages</MenuItem>
                <MenuItem value="bot">Bot Responses</MenuItem>
                <MenuItem value="system">System Events</MenuItem>
                <MenuItem value="error">Errors</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {displayedLogs.length} of {logs.length} logs
              {totalLogs > logs.length && ` (${totalLogs} total in backend)`}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Logs Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="120px">Timestamp</TableCell>
              <TableCell width="80px">Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell width="100px">Socket ID</TableCell>
              <TableCell width="100px">Response Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.type}
                    color={getLogChipColor(log.type)}
                    size="small"
                    icon={getLogIcon(log.type)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={log.message} placement="top-start">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        cursor: 'pointer',
                        fontFamily: log.type === 'error' ? 'monospace' : 'inherit',
                        color: log.type === 'error' ? 'error.main' : 'inherit'
                      }}
                    >
                      {formatMessage(log.message, log.type)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {log.socketId && (
                    <Chip 
                      label={log.socketId.substring(0, 8)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontFamily="monospace"
                    color={log.responseTime && log.responseTime > 2000 ? 'warning.main' : 'text.primary'}
                  >
                    {formatResponseTime(log.responseTime)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {displayedLogs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No logs found matching the current filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}