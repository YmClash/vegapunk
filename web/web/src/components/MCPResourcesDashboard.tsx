/**
 * MCP Resources Dashboard - Tools and resources management interface
 * Browse, test, and monitor MCP tools and resources
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Build as ToolIcon,
  Storage as ResourceIcon,
  PlayArrow as ExecuteIcon,
  Code as CodeIcon,
  Description as DocsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Analytics as MetricsIcon,
  Public as ExternalIcon
} from '@mui/icons-material';

interface MCPTool {
  name: string;
  description: string;
  category: string;
  inputSchema: any;
  metadata?: {
    cost?: number;
    latency?: number;
    reliability?: number;
    version?: string;
    tags?: string[];
  };
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  metadata?: {
    size?: number;
    lastModified?: string;
    version?: string;
    tags?: string[];
  };
}

interface ToolExecution {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  executionTime?: number;
  status: 'running' | 'completed' | 'failed';
}

interface MCPMetrics {
  totalTools: number;
  totalResources: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  mostUsedTools: Array<{ name: string; count: number }>;
  errorRate: number;
}

export function MCPResourcesDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [metrics, setMetrics] = useState<MCPMetrics | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [selectedResource, setSelectedResource] = useState<MCPResource | null>(null);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [toolParameters, setToolParameters] = useState<Record<string, any>>({});
  const [resourceContent, setResourceContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch MCP data
   */
  const fetchMCPData = useCallback(async () => {
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockTools: MCPTool[] = [
        {
          name: 'ethical_analysis',
          description: 'Perform comprehensive ethical analysis using multiple moral frameworks',
          category: 'ethical-analysis',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Content to analyze' },
              frameworks: { type: 'array', items: { type: 'string' }, description: 'Ethical frameworks to use' }
            },
            required: ['content']
          },
          metadata: {
            cost: 30,
            latency: 5000,
            reliability: 0.95,
            version: '1.0.0',
            tags: ['ethics', 'analysis', 'moral']
          }
        },
        {
          name: 'technical_support',
          description: 'Provide technical support and analysis for software, hardware, and system-related queries',
          category: 'technical-support',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Technical question or problem' },
              category: { type: 'string', enum: ['general', 'software', 'hardware'], description: 'Category of support' }
            },
            required: ['query']
          },
          metadata: {
            cost: 20,
            latency: 3000,
            reliability: 0.92,
            version: '1.0.0',
            tags: ['technical', 'support', 'troubleshooting']
          }
        }
      ];

      const mockResources: MCPResource[] = [
        {
          uri: 'vegapunk://agents/capabilities',
          name: 'Agent Capabilities',
          description: 'List of all agent capabilities in the Vegapunk ecosystem',
          mimeType: 'application/json',
          metadata: {
            size: 2048,
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            tags: ['agents', 'capabilities']
          }
        },
        {
          uri: 'vegapunk://network/topology',
          name: 'Network Topology',
          description: 'Current A2A network topology and connections',
          mimeType: 'application/json',
          metadata: {
            size: 1024,
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            tags: ['network', 'topology']
          }
        },
        {
          uri: 'vegapunk://metrics/performance',
          name: 'Performance Metrics',
          description: 'System performance metrics and analytics',
          mimeType: 'application/json',
          metadata: {
            size: 4096,
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            tags: ['metrics', 'performance']
          }
        }
      ];

      const mockExecutions: ToolExecution[] = [
        {
          id: 'exec-001',
          toolName: 'ethical_analysis',
          parameters: { content: 'Should we implement AI surveillance?', frameworks: ['all'] },
          result: { compliance_score: 0.65, concerns: 2, recommendations: 3 },
          startTime: new Date(Date.now() - 60000).toISOString(),
          endTime: new Date(Date.now() - 55000).toISOString(),
          executionTime: 5000,
          status: 'completed'
        },
        {
          id: 'exec-002',
          toolName: 'technical_support',
          parameters: { query: 'Database performance optimization', category: 'software' },
          result: { solution: 'Add indexing to frequently queried columns' },
          startTime: new Date(Date.now() - 120000).toISOString(),
          endTime: new Date(Date.now() - 117000).toISOString(),
          executionTime: 3000,
          status: 'completed'
        }
      ];

      const mockMetrics: MCPMetrics = {
        totalTools: mockTools.length,
        totalResources: mockResources.length,
        totalExecutions: 156,
        successRate: 0.94,
        averageExecutionTime: 4200,
        mostUsedTools: [
          { name: 'ethical_analysis', count: 67 },
          { name: 'technical_support', count: 89 }
        ],
        errorRate: 0.06
      };

      setTools(mockTools);
      setResources(mockResources);
      setExecutions(mockExecutions);
      setMetrics(mockMetrics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch MCP data');
      console.error('MCP data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchMCPData();

    if (autoRefresh) {
      const interval = setInterval(fetchMCPData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchMCPData]);

  /**
   * Execute tool
   */
  const executeTool = async (tool: MCPTool, parameters: Record<string, any>) => {
    const newExecution: ToolExecution = {
      id: `exec-${Date.now()}`,
      toolName: tool.name,
      parameters,
      startTime: new Date().toISOString(),
      status: 'running'
    };

    setExecutions(prev => [newExecution, ...prev]);

    // Simulate API call
    setTimeout(() => {
      const completedExecution: ToolExecution = {
        ...newExecution,
        endTime: new Date().toISOString(),
        executionTime: Math.random() * 5000 + 1000,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        result: Math.random() > 0.1 ? { 
          message: `Tool ${tool.name} executed successfully`,
          data: parameters 
        } : undefined,
        error: Math.random() <= 0.1 ? 'Simulated execution error' : undefined
      };

      setExecutions(prev => prev.map(exec => 
        exec.id === newExecution.id ? completedExecution : exec
      ));
    }, Math.random() * 3000 + 1000);

    setToolDialogOpen(false);
    setToolParameters({});
  };

  /**
   * Access resource
   */
  const accessResource = async (resource: MCPResource) => {
    try {
      // Simulate resource access
      const mockContent = {
        uri: resource.uri,
        name: resource.name,
        content: `Mock content for ${resource.name}`,
        timestamp: new Date().toISOString(),
        metadata: resource.metadata
      };

      setResourceContent(mockContent);
      setResourceDialogOpen(true);

    } catch (err) {
      setError(`Failed to access resource: ${resource.uri}`);
    }
  };

  /**
   * Filter tools by search and category
   */
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  /**
   * Get unique categories
   */
  const categories = ['all', ...new Set(tools.map(tool => tool.category))];

  /**
   * Format execution time
   */
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CircularProgress size={16} />;
      case 'completed': return <SuccessIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading MCP Resources...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchMCPData} size="small">
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ExternalIcon color="primary" />
          <Typography variant="h6">
            MCP Resources Dashboard
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />
          <IconButton onClick={fetchMCPData} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Metrics Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="primary">
                    {metrics?.totalTools || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Tools
                  </Typography>
                </Box>
                <ToolIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="secondary">
                    {metrics?.totalResources || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resources
                  </Typography>
                </Box>
                <ResourceIcon color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="success">
                    {((metrics?.successRate || 0) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
                <MetricsIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" color="info">
                    {formatExecutionTime(metrics?.averageExecutionTime || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration
                  </Typography>
                </Box>
                <TimerIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Tools" icon={<ToolIcon />} />
          <Tab label="Resources" icon={<ResourceIcon />} />
          <Tab label="Executions" icon={<ExecuteIcon />} />
        </Tabs>
      </Box>

      {/* Tools Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Search and Filter */}
          <Box display="flex" gap={2} mb={3}>
            <TextField
              label="Search tools..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Tools List */}
          <Grid container spacing={3}>
            {filteredTools.map((tool) => (
              <Grid item xs={12} md={6} key={tool.name}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                          <ToolIcon />
                          {tool.name}
                        </Typography>
                        <Chip 
                          label={tool.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ExecuteIcon />}
                        onClick={() => {
                          setSelectedTool(tool);
                          setToolDialogOpen(true);
                        }}
                      >
                        Execute
                      </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {tool.description}
                    </Typography>

                    {tool.metadata && (
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {tool.metadata.cost && (
                          <Chip 
                            label={`Cost: ${tool.metadata.cost}`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                        {tool.metadata.reliability && (
                          <Chip 
                            label={`Reliability: ${(tool.metadata.reliability * 100).toFixed(0)}%`} 
                            size="small" 
                            variant="outlined"
                            color="success"
                          />
                        )}
                        {tool.metadata.latency && (
                          <Chip 
                            label={`~${tool.metadata.latency}ms`} 
                            size="small" 
                            variant="outlined"
                            color="info"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Resources Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} md={6} key={resource.uri}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                        <ResourceIcon />
                        {resource.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resource.uri}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DocsIcon />}
                      onClick={() => accessResource(resource)}
                    >
                      Access
                    </Button>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {resource.description}
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip 
                      label={resource.mimeType} 
                      size="small" 
                      variant="outlined"
                    />
                    {resource.metadata?.size && (
                      <Chip 
                        label={`${(resource.metadata.size / 1024).toFixed(1)} KB`} 
                        size="small" 
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Executions Tab */}
      {activeTab === 2 && (
        <List>
          {executions.map((execution) => (
            <React.Fragment key={execution.id}>
              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(execution.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {execution.toolName}
                      </Typography>
                      <Chip
                        label={execution.status}
                        size="small"
                        color={getStatusColor(execution.status) as any}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Parameters: {JSON.stringify(execution.parameters)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Started: {new Date(execution.startTime).toLocaleString()}
                        {execution.executionTime && ` • Duration: ${formatExecutionTime(execution.executionTime)}`}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Tool Execution Dialog */}
      <Dialog open={toolDialogOpen} onClose={() => setToolDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Execute Tool: {selectedTool?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {selectedTool?.description}
          </Typography>
          
          {selectedTool?.inputSchema && (
            <Box>
              <Typography variant="subtitle2" mb={1}>Parameters:</Typography>
              {Object.entries(selectedTool.inputSchema.properties || {}).map(([key, schema]: [string, any]) => (
                <TextField
                  key={key}
                  label={key}
                  fullWidth
                  margin="normal"
                  required={selectedTool.inputSchema.required?.includes(key)}
                  helperText={schema.description}
                  value={toolParameters[key] || ''}
                  onChange={(e) => setToolParameters(prev => ({
                    ...prev,
                    [key]: e.target.value
                  }))}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToolDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => selectedTool && executeTool(selectedTool, toolParameters)}
            startIcon={<ExecuteIcon />}
          >
            Execute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resource Content Dialog */}
      <Dialog open={resourceDialogOpen} onClose={() => setResourceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Resource Content: {resourceContent?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            URI: {resourceContent?.uri}
          </Typography>
          
          <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(resourceContent, null, 2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}