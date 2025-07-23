/**
 * Workflow Template Library - Advanced Template Management & Visual Designer
 * Professional workflow templates library with categorization, performance metrics, and visual designer interface
 */

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Avatar,
  AvatarGroup,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import {
  LibraryBooks as TemplatesIcon,
  PlayArrow as ExecuteIcon,
  Edit as EditIcon,
  FileCopy as DuplicateIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as CreativeIcon,
  Build as MaintenanceIcon,
  Psychology as AIIcon,
  Speed as PerformanceIcon,
  CheckCircle as SuccessIcon,
  Schedule as DurationIcon,
  Group as TeamIcon,
  Star as FeaturedIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

// TypeScript interfaces
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'security-ethics' | 'data-analysis' | 'creative-problem' | 'system-maintenance' | 'custom';
  agents: string[];
  complexity: 'Simple' | 'Moderate' | 'Complex';
  estimatedDuration: number; // in minutes
  successRate: number; // 0-1
  avgExecutionTime: number; // in ms
  totalExecutions: number;
  lastUsed?: string;
  isPopular: boolean;
  isFeatured: boolean;
  tags: string[];
  author: string;
  version: string;
  requiresApproval: boolean;
  metadata: {
    nodeCount: number;
    branchingFactor: number;
    parallelCapability: boolean;
    resourceIntensive: boolean;
  };
}

interface WorkflowTemplateLibraryProps {
  onTemplateSelect?: (template: WorkflowTemplate) => void;
  onWorkflowDesign?: () => void;
  maxTemplates?: number;
}

export function WorkflowTemplateLibrary({
  onTemplateSelect,
  onWorkflowDesign,
  maxTemplates = 20
}: WorkflowTemplateLibraryProps) {
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'success-rate' | 'recent'>('popularity');
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [templateDetailsOpen, setTemplateDetailsOpen] = useState(false);

  // Mock template data
  const mockTemplates: WorkflowTemplate[] = [
    {
      id: 'sec-001',
      name: 'Security Threat Analysis',
      description: 'Comprehensive security analysis workflow with multi-stage threat detection and response planning',
      category: 'security-ethics',
      agents: ['SupervisorAgent', 'ShakaAgent'],
      complexity: 'Complex',
      estimatedDuration: 45,
      successRate: 0.94,
      avgExecutionTime: 42000,
      totalExecutions: 1247,
      lastUsed: '2025-07-22T10:30:00Z',
      isPopular: true,
      isFeatured: true,
      tags: ['security', 'threat-detection', 'analysis', 'enterprise'],
      author: 'Vegapunk Security Team',
      version: '2.1.0',
      requiresApproval: true,
      metadata: {
        nodeCount: 8,
        branchingFactor: 3,
        parallelCapability: true,
        resourceIntensive: true
      }
    },
    {
      id: 'data-001',
      name: 'Data Processing Pipeline',
      description: 'Automated data ingestion, validation, and transformation with quality checks',
      category: 'data-analysis',
      agents: ['SupervisorAgent', 'ShakaAgent'],
      complexity: 'Moderate',
      estimatedDuration: 25,
      successRate: 0.97,
      avgExecutionTime: 22000,
      totalExecutions: 2156,
      lastUsed: '2025-07-22T09:15:00Z',
      isPopular: true,
      isFeatured: false,
      tags: ['data-processing', 'ETL', 'validation', 'automation'],
      author: 'Data Engineering Team',
      version: '1.8.2',
      requiresApproval: false,
      metadata: {
        nodeCount: 6,
        branchingFactor: 2,
        parallelCapability: true,
        resourceIntensive: false
      }
    },
    {
      id: 'creative-001',
      name: 'Creative Problem Solving',
      description: 'Multi-perspective creative problem-solving with brainstorming and solution validation',
      category: 'creative-problem',
      agents: ['SupervisorAgent'],
      complexity: 'Simple',
      estimatedDuration: 15,
      successRate: 0.89,
      avgExecutionTime: 13000,
      totalExecutions: 892,
      lastUsed: '2025-07-21T16:45:00Z',
      isPopular: false,
      isFeatured: false,
      tags: ['creative', 'problem-solving', 'brainstorming', 'innovation'],
      author: 'Innovation Team',
      version: '1.2.1',
      requiresApproval: false,
      metadata: {
        nodeCount: 4,
        branchingFactor: 1,
        parallelCapability: false,
        resourceIntensive: false
      }
    },
    {
      id: 'maint-001',
      name: 'System Health Check',
      description: 'Comprehensive system monitoring and maintenance workflow with automated diagnostics',
      category: 'system-maintenance',
      agents: ['SupervisorAgent', 'ShakaAgent'],
      complexity: 'Moderate',
      estimatedDuration: 20,
      successRate: 0.96,
      avgExecutionTime: 18000,
      totalExecutions: 1567,
      lastUsed: '2025-07-22T08:00:00Z',
      isPopular: true,
      isFeatured: true,
      tags: ['maintenance', 'monitoring', 'diagnostics', 'automation'],
      author: 'DevOps Team',
      version: '3.0.1',
      requiresApproval: false,
      metadata: {
        nodeCount: 7,
        branchingFactor: 2,
        parallelCapability: true,
        resourceIntensive: false
      }
    }
  ];

  // Template categories configuration
  const templateCategories = [
    { 
      id: 'all', 
      name: 'All Templates', 
      icon: <TemplatesIcon />, 
      color: 'primary',
      count: mockTemplates.length 
    },
    { 
      id: 'security-ethics', 
      name: 'Security + Ethics', 
      icon: <SecurityIcon />, 
      color: 'error',
      count: mockTemplates.filter(t => t.category === 'security-ethics').length
    },
    { 
      id: 'data-analysis', 
      name: 'Data Analysis', 
      icon: <AnalyticsIcon />, 
      color: 'info',
      count: mockTemplates.filter(t => t.category === 'data-analysis').length
    },
    { 
      id: 'creative-problem', 
      name: 'Creative Problem Solving', 
      icon: <CreativeIcon />, 
      color: 'warning',
      count: mockTemplates.filter(t => t.category === 'creative-problem').length
    },
    { 
      id: 'system-maintenance', 
      name: 'System Maintenance', 
      icon: <MaintenanceIcon />, 
      color: 'success',
      count: mockTemplates.filter(t => t.category === 'system-maintenance').length
    }
  ];

  /**
   * Filter and sort templates
   */
  const filteredTemplates = mockTemplates
    .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.totalExecutions - a.totalExecutions;
        case 'success-rate':
          return b.successRate - a.successRate;
        case 'recent':
          return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime();
        default:
          return 0;
      }
    })
    .slice(0, maxTemplates);

  /**
   * Get complexity color
   */
  const getComplexityColor = (complexity: string): 'success' | 'warning' | 'error' => {
    switch (complexity) {
      case 'Simple': return 'success';
      case 'Moderate': return 'warning';
      case 'Complex': return 'error';
      default: return 'warning';
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setTemplateDetailsOpen(true);
  };

  /**
   * Execute template
   */
  const handleTemplateExecute = (template: WorkflowTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    setTemplateDetailsOpen(false);
    console.log('Executing template:', template.name);
  };

  /**
   * Duplicate template
   */
  const handleTemplateDuplicate = (template: WorkflowTemplate) => {
    console.log('Duplicating template:', template.name);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Template Categories & Controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {templateCategories.map((category) => (
            <Badge key={category.id} badgeContent={category.count} color="primary" sx={{ mr: 1 }}>
              <Chip
                icon={category.icon}
                label={category.name}
                clickable
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                color={category.color as any}
                onClick={() => setSelectedCategory(category.id)}
                sx={{ fontWeight: selectedCategory === category.id ? 'bold' : 'normal' }}
              />
            </Badge>
          ))}
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="popularity">Popularity</MenuItem>
              <MenuItem value="success-rate">Success Rate</MenuItem>
              <MenuItem value="recent">Recently Used</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={() => setDesignDialogOpen(true)}
            startIcon={<AddIcon />}
          >
            Design New
          </Button>
        </Stack>
      </Stack>

      {/* Templates Grid */}
      <Grid container spacing={3} sx={{ height: 'calc(100% - 100px)', overflow: 'auto' }}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card 
              variant="outlined"
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                bgcolor: selectedTemplate?.id === template.id ? 'action.selected' : 'background.paper'
              }}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Template Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box flexGrow={1}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                        {template.name}
                      </Typography>
                      {template.isFeatured && (
                        <FeaturedIcon color="warning" sx={{ fontSize: 16 }} />
                      )}
                      {template.isPopular && (
                        <TrendingIcon color="success" sx={{ fontSize: 16 }} />
                      )}
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.4rem'
                    }}>
                      {template.description}
                    </Typography>
                  </Box>
                </Stack>

                {/* Template Metrics */}
                <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                  {/* Agents & Complexity */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Agents:
                      </Typography>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.7rem' } }}>
                        {template.agents.map((agent, index) => (
                          <Tooltip key={index} title={agent}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {agent.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    </Box>
                    
                    <Chip
                      label={template.complexity}
                      size="small"
                      color={getComplexityColor(template.complexity)}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Stack>

                  {/* Performance Metrics */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        {(template.successRate * 100).toFixed(0)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={template.successRate * 100}
                      color="success"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>

                  {/* Duration & Executions */}
                  <Stack direction="row" spacing={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <DurationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        ~{formatDuration(template.estimatedDuration)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PerformanceIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {template.totalExecutions} runs
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Tags */}
                  <Box sx={{ mt: 'auto' }}>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.6rem', 
                            height: 18,
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      ))}
                      {template.tags.length > 3 && (
                        <Chip
                          label={`+${template.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.6rem', 
                            height: 18,
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Details Dialog */}
      <Dialog 
        open={templateDetailsOpen} 
        onClose={() => setTemplateDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {selectedTemplate?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{selectedTemplate?.version} • by {selectedTemplate?.author}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {selectedTemplate?.isFeatured && <FeaturedIcon color="warning" />}
              {selectedTemplate?.isPopular && <TrendingIcon color="success" />}
            </Stack>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedTemplate && (
            <Stack spacing={3}>
              <Typography variant="body1">
                {selectedTemplate.description}
              </Typography>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Success Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {(selectedTemplate.successRate * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Avg Execution:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(selectedTemplate.avgExecutionTime / 1000).toFixed(1)}s
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Total Runs:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedTemplate.totalExecutions.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Template Configuration
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Complexity:</Typography>
                      <Chip 
                        label={selectedTemplate.complexity}
                        size="small"
                        color={getComplexityColor(selectedTemplate.complexity)}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Nodes:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedTemplate.metadata.nodeCount}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Parallel Capable:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedTemplate.metadata.parallelCapability ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Required Agents
                </Typography>
                <Stack direction="row" spacing={1}>
                  {selectedTemplate.agents.map((agent, index) => (
                    <Chip 
                      key={index}
                      label={agent}
                      color="primary"
                      variant="outlined"
                      avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{agent.charAt(0)}</Avatar>}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {selectedTemplate.tags.map((tag, index) => (
                    <Chip 
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setTemplateDetailsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedTemplate && handleTemplateDuplicate(selectedTemplate)}
            startIcon={<DuplicateIcon />}
          >
            Duplicate
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedTemplate && handleTemplateExecute(selectedTemplate)}
            startIcon={<ExecuteIcon />}
          >
            Execute Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Designer Dialog */}
      <Dialog 
        open={designDialogOpen} 
        onClose={() => setDesignDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Visual Workflow Designer</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: 400, 
            border: '2px dashed #ccc', 
            borderRadius: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'text.secondary'
          }}>
            <AIIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Visual Workflow Designer
            </Typography>
            <Typography variant="body2" textAlign="center">
              Drag-and-drop workflow designer coming soon.<br/>
              Create custom workflows with visual node editor.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesignDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" disabled>
            Save Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}