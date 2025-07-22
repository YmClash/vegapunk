/**
 * A2A Reports Viewer - Professional Reports Dashboard with Generation Capabilities
 * Advanced reporting interface with automated report generation and export features
 */

import React, { useState, useMemo } from 'react';
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
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  Badge,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as PerformanceIcon,
  Message as MessageIcon,
  Security as SecurityIcon,
  VerifiedUser as ReliabilityIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface A2AReport {
  id: string;
  title: string;
  type: 'performance' | 'communication' | 'reliability' | 'security' | 'analytics';
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  data: any;
  summary?: string;
  recommendations?: string[];
  metrics?: Record<string, number>;
  charts?: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: any[];
  }>;
}

interface A2AReportsViewerProps {
  reports: A2AReport[];
  height?: number;
  onReportSelect?: (report: A2AReport) => void;
  onGenerateReport?: (type: string) => Promise<A2AReport>;
  onDownloadReport?: (report: A2AReport) => void;
}

export function A2AReportsViewer({
  reports,
  height = 400,
  onReportSelect,
  onGenerateReport,
  onDownloadReport
}: A2AReportsViewerProps) {
  const [selectedReport, setSelectedReport] = useState<A2AReport | null>(null);
  const [reportTypeToGenerate, setReportTypeToGenerate] = useState('performance');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Report type configuration
  const reportTypeConfig = {
    'performance': {
      name: 'Performance Report',
      icon: <PerformanceIcon />,
      color: 'primary',
      description: 'Agent performance metrics, response times, and throughput analysis'
    },
    'communication': {
      name: 'Communication Analysis',
      icon: <MessageIcon />,
      color: 'secondary',
      description: 'Message flow patterns, routing efficiency, and network topology insights'
    },
    'reliability': {
      name: 'Reliability Report',
      icon: <ReliabilityIcon />,
      color: 'success',
      description: 'System uptime, error rates, and service availability metrics'
    },
    'security': {
      name: 'Security Analysis',
      icon: <SecurityIcon />,
      color: 'error',
      description: 'Security events, threat detection, and vulnerability assessments'
    },
    'analytics': {
      name: 'Analytics Dashboard',
      icon: <AnalyticsIcon />,
      color: 'info',
      description: 'Comprehensive system analytics and trend analysis'
    }
  };

  /**
   * Sort reports by generation date (newest first)
   */
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }, [reports]);

  /**
   * Group reports by type
   */
  const reportsByType = useMemo(() => {
    const grouped: Record<string, A2AReport[]> = {};
    sortedReports.forEach(report => {
      if (!grouped[report.type]) {
        grouped[report.type] = [];
      }
      grouped[report.type].push(report);
    });
    return grouped;
  }, [sortedReports]);

  /**
   * Generate new report
   */
  const handleGenerateReport = async () => {
    if (!onGenerateReport) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const newReport = await onGenerateReport(reportTypeToGenerate);
      setSelectedReport(newReport);
      onReportSelect?.(newReport);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle report selection with toggle functionality
   */
  const handleReportSelect = (report: A2AReport) => {
    // Toggle logic: if clicking the same report, deselect it; otherwise select it
    const newSelection = selectedReport?.id === report.id ? null : report;
    setSelectedReport(newSelection);
    if (newSelection) {
      onReportSelect?.(newSelection);
    }
  };

  /**
   * Handle report download
   */
  const handleDownloadReport = (report: A2AReport) => {
    if (onDownloadReport) {
      onDownloadReport(report);
    } else {
      // Default download behavior
      const reportData = {
        ...report,
        generatedAt: format(new Date(report.generatedAt), 'PPpp')
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a2a-${report.type}-report-${format(new Date(report.generatedAt), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  /**
   * Render report status chip
   */
  const renderStatusChip = (status: A2AReport['status']) => {
    const config = {
      'generating': { color: 'warning' as const, icon: <CircularProgress size={12} />, label: 'Generating' },
      'completed': { color: 'success' as const, icon: <SuccessIcon />, label: 'Completed' },
      'failed': { color: 'error' as const, icon: <ErrorIcon />, label: 'Failed' }
    };

    const { color, icon, label } = config[status];

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  /**
   * Render report metrics summary
   */
  const renderMetricsSummary = (report: A2AReport) => {
    if (!report.metrics) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Key Metrics
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(report.metrics).slice(0, 4).map(([key, value]) => (
            <Grid item xs={6} key={key}>
              <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {typeof value === 'number' ? 
                    (value < 1 ? (value * 100).toFixed(1) + '%' : value.toFixed(1)) 
                    : value
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  /**
   * Render performance report content
   */
  const renderPerformanceReport = (report: A2AReport) => (
    <Stack spacing={2}>
      <Alert severity="info" icon={<PerformanceIcon />}>
        Performance analysis for A2A network infrastructure
      </Alert>
      
      {report.data && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Response Time Analysis
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Average Response Time</Typography>
                <Typography variant="h6" color="primary">
                  {report.data.avgResponseTime?.toFixed(1) || 'N/A'}ms
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((report.data.avgResponseTime || 0) / 100 * 100, 100)}
                color={report.data.avgResponseTime < 50 ? 'success' : 
                       report.data.avgResponseTime < 100 ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
                <Typography variant="h6" color="success.main">
                  {((report.data.successRate || 0) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Throughput
                </Typography>
                <Typography variant="h6" color="info.main">
                  {report.data.throughput?.toFixed(1) || 'N/A'} ops/min
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
      
      {renderMetricsSummary(report)}
    </Stack>
  );

  /**
   * Render communication report content
   */
  const renderCommunicationReport = (report: A2AReport) => (
    <Stack spacing={2}>
      <Alert severity="info" icon={<MessageIcon />}>
        Communication flow analysis for agent network
      </Alert>
      
      {report.data && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Message Flow Statistics
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Messages</Typography>
                  <Typography variant="h6" color="primary">
                    {report.data.totalMessages?.toLocaleString() || 'N/A'}
                  </Typography>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Top Communicators
                </Typography>
                {report.data.topCommunicators?.map((agent: string, index: number) => (
                  <Chip
                    key={agent}
                    label={agent}
                    size="small"
                    color={index === 0 ? 'primary' : 'default'}
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
      
      {renderMetricsSummary(report)}
    </Stack>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          Reports
          <Badge badgeContent={reports.length} color="primary" />
        </Typography>
        
        <IconButton onClick={() => window.location.reload()}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Report Generation */}
      <Paper elevation={1} sx={{ p: 1.5, mb: 1.5, backgroundColor: 'grey.50', flexShrink: 0 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.9rem' }}>
          Generate New Report
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportTypeToGenerate}
              label="Report Type"
              onChange={(e) => setReportTypeToGenerate(e.target.value)}
              disabled={isGenerating}
            >
              {Object.entries(reportTypeConfig).map(([type, config]) => (
                <MenuItem key={type} value={type}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {config.icon}
                    <Typography variant="body2">{config.name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            size="small"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={14} /> : <ReportIcon />}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </Stack>
        
        {reportTypeToGenerate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
            {reportTypeConfig[reportTypeToGenerate as keyof typeof reportTypeConfig]?.description}
          </Typography>
        )}
        
        {generationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {generationError}
          </Alert>
        )}
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Reports List */}
          <Grid item xs={12} md={5} sx={{ height: '100%' }}>
            <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Recent Reports
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
                {sortedReports.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No reports available. Generate your first report to get started.
                    </Typography>
                  </Box>
                ) : (
                  <List dense>
                    {sortedReports.map((report) => {
                    const config = reportTypeConfig[report.type as keyof typeof reportTypeConfig];
                    const isSelected = selectedReport?.id === report.id;
                    
                    return (
                      <ListItem
                        key={report.id}
                        onClick={() => handleReportSelect(report)}
                        sx={{ 
                          cursor: 'pointer',
                          borderLeft: isSelected ? `3px solid` : '3px solid transparent',
                          borderLeftColor: isSelected ? `${config.color}.main` : 'transparent',
                          backgroundColor: isSelected ? 'action.selected' : 'transparent',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <ListItemIcon>
                          {config.icon}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={report.title}
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(report.generatedAt), 'MMM dd, yyyy • HH:mm')}
                              </Typography>
                              {renderStatusChip(report.status)}
                            </Stack>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View Report">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle logic: if already selected, deselect; otherwise select
                                  const newSelection = selectedReport?.id === report.id ? null : report;
                                  setSelectedReport(newSelection);
                                  onReportSelect?.(newSelection || report);
                                }}
                                color={selectedReport?.id === report.id ? 'primary' : 'default'}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Report">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadReport(report);
                                }}
                                disabled={report.status !== 'completed'}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                    })}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Report Preview */}
          <Grid item xs={12} md={7} sx={{ height: '100%' }}>
            <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {selectedReport ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {selectedReport.title}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Generated: {format(new Date(selectedReport.generatedAt), 'MMM dd, HH:mm')}
                        </Typography>
                        {renderStatusChip(selectedReport.status)}
                      </Stack>
                    </Box>
                    
                    <Button
                      size="small"
                      startIcon={<ExportIcon />}
                      onClick={() => handleDownloadReport(selectedReport)}
                      disabled={selectedReport.status !== 'completed'}
                    >
                      Export
                    </Button>
                  </Stack>
                </Box>
                
                <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
                  {selectedReport.status === 'completed' && (
                    <>
                      {selectedReport.summary && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          {selectedReport.summary}
                        </Alert>
                      )}
                      
                      {selectedReport.type === 'performance' && renderPerformanceReport(selectedReport)}
                      {selectedReport.type === 'communication' && renderCommunicationReport(selectedReport)}
                      
                      {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Recommendations
                          </Typography>
                          <List dense>
                            {selectedReport.recommendations.map((rec, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <InfoIcon color="info" />
                                </ListItemIcon>
                                <ListItemText primary={rec} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </>
                  )}
                  
                  {selectedReport.status === 'generating' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                      <CircularProgress size={48} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Generating report...
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedReport.status === 'failed' && (
                    <Alert severity="error">
                      Report generation failed. Please try again.
                    </Alert>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Report Selected
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Select a report from the list or generate a new one to view detailed analytics.
                </Typography>
              </Box>
            )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}