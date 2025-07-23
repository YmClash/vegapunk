/**
 * DataFlow Tracing Visualization - Advanced Timeline Data Flow Monitoring
 * Professional dataflow tracing with timeline, JSON inspection, filtering, and export capabilities
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Card,
  CardContent,
  Collapse,
  Paper,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';
import {
  DataObject as DataIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Speed as PerformanceIcon,
  Storage as DataSizeIcon,
  Transform as TransformIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// TypeScript interfaces
interface DataFlowTrace {
  id: string;
  workflowId: string;
  timestamp: string;
  nodeName: string;
  operation: string;
  dataSize: number;
  duration: number;
  isActive: boolean;
  dataPreview: Record<string, any>;
  performanceMetrics?: {
    memoryUsage: number;
    cpuUsage: number;
    ioOperations: number;
  };
  dataTransformation?: {
    inputSchema: string;
    outputSchema: string;
    transformationType: string;
  };
}

interface DataFlowTracingVisualizationProps {
  traces: DataFlowTrace[];
  height?: number;
  maxTraces?: number;
  enableExport?: boolean;
}

export function DataFlowTracingVisualization({
  traces,
  height = 300,
  maxTraces = 50,
  enableExport = true
}: DataFlowTracingVisualizationProps) {
  // State management
  const [selectedTrace, setSelectedTrace] = useState<DataFlowTrace | null>(null);
  const [filterField, setFilterField] = useState<string>('all');
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /**
   * Filter and search traces
   */
  const filteredTraces = traces
    .filter(trace => {
      // Filter by field type
      if (filterField !== 'all') {
        const hasField = Object.keys(trace.dataPreview).some(key => 
          key.toLowerCase().includes(filterField.toLowerCase())
        );
        if (!hasField) return false;
      }

      // Filter by operation type
      if (filterOperation !== 'all' && trace.operation !== filterOperation) {
        return false;
      }

      // Search in node name and operation
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesNodeName = trace.nodeName.toLowerCase().includes(searchLower);
        const matchesOperation = trace.operation.toLowerCase().includes(searchLower);
        const matchesData = JSON.stringify(trace.dataPreview).toLowerCase().includes(searchLower);
        
        if (!matchesNodeName && !matchesOperation && !matchesData) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    })
    .slice(0, maxTraces);

  /**
   * Get operation color based on type
   */
  const getOperationColor = (operation: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    const operationColors: Record<string, any> = {
      'data_transformation': 'primary',
      'data_validation': 'success',
      'data_filtering': 'info',
      'context_preparation': 'secondary',
      'agent_handoff': 'warning',
      'error_handling': 'error',
      'performance_monitoring': 'info'
    };
    return operationColors[operation] || 'primary';
  };

  /**
   * Get operation icon based on type
   */
  const getOperationIcon = (operation: string) => {
    const operationIcons: Record<string, React.ReactElement> = {
      'data_transformation': <TransformIcon />,
      'data_validation': <InfoIcon />,
      'data_filtering': <FilterIcon />,
      'context_preparation': <DataIcon />,
      'agent_handoff': <PerformanceIcon />,
      'error_handling': <ErrorIcon />,
      'performance_monitoring': <PerformanceIcon />
    };
    return operationIcons[operation] || <DataIcon />;
  };

  /**
   * Format bytes to human readable
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Export dataflow trace
   */
  const exportDataFlowTrace = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalTraces: filteredTraces.length,
      filters: {
        field: filterField,
        operation: filterOperation,
        search: searchTerm
      },
      traces: filteredTraces.map(trace => ({
        ...trace,
        formattedTimestamp: format(new Date(trace.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'),
        formattedDataSize: formatBytes(trace.dataSize),
        formattedDuration: `${trace.duration}ms`
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataflow-trace-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredTraces, filterField, filterOperation, searchTerm]);

  /**
   * Toggle trace expansion
   */
  const toggleTraceExpansion = (traceId: string) => {
    setExpandedTrace(expandedTrace === traceId ? null : traceId);
  };

  /**
   * Get unique operations for filter
   */
  const uniqueOperations = Array.from(new Set(traces.map(t => t.operation)));

  /**
   * Get performance indicator
   */
  const getPerformanceIndicator = (duration: number): { color: string; label: string } => {
    if (duration < 100) return { color: 'success.main', label: 'Fast' };
    if (duration < 500) return { color: 'warning.main', label: 'Normal' };
    return { color: 'error.main', label: 'Slow' };
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {/* DataFlow Controls */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search traces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />

        {/* Field Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Data Field</InputLabel>
          <Select
            value={filterField}
            label="Data Field"
            onChange={(e) => setFilterField(e.target.value)}
          >
            <MenuItem value="all">All Fields</MenuItem>
            <MenuItem value="user_input">User Input</MenuItem>
            <MenuItem value="agent_response">Agent Response</MenuItem>
            <MenuItem value="context">Context</MenuItem>
            <MenuItem value="metadata">Metadata</MenuItem>
            <MenuItem value="analysis">Analysis</MenuItem>
          </Select>
        </FormControl>

        {/* Operation Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Operation</InputLabel>
          <Select
            value={filterOperation}
            label="Operation"
            onChange={(e) => setFilterOperation(e.target.value)}
          >
            <MenuItem value="all">All Operations</MenuItem>
            {uniqueOperations.map(op => (
              <MenuItem key={op} value={op}>
                {op.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sort Order */}
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          startIcon={<TimelineIcon />}
        >
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </Button>

        {/* Export Button */}
        {enableExport && (
          <Button
            size="small"
            variant="outlined"
            onClick={exportDataFlowTrace}
            startIcon={<ExportIcon />}
            disabled={filteredTraces.length === 0}
          >
            Export Trace
          </Button>
        )}
      </Stack>

      {/* Trace Statistics */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip 
          label={`${filteredTraces.length} Traces`} 
          color="primary" 
          size="small" 
        />
        <Chip 
          label={`${filteredTraces.filter(t => t.isActive).length} Active`} 
          color="info" 
          size="small" 
        />
        <Chip 
          label={`Avg: ${filteredTraces.reduce((acc, t) => acc + t.duration, 0) / Math.max(filteredTraces.length, 1) || 0}ms`} 
          color="secondary" 
          size="small" 
        />
      </Stack>

      {/* DataFlow Timeline */}
      <Paper 
        variant="outlined"
        sx={{ 
          height: height - 120,
          overflow: 'auto',
          bgcolor: '#fafafa'
        }}
      >
        {filteredTraces.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              flexDirection: 'column',
              color: 'text.secondary'
            }}
          >
            <DataIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No DataFlow Traces
            </Typography>
            <Typography variant="body2">
              {searchTerm || filterField !== 'all' || filterOperation !== 'all' 
                ? 'Try adjusting your filters' 
                : 'DataFlow traces will appear here when workflows are running'
              }
            </Typography>
          </Box>
        ) : (
          <Timeline position="right">
            {filteredTraces.map((trace, index) => {
              const performanceIndicator = getPerformanceIndicator(trace.duration);
              const isExpanded = expandedTrace === trace.id;

              return (
                <TimelineItem key={trace.id}>
                  <TimelineOppositeContent 
                    sx={{ m: 'auto 0', minWidth: 100 }}
                    align="right" 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {format(new Date(trace.timestamp), 'HH:mm:ss.SSS')}
                  </TimelineOppositeContent>
                  
                  <TimelineSeparator>
                    <TimelineDot 
                      color={getOperationColor(trace.operation)}
                      variant={trace.isActive ? 'filled' : 'outlined'}
                      sx={{ p: 1.5 }}
                    >
                      {getOperationIcon(trace.operation)}
                    </TimelineDot>
                    {index < filteredTraces.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          bgcolor: '#f5f5f5',
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        },
                        bgcolor: selectedTrace?.id === trace.id ? 'action.selected' : 'background.paper'
                      }}
                      onClick={() => {
                        setSelectedTrace(trace);
                        toggleTraceExpansion(trace.id);
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                              {trace.nodeName}
                              <Chip 
                                label={trace.operation.replace('_', ' ')}
                                size="small"
                                color={getOperationColor(trace.operation)}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Workflow: {trace.workflowId}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title={`Performance: ${performanceIndicator.label}`}>
                              <Chip 
                                label={`${trace.duration}ms`}
                                size="small"
                                sx={{ 
                                  bgcolor: performanceIndicator.color,
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Tooltip>
                            
                            <Tooltip title={`Data Size: ${formatBytes(trace.dataSize)}`}>
                              <Chip 
                                icon={<DataSizeIcon sx={{ fontSize: '0.8rem' }} />}
                                label={formatBytes(trace.dataSize)}
                                size="small"
                                color="info"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Tooltip>

                            <IconButton size="small">
                              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                            </IconButton>
                          </Stack>
                        </Stack>

                        {/* Data Preview Collapse */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Stack spacing={2}>
                              {/* Data Preview */}
                              <Box>
                                <Typography variant="caption" fontWeight="bold" color="primary">
                                  Data Preview:
                                </Typography>
                                <Paper 
                                  variant="outlined"
                                  sx={{ 
                                    p: 1, 
                                    mt: 1, 
                                    bgcolor: '#f9f9f9',
                                    maxHeight: 200,
                                    overflow: 'auto'
                                  }}
                                >
                                  <pre style={{ 
                                    fontSize: '11px', 
                                    margin: 0, 
                                    fontFamily: 'Monaco, monospace',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                  }}>
                                    {JSON.stringify(trace.dataPreview, null, 2)}
                                  </pre>
                                </Paper>
                              </Box>

                              {/* Performance Metrics */}
                              {trace.performanceMetrics && (
                                <Box>
                                  <Typography variant="caption" fontWeight="bold" color="secondary">
                                    Performance Metrics:
                                  </Typography>
                                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Chip 
                                      label={`Memory: ${trace.performanceMetrics.memoryUsage}MB`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip 
                                      label={`CPU: ${trace.performanceMetrics.cpuUsage}%`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip 
                                      label={`I/O: ${trace.performanceMetrics.ioOperations}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Stack>
                                </Box>
                              )}

                              {/* Data Transformation Info */}
                              {trace.dataTransformation && (
                                <Box>
                                  <Typography variant="caption" fontWeight="bold" color="success.main">
                                    Data Transformation:
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block">
                                      {trace.dataTransformation.inputSchema} → {trace.dataTransformation.outputSchema}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Type: {trace.dataTransformation.transformationType}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Paper>
    </Box>
  );
}