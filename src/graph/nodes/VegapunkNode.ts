/**
 * Vegapunk Node - Technical Support Agent Node for LangGraph
 * Main technical assistant with LLM provider integration
 */

import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  VegapunkGraphState, 
  AgentResponse, 
  HandoffDecision,
  GraphNodeFunction 
} from '../types';
import { A2AMessage, A2AMessageType, A2APriority } from '../../a2a/types';
import { ChatHandler } from '../../chat/ChatHandler';

export class VegapunkNode {
  private chatHandler: ChatHandler;
  private nodeId = 'vegapunk-node';
  private agentId = 'vegapunk-001';

  constructor(chatHandler: ChatHandler) {
    this.chatHandler = chatHandler;
  }

  /**
   * Main node execution function for LangGraph
   */
  execute: GraphNodeFunction = async (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>> => {
    const startTime = Date.now();
    
    try {
      // Get the latest human message
      const humanMessages = state.messages.filter(m => m.constructor.name === 'HumanMessage');
      const latestMessage = humanMessages[humanMessages.length - 1];
      
      if (!latestMessage) {
        throw new Error('No human message found in state');
      }

      // Analyze if this requires handoff to another agent
      const handoffDecision = await this.analyzeHandoffNeed(latestMessage.content as string, state);
      
      if (handoffDecision.shouldHandoff) {
        return this.createHandoffResponse(handoffDecision, state, startTime);
      }

      // Process the message with Vegapunk's technical capabilities
      const response = await this.processVegapunkMessage(latestMessage.content as string, state);
      
      // Create AI response message
      const aiMessage = new AIMessage({
        content: response.data?.message || response.data || 'Processing complete',
        additional_kwargs: {
          agent: this.agentId,
          capability: 'technical-support',
          processingTime: Date.now() - startTime
        }
      });

      return {
        messages: [...state.messages, aiMessage],
        currentAgent: this.agentId,
        workflowStatus: 'completed',
        metadata: {
          ...state.metadata,
          currentStep: state.metadata.currentStep + 1,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error(`[VegapunkNode] Execution error:`, error);
      
      return {
        workflowStatus: 'error',
        metadata: {
          ...state.metadata,
          processingTime: Date.now() - startTime
        }
      };
    }
  };

  /**
   * Analyze if the message needs to be handed off to another agent
   */
  private async analyzeHandoffNeed(message: string, state: VegapunkGraphState): Promise<HandoffDecision> {
    const lowerMessage = message.toLowerCase();
    
    // Ethical analysis keywords
    const ethicalKeywords = [
      'ethical', 'ethics', 'moral', 'right', 'wrong', 'should', 'shouldn\'t',
      'appropriate', 'inappropriate', 'bias', 'fairness', 'responsibility',
      'harmful', 'beneficial', 'consequences', 'values', 'principles'
    ];
    
    // Security analysis keywords
    const securityKeywords = [
      'security', 'secure', 'vulnerability', 'attack', 'breach', 'hack',
      'malware', 'threat', 'risk', 'encryption', 'authentication',
      'authorization', 'firewall', 'penetration', 'exploit'
    ];
    
    // Creative/innovation keywords
    const creativeKeywords = [
      'creative', 'innovation', 'brainstorm', 'idea', 'design', 'concept',
      'solution', 'alternative', 'improve', 'optimize', 'enhance',
      'invent', 'develop', 'prototype', 'experiment'
    ];

    // Check for ethical handoff
    const ethicalScore = ethicalKeywords.reduce((score, keyword) => 
      lowerMessage.includes(keyword) ? score + 1 : score, 0
    );
    
    if (ethicalScore >= 2) {
      return {
        shouldHandoff: true,
        targetAgent: 'shaka-001',
        reason: `Message contains ethical considerations (${ethicalScore} ethical keywords detected)`,
        confidence: Math.min(ethicalScore / ethicalKeywords.length, 0.9),
        context: { keywords: ethicalKeywords.filter(k => lowerMessage.includes(k)) }
      };
    }

    // Check for security handoff (when Atlas is available)
    const securityScore = securityKeywords.reduce((score, keyword) => 
      lowerMessage.includes(keyword) ? score + 1 : score, 0
    );
    
    if (securityScore >= 2 && state.availableAgents.includes('atlas-001')) {
      return {
        shouldHandoff: true,
        targetAgent: 'atlas-001',
        reason: `Message contains security concerns (${securityScore} security keywords detected)`,
        confidence: Math.min(securityScore / securityKeywords.length, 0.9),
        context: { keywords: securityKeywords.filter(k => lowerMessage.includes(k)) }
      };
    }

    // Check for creative handoff (when Edison is available)
    const creativeScore = creativeKeywords.reduce((score, keyword) => 
      lowerMessage.includes(keyword) ? score + 1 : score, 0
    );
    
    if (creativeScore >= 2 && state.availableAgents.includes('edison-001')) {
      return {
        shouldHandoff: true,
        targetAgent: 'edison-001',
        reason: `Message requires creative thinking (${creativeScore} creativity keywords detected)`,
        confidence: Math.min(creativeScore / creativeKeywords.length, 0.9),
        context: { keywords: creativeKeywords.filter(k => lowerMessage.includes(k)) }
      };
    }

    // No handoff needed - Vegapunk can handle this
    return {
      shouldHandoff: false,
      reason: 'Message is within Vegapunk\'s technical support capabilities',
      confidence: 0.8
    };
  }

  /**
   * Process message with Vegapunk's technical capabilities
   */
  private async processVegapunkMessage(message: string, state: VegapunkGraphState): Promise<AgentResponse> {
    try {
      // Use existing ChatHandler to process the message
      const response = await this.chatHandler.processMessage(message, state.sessionId);
      
      return {
        agentId: this.agentId,
        success: true,
        data: response,
        metadata: {
          processingTime: Date.now(),
          capability: 'technical-support',
          confidence: 0.85
        }
      };
      
    } catch (error) {
      console.error(`[VegapunkNode] Processing error:`, error);
      
      return {
        agentId: this.agentId,
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        metadata: {
          processingTime: Date.now(),
          capability: 'technical-support'
        }
      };
    }
  }

  /**
   * Create handoff response for another agent
   */
  private createHandoffResponse(
    handoff: HandoffDecision, 
    state: VegapunkGraphState, 
    startTime: number
  ): Partial<VegapunkGraphState> {
    // Create A2A message for handoff
    const a2aMessage: A2AMessage = {
      id: `handoff-${Date.now()}`,
      from: this.agentId,
      to: handoff.targetAgent!,
      type: A2AMessageType.TASK_DELEGATE,
      payload: {
        originalMessage: state.messages[state.messages.length - 1]?.content,
        context: handoff.context,
        reason: handoff.reason,
        priority: 'normal' as A2APriority
      },
      timestamp: new Date(),
      priority: 'normal' as A2APriority,
      correlationId: state.sessionId
    };

    // Add handoff message to inform user
    const handoffMessage = new AIMessage({
      content: `🔄 **Handoff to ${this.getAgentName(handoff.targetAgent!)}**\n\n` +
                `${handoff.reason}\n\n` +
                `Transferring your request to our ${this.getAgentSpecialty(handoff.targetAgent!)} for specialized assistance...`,
      additional_kwargs: {
        agent: this.agentId,
        handoff: true,
        targetAgent: handoff.targetAgent,
        confidence: handoff.confidence
      }
    });

    return {
      messages: [...state.messages, handoffMessage],
      currentAgent: handoff.targetAgent!,
      nextAgent: handoff.targetAgent!,
      a2aMessages: [...state.a2aMessages, a2aMessage],
      workflowStatus: 'running',
      metadata: {
        ...state.metadata,
        currentStep: state.metadata.currentStep + 1,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * Get friendly agent name for display
   */
  private getAgentName(agentId: string): string {
    const agentNames: Record<string, string> = {
      'shaka-001': 'ShakaAgent',
      'atlas-001': 'AtlasAgent', 
      'edison-001': 'EdisonAgent',
      'vegapunk-001': 'Vegapunk'
    };
    return agentNames[agentId] || agentId;
  }

  /**
   * Get agent specialty description
   */
  private getAgentSpecialty(agentId: string): string {
    const specialties: Record<string, string> = {
      'shaka-001': 'ethical analysis specialist',
      'atlas-001': 'security analysis expert',
      'edison-001': 'innovation and creativity consultant',
      'vegapunk-001': 'technical support specialist'
    };
    return specialties[agentId] || 'specialist';
  }

  /**
   * Get node capabilities
   */
  getCapabilities(): string[] {
    return [
      'technical-support',
      'llm-interaction',
      'general-assistance',
      'handoff-coordination',
      'workflow-management'
    ];
  }

  /**
   * Get node metadata
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      agentId: this.agentId,
      name: 'Vegapunk Technical Support',
      type: 'technical',
      capabilities: this.getCapabilities(),
      description: 'Main technical support agent with LLM integration and intelligent handoff capabilities'
    };
  }
}