/**
 * MCP Resources Monitor - Enterprise Resource Management Interface
 * Complete MCP resources tracking, management, and analytics
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
  Tab,
  Tabs,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';

import {
  CloudUpload as ResourceIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AnalyticsIcon,
  History as HistoryIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
  Schedule as RecentIcon,
  Star as PopularIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as TemplateIcon,
  Psychology as PromptIcon,
  Extension as IntegrationIcon,
  Settings as ConfigIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface MCPResource {
  id: string;
  name: string;
  description: string;
  category: 'templates' | 'prompts' | 'integrations' | 'configs';
  type: string;
  version: string;
  author: string;
  isPublic: boolean;
  size: number; // in bytes
  createdAt: string;
  updatedAt: string;
  usage: {
    totalAccesses: number;
    lastAccessed: string;
    accessFrequency: number; // per day
    popularityScore: number;
  };
  status: 'active' | 'archived' | 'deprecated' | 'draft';
  tags: string[];
  metadata: {
    dependencies?: string[];
    compatibility?: string[];
    parameters?: { [key: string]: any };
    [key: string]: any;
  };
  content?: string;
  preview?: string;
}

interface ResourceUsage {
  resourceId: string;
  date: string;
  accessCount: number;
  uniqueUsers: number;
  avgExecutionTime: number;
  successRate: number;
}

interface ResourceAnalytics {
  totalResources: number;
  byCategory: { [key: string]: number };
  byStatus: { [key: string]: number };
  popularResources: MCPResource[];
  recentlyUpdated: MCPResource[];
  usageTrends: {
    date: string;
    accesses: number;
    resources: number;
  }[];
  storageUsage: {
    total: number;
    used: number;
    available: number;
    byCategory: { [key: string]: number };
  };
}

export function MCPResourcesMonitor() {
  // State management
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<MCPResource[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [resourceAnalytics, setResourceAnalytics] = useState<ResourceAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<MCPResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [viewResourceDialogOpen, setViewResourceDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /**
   * Resource categories configuration
   */
  const resourceCategories = [
    { 
      id: 'templates', 
      name: 'Templates', 
      icon: <TemplateIcon />, 
      color: 'primary',
      description: 'Reusable code templates and patterns'
    },
    { 
      id: 'prompts', 
      name: 'Prompts', 
      icon: <PromptIcon />, 
      color: 'secondary',
      description: 'AI prompt templates and instructions'
    },
    { 
      id: 'integrations', 
      name: 'Integrations', 
      icon: <IntegrationIcon />, 
      color: 'success',
      description: 'External service integrations'
    },
    { 
      id: 'configs', 
      name: 'Configurations', 
      icon: <ConfigIcon />, 
      color: 'warning',
      description: 'System and application configurations'
    }
  ];

  /**
   * Fetch resources data
   */
  const fetchResourcesData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Mock data for development - replace with actual API calls
      const mockResources: MCPResource[] = [
        {
          id: 'template-001',
          name: 'API Response Template',
          description: 'Standard JSON API response template with error handling',
          category: 'templates',
          type: 'json-template',
          version: '2.1.0',
          author: 'DevTeam',
          isPublic: true,
          size: 2048,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            totalAccesses: 1847,
            lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            accessFrequency: 45.2,
            popularityScore: 92
          },
          status: 'active',
          tags: ['api', 'json', 'template', 'popular'],
          metadata: {
            dependencies: ['json-schema'],
            compatibility: ['v2.x', 'v3.x'],
            parameters: { format: 'json', version: '2.1' }
          },
          preview: '{"status": "success", "data": {...}, "meta": {...}}'
        },
        {
          id: 'prompt-001',
          name: 'Code Review Prompt',
          description: 'Comprehensive code review prompt for AI assistants',
          category: 'prompts',
          type: 'ai-prompt',
          version: '1.3.0',
          author: 'AI Team',
          isPublic: true,
          size: 1536,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            totalAccesses: 892,
            lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            accessFrequency: 23.1,
            popularityScore: 78
          },
          status: 'active',
          tags: ['code-review', 'ai', 'prompt', 'quality'],
          metadata: {
            parameters: { language: 'any', style: 'comprehensive' }
          },
          preview: 'Please review the following code for...'
        },
        {
          id: 'integration-001',
          name: 'Slack Notification Integration',
          description: 'Send notifications to Slack channels with rich formatting',
          category: 'integrations',
          type: 'webhook-integration',
          version: '1.0.2',
          author: 'Integration Team',
          isPublic: false,
          size: 4096,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            totalAccesses: 456,
            lastAccessed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            accessFrequency: 12.7,
            popularityScore: 65
          },
          status: 'active',
          tags: ['slack', 'notification', 'webhook', 'integration'],
          metadata: {
            dependencies: ['slack-api'],
            parameters: { webhookUrl: 'required', channel: 'optional' }
          },
          preview: 'Slack webhook integration configuration...'
        },
        {
          id: 'config-001',
          name: 'Production Environment Config',
          description: 'Production environment configuration with security settings',
          category: 'configs',
          type: 'env-config',
          version: '3.2.1',
          author: 'DevOps',
          isPublic: false,
          size: 3072,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            totalAccesses: 234,
            lastAccessed: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            accessFrequency: 5.8,
            popularityScore: 45
          },
          status: 'active',
          tags: ['production', 'config', 'security', 'environment'],
          metadata: {
            compatibility: ['prod-v3.x'],
            parameters: { env: 'production', secure: true }
          },
          preview: 'Environment configuration for production deployment...'
        },
        {
          id: 'template-002',
          name: 'Legacy Data Transformer',
          description: 'Transform legacy data formats to modern schemas',
          category: 'templates',
          type: 'data-template',
          version: '0.9.5',
          author: 'Legacy Team',
          isPublic: true,
          size: 1024,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            totalAccesses: 89,
            lastAccessed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            accessFrequency: 1.2,
            popularityScore: 28
          },
          status: 'deprecated',
          tags: ['legacy', 'transform', 'data', 'deprecated'],
          metadata: {
            parameters: { inputFormat: 'legacy', outputFormat: 'modern' }
          },
          preview: 'Legacy data transformation template...'
        }
      ];

      const mockResourceAnalytics: ResourceAnalytics = {
        totalResources: mockResources.length,
        byCategory: {
          templates: mockResources.filter(r => r.category === 'templates').length,
          prompts: mockResources.filter(r => r.category === 'prompts').length,
          integrations: mockResources.filter(r => r.category === 'integrations').length,
          configs: mockResources.filter(r => r.category === 'configs').length
        },
        byStatus: {
          active: mockResources.filter(r => r.status === 'active').length,
          archived: mockResources.filter(r => r.status === 'archived').length,
          deprecated: mockResources.filter(r => r.status === 'deprecated').length,
          draft: mockResources.filter(r => r.status === 'draft').length
        },
        popularResources: mockResources
          .sort((a, b) => b.usage.popularityScore - a.usage.popularityScore)
          .slice(0, 3),
        recentlyUpdated: mockResources
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3),
        usageTrends: [
          { date: '2025-07-19', accesses: 234, resources: 45 },
          { date: '2025-07-20', accesses: 267, resources: 48 },
          { date: '2025-07-21', accesses: 189, resources: 42 },
          { date: '2025-07-22', accesses: 298, resources: 51 },
          { date: '2025-07-23', accesses: 312, resources: 53 }
        ],
        storageUsage: {
          total: 1024 * 1024 * 100, // 100MB
          used: 1024 * 1024 * 23, // 23MB
          available: 1024 * 1024 * 77, // 77MB
          byCategory: {
            templates: 1024 * 8, // 8KB
            prompts: 1024 * 6, // 6KB
            integrations: 1024 * 5, // 5KB
            configs: 1024 * 4 // 4KB
          }
        }
      };

      setResources(mockResources);
      setFilteredResources(mockResources);
      setResourceAnalytics(mockResourceAnalytics);
      setError(null);

    } catch (err) {
      setError('Failed to fetch resources data');
      console.error('Resources data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Filter resources
   */
  useEffect(() => {
    const filtered = resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    setFilteredResources(filtered);
  }, [resources, searchQuery, selectedCategory, statusFilter]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    fetchResourcesData();
    const interval = setInterval(fetchResourcesData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchResourcesData]);

  /**
   * Get status chip
   */
  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'success' as const, icon: <SuccessIcon fontSize="small" /> },
      archived: { color: 'default' as const, icon: <StorageIcon fontSize="small" /> },
      deprecated: { color: 'warning' as const, icon: <WarningIcon fontSize="small" /> },
      draft: { color: 'info' as const, icon: <EditIcon fontSize="small" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
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
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Get category info
   */
  const getCategoryInfo = (categoryId: string) => {
    return resourceCategories.find(cat => cat.id === categoryId) || resourceCategories[0];
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
        <ResourceIcon color="primary" />
        📁 MCP Resources Monitor
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Resource Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {resourceAnalytics?.totalResources || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Resources
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {resourceAnalytics?.byStatus.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Resources
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {resourceAnalytics?.storageUsage ? 
                  formatFileSize(resourceAnalytics.storageUsage.used) : '0 B'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {resourceAnalytics?.storageUsage ? 
                  ((resourceAnalytics.storageUsage.used / resourceAnalytics.storageUsage.total) * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={selectedCategory} 
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Resources" value="all" />
          {resourceCategories.map(category => (
            <Tab 
              key={category.id}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {category.icon}
                  {category.name}
                  <Badge 
                    badgeContent={resourceAnalytics?.byCategory[category.id] || 0}
                    color={category.color as any}
                    size="small"
                  />
                </Box>
              }
              value={category.id}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Filters and Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search resources..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={4}>
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
                onClick={() => setAddResourceDialogOpen(true)}
                size="small"
              >
                Add Resource
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Resources Grid */}
      <Grid container spacing={2}>
        {filteredResources.map((resource) => {
          const categoryInfo = getCategoryInfo(resource.category);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={resource.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { elevation: 4, transform: 'translateY(-2px)' }
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: `${categoryInfo.color}.main`, width: 32, height: 32 }}>
                        {categoryInfo.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" noWrap>
                          {resource.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          v{resource.version} • {resource.author}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {!resource.isPublic && <PrivateIcon fontSize="small" color="action" />}
                      {getStatusChip(resource.status)}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {resource.description}
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {resource.tags.length > 3 && (
                      <Chip label={`+${resource.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Grid container spacing={1} mb={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Accesses
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {resource.usage.totalAccesses.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Size
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatFileSize(resource.size)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Updated: {new Date(resource.updatedAt).toLocaleDateString()}
                    </Typography>
                    
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Resource">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedResource(resource);
                            setViewResourceDialogOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Options">
                        <IconButton size="small">
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* View Resource Dialog */}
      <Dialog 
        open={viewResourceDialogOpen} 
        onClose={() => setViewResourceDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedResource?.name}
        </DialogTitle>
        <DialogContent>
          {selectedResource && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                {selectedResource.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body2">
                    {getCategoryInfo(selectedResource.category).name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body2">
                    {selectedResource.version}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body2">
                    {formatFileSize(selectedResource.size)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Accesses
                  </Typography>
                  <Typography variant="body2">
                    {selectedResource.usage.totalAccesses.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {selectedResource.preview && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview
                  </Typography>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}
                  >
                    {selectedResource.preview}
                  </Paper>
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selectedResource.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewResourceDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            Edit Resource
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}