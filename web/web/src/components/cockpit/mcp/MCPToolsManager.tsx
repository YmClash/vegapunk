/**
 * MCP Tools Manager - Professional Tools Ecosystem Management
 * Complete MCP tools discovery, testing, registration, and analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';

import {
  Build as ToolIcon,
  Add as AddIcon,
  PlayArrow as TestIcon,
  Assessment as AnalyticsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Speed as PerformanceIcon,
  Timeline as ActivityIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Star as PopularIcon,
  TrendingUp as TrendingIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Storage as StorageIcon,
  Build as BuildIcon
} from '@mui/icons-material';

interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'data' | 'analysis' | 'communication' | 'security' | 'utility';
  version: string;
  author: string;
  isPublic: boolean;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: any;
  }[];
  usage: {
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    lastUsed: string;
  };
  status: 'active' | 'inactive' | 'deprecated' | 'testing';
  tags: string[];
  documentation?: string;
  examples?: string[];
}

interface ToolTestResult {
  id: string;
  toolId: string;
  parameters: any;
  result: any;
  success: boolean;
  executionTime: number;
  timestamp: string;
  error?: string;
}

interface ToolAnalytics {
  totalTools: number;
  activeTools: number;
  categories: { [key: string]: number };
  popularTools: MCPTool[];
  recentActivity: {
    date: string;
    executions: number;
    successRate: number;
  }[];
  performanceMetrics: {
    avgExecutionTime: number;
    totalExecutions: number;
    successRate: number;
    errorRate: number;
  };
}

export function MCPToolsManager() {
  // State management
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [testResults, setTestResults] = useState<ToolTestResult[]>([]);
  const [toolAnalytics, setToolAnalytics] = useState<ToolAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [addToolDialogOpen, setAddToolDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Test states
  const [testParameters, setTestParameters] = useState<{ [key: string]: any }>({});
  const [isTestingTool, setIsTestingTool] = useState(false);

  /**
   * Fetch tools data
   */
  const fetchToolsData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development - replace with actual API calls
      const mockTools: MCPTool[] = [
        {
          id: 'file-reader',
          name: 'File Reader',
          description: 'Read and parse various file formats including text, JSON, CSV, and XML',
          category: 'data',
          version: '2.1.0',
          author: 'VegapunkAI',
          isPublic: true,
          parameters: [
            { name: 'filePath', type: 'string', required: true, description: 'Path to the file to read' },
            { name: 'encoding', type: 'string', required: false, description: 'File encoding', default: 'utf-8' },
            { name: 'parseJson', type: 'boolean', required: false, description: 'Auto-parse JSON files', default: true }
          ],
          usage: {
            totalExecutions: 2847,
            successRate: 0.98,
            avgExecutionTime: 145,
            lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          },
          status: 'active',
          tags: ['file', 'io', 'parsing', 'popular'],
          documentation: 'https://docs.vegapunk.ai/tools/file-reader'
        },
        {
          id: 'data-analyzer',
          name: 'Data Analyzer',
          description: 'Perform statistical analysis and generate insights from datasets',
          category: 'analysis',
          version: '1.5.2',
          author: 'Analytics Team',
          isPublic: true,
          parameters: [
            { name: 'dataset', type: 'array', required: true, description: 'Dataset to analyze' },
            { name: 'analysisType', type: 'string', required: true, description: 'Type of analysis to perform' },
            { name: 'includeVisualization', type: 'boolean', required: false, description: 'Generate charts', default: false }
          ],
          usage: {
            totalExecutions: 1456,
            successRate: 0.94,
            avgExecutionTime: 2847,
            lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString()
          },
          status: 'active',
          tags: ['analysis', 'statistics', 'insights'],
          documentation: 'https://docs.vegapunk.ai/tools/data-analyzer'
        },
        {
          id: 'secure-encryptor',
          name: 'Secure Encryptor',
          description: 'Advanced encryption and decryption with multiple cipher support',
          category: 'security',
          version: '3.0.1',
          author: 'Security Division',
          isPublic: false,
          parameters: [
            { name: 'data', type: 'string', required: true, description: 'Data to encrypt/decrypt' },
            { name: 'operation', type: 'string', required: true, description: 'encrypt or decrypt' },
            { name: 'algorithm', type: 'string', required: false, description: 'Encryption algorithm', default: 'AES-256-GCM' },
            { name: 'key', type: 'string', required: true, description: 'Encryption key' }
          ],
          usage: {
            totalExecutions: 892,
            successRate: 0.99,
            avgExecutionTime: 78,
            lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          status: 'active',
          tags: ['security', 'encryption', 'privacy'],
          documentation: 'https://docs.vegapunk.ai/tools/secure-encryptor'
        },
        {
          id: 'network-monitor',
          name: 'Network Monitor',
          description: 'Monitor network connectivity and performance metrics',
          category: 'system',
          version: '1.2.0',
          author: 'Infrastructure Team',
          isPublic: true,
          parameters: [
            { name: 'host', type: 'string', required: true, description: 'Host to monitor' },
            { name: 'port', type: 'number', required: false, description: 'Port to check', default: 80 },
            { name: 'timeout', type: 'number', required: false, description: 'Timeout in ms', default: 5000 }
          ],
          usage: {
            totalExecutions: 5623,
            successRate: 0.91,
            avgExecutionTime: 1245,
            lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          status: 'active',
          tags: ['network', 'monitoring', 'connectivity'],
          documentation: 'https://docs.vegapunk.ai/tools/network-monitor'
        },
        {
          id: 'legacy-converter',
          name: 'Legacy Converter',
          description: 'Convert legacy data formats to modern standards',
          category: 'utility',
          version: '0.9.1',
          author: 'Legacy Support',
          isPublic: true,
          parameters: [
            { name: 'inputFormat', type: 'string', required: true, description: 'Input data format' },
            { name: 'outputFormat', type: 'string', required: true, description: 'Desired output format' },
            { name: 'data', type: 'string', required: true, description: 'Data to convert' }
          ],
          usage: {
            totalExecutions: 234,
            successRate: 0.87,
            avgExecutionTime: 890,
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'deprecated',
          tags: ['legacy', 'conversion', 'compatibility'],
          documentation: 'https://docs.vegapunk.ai/tools/legacy-converter'
        }
      ];

      const mockAnalytics: ToolAnalytics = {
        totalTools: mockTools.length,
        activeTools: mockTools.filter(t => t.status === 'active').length,
        categories: {
          'data': 1,
          'analysis': 1,
          'security': 1,
          'system': 1,
          'utility': 1
        },
        popularTools: mockTools.slice(0, 3),
        recentActivity: [
          { date: '2025-07-23', executions: 156, successRate: 0.96 },
          { date: '2025-07-22', executions: 143, successRate: 0.94 },
          { date: '2025-07-21', executions: 178, successRate: 0.97 },
          { date: '2025-07-20', executions: 134, successRate: 0.93 },
          { date: '2025-07-19', executions: 167, successRate: 0.95 }
        ],
        performanceMetrics: {
          avgExecutionTime: 1052,
          totalExecutions: 11052,
          successRate: 0.95,
          errorRate: 0.05
        }
      };

      setAvailableTools(mockTools);
      setFilteredTools(mockTools);
      setToolAnalytics(mockAnalytics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch tools data');
      console.error('Tools data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filter tools
   */
  useEffect(() => {
    const filtered = availableTools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    setFilteredTools(filtered);
  }, [availableTools, searchQuery, categoryFilter, statusFilter]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchToolsData();
    const interval = setInterval(fetchToolsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchToolsData]);

  /**
   * Handle tool testing
   */
  const handleToolTest = async (tool: MCPTool, parameters: any) => {
    setIsTestingTool(true);
    try {
      // Mock API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult: ToolTestResult = {
        id: Date.now().toString(),
        toolId: tool.id,
        parameters,
        result: { success: true, data: 'Mock result data', processingTime: 1234 },
        success: true,
        executionTime: 1234,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('Tool test error:', error);
    } finally {
      setIsTestingTool(false);
      setTestDialogOpen(false);
    }
  };

  /**
   * Get status chip
   */
  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'success' as const, icon: <SuccessIcon fontSize="small" /> },
      inactive: { color: 'default' as const, icon: <PendingIcon fontSize="small" /> },
      deprecated: { color: 'warning' as const, icon: <ErrorIcon fontSize="small" /> },
      testing: { color: 'info' as const, icon: <CodeIcon fontSize="small" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: string) => {
    const icons = {
      system: <SettingsIcon />,
      data: <StorageIcon />,
      analysis: <AnalyticsIcon />,
      communication: <PublicIcon />,
      security: <PrivateIcon />,
      utility: <BuildIcon />
    };
    return icons[category as keyof typeof icons] || <ToolIcon />;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <ToolIcon color="primary" />
        🛠 MCP Tools Manager
      </Typography>

      {/* Tools Overview Analytics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {toolAnalytics?.totalTools || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tools
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {toolAnalytics?.activeTools || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Tools
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {toolAnalytics?.performanceMetrics.successRate ? 
                  (toolAnalytics.performanceMetrics.successRate * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {toolAnalytics?.performanceMetrics.avgExecutionTime || 0}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Execution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="data">Data</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="communication">Communication</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="utility">Utility</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                startIcon={<AnalyticsIcon />}
                onClick={() => setAnalyticsDialogOpen(true)}
                size="small"
              >
                Analytics
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddToolDialogOpen(true)}
                size="small"
              >
                Add Tool
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tools Grid */}
      <Grid container spacing={2}>
        {filteredTools.map((tool) => (
          <Grid item xs={12} md={6} lg={4} key={tool.id}>
            <Card 
              elevation={selectedTool?.id === tool.id ? 6 : 2}
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: selectedTool?.id === tool.id ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { elevation: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setSelectedTool(tool)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {getCategoryIcon(tool.category)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" noWrap>
                        {tool.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        v{tool.version} • {tool.author}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {!tool.isPublic && <PrivateIcon fontSize="small" color="action" />}
                    {getStatusChip(tool.status)}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {tool.description}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                  {tool.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                  {tool.tags.length > 3 && (
                    <Chip label={`+${tool.tags.length - 3}`} size="small" variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Executions
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {tool.usage.totalExecutions.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {(tool.usage.successRate * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Last used: {new Date(tool.usage.lastUsed).toLocaleTimeString()}
                  </Typography>
                  
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Test Tool">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTool(tool);
                          setTestDialogOpen(true);
                        }}
                      >
                        <TestIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Options">
                      <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                        <MoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tool Testing Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Test Tool: {selectedTool?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTool && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {selectedTool.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Parameters
              </Typography>
              
              <Grid container spacing={2}>
                {selectedTool.parameters.map((param) => (
                  <Grid item xs={12} md={6} key={param.name}>
                    <TextField
                      label={param.name}
                      helperText={param.description}
                      required={param.required}
                      type={param.type === 'number' ? 'number' : 'text'}
                      fullWidth
                      value={testParameters[param.name] || param.default || ''}
                      onChange={(e) => setTestParameters({
                        ...testParameters,
                        [param.name]: param.type === 'number' ? parseFloat(e.target.value) : e.target.value
                      })}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {testResults.filter(r => r.toolId === selectedTool.id).length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Recent Test Results
                  </Typography>
                  <List dense>
                    {testResults
                      .filter(r => r.toolId === selectedTool.id)
                      .slice(0, 3)
                      .map((result) => (
                        <ListItem key={result.id}>
                          <ListItemIcon>
                            {result.success ? 
                              <SuccessIcon color="success" /> : 
                              <ErrorIcon color="error" />
                            }
                          </ListItemIcon>
                          <ListItemText
                            primary={`Execution time: ${result.executionTime}ms`}
                            secondary={new Date(result.timestamp).toLocaleString()}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => selectedTool && handleToolTest(selectedTool, testParameters)}
            variant="contained"
            disabled={isTestingTool}
            startIcon={isTestingTool ? <CircularProgress size={16} /> : <TestIcon />}
          >
            {isTestingTool ? 'Testing...' : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}