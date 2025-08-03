/**
 * A2A Network Visualization - D3.js Network Topology with Real-time Animations
 * Professional network graph with force simulation, message flow animation, and interactive features
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'degraded';
  capabilities: string[];
  position?: { x: number; y: number };
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    responseTime: number;
    successRate: number;
  };
  // D3 simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
  messageCount: number;
  latency: number;
}

interface NetworkTopology {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface MessageFlow {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  type: 'TASK_REQUEST' | 'CAPABILITY_REQUEST' | 'HEALTH_CHECK' | 'ERROR_REPORT' | 'AGENT_ANNOUNCE';
  status: 'sent' | 'delivered' | 'processed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface A2ANetworkVisualizationProps {
  topology: NetworkTopology | null;
  messageFlow: MessageFlow[];
  height?: number;
  onNodeSelect?: (nodeId: string | null) => void;
  selectedNode?: string | null;
}

export function A2ANetworkVisualization({
  topology,
  messageFlow,
  height = 500,
  onNodeSelect,
  selectedNode
}: A2ANetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMessages, setShowMessages] = useState(true);
  const [nodeSize, setNodeSize] = useState(20);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  /**
   * Agent type colors and styling
   */
  const getAgentColor = useCallback((agentType: string, status: string): string => {
    const baseColors = {
      'VegapunkAgent': '#1976d2',
      'EthicsAgent': '#388e3c',
      'SecurityAgent': '#d32f2f',
      'CreativeAgent': '#f57c00',
      'InnovationAgent': '#7b1fa2',
      'DataAgent': '#455a64',
      'ResourceAgent': '#795548'
    };
    
    const baseColor = baseColors[agentType] || '#757575';
    
    switch (status) {
      case 'offline':
        return d3.color(baseColor)?.darker(2).toString() || '#424242';
      case 'degraded':
        return d3.color(baseColor)?.darker(0.5).toString() || baseColor;
      default:
        return baseColor;
    }
  }, []);

  /**
   * Message type colors
   */
  const getMessageColor = useCallback((messageType: string): string => {
    const colors = {
      'TASK_REQUEST': '#2196f3',
      'CAPABILITY_REQUEST': '#4caf50',
      'HEALTH_CHECK': '#ff9800',
      'ERROR_REPORT': '#f44336',
      'AGENT_ANNOUNCE': '#9c27b0'
    };
    return colors[messageType] || '#9e9e9e';
  }, []);

  /**
   * Initialize and update D3 visualization
   */
  useEffect(() => {
    if (!topology || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    
    // Clear previous visualization
    svg.selectAll("*").remove();

    // Create main group for zoom/pan
    const g = svg.append("g");

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Initialize simulation
    const simulation = d3.forceSimulation<NetworkNode, NetworkLink>(topology.nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(topology.links)
        .id(d => d.id)
        .distance(d => 100 + (1 - d.strength) * 100))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeSize + 10));

    simulationRef.current = simulation;

    // Create link elements
    const link = g.append("g")
      .selectAll("line")
      .data(topology.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => 1 + Math.sqrt(d.strength) * 3)
      .attr("stroke-dasharray", d => d.messageCount === 0 ? "5,5" : "none");

    // Create node groups
    const node = g.append("g")
      .selectAll("g")
      .data(topology.nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add node circles
    const circles = node.append("circle")
      .attr("r", nodeSize)
      .attr("fill", d => getAgentColor(d.type, d.status))
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("filter", d => d.status === 'online' ? "drop-shadow(0 0 6px rgba(0,0,0,0.3))" : "none");

    // Add status indicator rings
    node.append("circle")
      .attr("r", nodeSize + 5)
      .attr("fill", "none")
      .attr("stroke", d => {
        switch (d.status) {
          case 'online': return '#4caf50';
          case 'degraded': return '#ff9800';
          case 'offline': return '#f44336';
          default: return 'transparent';
        }
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d => d.status === 'degraded' ? "3,3" : "none");

    // Add node labels
    const labels = node.append("text")
      .text(d => d.name)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .attr("dy", nodeSize + 20);

    // Add capability badges
    node.each(function(d) {
      const nodeGroup = d3.select(this);
      d.capabilities.slice(0, 3).forEach((capability, i) => {
        nodeGroup.append("circle")
          .attr("r", 4)
          .attr("cx", -nodeSize + i * 8)
          .attr("cy", -nodeSize - 8)
          .attr("fill", getAgentColor(d.type, d.status))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
      });
    });

    // Add click handlers
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeSelect?.(d.id === selectedNode ? null : d.id);
    });

    // Highlight selected node
    circles.attr("stroke-width", d => d.id === selectedNode ? 6 : 3)
      .attr("stroke", d => d.id === selectedNode ? "#ffeb3b" : "#fff");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as NetworkNode).x || 0)
        .attr("y1", d => (d.source as NetworkNode).y || 0)
        .attr("x2", d => (d.target as NetworkNode).x || 0)
        .attr("y2", d => (d.target as NetworkNode).y || 0);

      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Animate message flow
    if (showMessages && messageFlow.length > 0) {
      animateMessageFlow(g, messageFlow, topology);
    }

    // Pause/resume simulation
    if (!isPlaying) {
      simulation.stop();
    }

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [topology, selectedNode, onNodeSelect, height, isPlaying, showMessages, nodeSize, getAgentColor, getMessageColor, messageFlow]);

  /**
   * Animate message flow between agents
   */
  const animateMessageFlow = useCallback((
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    messages: MessageFlow[],
    topology: NetworkTopology
  ) => {
    messages.forEach((message, index) => {
      setTimeout(() => {
        const sourceNode = topology.nodes.find(n => n.id === message.from);
        const targetNode = topology.nodes.find(n => n.id === message.to);
        
        if (!sourceNode || !targetNode) return;

        // Create message particle
        const messageParticle = svg.append("circle")
          .attr("r", message.priority === 'critical' ? 6 : 4)
          .attr("fill", getMessageColor(message.type))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("cx", sourceNode.x || 0)
          .attr("cy", sourceNode.y || 0)
          .style("filter", "drop-shadow(0 0 4px rgba(0,0,0,0.5))")
          .style("opacity", 0);

        // Animate particle
        messageParticle
          .transition()
          .duration(100)
          .style("opacity", 1)
          .transition()
          .duration(2000)
          .ease(d3.easeCubicInOut)
          .attr("cx", targetNode.x || 0)
          .attr("cy", targetNode.y || 0)
          .transition()
          .duration(200)
          .style("opacity", 0)
          .remove();

        // Create trail effect
        const trail = svg.append("line")
          .attr("x1", sourceNode.x || 0)
          .attr("y1", sourceNode.y || 0)
          .attr("x2", sourceNode.x || 0)
          .attr("y2", sourceNode.y || 0)
          .attr("stroke", getMessageColor(message.type))
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.3)
          .attr("stroke-dasharray", "2,2");

        trail
          .transition()
          .duration(2000)
          .ease(d3.easeCubicInOut)
          .attr("x2", targetNode.x || 0)
          .attr("y2", targetNode.y || 0)
          .transition()
          .duration(1000)
          .attr("stroke-opacity", 0)
          .remove();

      }, index * 500); // Stagger animations
    });
  }, [getMessageColor]);

  /**
   * Control handlers
   */
  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.75
      );
    }
  };

  const handleCenter = () => {
    if (svgRef.current && simulationRef.current) {
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
      );
      
      // Restart simulation to center nodes
      simulationRef.current.alpha(0.3).restart();
    }
  };

  const toggleSimulation = () => {
    if (simulationRef.current) {
      if (isPlaying) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.alpha(0.3).restart();
      }
    }
    setIsPlaying(!isPlaying);
  };

  if (!topology) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Typography variant="body1" color="text.secondary">
          No network topology data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      {/* Visualization Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          cursor: 'grab'
        }}
      />

      {/* Control Panel */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Center View">
              <IconButton size="small" onClick={handleCenter}>
                <CenterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? "Pause Simulation" : "Play Simulation"}>
              <IconButton size="small" onClick={toggleSimulation}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
          
          <FormControlLabel
            control={
              <Switch
                checked={showMessages}
                onChange={(e) => setShowMessages(e.target.checked)}
                size="small"
              />
            }
            label="Messages"
            componentsProps={{ typography: { variant: 'caption' } }}
          />
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Node Size
            </Typography>
            <Slider
              value={nodeSize}
              onChange={(_, value) => setNodeSize(value as number)}
              min={10}
              max={30}
              size="small"
              sx={{ width: 80 }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Network Stats Overlay */}
      <Paper 
        elevation={2} 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          minWidth: 200
        }}
      >
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Network Overview
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">Agents:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {topology.nodes.length}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">Online:</Typography>
            <Typography variant="caption" fontWeight="bold" color="success.main">
              {topology.nodes.filter(n => n.status === 'online').length}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">Connections:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {topology.links.length}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">Messages:</Typography>
            <Typography variant="caption" fontWeight="bold" color="secondary.main">
              {messageFlow.length}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">Zoom:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {(zoomLevel * 100).toFixed(0)}%
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Legend */}
      <Card 
        elevation={2} 
        sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 16,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Legend
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#4caf50',
                  border: '2px solid #4caf50'
                }} 
              />
              <Typography variant="caption">Online</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#ff9800',
                  border: '2px dashed #ff9800'
                }} 
              />
              <Typography variant="caption">Degraded</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#f44336',
                  border: '2px solid #f44336'
                }} 
              />
              <Typography variant="caption">Offline</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            bottom: 16, 
            right: 16,
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            maxWidth: 250
          }}
        >
          {(() => {
            const node = topology.nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            return (
              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {node.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {node.type}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {node.capabilities.map((cap, i) => (
                    <Chip
                      key={i}
                      label={cap}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '10px', height: '20px' }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption">Response Time:</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {node.metrics.responseTime}ms
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption">Success Rate:</Typography>
                  <Typography variant="caption" fontWeight="bold" color="success.main">
                    {(node.metrics.successRate * 100).toFixed(1)}%
                  </Typography>
                </Stack>
              </Stack>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
}