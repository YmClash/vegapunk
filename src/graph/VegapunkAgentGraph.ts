/**
 * Vegapunk Agent Graph - Main LangGraph Workflow Orchestrator
 * Integrates A2A Protocol, LangGraph, and MCP for multi-agent coordination
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { VegapunkGraphState, GraphConfig, GraphMetrics, AgentHandoff } from './types';
import { A2AProtocol } from '../a2a/A2AProtocol';
import { SupervisorAgent } from './SupervisorAgent';
import { VegapunkNode } from './nodes/VegapunkNode';
import { ShakaNode } from './nodes/ShakaNode';
import { ChatHandler } from '../chat/ChatHandler';
import { v4 as uuidv4 } from 'uuid';

export class VegapunkAgentGraph {
  private graph: StateGraph<VegapunkGraphState>;
  private a2aProtocol: A2AProtocol;
  private supervisor: SupervisorAgent;
  private vegapunkNode: VegapunkNode;
  private shakaNode: ShakaNode;
  private config: GraphConfig;
  private metrics: Map<string, GraphMetrics> = new Map();
  private isInitialized = false;
  
  // Data collectors for LangGraph Cockpit
  private dataFlowTraces: any[] = [];
  private agentHandoffs: AgentHandoff[] = [];
  private supervisorDecisions: any[] = [];
  private activeWorkflows: Map<string, any> = new Map();
  private workflowHistory: any[] = [];
  private readonly MAX_TRACES = 1000;
  private readonly MAX_HANDOFFS = 500;
  private readonly MAX_DECISIONS = 300;

  constructor(
    a2aProtocol: A2AProtocol,
    chatHandler: ChatHandler,
    config?: Partial<GraphConfig>
  ) {
    this.a2aProtocol = a2aProtocol;
    
    // Initialize config
    this.config = {
      maxIterations: 10,
      enableA2AIntegration: true,
      enableMCPTools: true,
      debugMode: false,
      timeout: 120000, // 2 minutes
      ...config
    };

    // Initialize agents
    this.supervisor = new SupervisorAgent(a2aProtocol);
    this.vegapunkNode = new VegapunkNode(chatHandler);
    this.shakaNode = new ShakaNode();

    // Initialize the graph
    this.graph = this.createGraph();
  }

  /**
   * Initialize the graph system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register agents with A2A protocol if enabled
      if (this.config.enableA2AIntegration) {
        await this.registerAgentsWithA2A();
      }

      this.isInitialized = true;
      console.log('[VegapunkAgentGraph] Graph system initialized successfully');
      
    } catch (error) {
      console.error('[VegapunkAgentGraph] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process a user message through the agent graph
   */
  async processMessage(
    message: string,
    sessionId: string,
    userId?: string
  ): Promise<{ response: string; metadata: any }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const workflowId = `workflow-${Date.now()}-${uuidv4().slice(0, 8)}`;

    try {
      // Create initial state
      const initialState: VegapunkGraphState = {
        messages: [new HumanMessage({ content: message })],
        currentAgent: 'supervisor',
        availableAgents: await this.getAvailableAgents(),
        a2aMessages: [],
        agentCapabilities: new Map(),
        taskResults: new Map(),
        userId,
        sessionId,
        needsHumanInput: false,
        workflowStatus: 'running',
        metadata: {
          timestamp: new Date(),
          totalSteps: 0,
          currentStep: 0
        }
      };

      // Add workflow to active tracking
      this.addActiveWorkflow(workflowId, {
        id: workflowId,
        name: this.inferWorkflowName(message),
        status: 'running',
        startTime: new Date(startTime).toISOString(),
        sessionId,
        userId,
        message,
        currentNode: 'supervisor'
      });

      // Execute the graph
      const result = await this.executeGraph(initialState, workflowId);
      
      // Extract final response
      const finalResponse = this.extractFinalResponse(result);
      
      // Record metrics
      const metrics = this.recordMetrics(workflowId, initialState, result, startTime);
      
      // Complete workflow tracking
      this.completeWorkflow(workflowId, {
        status: 'completed',
        endTime: new Date().toISOString(),
        totalSteps: result.metadata.totalSteps,
        executionTime: Date.now() - startTime,
        agentPath: this.extractAgentPath(result)
      });
      
      return {
        response: finalResponse,
        metadata: {
          workflowId,
          sessionId,
          totalSteps: result.metadata.totalSteps,
          processingTime: Date.now() - startTime,
          agentPath: this.extractAgentPath(result),
          metrics: metrics
        }
      };

    } catch (error) {
      console.error(`[VegapunkAgentGraph] Processing failed:`, error);
      
      // Mark workflow as failed
      this.completeWorkflow(workflowId, {
        status: 'error',
        endTime: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        response: `🚨 **Processing Error**\n\nI encountered an issue while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`,
        metadata: {
          workflowId,
          sessionId,
          error: true,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Create the LangGraph workflow
   */
  private createGraph(): StateGraph<VegapunkGraphState> {
    const workflow = new StateGraph<VegapunkGraphState>({
      channels: {
        messages: {
          reducer: (existing: BaseMessage[], new_messages: BaseMessage[]) => 
            [...existing, ...new_messages],
          default: () => []
        },
        currentAgent: {
          reducer: (existing: string, new_agent: string) => new_agent || existing,
          default: () => 'supervisor'
        },
        availableAgents: {
          reducer: (existing: string[], new_agents: string[]) => new_agents || existing,
          default: () => []
        },
        a2aMessages: {
          reducer: (existing: any[], new_messages: any[]) => [...existing, ...new_messages],
          default: () => []
        },
        agentCapabilities: {
          reducer: (existing: Map<string, any>, new_caps: Map<string, any>) => 
            new_caps || existing,
          default: () => new Map()
        },
        taskResults: {
          reducer: (existing: Map<string, any>, new_results: Map<string, any>) => 
            new_results || existing,
          default: () => new Map()
        },
        userId: {
          reducer: (existing: string | undefined, new_id: string | undefined) => 
            new_id || existing,
          default: () => undefined
        },
        sessionId: {
          reducer: (existing: string, new_id: string) => new_id || existing,
          default: () => ''
        },
        needsHumanInput: {
          reducer: (existing: boolean, new_val: boolean) => new_val !== undefined ? new_val : existing,
          default: () => false
        },
        workflowStatus: {
          reducer: (existing: string, new_status: string) => new_status || existing,
          default: () => 'running'
        },
        nextAgent: {
          reducer: (existing: string | undefined, new_agent: string | undefined) => 
            new_agent || existing,
          default: () => undefined
        },
        metadata: {
          reducer: (existing: any, new_metadata: any) => ({ ...existing, ...new_metadata }),
          default: () => ({
            timestamp: new Date(),
            totalSteps: 0,
            currentStep: 0
          })
        }
      }
    });

    // Add nodes
    workflow.addNode('supervisor', this.supervisor.execute);
    workflow.addNode('vegapunk_node', this.vegapunkNode.execute);
    workflow.addNode('shaka_node', this.shakaNode.execute);

    // Add edges
    workflow.setEntryPoint('supervisor');
    
    // Supervisor routing
    workflow.addConditionalEdges(
      'supervisor',
      this.supervisor.routeAgent.bind(this.supervisor),
      {
        'vegapunk_node': 'vegapunk_node',
        'shaka_node': 'shaka_node',
        'atlas_node': 'vegapunk_node', // Fallback to vegapunk for now
        'edison_node': 'vegapunk_node' // Fallback to vegapunk for now
      }
    );

    // Agent completion or handoff routing
    workflow.addConditionalEdges(
      'vegapunk_node',
      this.routeFromAgent.bind(this),
      {
        'shaka_node': 'shaka_node',
        'end': END
      }
    );

    workflow.addConditionalEdges(
      'shaka_node',
      this.routeFromAgent.bind(this),
      {
        'vegapunk_node': 'vegapunk_node',
        'end': END
      }
    );

    return workflow.compile({
      debug: this.config.debugMode
    });
  }

  /**
   * Route from agent node based on state
   */
  private routeFromAgent(state: VegapunkGraphState): string {
    // Check if there's a handoff to another agent
    if (state.nextAgent && state.nextAgent !== state.currentAgent) {
      const targetNode = this.mapAgentToNode(state.nextAgent);
      if (targetNode !== 'unknown') {
        return targetNode;
      }
    }

    // Check workflow status
    if (state.workflowStatus === 'completed' || state.workflowStatus === 'error') {
      return 'end';
    }

    // Default to end
    return 'end';
  }

  /**
   * Map agent ID to node name
   */
  private mapAgentToNode(agentId: string): string {
    const mapping: Record<string, string> = {
      'vegapunk-001': 'vegapunk_node',
      'shaka-001': 'shaka_node',
      'atlas-001': 'vegapunk_node', // Fallback for now
      'edison-001': 'vegapunk_node' // Fallback for now
    };
    return mapping[agentId] || 'unknown';
  }

  /**
   * Execute the graph with timeout and error handling
   */
  private async executeGraph(
    initialState: VegapunkGraphState,
    workflowId: string
  ): Promise<VegapunkGraphState> {
    const maxIterations = this.config.maxIterations;
    let iterations = 0;
    
    try {
      const result = await Promise.race([
        // Graph execution
        (async () => {
          const stream = await this.graph.stream(initialState);
          let finalState = initialState;
          
          for await (const output of stream) {
            if (iterations++ > maxIterations) {
              throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
            }
            
            // Update final state with latest output
            if (output && typeof output === 'object') {
              const nodeId = Object.keys(output)[0];
              const nodeOutput = Object.values(output)[0] as Partial<VegapunkGraphState>;
              
              // Record dataflow trace for this node execution
              const nodeStartTime = Date.now();
              this.recordDataFlowTrace(
                workflowId,
                nodeId,
                `node_execution`,
                nodeOutput,
                Math.floor(Math.random() * 2000) + 500 // Mock execution time
              );
              
              // Check for agent handoffs
              if (nodeOutput.nextAgent && nodeOutput.nextAgent !== finalState.currentAgent) {
                this.recordAgentHandoff({
                  fromAgent: finalState.currentAgent,
                  toAgent: nodeOutput.nextAgent,
                  reason: this.inferHandoffReason(finalState.currentAgent, nodeOutput.nextAgent),
                  context: {
                    workflowId,
                    currentStep: iterations,
                    message: finalState.messages[finalState.messages.length - 1]?.content || ''
                  },
                  timestamp: new Date()
                });
              }
              
              // Record supervisor decisions
              if (nodeId === 'supervisor' && nodeOutput.nextAgent) {
                this.recordSupervisorDecision({
                  selectedAgent: nodeOutput.nextAgent,
                  reasoning: this.inferSupervisorReasoning(nodeOutput.nextAgent, finalState),
                  confidence: 0.85 + Math.random() * 0.15, // Mock confidence 0.85-1.0
                  fallbackAgent: this.getFallbackAgent(nodeOutput.nextAgent),
                  estimatedDuration: Math.floor(Math.random() * 30000) + 10000
                });
              }
              
              finalState = { ...finalState, ...nodeOutput };
              
              // Update workflow current node
              const workflow = this.activeWorkflows.get(workflowId);
              if (workflow) {
                workflow.currentNode = nodeOutput.nextAgent || nodeId;
                workflow.currentStep = iterations;
              }
            }
          }
          
          return finalState;
        })(),
        
        // Timeout
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Graph execution timeout')), this.config.timeout)
        )
      ]);

      return result as VegapunkGraphState;
      
    } catch (error) {
      console.error(`[VegapunkAgentGraph] Graph execution failed:`, error);
      throw error;
    }
  }

  /**
   * Extract final response from graph result
   */
  private extractFinalResponse(result: VegapunkGraphState): string {
    const aiMessages = result.messages.filter(m => m.constructor.name === 'AIMessage');
    const lastMessage = aiMessages[aiMessages.length - 1] as AIMessage;
    
    if (lastMessage && lastMessage.content) {
      return lastMessage.content as string;
    }
    
    return 'Processing completed but no response generated.';
  }

  /**
   * Extract agent execution path
   */
  private extractAgentPath(result: VegapunkGraphState): string[] {
    const path: string[] = ['supervisor']; // Always starts with supervisor
    
    // Extract agents from message metadata
    const aiMessages = result.messages.filter(m => m.constructor.name === 'AIMessage');
    for (const message of aiMessages) {
      const agent = (message as any).additional_kwargs?.agent;
      if (agent && !path.includes(agent)) {
        path.push(agent);
      }
    }
    
    return path;
  }

  /**
   * Record workflow metrics
   */
  private recordMetrics(
    workflowId: string,
    initialState: VegapunkGraphState,
    finalState: VegapunkGraphState,
    startTime: number
  ): GraphMetrics {
    const metrics: GraphMetrics = {
      workflowId,
      startTime: new Date(startTime),
      endTime: new Date(),
      totalSteps: finalState.metadata.totalSteps,
      completedSteps: finalState.metadata.currentStep,
      errors: [],
      handoffs: this.extractHandoffs(finalState),
      performance: {
        averageStepTime: (Date.now() - startTime) / Math.max(finalState.metadata.currentStep, 1),
        totalProcessingTime: Date.now() - startTime,
        agentUtilization: this.calculateAgentUtilization(finalState)
      }
    };

    this.metrics.set(workflowId, metrics);
    return metrics;
  }

  /**
   * Extract handoffs from final state
   */
  private extractHandoffs(state: VegapunkGraphState): AgentHandoff[] {
    const handoffs: AgentHandoff[] = [];
    
    // Extract handoffs from A2A messages
    for (const a2aMessage of state.a2aMessages) {
      if (a2aMessage.type === 'task_delegate') {
        handoffs.push({
          fromAgent: a2aMessage.from,
          toAgent: a2aMessage.to,
          reason: a2aMessage.payload?.reason || 'Task delegation',
          context: a2aMessage.payload?.context,
          timestamp: a2aMessage.timestamp
        });
      }
    }
    
    return handoffs;
  }

  /**
   * Calculate agent utilization
   */
  private calculateAgentUtilization(state: VegapunkGraphState): Map<string, number> {
    const utilization = new Map<string, number>();
    
    // Count messages per agent
    const agentMessageCounts = new Map<string, number>();
    const aiMessages = state.messages.filter(m => m.constructor.name === 'AIMessage');
    
    for (const message of aiMessages) {
      const agent = (message as any).additional_kwargs?.agent;
      if (agent) {
        agentMessageCounts.set(agent, (agentMessageCounts.get(agent) || 0) + 1);
      }
    }
    
    // Calculate utilization percentages
    const totalMessages = aiMessages.length;
    for (const [agent, count] of agentMessageCounts) {
      utilization.set(agent, totalMessages > 0 ? (count / totalMessages) * 100 : 0);
    }
    
    return utilization;
  }

  /**
   * Register agents with A2A protocol
   */
  private async registerAgentsWithA2A(): Promise<void> {
    const agents = [
      {
        agentId: 'vegapunk-001',
        agentType: 'TechnicalSupport',
        capabilities: this.vegapunkNode.getCapabilities()
      },
      {
        agentId: 'shaka-001',
        agentType: 'EthicalAnalysis',
        capabilities: this.shakaNode.getCapabilities()
      }
    ];

    for (const agentInfo of agents) {
      const profile = {
        agentId: agentInfo.agentId,
        agentType: agentInfo.agentType,
        status: 'online' as const,
        capabilities: agentInfo.capabilities.map(cap => ({
          id: cap,
          name: cap,
          description: `${cap} capability`,
          category: 'analysis' as const,
          inputs: [],
          outputs: [],
          cost: 30,
          reliability: 0.9,
          version: '1.0.0'
        })),
        metadata: {
          version: '1.0.0',
          location: `graph://${agentInfo.agentId}`,
          load: 0,
          uptime: Date.now(),
          capabilities_count: agentInfo.capabilities.length
        },
        lastSeen: new Date()
      };

      await this.a2aProtocol.registerAgent(profile);
    }
  }

  /**
   * Get available agents
   */
  private async getAvailableAgents(): Promise<string[]> {
    if (!this.config.enableA2AIntegration) {
      return ['vegapunk-001', 'shaka-001'];
    }

    try {
      const agents = await this.a2aProtocol.discoverAgents();
      return agents.map(agent => agent.agentId);
    } catch (error) {
      console.warn('[VegapunkAgentGraph] Failed to discover agents, using defaults');
      return ['vegapunk-001', 'shaka-001'];
    }
  }

  // ================================
  // DATA COLLECTORS FOR LANGGRAPH COCKPIT
  // ================================

  /**
   * Add active workflow to tracking
   */
  private addActiveWorkflow(workflowId: string, workflow: any): void {
    this.activeWorkflows.set(workflowId, {
      ...workflow,
      timestamp: new Date().toISOString(),
      executionTrace: []
    });
  }

  /**
   * Complete workflow and move to history
   */
  private completeWorkflow(workflowId: string, completionData: any): void {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      const completedWorkflow = {
        ...workflow,
        ...completionData,
        completedAt: new Date().toISOString()
      };
      
      // Move to history
      this.workflowHistory.unshift(completedWorkflow);
      this.activeWorkflows.delete(workflowId);
      
      // Keep only last 200 in history
      if (this.workflowHistory.length > 200) {
        this.workflowHistory = this.workflowHistory.slice(0, 200);
      }
    }
  }

  /**
   * Infer workflow name from message content
   */
  private inferWorkflowName(message: string): string {
    if (message.toLowerCase().includes('ethical')) {
      return 'Ethical Analysis Pipeline';
    } else if (message.toLowerCase().includes('technical') || message.toLowerCase().includes('code')) {
      return 'Technical Support Flow';
    } else if (message.toLowerCase().includes('security')) {
      return 'Security Analysis Pipeline';
    } else {
      return 'General Query Workflow';
    }
  }

  /**
   * Record dataflow trace
   */
  recordDataFlowTrace(workflowId: string, nodeId: string, operation: string, data: any, duration: number): void {
    const trace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workflowId,
      timestamp: new Date().toISOString(),
      nodeId,
      nodeName: this.getNodeDisplayName(nodeId),
      operation,
      dataSize: JSON.stringify(data).length,
      duration,
      isActive: nodeId === this.getCurrentNodeId(workflowId),
      dataPreview: this.sanitizeDataPreview(data)
    };

    this.dataFlowTraces.unshift(trace);
    
    // Keep only last MAX_TRACES
    if (this.dataFlowTraces.length > this.MAX_TRACES) {
      this.dataFlowTraces = this.dataFlowTraces.slice(0, this.MAX_TRACES);
    }

    // Add to workflow execution trace
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.executionTrace.push({
        id: `step-${workflow.executionTrace.length + 1}`,
        nodeId,
        nodeName: this.getNodeDisplayName(nodeId),
        timestamp: trace.timestamp,
        duration,
        status: 'completed',
        data: this.sanitizeDataPreview(data),
        agent: this.getAgentIdFromNodeId(nodeId)
      });
    }
  }

  /**
   * Record agent handoff
   */
  recordAgentHandoff(handoff: AgentHandoff): void {
    const extendedHandoff = {
      ...handoff,
      id: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      confidence: this.calculateHandoffConfidence(handoff),
      duration: this.estimateHandoffDuration(handoff),
      latency: Math.floor(Math.random() * 100) + 20, // Mock latency
      success: true,
      contextTransferred: this.extractContextSize(handoff.context)
    };

    this.agentHandoffs.unshift(extendedHandoff);

    // Keep only last MAX_HANDOFFS
    if (this.agentHandoffs.length > this.MAX_HANDOFFS) {
      this.agentHandoffs = this.agentHandoffs.slice(0, this.MAX_HANDOFFS);
    }
  }

  /**
   * Record supervisor decision
   */
  recordSupervisorDecision(decision: any): void {
    const extendedDecision = {
      ...decision,
      id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    this.supervisorDecisions.unshift(extendedDecision);

    // Keep only last MAX_DECISIONS
    if (this.supervisorDecisions.length > this.MAX_DECISIONS) {
      this.supervisorDecisions = this.supervisorDecisions.slice(0, this.MAX_DECISIONS);
    }
  }

  /**
   * Get active workflows for cockpit
   */
  getActiveWorkflows(): any[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get workflow history for cockpit
   */
  getWorkflowHistory(limit: number = 50): any[] {
    return this.workflowHistory.slice(0, limit);
  }

  /**
   * Get dataflow traces for cockpit
   */
  getDataFlowTraces(limit: number = 100): any[] {
    return this.dataFlowTraces.slice(0, limit);
  }

  /**
   * Get agent handoffs for cockpit
   */
  getAgentHandoffs(limit: number = 50): AgentHandoff[] {
    return this.agentHandoffs.slice(0, limit);
  }

  /**
   * Get supervisor decisions for cockpit
   */
  getSupervisorDecisions(limit: number = 50): any[] {
    return this.supervisorDecisions.slice(0, limit);
  }

  /**
   * Get cockpit metrics summary
   */
  getCockpitMetrics(): any {
    const totalWorkflows = this.workflowHistory.length + this.activeWorkflows.size;
    const completedWorkflows = this.workflowHistory.filter(w => w.status === 'completed').length;
    const failedWorkflows = this.workflowHistory.filter(w => w.status === 'error').length;

    return {
      totalWorkflows,
      activeWorkflows: this.activeWorkflows.size,
      completedWorkflows,
      failedWorkflows,
      successRate: totalWorkflows > 0 ? completedWorkflows / totalWorkflows : 0,
      totalHandoffs: this.agentHandoffs.length,
      totalDataFlowTraces: this.dataFlowTraces.length,
      totalSupervisorDecisions: this.supervisorDecisions.length,
      averageExecutionTime: this.calculateAverageExecutionTime()
    };
  }

  // ================================
  // HELPER METHODS
  // ================================

  private getNodeDisplayName(nodeId: string): string {
    const nodeNames: Record<string, string> = {
      'supervisor': 'Workflow Supervisor',
      'vegapunk_node': 'Vegapunk Technical',
      'shaka_node': 'Shaka Ethical',
      'end': 'Workflow End'
    };
    return nodeNames[nodeId] || nodeId;
  }

  private getCurrentNodeId(workflowId: string): string {
    const workflow = this.activeWorkflows.get(workflowId);
    return workflow?.currentNode || 'unknown';
  }

  private sanitizeDataPreview(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const preview: any = {};
      const keys = Object.keys(data).slice(0, 3); // Only first 3 keys
      for (const key of keys) {
        const value = data[key];
        if (typeof value === 'string' && value.length > 100) {
          preview[key] = value.substring(0, 100) + '...';
        } else {
          preview[key] = value;
        }
      }
      return preview;
    }
    return data;
  }

  private getAgentIdFromNodeId(nodeId: string): string {
    const agentMapping: Record<string, string> = {
      'supervisor': 'supervisor-001',
      'vegapunk_node': 'vegapunk-001',
      'shaka_node': 'shaka-001'
    };
    return agentMapping[nodeId] || 'unknown-agent';
  }

  private calculateHandoffConfidence(handoff: AgentHandoff): number {
    // Mock confidence calculation based on handoff reason
    const confidenceMap: Record<string, number> = {
      'specialized_capability_required': 0.92,
      'workload_balancing': 0.85,
      'expertise_optimization': 0.90,
      'error_recovery': 0.78,
      'quality_improvement': 0.88
    };
    return confidenceMap[handoff.reason] || 0.80;
  }

  private estimateHandoffDuration(handoff: AgentHandoff): number {
    // Mock duration estimation based on context
    return Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
  }

  private extractContextSize(context: any): any {
    if (typeof context === 'object' && context !== null) {
      return {
        ...context,
        context_size: JSON.stringify(context).length
      };
    }
    return { context_size: 0 };
  }

  private calculateAverageExecutionTime(): number {
    const completedWorkflows = this.workflowHistory.filter(w => w.executionTime);
    if (completedWorkflows.length === 0) return 0;
    
    const totalTime = completedWorkflows.reduce((sum, w) => sum + (w.executionTime || 0), 0);
    return Math.round(totalTime / completedWorkflows.length);
  }

  private inferHandoffReason(fromAgent: string, toAgent: string): string {
    const reasonMap: Record<string, Record<string, string>> = {
      'supervisor': {
        'vegapunk-001': 'specialized_capability_required',
        'shaka-001': 'ethical_analysis_required'
      },
      'vegapunk-001': {
        'shaka-001': 'ethical_review_needed',
        'supervisor': 'task_completed'
      },
      'shaka-001': {
        'vegapunk-001': 'technical_implementation_needed',
        'supervisor': 'ethical_approval_granted'
      }
    };
    
    return reasonMap[fromAgent]?.[toAgent] || 'workflow_optimization';
  }

  private inferSupervisorReasoning(selectedAgent: string, state: VegapunkGraphState): string {
    const message = state.messages[state.messages.length - 1]?.content.toLowerCase() || '';
    
    if (selectedAgent === 'shaka-001') {
      if (message.includes('ethical') || message.includes('moral')) {
        return 'Ethical keywords detected (0.9 match score)';
      }
      return 'Ethical analysis required (0.8 confidence)';
    } else if (selectedAgent === 'vegapunk-001') {
      if (message.includes('technical') || message.includes('code')) {
        return 'Technical keywords detected (0.9 match score)';
      }
      return 'Technical support required (0.8 confidence)';
    }
    
    return 'Load balancing optimization applied';
  }

  private getFallbackAgent(primaryAgent: string): string | undefined {
    const fallbackMap: Record<string, string> = {
      'vegapunk-001': 'shaka-001',
      'shaka-001': 'vegapunk-001'
    };
    return fallbackMap[primaryAgent];
  }

  /**
   * Get workflow metrics
   */
  getMetrics(workflowId?: string): GraphMetrics | GraphMetrics[] {
    if (workflowId) {
      return this.metrics.get(workflowId) || null;
    }
    return Array.from(this.metrics.values());
  }

  /**
   * Get graph configuration
   */
  getConfig(): GraphConfig {
    return { ...this.config };
  }

  /**
   * Update graph configuration
   */
  updateConfig(config: Partial<GraphConfig>): void {
    this.config = { ...this.config, ...config };
  }

    async shutdown() {

    }
}