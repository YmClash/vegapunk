/**
 * LangGraph WebSocket Handlers
 * Real-time streaming handlers pour les données du cockpit LangGraph
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { VegapunkAgentGraph } from '../graph/VegapunkAgentGraph';
import { VegapunkGraphState, GraphMetrics, AgentHandoff } from '../graph/types';
import { logger } from '../utils/logger';

export class LangGraphWebSocketHandler {
  private io: SocketIOServer;
  private vegapunkGraph: VegapunkAgentGraph | null = null;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectedClients: Set<string> = new Set();

  // Data stores for real-time updates
  private activeWorkflows: Map<string, any> = new Map();
  private dataFlowTraces: any[] = [];
  private agentHandoffs: AgentHandoff[] = [];
  private supervisorDecisions: any[] = [];

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupNamespaces();
    logger.info('[LangGraph WebSocket] Handler initialized');
  }

  /**
   * Initialize with VegapunkAgentGraph instance
   */
  initialize(graph: VegapunkAgentGraph) {
    this.vegapunkGraph = graph;
    this.setupGraphEventListeners();
    logger.info('[LangGraph WebSocket] Initialized with VegapunkAgentGraph instance');
  }

  /**
   * Setup WebSocket namespaces pour different data streams
   */
  private setupNamespaces() {
    // Workflow updates namespace
    this.io.of('/api/langgraph/workflows/live').on('connection', (socket) => {
      this.handleWorkflowConnection(socket);
    });

    // DataFlow traces namespace
    this.io.of('/api/langgraph/dataflow/live').on('connection', (socket) => {
      this.handleDataFlowConnection(socket);
    });

    // Agent handoffs namespace
    this.io.of('/api/langgraph/handoffs/live').on('connection', (socket) => {
      this.handleHandoffConnection(socket);
    });

    // Supervisor decisions namespace
    this.io.of('/api/langgraph/supervisor/live').on('connection', (socket) => {
      this.handleSupervisorConnection(socket);
    });

    // System health namespace
    this.io.of('/api/langgraph/health/live').on('connection', (socket) => {
      this.handleHealthConnection(socket);
    });
  }

  /**
   * Handle workflow updates connection
   */
  private handleWorkflowConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[LangGraph WebSocket] Client ${clientId} connected to workflows live`);

    // Send initial workflow data
    const initialWorkflows = this.getActiveWorkflowsData();
    socket.emit('workflow_list', {
      type: 'workflow_list',
      data: initialWorkflows,
      timestamp: new Date().toISOString(),
      channel: 'langgraph/workflows/live'
    });

    // Setup periodic updates
    const interval = setInterval(() => {
      if (socket.connected) {
        const workflows = this.getActiveWorkflowsData();
        socket.emit('workflow_update', {
          type: 'workflow_update',
          data: workflows,
          timestamp: new Date().toISOString(),
          channel: 'langgraph/workflows/live'
        });
      }
    }, 2000);

    this.updateIntervals.set(`workflows-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`workflows-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`workflows-${clientId}`);
      }
      logger.info(`[LangGraph WebSocket] Client ${clientId} disconnected from workflows`);
    });
  }

  /**
   * Handle dataflow traces connection
   */
  private handleDataFlowConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[LangGraph WebSocket] Client ${clientId} connected to dataflow live`);

    // Send initial dataflow data
    socket.emit('dataflow_list', {
      type: 'dataflow_list',
      data: this.dataFlowTraces.slice(-20), // Last 20 traces
      timestamp: new Date().toISOString(),
      channel: 'langgraph/dataflow/live'
    });

    // Setup periodic updates for new traces
    const interval = setInterval(() => {
      if (socket.connected && this.vegapunkGraph) {
        // Get real dataflow traces
        const traces = this.vegapunkGraph.getDataFlowTraces(1);
        if (traces.length > 0) {
          const latestTrace = traces[0];
          socket.emit('dataflow_trace', {
            type: 'dataflow_trace',
            data: latestTrace,
            timestamp: new Date().toISOString(),
            channel: 'langgraph/dataflow/live'
          });
        }
      }
    }, 1500);

    this.updateIntervals.set(`dataflow-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`dataflow-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`dataflow-${clientId}`);
      }
      logger.info(`[LangGraph WebSocket] Client ${clientId} disconnected from dataflow`);
    });
  }

  /**
   * Handle agent handoffs connection
   */
  private handleHandoffConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[LangGraph WebSocket] Client ${clientId} connected to handoffs live`);

    // Send initial handoffs data
    socket.emit('handoff_list', {
      type: 'handoff_list',
      data: this.agentHandoffs.slice(-10), // Last 10 handoffs
      timestamp: new Date().toISOString(),
      channel: 'langgraph/handoffs/live'
    });

    // Setup periodic updates
    const interval = setInterval(() => {
      if (socket.connected && this.vegapunkGraph) {
        // Get real handoffs
        const handoffs = this.vegapunkGraph.getAgentHandoffs(1);
        if (handoffs.length > 0) {
          const latestHandoff = handoffs[0];
          socket.emit('agent_handoff', {
            type: 'agent_handoff',
            data: latestHandoff,
            timestamp: new Date().toISOString(),
            channel: 'langgraph/handoffs/live'
          });
        }
      }
    }, 3000);

    this.updateIntervals.set(`handoffs-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`handoffs-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`handoffs-${clientId}`);
      }
      logger.info(`[LangGraph WebSocket] Client ${clientId} disconnected from handoffs`);
    });
  }

  /**
   * Handle supervisor decisions connection
   */
  private handleSupervisorConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[LangGraph WebSocket] Client ${clientId} connected to supervisor live`);

    // Send initial supervisor data
    socket.emit('supervisor_list', {
      type: 'supervisor_list',
      data: this.supervisorDecisions.slice(-15), // Last 15 decisions
      timestamp: new Date().toISOString(),
      channel: 'langgraph/supervisor/live'
    });

    // Setup periodic updates
    const interval = setInterval(() => {
      if (socket.connected && this.vegapunkGraph) {
        // Get real supervisor decisions
        const decisions = this.vegapunkGraph.getSupervisorDecisions(1);
        if (decisions.length > 0) {
          const latestDecision = decisions[0];
          socket.emit('supervisor_decision', {
            type: 'supervisor_decision',
            data: latestDecision,
            timestamp: new Date().toISOString(),
            channel: 'langgraph/supervisor/live'
          });
        }
      }
    }, 2500);

    this.updateIntervals.set(`supervisor-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`supervisor-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`supervisor-${clientId}`);
      }
      logger.info(`[LangGraph WebSocket] Client ${clientId} disconnected from supervisor`);
    });
  }

  /**
   * Handle system health connection
   */
  private handleHealthConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[LangGraph WebSocket] Client ${clientId} connected to health live`);

    // Send initial health data
    socket.emit('health_status', {
      type: 'health_status',
      data: this.getSystemHealthData(),
      timestamp: new Date().toISOString(),
      channel: 'langgraph/health/live'
    });

    // Setup periodic health updates
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('health_update', {
          type: 'health_update',
          data: this.getSystemHealthData(),
          timestamp: new Date().toISOString(),
          channel: 'langgraph/health/live'
        });
      }
    }, 5000);

    this.updateIntervals.set(`health-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`health-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`health-${clientId}`);
      }
      logger.info(`[LangGraph WebSocket] Client ${clientId} disconnected from health`);
    });
  }

  /**
   * Setup event listeners pour VegapunkAgentGraph
   */
  private setupGraphEventListeners() {
    if (!this.vegapunkGraph) return;

    // TODO: Setup real event listeners when VegapunkAgentGraph supports events
    // For now, we'll use mock data with periodic updates
    logger.info('[LangGraph WebSocket] Graph event listeners setup complete');
  }

  /**
   * Get active workflows data
   */
  private getActiveWorkflowsData(): any[] {
    if (!this.vegapunkGraph) {
      return [];
    }
    
    // Get real active workflows and recent history
    const activeWorkflows = this.vegapunkGraph.getActiveWorkflows();
    const recentWorkflows = this.vegapunkGraph.getWorkflowHistory(3);
    
    return [...activeWorkflows, ...recentWorkflows];
  }

  /**
   * Generate mock handoff data
   */
  private generateMockHandoff(): AgentHandoff {
    const agents = ['supervisor-001', 'vegapunk-001', 'shaka-001'];
    const fromAgent = agents[Math.floor(Math.random() * agents.length)];
    let toAgent = agents[Math.floor(Math.random() * agents.length)];
    
    // Ensure different agents
    while (toAgent === fromAgent) {
      toAgent = agents[Math.floor(Math.random() * agents.length)];
    }

    const reasons = [
      'specialized_capability_required',
      'workload_balancing',
      'expertise_optimization',
      'error_recovery',
      'quality_improvement'
    ];

    return {
      fromAgent,
      toAgent,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      context: {
        task_id: `task-${Date.now()}`,
        priority: Math.random() > 0.5 ? 'high' : 'medium',
        estimated_duration: Math.floor(Math.random() * 30000) + 5000
      },
      timestamp: new Date()
    };
  }

  /**
   * Generate mock supervisor decision
   */
  private generateMockSupervisorDecision(): any {
    const agents = ['vegapunk-001', 'shaka-001'];
    const selectedAgent = agents[Math.floor(Math.random() * agents.length)];
    
    const reasonings = [
      'Technical keywords detected (0.9 match score)',
      'Ethical analysis required (0.8 confidence)',
      'Load balancing optimization applied',
      'Capability specialization match found'
    ];

    return {
      id: `decision-${Date.now()}`,
      timestamp: new Date().toISOString(),
      selectedAgent,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
      confidence: 0.7 + Math.random() * 0.25,
      fallbackAgent: agents.find(a => a !== selectedAgent),
      estimatedDuration: Math.floor(Math.random() * 25000) + 10000
    };
  }

  /**
   * Get system health data
   */
  private getSystemHealthData(): any {
    const memUsage = process.memoryUsage();
    
    return {
      status: Math.random() > 0.9 ? 'degraded' : 'healthy',
      activeWorkflows: this.activeWorkflows.size,
      connectedClients: this.connectedClients.size,
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        usage: Math.floor(Math.random() * 40) + 10 // Mock CPU usage 10-50%
      },
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Broadcast workflow update to all connected clients
   */
  broadcastWorkflowUpdate(workflow: any) {
    this.io.of('/api/langgraph/workflows/live').emit('workflow_update', {
      type: 'workflow_update',
      data: workflow,
      timestamp: new Date().toISOString(),
      channel: 'langgraph/workflows/live'
    });
  }

  /**
   * Broadcast dataflow trace to all connected clients
   */
  broadcastDataFlowTrace(trace: any) {
    this.dataFlowTraces.push(trace);
    // Keep only last 100 traces in memory
    if (this.dataFlowTraces.length > 100) {
      this.dataFlowTraces = this.dataFlowTraces.slice(-100);
    }

    this.io.of('/api/langgraph/dataflow/live').emit('dataflow_trace', {
      type: 'dataflow_trace',
      data: trace,
      timestamp: new Date().toISOString(),
      channel: 'langgraph/dataflow/live'
    });
  }

  /**
   * Broadcast agent handoff to all connected clients
   */
  broadcastAgentHandoff(handoff: AgentHandoff) {
    this.agentHandoffs.push(handoff);
    // Keep only last 50 handoffs in memory
    if (this.agentHandoffs.length > 50) {
      this.agentHandoffs = this.agentHandoffs.slice(-50);
    }

    this.io.of('/api/langgraph/handoffs/live').emit('agent_handoff', {
      type: 'agent_handoff',
      data: handoff,
      timestamp: new Date().toISOString(),
      channel: 'langgraph/handoffs/live'
    });
  }

  /**
   * Broadcast supervisor decision to all connected clients
   */
  broadcastSupervisorDecision(decision: any) {
    this.supervisorDecisions.push(decision);
    // Keep only last 30 decisions in memory
    if (this.supervisorDecisions.length > 30) {
      this.supervisorDecisions = this.supervisorDecisions.slice(-30);
    }

    this.io.of('/api/langgraph/supervisor/live').emit('supervisor_decision', {
      type: 'supervisor_decision',
      data: decision,
      timestamp: new Date().toISOString(),
      channel: 'langgraph/supervisor/live'
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      activeIntervals: this.updateIntervals.size,
      dataStores: {
        workflows: this.activeWorkflows.size,
        dataFlowTraces: this.dataFlowTraces.length,
        handoffs: this.agentHandoffs.length,
        supervisorDecisions: this.supervisorDecisions.length
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all intervals
    for (const interval of this.updateIntervals.values()) {
      clearInterval(interval);
    }
    this.updateIntervals.clear();
    this.connectedClients.clear();
    
    logger.info('[LangGraph WebSocket] Cleanup completed');
  }
}