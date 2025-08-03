/**
 * Agent Registry - A2A Protocol Discovery System
 * Manages agent registration, discovery, and capability matching
 */

import { EventEmitter } from 'events';
import {
  AgentProfile,
  AgentCapability,
  AgentStatus,
  CapabilityQuery,
  CapabilityMatch,
  CapabilityCategory,
  NetworkTopology,
  Route,
  A2AMessage,
  A2AMessageType,
  A2AProtocolEvents
} from './types';

export class AgentRegistry extends EventEmitter {
  private agents = new Map<string, AgentProfile>();
  private capabilities = new Map<string, Map<string, AgentCapability>>(); // agentId -> capability map
  private capabilityIndex = new Map<string, Set<string>>(); // capability name -> agent IDs
  private categoryIndex = new Map<CapabilityCategory, Set<string>>(); // category -> agent IDs
  private lastTopologyUpdate = new Date();

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  /**
   * Register an agent with the network
   */
  async register(profile: AgentProfile): Promise<void> {
    const agentId = profile.agentId;
    
    // Validate profile
    this.validateAgentProfile(profile);
    
    // Store agent profile
    this.agents.set(agentId, { ...profile, lastSeen: new Date() });
    
    // Index capabilities
    await this.indexAgentCapabilities(agentId, profile.capabilities);
    
    // Update topology
    this.updateTopology();
    
    // Emit events
    this.emit('agent.registered', profile);
    this.emit('network.topology.changed', this.getTopology());
    
    console.log(`[A2A Registry] Agent registered: ${agentId} with ${profile.capabilities.length} capabilities`);
  }

  /**
   * Unregister an agent from the network
   */
  async unregister(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return; // Agent not found, silently ignore
    }

    // Remove from indices
    await this.removeAgentFromIndices(agentId);
    
    // Remove agent
    this.agents.delete(agentId);
    this.capabilities.delete(agentId);
    
    // Update topology
    this.updateTopology();
    
    // Emit events
    this.emit('agent.unregistered', agentId);
    this.emit('network.topology.changed', this.getTopology());
    
    console.log(`[A2A Registry] Agent unregistered: ${agentId}`);
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId: string, status: AgentStatus, metadata?: Partial<AgentProfile['metadata']>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const oldStatus = agent.status;
    agent.status = status;
    agent.lastSeen = new Date();
    
    if (metadata) {
      agent.metadata = { ...agent.metadata, ...metadata };
    }

    // Update agent in map
    this.agents.set(agentId, agent);
    
    // Emit status change event
    if (oldStatus !== status) {
      this.emit('agent.status.changed', agentId, status);
    }
  }

  /**
   * Discover all agents in the network
   */
  async discover(): Promise<AgentProfile[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.status !== AgentStatus.OFFLINE);
  }

  /**
   * Find agents by capability name
   */
  async findByCapability(capabilityName: string): Promise<AgentProfile[]> {
    const agentIds = this.capabilityIndex.get(capabilityName) || new Set();
    const agents: AgentProfile[] = [];
    
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent && agent.status === AgentStatus.ONLINE) {
        agents.push(agent);
      }
    }
    
    return agents;
  }

  /**
   * Find agents by category
   */
  async findByCategory(category: CapabilityCategory): Promise<AgentProfile[]> {
    const agentIds = this.categoryIndex.get(category) || new Set();
    const agents: AgentProfile[] = [];
    
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent && agent.status === AgentStatus.ONLINE) {
        agents.push(agent);
      }
    }
    
    return agents;
  }

  /**
   * Query capabilities with advanced matching
   */
  async queryCapabilities(query: CapabilityQuery): Promise<CapabilityMatch[]> {
    const matches: CapabilityMatch[] = [];
    
    for (const [agentId, agent] of this.agents) {
      if (agent.status !== AgentStatus.ONLINE) continue;
      
      const agentCapabilities = this.capabilities.get(agentId);
      if (!agentCapabilities) continue;
      
      for (const capability of agentCapabilities.values()) {
        const match = this.matchCapability(capability, agent, query);
        if (match && match.score > 0.3) { // Minimum match threshold
          matches.push(match);
        }
      }
    }
    
    // Sort by match score (highest first)
    matches.sort((a, b) => b.score - a.score);
    
    // Apply limit if specified
    if (query.limit && query.limit > 0) {
      matches.splice(query.limit);
    }
    
    this.emit('capability.discovered', matches);
    return matches;
  }

  /**
   * Get current network topology
   */
  getTopology(): NetworkTopology {
    const connections = new Map<string, string[]>();
    const messageRoutes = new Map<string, Route[]>();
    
    // Build connections (all agents can communicate with all others for now)
    for (const agentId of this.agents.keys()) {
      const otherAgents = Array.from(this.agents.keys()).filter(id => id !== agentId);
      connections.set(agentId, otherAgents);
    }
    
    // Build message routes for each capability
    for (const [capabilityName, agentIds] of this.capabilityIndex) {
      const routes: Route[] = [];
      
      for (const agentId of agentIds) {
        const agent = this.agents.get(agentId);
        const agentCapabilities = this.capabilities.get(agentId);
        
        if (agent && agentCapabilities && agent.status === AgentStatus.ONLINE) {
          const capability = agentCapabilities.get(capabilityName);
          if (capability) {
            routes.push({
              agentId,
              capability: capabilityName,
              cost: capability.cost,
              reliability: capability.reliability,
              responseTime: agent.metadata.performance_metrics?.avg_response_time || 1000,
              load: agent.metadata.load
            });
          }
        }
      }
      
      messageRoutes.set(capabilityName, routes);
    }
    
    return {
      agents: new Map(this.agents),
      connections,
      messageRoutes,
      lastUpdated: this.lastTopologyUpdate
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentProfile | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all capabilities for an agent
   */
  getAgentCapabilities(agentId: string): AgentCapability[] {
    const capabilities = this.capabilities.get(agentId);
    return capabilities ? Array.from(capabilities.values()) : [];
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    const totalAgents = this.agents.size;
    const onlineAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AgentStatus.ONLINE).length;
    const totalCapabilities = Array.from(this.capabilities.values())
      .reduce((sum, caps) => sum + caps.size, 0);
    const uniqueCapabilities = this.capabilityIndex.size;
    
    return {
      totalAgents,
      onlineAgents,
      totalCapabilities,
      uniqueCapabilities,
      categories: Array.from(this.categoryIndex.keys()),
      lastTopologyUpdate: this.lastTopologyUpdate
    };
  }

  // ================================
  // Private Methods
  // ================================

  private validateAgentProfile(profile: AgentProfile): void {
    if (!profile.agentId || !profile.agentType) {
      throw new Error('Agent ID and type are required');
    }
    
    if (!Array.isArray(profile.capabilities)) {
      throw new Error('Agent capabilities must be an array');
    }
    
    // Validate each capability
    for (const capability of profile.capabilities) {
      this.validateCapability(capability);
    }
  }

  private validateCapability(capability: AgentCapability): void {
    if (!capability.id || !capability.name || !capability.category) {
      throw new Error('Capability must have id, name, and category');
    }
    
    if (capability.reliability < 0 || capability.reliability > 1) {
      throw new Error('Capability reliability must be between 0 and 1');
    }
    
    if (capability.cost < 0 || capability.cost > 100) {
      throw new Error('Capability cost must be between 0 and 100');
    }
  }

  private async indexAgentCapabilities(agentId: string, capabilities: AgentCapability[]): Promise<void> {
    const agentCapMap = new Map<string, AgentCapability>();
    
    for (const capability of capabilities) {
      // Store in agent's capability map
      agentCapMap.set(capability.name, capability);
      
      // Index by capability name
      if (!this.capabilityIndex.has(capability.name)) {
        this.capabilityIndex.set(capability.name, new Set());
      }
      this.capabilityIndex.get(capability.name)!.add(agentId);
      
      // Index by category
      if (!this.categoryIndex.has(capability.category)) {
        this.categoryIndex.set(capability.category, new Set());
      }
      this.categoryIndex.get(capability.category)!.add(agentId);
    }
    
    this.capabilities.set(agentId, agentCapMap);
  }

  private async removeAgentFromIndices(agentId: string): Promise<void> {
    // Remove from capability index
    for (const agentIds of this.capabilityIndex.values()) {
      agentIds.delete(agentId);
    }
    
    // Remove from category index
    for (const agentIds of this.categoryIndex.values()) {
      agentIds.delete(agentId);
    }
  }

  private matchCapability(
    capability: AgentCapability,
    agent: AgentProfile,
    query: CapabilityQuery
  ): CapabilityMatch | null {
    let score = 0;
    let reason = '';
    
    // Check filters first
    if (query.filters) {
      const { category, tags, minReliability, maxCost, availability } = query.filters;
      
      if (category && capability.category !== category) return null;
      if (minReliability && capability.reliability < minReliability) return null;
      if (maxCost && capability.cost > maxCost) return null;
      if (availability && agent.status !== AgentStatus.ONLINE) return null;
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => capability.tags?.includes(tag));
        if (!hasMatchingTag) return null;
      }
    }
    
    // Exact name match
    if (capability.name.toLowerCase() === query.query.toLowerCase()) {
      score = 1.0;
      reason = 'Exact capability name match';
    }
    // Partial name match
    else if (capability.name.toLowerCase().includes(query.query.toLowerCase())) {
      score = 0.8;
      reason = 'Partial capability name match';
    }
    // Description match
    else if (capability.description.toLowerCase().includes(query.query.toLowerCase())) {
      score = 0.6;
      reason = 'Description contains query terms';
    }
    // Tag match
    else if (capability.tags?.some(tag => tag.toLowerCase().includes(query.query.toLowerCase()))) {
      score = 0.4;
      reason = 'Tag matches query';
    }
    
    // Adjust score based on agent performance
    const reliabilityBonus = capability.reliability * 0.2;
    const loadPenalty = (agent.metadata.load / 100) * 0.1;
    score = Math.max(0, score + reliabilityBonus - loadPenalty);
    
    if (score > 0) {
      return {
        agent,
        capability,
        score,
        reason
      };
    }
    
    return null;
  }

  private updateTopology(): void {
    this.lastTopologyUpdate = new Date();
  }

  private setupCleanupInterval(): void {
    // Clean up offline agents every 5 minutes
    setInterval(() => {
      this.cleanupOfflineAgents();
    }, 5 * 60 * 1000);
  }

  private cleanupOfflineAgents(): void {
    const offlineThreshold = 10 * 60 * 1000; // 10 minutes
    const now = new Date();
    
    for (const [agentId, agent] of this.agents) {
      const timeSinceLastSeen = now.getTime() - agent.lastSeen.getTime();
      
      if (timeSinceLastSeen > offlineThreshold && agent.status !== AgentStatus.OFFLINE) {
        this.updateStatus(agentId, AgentStatus.OFFLINE);
        console.log(`[A2A Registry] Agent marked offline due to inactivity: ${agentId}`);
      }
    }
  }
}