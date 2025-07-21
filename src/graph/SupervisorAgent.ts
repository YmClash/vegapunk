/**
 * Supervisor Agent - LangGraph Workflow Orchestrator
 * Manages agent selection and workflow coordination
 */

import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { 
  VegapunkGraphState, 
  SupervisorDecision, 
  AgentCapabilityScore,
  GraphNodeFunction 
} from './types';
import { A2AProtocol } from '../a2a/A2AProtocol';
import { AgentProfile, CapabilityQuery } from '../a2a/types';

export class SupervisorAgent {
  private a2aProtocol: A2AProtocol;
  private nodeId = 'supervisor';
  private agentId = 'supervisor-001';

  constructor(a2aProtocol: A2AProtocol) {
    this.a2aProtocol = a2aProtocol;
  }

  /**
   * Main supervisor execution function
   */
  execute: GraphNodeFunction = async (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>> => {
    const startTime = Date.now();
    
    try {
      // Get latest human message
      const humanMessages = state.messages.filter(m => m.constructor.name === 'HumanMessage');
      const latestMessage = humanMessages[humanMessages.length - 1];
      
      if (!latestMessage) {
        throw new Error('No human message found for supervision');
      }

      // Analyze the message and determine best agent
      const decision = await this.makeSupervisionDecision(latestMessage.content as string, state);
      
      // Update available agents list
      const availableAgents = await this.getAvailableAgents();
      
      // Create supervisor response
      const supervisorMessage = new AIMessage({
        content: this.createSupervisionMessage(decision),
        additional_kwargs: {
          agent: this.agentId,
          decision: decision,
          availableAgents: availableAgents.map(a => a.agentId)
        }
      });

      return {
        messages: [...state.messages, supervisorMessage],
        currentAgent: decision.selectedAgent,
        nextAgent: decision.selectedAgent,
        availableAgents: availableAgents.map(a => a.agentId),
        workflowStatus: 'running',
        metadata: {
          ...state.metadata,
          currentStep: state.metadata.currentStep + 1,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error(`[SupervisorAgent] Execution error:`, error);
      
      // Default to Vegapunk on error
      return {
        currentAgent: 'vegapunk-001',
        nextAgent: 'vegapunk-001',
        workflowStatus: 'running',
        metadata: {
          ...state.metadata,
          processingTime: Date.now() - startTime
        }
      };
    }
  };

  /**
   * Make intelligent agent selection decision
   */
  private async makeSupervisionDecision(message: string, state: VegapunkGraphState): Promise<SupervisorDecision> {
    // Get available agents and their capabilities
    const agents = await this.getAvailableAgents();
    const capabilityScores = await this.scoreAgentCapabilities(message, agents);
    
    // Sort agents by capability score
    capabilityScores.sort((a, b) => b.score - a.score);
    
    const bestAgent = capabilityScores[0];
    const fallbackAgent = capabilityScores[1];

    if (!bestAgent) {
      // Default to Vegapunk if no agents available
      return {
        selectedAgent: 'vegapunk-001',
        reasoning: 'No specialized agents available, defaulting to Vegapunk technical support',
        confidence: 0.5,
        fallbackAgent: undefined,
        estimatedDuration: 30000 // 30 seconds
      };
    }

    return {
      selectedAgent: bestAgent.agentId,
      reasoning: bestAgent.reasoning,
      confidence: bestAgent.score,
      fallbackAgent: fallbackAgent?.agentId,
      estimatedDuration: this.estimateProcessingTime(bestAgent.capability, message)
    };
  }

  /**
   * Score agents based on their capability to handle the message
   */
  private async scoreAgentCapabilities(message: string, agents: AgentProfile[]): Promise<AgentCapabilityScore[]> {
    const scores: AgentCapabilityScore[] = [];
    const lowerMessage = message.toLowerCase();

    for (const agent of agents) {
      if (agent.status !== 'online') continue;

      for (const capability of agent.capabilities) {
        const score = this.calculateCapabilityScore(message, capability, agent);
        
        if (score.score > 0.3) { // Minimum threshold
          scores.push({
            agentId: agent.agentId,
            capability: capability.name,
            score: score.score,
            availability: agent.status === 'online',
            load: agent.metadata.load,
            reasoning: score.reasoning
          });
        }
      }
    }

    return scores;
  }

  /**
   * Calculate how well a capability matches the message
   */
  private calculateCapabilityScore(message: string, capability: any, agent: AgentProfile): { score: number, reasoning: string } {
    const lowerMessage = message.toLowerCase();
    let score = 0;
    let reasoning = '';

    // Keyword-based scoring for different capabilities
    switch (capability.name) {
      case 'ethical-analysis':
        const ethicalKeywords = [
          'ethical', 'ethics', 'moral', 'right', 'wrong', 'should', 'shouldn\'t',
          'appropriate', 'inappropriate', 'bias', 'fairness', 'responsibility'
        ];
        const ethicalScore = ethicalKeywords.reduce((s, keyword) => 
          lowerMessage.includes(keyword) ? s + 0.2 : s, 0
        );
        score = Math.min(ethicalScore, 0.95);
        reasoning = `Ethical keywords detected (${ethicalScore.toFixed(1)} match score)`;
        break;

      case 'security-analysis':
        const securityKeywords = [
          'security', 'secure', 'vulnerability', 'attack', 'breach', 'hack',
          'malware', 'threat', 'risk', 'encryption', 'authentication'
        ];
        const securityScore = securityKeywords.reduce((s, keyword) => 
          lowerMessage.includes(keyword) ? s + 0.2 : s, 0
        );
        score = Math.min(securityScore, 0.95);
        reasoning = `Security keywords detected (${securityScore.toFixed(1)} match score)`;
        break;

      case 'creative-solutions':
        const creativeKeywords = [
          'creative', 'innovation', 'brainstorm', 'idea', 'design', 'concept',
          'solution', 'alternative', 'improve', 'optimize', 'enhance'
        ];
        const creativeScore = creativeKeywords.reduce((s, keyword) => 
          lowerMessage.includes(keyword) ? s + 0.2 : s, 0
        );
        score = Math.min(creativeScore, 0.95);
        reasoning = `Creative keywords detected (${creativeScore.toFixed(1)} match score)`;
        break;

      case 'technical-support':
        // Technical support has baseline score for all messages
        score = 0.6;
        reasoning = 'General technical support capability';
        
        // Boost for technical keywords
        const technicalKeywords = [
          'technical', 'code', 'programming', 'software', 'hardware', 'system',
          'error', 'bug', 'fix', 'troubleshoot', 'configure', 'install'
        ];
        const technicalScore = technicalKeywords.reduce((s, keyword) => 
          lowerMessage.includes(keyword) ? s + 0.1 : s, 0
        );
        score = Math.min(score + technicalScore, 0.95);
        if (technicalScore > 0) {
          reasoning = `Technical support with specialized keywords (${score.toFixed(1)} total score)`;
        }
        break;

      default:
        // Generic capability scoring
        score = 0.3;
        reasoning = `Generic capability match for ${capability.name}`;
    }

    // Adjust score based on agent performance
    const reliabilityFactor = capability.reliability || 0.8;
    const loadFactor = 1 - (agent.metadata.load / 100);
    
    score = score * reliabilityFactor * loadFactor;
    
    return { score, reasoning };
  }

  /**
   * Get available agents from A2A protocol
   */
  private async getAvailableAgents(): Promise<AgentProfile[]> {
    try {
      return await this.a2aProtocol.discoverAgents();
    } catch (error) {
      console.warn(`[SupervisorAgent] Failed to discover agents:`, error);
      return [];
    }
  }

  /**
   * Estimate processing time for a capability
   */
  private estimateProcessingTime(capability: string, message: string): number {
    const baseTime = 10000; // 10 seconds base
    const messageComplexity = message.length / 100; // Factor based on message length
    
    const capabilityTime: Record<string, number> = {
      'technical-support': 15000,     // 15 seconds
      'ethical-analysis': 25000,      // 25 seconds
      'security-analysis': 30000,     // 30 seconds
      'creative-solutions': 35000     // 35 seconds
    };

    const estimatedTime = (capabilityTime[capability] || baseTime) * (1 + messageComplexity * 0.1);
    return Math.min(estimatedTime, 60000); // Max 60 seconds
  }

  /**
   * Create supervision message for user
   */
  private createSupervisionMessage(decision: SupervisorDecision): string {
    const agentName = this.getAgentDisplayName(decision.selectedAgent);
    const confidence = (decision.confidence * 100).toFixed(1);
    
    let message = `🎯 **Workflow Supervisor Decision**\n\n`;
    message += `**Selected Agent:** ${agentName}\n`;
    message += `**Confidence:** ${confidence}%\n`;
    message += `**Reasoning:** ${decision.reasoning}\n`;
    
    if (decision.estimatedDuration) {
      const duration = Math.round(decision.estimatedDuration / 1000);
      message += `**Estimated Duration:** ~${duration} seconds\n`;
    }
    
    if (decision.fallbackAgent) {
      const fallbackName = this.getAgentDisplayName(decision.fallbackAgent);
      message += `**Fallback Agent:** ${fallbackName}\n`;
    }
    
    message += `\n🚀 Routing your request to ${agentName} for specialized processing...`;
    
    return message;
  }

  /**
   * Get display name for agent
   */
  private getAgentDisplayName(agentId: string): string {
    const displayNames: Record<string, string> = {
      'vegapunk-001': 'Vegapunk (Technical Support)',
      'shaka-001': 'ShakaAgent (Ethical Analysis)',
      'atlas-001': 'AtlasAgent (Security Analysis)',
      'edison-001': 'EdisonAgent (Creative Solutions)'
    };
    return displayNames[agentId] || agentId;
  }

  /**
   * Conditional routing function for LangGraph
   */
  routeAgent(state: VegapunkGraphState): string {
    // Route to the agent specified by the supervisor
    if (state.nextAgent) {
      return this.mapAgentToNode(state.nextAgent);
    }
    
    // Default to Vegapunk
    return 'vegapunk_node';
  }

  /**
   * Map agent ID to LangGraph node name
   */
  private mapAgentToNode(agentId: string): string {
    const nodeMapping: Record<string, string> = {
      'vegapunk-001': 'vegapunk_node',
      'shaka-001': 'shaka_node',
      'atlas-001': 'atlas_node',
      'edison-001': 'edison_node'
    };
    return nodeMapping[agentId] || 'vegapunk_node';
  }

  /**
   * Get supervisor capabilities
   */
  getCapabilities(): string[] {
    return [
      'workflow-supervision',
      'agent-selection',
      'capability-matching',
      'load-balancing',
      'decision-making'
    ];
  }

  /**
   * Get supervisor metadata
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      agentId: this.agentId,
      name: 'Workflow Supervisor',
      type: 'coordinator',
      capabilities: this.getCapabilities(),
      description: 'Intelligent workflow coordinator that selects optimal agents based on capability matching and load balancing'
    };
  }
}