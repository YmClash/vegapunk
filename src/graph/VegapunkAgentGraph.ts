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

      // Execute the graph
      const result = await this.executeGraph(initialState, workflowId);
      
      // Extract final response
      const finalResponse = this.extractFinalResponse(result);
      
      // Record metrics
      const metrics = this.recordMetrics(workflowId, initialState, result, startTime);
      
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
              const nodeOutput = Object.values(output)[0] as Partial<VegapunkGraphState>;
              finalState = { ...finalState, ...nodeOutput };
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
}