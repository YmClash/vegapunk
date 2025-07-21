/**
 * A2A ↔ LangGraph Bridge - Integration between protocols
 * Enables LangGraph workflows to use A2A agent discovery and communication
 */

import { EventEmitter } from 'events';
import { A2AProtocol, A2AMessage, A2AMessageType, AgentProfile, CapabilityQuery } from '../a2a/types';
import { VegapunkAgentGraph } from '../graph/VegapunkAgentGraph';
import { VegapunkGraphState, AgentHandoff, GraphMetrics } from '../graph/types';

export interface A2ALangGraphBridgeConfig {
  enableAutoDiscovery: boolean;
  enableCapabilityMatching: boolean;
  enableHandoffOptimization: boolean;
  maxHandoffRetries: number;
  handoffTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class A2ALangGraphBridge extends EventEmitter {
  private a2aProtocol: A2AProtocol;
  private agentGraph: VegapunkAgentGraph;
  private config: A2ALangGraphBridgeConfig;
  private handoffHistory = new Map<string, AgentHandoff[]>();
  private capabilityCache = new Map<string, AgentProfile[]>();
  private isInitialized = false;

  constructor(
    a2aProtocol: A2AProtocol,
    agentGraph: VegapunkAgentGraph,
    config?: Partial<A2ALangGraphBridgeConfig>
  ) {
    super();
    
    this.a2aProtocol = a2aProtocol;
    this.agentGraph = agentGraph;
    this.config = {
      enableAutoDiscovery: true,
      enableCapabilityMatching: true,
      enableHandoffOptimization: true,
      maxHandoffRetries: 3,
      handoffTimeout: 30000, // 30 seconds
      logLevel: 'info',
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the bridge
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize both protocols if not already done
      await this.a2aProtocol.initialize();
      await this.agentGraph.initialize();

      // Setup capability caching if enabled
      if (this.config.enableCapabilityMatching) {
        await this.refreshCapabilityCache();
        this.setupCapabilityCacheRefresh();
      }

      this.isInitialized = true;
      this.log('info', 'A2A-LangGraph bridge initialized successfully');
      
    } catch (error) {
      this.log('error', `Failed to initialize bridge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Enhanced agent discovery for LangGraph workflows
   */
  async discoverAgentsForWorkflow(requirements: {
    capabilities?: string[];
    excludeAgents?: string[];
    minReliability?: number;
    maxLoad?: number;
  }): Promise<AgentProfile[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let availableAgents: AgentProfile[] = [];

      if (this.config.enableAutoDiscovery) {
        // Use A2A protocol for discovery
        availableAgents = await this.a2aProtocol.discoverAgents();
      } else {
        // Use cached capabilities
        availableAgents = Array.from(this.capabilityCache.values()).flat();
      }

      // Apply filters
      let filteredAgents = availableAgents.filter(agent => {
        // Exclude specified agents
        if (requirements.excludeAgents?.includes(agent.agentId)) {
          return false;
        }

        // Check reliability
        if (requirements.minReliability) {
          const avgReliability = agent.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / agent.capabilities.length;
          if (avgReliability < requirements.minReliability) {
            return false;
          }
        }

        // Check load
        if (requirements.maxLoad && agent.metadata.load > requirements.maxLoad) {
          return false;
        }

        return true;
      });

      // Filter by capabilities if specified
      if (requirements.capabilities && requirements.capabilities.length > 0) {
        filteredAgents = filteredAgents.filter(agent => 
          requirements.capabilities!.some(reqCap =>
            agent.capabilities.some(agentCap => agentCap.name === reqCap)
          )
        );
      }

      // Sort by load and reliability (best agents first)
      filteredAgents.sort((a, b) => {
        const scoreA = this.calculateAgentScore(a);
        const scoreB = this.calculateAgentScore(b);
        return scoreB - scoreA;
      });

      this.log('debug', `Discovered ${filteredAgents.length} agents for workflow`);
      return filteredAgents;

    } catch (error) {
      this.log('error', `Agent discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Optimize agent handoff for LangGraph workflows
   */
  async optimizeHandoff(
    fromAgent: string,
    currentState: VegapunkGraphState,
    targetCapability: string
  ): Promise<{ targetAgent: string; confidence: number; reasoning: string }> {
    if (!this.config.enableHandoffOptimization) {
      // Fall back to simple capability matching
      const agents = await this.a2aProtocol.findAgentsByCapability(targetCapability);
      const bestAgent = agents[0];
      
      return {
        targetAgent: bestAgent?.agentId || 'vegapunk-001',
        confidence: bestAgent ? 0.7 : 0.3,
        reasoning: bestAgent ? 'Simple capability match' : 'Fallback to default agent'
      };
    }

    try {
      // Get handoff history for context
      const history = this.handoffHistory.get(currentState.sessionId) || [];
      
      // Use A2A capability query for intelligent matching
      const query: CapabilityQuery = {
        query: targetCapability,
        requester: fromAgent,
        filters: {
          availability: true,
          minReliability: 0.7
        },
        limit: 5
      };

      const matches = await this.a2aProtocol.queryCapabilities(query);
      
      if (matches.length === 0) {
        return {
          targetAgent: 'vegapunk-001',
          confidence: 0.3,
          reasoning: 'No capable agents found, fallback to default'
        };
      }

      // Apply handoff optimization logic
      const optimizedMatch = this.selectOptimalAgent(matches, history, currentState);
      
      return {
        targetAgent: optimizedMatch.agent.agentId,
        confidence: optimizedMatch.score,
        reasoning: optimizedMatch.reason
      };

    } catch (error) {
      this.log('error', `Handoff optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to simple approach
      return {
        targetAgent: 'vegapunk-001',
        confidence: 0.3,
        reasoning: 'Optimization failed, using fallback'
      };
    }
  }

  /**
   * Execute A2A message from LangGraph workflow
   */
  async executeA2AMessage(
    message: A2AMessage,
    context: {
      workflowId: string;
      sessionId: string;
      currentAgent: string;
    }
  ): Promise<any> {
    try {
      const response = await this.a2aProtocol.sendMessage(message);
      
      // Record handoff if this is a task delegation
      if (message.type === A2AMessageType.TASK_DELEGATE) {
        this.recordHandoff({
          fromAgent: message.from,
          toAgent: message.to,
          reason: message.payload?.reason || 'Task delegation',
          context: message.payload?.context,
          timestamp: message.timestamp,
          metadata: {
            capability: message.payload?.capability,
            priority: 3
          }
        }, context.sessionId);
      }

      return response;
      
    } catch (error) {
      this.log('error', `A2A message execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Sync LangGraph state with A2A network
   */
  async syncStateWithA2A(
    state: VegapunkGraphState,
    updates: {
      currentAgent?: string;
      agentCapabilities?: Map<string, any>;
      networkTopology?: boolean;
    }
  ): Promise<Partial<VegapunkGraphState>> {
    const stateUpdates: Partial<VegapunkGraphState> = {};

    try {
      // Update available agents if requested
      if (updates.networkTopology) {
        const agents = await this.a2aProtocol.discoverAgents();
        stateUpdates.availableAgents = agents.map(agent => agent.agentId);
      }

      // Update agent capabilities if requested
      if (updates.agentCapabilities) {
        const agents = await this.a2aProtocol.discoverAgents();
        const capabilitiesMap = new Map();
        
        for (const agent of agents) {
          capabilitiesMap.set(agent.agentId, agent.capabilities);
        }
        
        stateUpdates.agentCapabilities = capabilitiesMap;
      }

      // Update current agent status if specified
      if (updates.currentAgent && updates.currentAgent !== state.currentAgent) {
        await this.a2aProtocol.updateAgentStatus(
          updates.currentAgent,
          'online',
          { lastActivity: new Date() }
        );
        stateUpdates.currentAgent = updates.currentAgent;
      }

      return stateUpdates;

    } catch (error) {
      this.log('error', `State sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {};
    }
  }

  /**
   * Get handoff analytics for a session
   */
  getHandoffAnalytics(sessionId: string): {
    totalHandoffs: number;
    uniqueAgents: number;
    averageHandoffTime: number;
    handoffSuccess: number;
    mostUsedCapabilities: string[];
  } {
    const handoffs = this.handoffHistory.get(sessionId) || [];
    
    if (handoffs.length === 0) {
      return {
        totalHandoffs: 0,
        uniqueAgents: 0,
        averageHandoffTime: 0,
        handoffSuccess: 0,
        mostUsedCapabilities: []
      };
    }

    const uniqueAgents = new Set([
      ...handoffs.map(h => h.fromAgent),
      ...handoffs.map(h => h.toAgent)
    ]).size;

    const capabilities = handoffs
      .map(h => h.metadata?.capability)
      .filter(Boolean) as string[];
    
    const capabilityCounts = capabilities.reduce((acc, cap) => {
      acc[cap] = (acc[cap] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedCapabilities = Object.entries(capabilityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cap]) => cap);

    return {
      totalHandoffs: handoffs.length,
      uniqueAgents,
      averageHandoffTime: 0, // Would need timing data
      handoffSuccess: 1.0, // Would need success/failure tracking
      mostUsedCapabilities
    };
  }

  /**
   * Shutdown the bridge
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Clear caches
      this.capabilityCache.clear();
      this.handoffHistory.clear();

      this.isInitialized = false;
      this.log('info', 'A2A-LangGraph bridge shutdown complete');
      
    } catch (error) {
      this.log('error', `Bridge shutdown error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // Private Methods
  // ================================

  private setupEventHandlers(): void {
    // Listen to A2A events
    this.a2aProtocol.on('agent.registered', (agent: AgentProfile) => {
      this.emit('agent.discovered', agent);
      if (this.config.enableCapabilityMatching) {
        this.refreshCapabilityCache();
      }
    });

    this.a2aProtocol.on('agent.unregistered', (agentId: string) => {
      this.emit('agent.lost', agentId);
      if (this.config.enableCapabilityMatching) {
        this.refreshCapabilityCache();
      }
    });

    this.a2aProtocol.on('network.topology.changed', () => {
      this.emit('topology.changed');
      if (this.config.enableCapabilityMatching) {
        this.refreshCapabilityCache();
      }
    });
  }

  private async refreshCapabilityCache(): Promise<void> {
    try {
      const agents = await this.a2aProtocol.discoverAgents();
      
      // Group agents by capability
      this.capabilityCache.clear();
      for (const agent of agents) {
        for (const capability of agent.capabilities) {
          const existing = this.capabilityCache.get(capability.name) || [];
          existing.push(agent);
          this.capabilityCache.set(capability.name, existing);
        }
      }

      this.log('debug', `Refreshed capability cache with ${agents.length} agents`);
      
    } catch (error) {
      this.log('error', `Failed to refresh capability cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupCapabilityCacheRefresh(): void {
    // Refresh cache every 60 seconds
    setInterval(() => {
      this.refreshCapabilityCache();
    }, 60000);
  }

  private calculateAgentScore(agent: AgentProfile): number {
    const avgReliability = agent.capabilities.reduce((sum, cap) => sum + cap.reliability, 0) / agent.capabilities.length;
    const loadScore = (100 - agent.metadata.load) / 100;
    const performanceScore = agent.metadata.performance_metrics?.success_rate || 0.8;
    
    return (avgReliability * 0.4) + (loadScore * 0.3) + (performanceScore * 0.3);
  }

  private selectOptimalAgent(
    matches: any[],
    history: AgentHandoff[],
    currentState: VegapunkGraphState
  ): { agent: AgentProfile; score: number; reason: string } {
    let bestMatch = matches[0];
    let bestScore = bestMatch.score;
    let reason = bestMatch.reason;

    // Apply handoff optimization logic
    for (const match of matches) {
      let score = match.score;
      
      // Boost score for agents not recently used (avoid ping-pong)
      const recentHandoffs = history.slice(-3);
      const recentlyUsed = recentHandoffs.some(h => h.toAgent === match.agent.agentId);
      if (!recentlyUsed) {
        score += 0.1;
      }

      // Boost score for agents with lower current load
      const loadBonus = (100 - match.agent.metadata.load) / 1000;
      score += loadBonus;

      // Boost score for agents with better performance metrics
      const performanceBonus = (match.agent.metadata.performance_metrics?.success_rate || 0.8) * 0.1;
      score += performanceBonus;

      if (score > bestScore) {
        bestMatch = match;
        bestScore = score;
        reason = `Optimized selection: ${match.reason} + load/performance optimization`;
      }
    }

    return {
      agent: bestMatch.agent,
      score: bestScore,
      reason
    };
  }

  private recordHandoff(handoff: AgentHandoff, sessionId: string): void {
    const existing = this.handoffHistory.get(sessionId) || [];
    existing.push(handoff);
    
    // Keep only last 50 handoffs per session
    if (existing.length > 50) {
      existing.splice(0, existing.length - 50);
    }
    
    this.handoffHistory.set(sessionId, existing);
    this.emit('handoff.recorded', handoff, sessionId);
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[A2A-LangGraph-Bridge-${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
    }
  }
}