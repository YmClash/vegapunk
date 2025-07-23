/**
 * LangGraph Workflow Visualization - Advanced D3.js Hierarchical Workflow Graph
 * Professional workflow graph visualization with real-time execution, interactive controls, and step-by-step replay
 */

import React, { useEffect, useRef, useState } from 'react';
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
  Chip,
  Slider,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as StepIcon,
  Replay as ReplayIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon
} from '@mui/icons-material';
import * as d3 from 'd3';

// TypeScript interfaces
interface WorkflowExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentNode?: string;
  executionTrace: ExecutionStep[];
  supervisor: SupervisorAgent;
  agents: string[];
  metadata: Record<string, any>;
}

interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: Record<string, any>;
  agent?: string;
}

interface SupervisorAgent {
  id: string;
  name: string;
  decisionsCount: number;
  successRate: number;
  averageDecisionTime: number;
  currentStrategy: string;
}

interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: Record<string, any>;
}

interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'agent' | 'supervisor' | 'condition' | 'end';
  agent?: string;
  position: { x: number; y: number };
  metadata: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  metadata: Record<string, any>;
}

interface LangGraphWorkflowVisualizationProps {
  workflows: WorkflowExecution[];
  topology: WorkflowGraph | null;
  height?: number;
  selectedWorkflow?: string;
  onWorkflowSelect?: (workflowId: string) => void;
}

export function LangGraphWorkflowVisualization({
  workflows,
  topology,
  height = 500,
  selectedWorkflow,
  onWorkflowSelect
}: LangGraphWorkflowVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowExecution | null>(null);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [zoomLevel, setZoomLevel] = useState(1);

  // D3 visualization refs
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const svgGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  /**
   * Update current workflow when selection changes
   */
  useEffect(() => {
    if (selectedWorkflow && workflows.length > 0) {
      const workflow = workflows.find(w => w.id === selectedWorkflow);
      setCurrentWorkflow(workflow || workflows[0]);
    } else if (workflows.length > 0) {
      setCurrentWorkflow(workflows[0]);
    } else {
      setCurrentWorkflow(null);
    }
    setExecutionStep(0);
  }, [selectedWorkflow, workflows]);

  /**
   * Initialize D3.js workflow graph visualization
   */
  useEffect(() => {
    if (!topology || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const svgHeight = height - 80;

    // Create main group for zoom/pan
    const g = svg.append("g");
    svgGroupRef.current = g;

    // Create hierarchical layout
    const hierarchyData = createHierarchyFromTopology(topology);
    const tree = d3.tree<WorkflowNode>()
      .size([width - 120, svgHeight - 120])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

    const root = tree(hierarchyData);

    // Create links (edges)
    const links = root.links();
    
    const linkPathGenerator = d3.linkHorizontal<any, any>()
      .x(d => d.y + 60)
      .y(d => d.x + 60);

    // Draw links
    g.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkPathGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d: any) => {
        const edge = topology.edges.find(e => 
          e.source === d.source.data.id && e.target === d.target.data.id
        );
        return edge?.condition ? '5,5' : 'none';
      });

    // Create nodes
    const nodeGroups = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y + 60}, ${d.x + 60})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => handleNodeClick(d.data));

    // Node circles
    nodeGroups.append('circle')
      .attr('r', (d: any) => getNodeRadius(d.data.type))
      .attr('fill', (d: any) => getNodeColor(d.data, currentWorkflow, executionStep))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);

    // Node icons/symbols
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text((d: any) => getNodeSymbol(d.data.type));

    // Node labels
    nodeGroups.append('text')
      .attr('x', 0)
      .attr('y', (d: any) => getNodeRadius(d.data.type) + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text((d: any) => d.data.name);

    // Agent labels for agent nodes
    nodeGroups
      .filter((d: any) => d.data.agent)
      .append('text')
      .attr('x', 0)
      .attr('y', (d: any) => getNodeRadius(d.data.type) + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '10px')
      .text((d: any) => d.data.agent);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Clean up simulation
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };

  }, [topology, height]);

  /**
   * Animation effect for workflow execution
   */
  useEffect(() => {
    if (!currentWorkflow || !isPlaying || !svgGroupRef.current) return;

    const interval = setInterval(() => {
      if (executionStep < currentWorkflow.executionTrace.length - 1) {
        setExecutionStep(prev => prev + 1);
        updateVisualizationForStep(executionStep + 1);
      } else {
        setIsPlaying(false);
      }
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, executionStep, currentWorkflow, playbackSpeed]);

  /**
   * Create hierarchy from topology data
   */
  const createHierarchyFromTopology = (topology: WorkflowGraph): d3.HierarchyNode<WorkflowNode> => {
    // Find root node (start type)
    const rootNode = topology.nodes.find(n => n.type === 'start') || topology.nodes[0];
    
    // Build hierarchy structure
    const buildChildren = (nodeId: string): WorkflowNode[] => {
      const outgoingEdges = topology.edges.filter(e => e.source === nodeId);
      return outgoingEdges.map(edge => {
        const childNode = topology.nodes.find(n => n.id === edge.target)!;
        return {
          ...childNode,
          children: buildChildren(childNode.id) as any
        };
      });
    };

    const hierarchyRoot = {
      ...rootNode,
      children: buildChildren(rootNode.id) as any
    };

    return d3.hierarchy(hierarchyRoot);
  };

  /**
   * Handle node click
   */
  const handleNodeClick = (node: WorkflowNode) => {
    console.log('Node clicked:', node);
    // Could show node details, jump to execution step, etc.
  };

  /**
   * Get node color based on execution status
   */
  const getNodeColor = (node: WorkflowNode, workflow: WorkflowExecution | null, step: number): string => {
    if (!workflow) return '#9e9e9e';

    const nodeExecution = workflow.executionTrace.slice(0, step + 1).find(trace => trace.nodeId === node.id);
    
    if (!nodeExecution) return '#9e9e9e'; // Gray for pending
    
    const colors = {
      'pending': '#9e9e9e',    // Gray
      'running': '#2196f3',    // Blue
      'completed': '#4caf50',  // Green
      'failed': '#f44336'      // Red
    };

    return colors[nodeExecution.status] || '#9e9e9e';
  };

  /**
   * Get node radius based on type
   */
  const getNodeRadius = (type: string): number => {
    const sizes = {
      'start': 20,
      'supervisor': 30,
      'agent': 25,
      'condition': 18,
      'end': 20
    };
    return sizes[type as keyof typeof sizes] || 20;
  };

  /**
   * Get node symbol based on type
   */
  const getNodeSymbol = (type: string): string => {
    const symbols = {
      'start': '▶',
      'supervisor': '🧠',
      'agent': '🤖',
      'condition': '?',
      'end': '⏹'
    };
    return symbols[type as keyof typeof symbols] || '●';
  };

  /**
   * Update visualization for specific execution step
   */
  const updateVisualizationForStep = (step: number) => {
    if (!svgGroupRef.current || !currentWorkflow) return;

    // Update node colors
    svgGroupRef.current.selectAll('.node circle')
      .transition()
      .duration(300)
      .attr('fill', (d: any) => getNodeColor(d.data, currentWorkflow, step));

    // Add execution pulse effect
    const currentTrace = currentWorkflow.executionTrace[step];
    if (currentTrace) {
      const nodeElement = svgGroupRef.current.selectAll('.node')
        .filter((d: any) => d.data.id === currentTrace.nodeId);

      // Add pulse ring
      nodeElement.append('circle')
        .attr('r', getNodeRadius('agent'))
        .attr('fill', 'none')
        .attr('stroke', '#2196f3')
        .attr('stroke-width', 3)
        .attr('opacity', 0.8)
        .transition()
        .duration(1000)
        .attr('r', getNodeRadius('agent') + 20)
        .attr('opacity', 0)
        .remove();
    }
  };

  /**
   * Control handlers
   */
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setExecutionStep(0);
  };

  const handleStepForward = () => {
    if (currentWorkflow && executionStep < currentWorkflow.executionTrace.length - 1) {
      const newStep = executionStep + 1;
      setExecutionStep(newStep);
      updateVisualizationForStep(newStep);
    }
  };

  const handleReplay = () => {
    setExecutionStep(0);
    setIsPlaying(true);
  };

  const handleZoom = (direction: 'in' | 'out' | 'center') => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    switch (direction) {
      case 'in':
        svg.transition().call(zoom.scaleBy as any, 1.5);
        break;
      case 'out':
        svg.transition().call(zoom.scaleBy as any, 0.67);
        break;
      case 'center':
        svg.transition().call(zoom.transform as any, d3.zoomIdentity);
        break;
    }
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {/* Workflow Controls */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* Workflow Selection */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Active Workflow</InputLabel>
          <Select
            value={currentWorkflow?.id || ''}
            label="Active Workflow"
            onChange={(e) => {
              const workflow = workflows.find(w => w.id === e.target.value);
              if (workflow && onWorkflowSelect) {
                onWorkflowSelect(workflow.id);
              }
            }}
          >
            {workflows.map((workflow) => (
              <MenuItem key={workflow.id} value={workflow.id}>
                {workflow.name} - {workflow.status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Playback Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Tooltip title={isPlaying ? "Pause" : "Play"}>
            <IconButton size="small" onClick={handlePlayPause} disabled={!currentWorkflow}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Stop">
            <IconButton size="small" onClick={handleStop} disabled={!currentWorkflow}>
              <StopIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Step Forward">
            <IconButton size="small" onClick={handleStepForward} disabled={!currentWorkflow}>
              <StepIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Replay">
            <IconButton size="small" onClick={handleReplay} disabled={!currentWorkflow}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Speed Control */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
          <Typography variant="caption">Speed:</Typography>
          <Slider
            size="small"
            value={playbackSpeed}
            onChange={(_, value) => setPlaybackSpeed(value as number)}
            min={200}
            max={3000}
            step={200}
            sx={{ width: 80 }}
            valueLabelDisplay="off"
          />
          <Typography variant="caption">{(playbackSpeed/1000).toFixed(1)}s</Typography>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={() => handleZoom('in')}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={() => handleZoom('out')}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={() => handleZoom('center')}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="caption">
            {Math.round(zoomLevel * 100)}%
          </Typography>
        </Box>
      </Stack>

      {/* Workflow Graph Visualization */}
      <Box 
        sx={{ 
          position: 'relative',
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          height: height - 80,
          overflow: 'hidden',
          bgcolor: '#fafafa'
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        />

        {/* Execution Info Overlay */}
        {currentWorkflow && (
          <Card
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              minWidth: 200,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {currentWorkflow.name}
              </Typography>
              
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">Status:</Typography>
                  <Chip 
                    label={currentWorkflow.status}
                    size="small"
                    color={currentWorkflow.status === 'running' ? 'info' : 
                           currentWorkflow.status === 'completed' ? 'success' : 'default'}
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">Step:</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {executionStep + 1} / {currentWorkflow.executionTrace.length}
                  </Typography>
                </Box>
                
                {currentWorkflow.executionTrace[executionStep] && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">Current Node:</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {currentWorkflow.executionTrace[executionStep].nodeName}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {!currentWorkflow && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="h6" gutterBottom>
              No Active Workflows
            </Typography>
            <Typography variant="body2">
              Start a workflow to see the execution graph
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Export types for use in other components
export type { WorkflowExecution, WorkflowGraph, WorkflowNode, WorkflowEdge };