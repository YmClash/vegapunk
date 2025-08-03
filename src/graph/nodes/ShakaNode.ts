/**
 * Shaka Node - Ethical Analysis Agent Node for LangGraph
 * Specialized ethical analysis with multi-framework evaluation
 */

import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  VegapunkGraphState, 
  AgentResponse, 
  HandoffDecision,
  GraphNodeFunction 
} from '../types';
import { A2AMessage, A2AMessageType, A2APriority } from '../../a2a/types';

export class ShakaNode {
  private nodeId = 'shaka-node';
  private agentId = 'shaka-001';

  /**
   * Main node execution function for LangGraph
   */
  execute: GraphNodeFunction = async (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>> => {
    const startTime = Date.now();
    
    try {
      // Get the content to analyze (either from handoff or direct message)
      const contentToAnalyze = this.extractContentFromState(state);
      
      if (!contentToAnalyze) {
        throw new Error('No content found for ethical analysis');
      }

      // Perform ethical analysis
      const ethicalAnalysis = await this.performEthicalAnalysis(contentToAnalyze, state);
      
      // Check if we need to handoff to another agent
      const handoffDecision = await this.analyzeHandoffNeed(ethicalAnalysis, state);
      
      if (handoffDecision.shouldHandoff) {
        return this.createHandoffResponse(handoffDecision, ethicalAnalysis, state, startTime);
      }

      // Create comprehensive ethical response
      const responseMessage = this.createEthicalResponse(ethicalAnalysis, contentToAnalyze);
      
      const aiMessage = new AIMessage({
        content: responseMessage,
        additional_kwargs: {
          agent: this.agentId,
          capability: 'ethical-analysis',
          analysis: ethicalAnalysis,
          processingTime: Date.now() - startTime
        }
      });

      return {
        messages: [...state.messages, aiMessage],
        currentAgent: this.agentId,
        workflowStatus: 'completed',
        taskResults: state.taskResults.set('ethical-analysis', ethicalAnalysis),
        metadata: {
          ...state.metadata,
          currentStep: state.metadata.currentStep + 1,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error(`[ShakaNode] Execution error:`, error);
      
      const errorMessage = new AIMessage({
        content: `🚨 **Ethical Analysis Error**\n\nI encountered an issue while performing the ethical analysis: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try rephrasing your request or contact technical support.`,
        additional_kwargs: {
          agent: this.agentId,
          error: true,
          processingTime: Date.now() - startTime
        }
      });
      
      return {
        messages: [...state.messages, errorMessage],
        workflowStatus: 'error',
        metadata: {
          ...state.metadata,
          processingTime: Date.now() - startTime
        }
      };
    }
  };

  /**
   * Extract content to analyze from state
   */
  private extractContentFromState(state: VegapunkGraphState): string | null {
    // Check for A2A handoff message first
    const latestA2AMessage = state.a2aMessages[state.a2aMessages.length - 1];
    if (latestA2AMessage && latestA2AMessage.to === this.agentId) {
      return latestA2AMessage.payload?.originalMessage || latestA2AMessage.payload;
    }

    // Otherwise get latest human message
    const humanMessages = state.messages.filter(m => m.constructor.name === 'HumanMessage');
    const latestMessage = humanMessages[humanMessages.length - 1];
    
    return latestMessage?.content as string || null;
  }

  /**
   * Perform comprehensive ethical analysis
   */
  private async performEthicalAnalysis(content: string, state: VegapunkGraphState): Promise<any> {
    // Simulate ethical analysis using multiple frameworks
    // In a real implementation, this would use the actual ShakaAgent
    
    const frameworks = ['utilitarian', 'deontological', 'virtue', 'care'];
    const analysis: any = {
      content_analyzed: content,
      timestamp: new Date(),
      frameworks_used: frameworks,
      overall_compliance: 0,
      concerns: [],
      recommendations: [],
      detailed_analysis: {}
    };

    // Analyze with each framework
    for (const framework of frameworks) {
      const frameworkAnalysis = await this.analyzeWithFramework(content, framework);
      analysis.detailed_analysis[framework] = frameworkAnalysis;
      analysis.overall_compliance += frameworkAnalysis.compliance_score;
    }

    // Calculate overall compliance
    analysis.overall_compliance = analysis.overall_compliance / frameworks.length;

    // Identify concerns and recommendations
    if (analysis.overall_compliance < 0.7) {
      analysis.concerns.push({
        level: 'high',
        category: 'compliance',
        description: 'Low overall ethical compliance score detected',
        frameworks_affected: frameworks.filter(f => 
          analysis.detailed_analysis[f].compliance_score < 0.7
        )
      });

      analysis.recommendations.push(
        'Consider reviewing the ethical implications of the proposed action',
        'Consult with stakeholders about potential impacts',
        'Implement additional safeguards or oversight measures'
      );
    }

    // Check for specific ethical red flags
    const ethicalRedFlags = this.detectEthicalRedFlags(content);
    if (ethicalRedFlags.length > 0) {
      analysis.concerns.push(...ethicalRedFlags);
    }

    return analysis;
  }

  /**
   * Analyze content with specific ethical framework
   */
  private async analyzeWithFramework(content: string, framework: string): Promise<any> {
    const lowerContent = content.toLowerCase();
    
    const frameworkAnalysis: any = {
      framework,
      compliance_score: 0.8, // Default neutral score
      key_considerations: [],
      potential_issues: [],
      recommendations: []
    };

    switch (framework) {
      case 'utilitarian':
        frameworkAnalysis.key_considerations = [
          'Greatest good for the greatest number',
          'Consequence-based evaluation',
          'Maximizing overall benefit'
        ];
        
        // Check for utilitarian concerns
        if (lowerContent.includes('harm') || lowerContent.includes('damage')) {
          frameworkAnalysis.compliance_score = 0.4;
          frameworkAnalysis.potential_issues.push('Potential for causing harm detected');
        }
        break;

      case 'deontological':
        frameworkAnalysis.key_considerations = [
          'Duty-based ethics',
          'Universal moral rules',
          'Rights and obligations'
        ];
        
        // Check for deontological concerns
        if (lowerContent.includes('lie') || lowerContent.includes('deceive')) {
          frameworkAnalysis.compliance_score = 0.3;
          frameworkAnalysis.potential_issues.push('Potential deception detected');
        }
        break;

      case 'virtue':
        frameworkAnalysis.key_considerations = [
          'Character-based ethics',
          'Moral virtues and excellences',
          'What would a virtuous person do?'
        ];
        
        // Check for virtue ethics concerns
        if (lowerContent.includes('cheat') || lowerContent.includes('unfair')) {
          frameworkAnalysis.compliance_score = 0.5;
          frameworkAnalysis.potential_issues.push('Potential character issues detected');
        }
        break;

      case 'care':
        frameworkAnalysis.key_considerations = [
          'Relationships and care',
          'Contextual and emotional considerations',
          'Responsibility for others'
        ];
        
        // Check for care ethics concerns
        if (lowerContent.includes('neglect') || lowerContent.includes('abandon')) {
          frameworkAnalysis.compliance_score = 0.4;
          frameworkAnalysis.potential_issues.push('Potential care relationship issues detected');
        }
        break;
    }

    return frameworkAnalysis;
  }

  /**
   * Detect ethical red flags in content
   */
  private detectEthicalRedFlags(content: string): any[] {
    const redFlags = [];
    const lowerContent = content.toLowerCase();

    const dangerousKeywords = [
      'illegal', 'violence', 'harmful', 'discriminat', 'bias', 'unfair',
      'exploit', 'manipulat', 'deceiv', 'fraud', 'abuse'
    ];

    for (const keyword of dangerousKeywords) {
      if (lowerContent.includes(keyword)) {
        redFlags.push({
          level: 'critical',
          category: 'red_flag',
          description: `Potentially problematic content detected: ${keyword}`,
          keyword,
          recommendation: 'Immediate review required'
        });
      }
    }

    return redFlags;
  }

  /**
   * Analyze if handoff to another agent is needed
   */
  private async analyzeHandoffNeed(ethicalAnalysis: any, state: VegapunkGraphState): Promise<HandoffDecision> {
    // Check if security concerns require Atlas
    const hasSecurityConcerns = ethicalAnalysis.concerns.some((concern: any) => 
      concern.category === 'security' || 
      concern.description.toLowerCase().includes('security')
    );

    if (hasSecurityConcerns && state.availableAgents.includes('atlas-001')) {
      return {
        shouldHandoff: true,
        targetAgent: 'atlas-001',
        reason: 'Ethical analysis revealed security concerns that require specialized security expertise',
        confidence: 0.8,
        context: {
          ethicalAnalysis,
          securityConcerns: ethicalAnalysis.concerns.filter((c: any) => 
            c.category === 'security'
          )
        }
      };
    }

    // Check if creative solutions are needed for ethical dilemmas
    const hasComplexDilemma = ethicalAnalysis.overall_compliance < 0.5 || 
                             ethicalAnalysis.concerns.length > 2;

    if (hasComplexDilemma && state.availableAgents.includes('edison-001')) {
      return {
        shouldHandoff: true,
        targetAgent: 'edison-001',
        reason: 'Complex ethical dilemma detected that may benefit from creative alternative solutions',
        confidence: 0.7,
        context: {
          ethicalAnalysis,
          complexityScore: 1 - ethicalAnalysis.overall_compliance
        }
      };
    }

    // No handoff needed - Shaka can complete the analysis
    return {
      shouldHandoff: false,
      reason: 'Ethical analysis complete within ShakaAgent capabilities',
      confidence: 0.9
    };
  }

  /**
   * Create handoff response
   */
  private createHandoffResponse(
    handoff: HandoffDecision,
    ethicalAnalysis: any,
    state: VegapunkGraphState,
    startTime: number
  ): Partial<VegapunkGraphState> {
    // Create A2A message for handoff
    const a2aMessage: A2AMessage = {
      id: `ethical-handoff-${Date.now()}`,
      from: this.agentId,
      to: handoff.targetAgent!,
      type: A2AMessageType.TASK_DELEGATE,
      payload: {
        ethicalAnalysis,
        originalContent: this.extractContentFromState(state),
        context: handoff.context,
        reason: handoff.reason,
        priority: 'high' as A2APriority
      },
      timestamp: new Date(),
      priority: 'high' as A2APriority,
      correlationId: state.sessionId
    };

    // Create handoff message
    const handoffMessage = new AIMessage({
      content: this.createEthicalHandoffMessage(handoff, ethicalAnalysis),
      additional_kwargs: {
        agent: this.agentId,
        handoff: true,
        targetAgent: handoff.targetAgent,
        ethicalAnalysis: ethicalAnalysis
      }
    });

    return {
      messages: [...state.messages, handoffMessage],
      currentAgent: handoff.targetAgent!,
      nextAgent: handoff.targetAgent!,
      a2aMessages: [...state.a2aMessages, a2aMessage],
      taskResults: state.taskResults.set('ethical-analysis', ethicalAnalysis),
      workflowStatus: 'running',
      metadata: {
        ...state.metadata,
        currentStep: state.metadata.currentStep + 1,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * Create comprehensive ethical response
   */
  private createEthicalResponse(ethicalAnalysis: any, originalContent: string): string {
    const complianceEmoji = ethicalAnalysis.overall_compliance >= 0.8 ? '✅' : 
                           ethicalAnalysis.overall_compliance >= 0.6 ? '⚠️' : '🚨';
    
    let response = `🧠 **ShakaAgent Ethical Analysis** ${complianceEmoji}\n\n`;
    
    // Overall assessment
    response += `**Overall Compliance Score:** ${(ethicalAnalysis.overall_compliance * 100).toFixed(1)}%\n\n`;
    
    // Framework analysis
    response += `**Multi-Framework Analysis:**\n`;
    for (const [framework, analysis] of Object.entries(ethicalAnalysis.detailed_analysis)) {
      const frameworkData = analysis as any;
      const score = (frameworkData.compliance_score * 100).toFixed(1);
      response += `• **${framework.charAt(0).toUpperCase() + framework.slice(1)}:** ${score}%\n`;
    }
    response += '\n';
    
    // Concerns
    if (ethicalAnalysis.concerns.length > 0) {
      response += `**⚠️ Ethical Concerns Identified:**\n`;
      ethicalAnalysis.concerns.forEach((concern: any, index: number) => {
        response += `${index + 1}. **${concern.level?.toUpperCase() || 'CONCERN'}:** ${concern.description}\n`;
      });
      response += '\n';
    }
    
    // Recommendations
    if (ethicalAnalysis.recommendations.length > 0) {
      response += `**💡 Recommendations:**\n`;
      ethicalAnalysis.recommendations.forEach((rec: string, index: number) => {
        response += `${index + 1}. ${rec}\n`;
      });
      response += '\n';
    }
    
    // Summary
    if (ethicalAnalysis.overall_compliance >= 0.8) {
      response += `**✅ Summary:** The analyzed content demonstrates strong ethical compliance across multiple frameworks.`;
    } else if (ethicalAnalysis.overall_compliance >= 0.6) {
      response += `**⚠️ Summary:** The content shows moderate ethical compliance with some areas for improvement.`;
    } else {
      response += `**🚨 Summary:** Significant ethical concerns identified. Careful consideration and review recommended.`;
    }

    return response;
  }

  /**
   * Create ethical handoff message
   */
  private createEthicalHandoffMessage(handoff: HandoffDecision, ethicalAnalysis: any): string {
    const complianceEmoji = ethicalAnalysis.overall_compliance >= 0.8 ? '✅' : 
                           ethicalAnalysis.overall_compliance >= 0.6 ? '⚠️' : '🚨';
    
    let message = `🧠 **ShakaAgent Ethical Analysis Complete** ${complianceEmoji}\n\n`;
    
    message += `**Overall Compliance:** ${(ethicalAnalysis.overall_compliance * 100).toFixed(1)}%\n`;
    message += `**Concerns Identified:** ${ethicalAnalysis.concerns.length}\n\n`;
    
    message += `🔄 **Handoff to ${this.getAgentName(handoff.targetAgent!)}**\n\n`;
    message += `${handoff.reason}\n\n`;
    message += `Transferring analysis results and context for specialized ${this.getAgentSpecialty(handoff.targetAgent!)}...`;

    return message;
  }

  /**
   * Get friendly agent name
   */
  private getAgentName(agentId: string): string {
    const agentNames: Record<string, string> = {
      'atlas-001': 'AtlasAgent',
      'edison-001': 'EdisonAgent',
      'vegapunk-001': 'Vegapunk'
    };
    return agentNames[agentId] || agentId;
  }

  /**
   * Get agent specialty
   */
  private getAgentSpecialty(agentId: string): string {
    const specialties: Record<string, string> = {
      'atlas-001': 'security analysis',
      'edison-001': 'creative problem solving',
      'vegapunk-001': 'technical support'
    };
    return specialties[agentId] || 'analysis';
  }

  /**
   * Get node capabilities
   */
  getCapabilities(): string[] {
    return [
      'ethical-analysis',
      'multi-framework-evaluation',
      'compliance-scoring',
      'risk-assessment',
      'recommendation-generation'
    ];
  }

  /**
   * Get node metadata
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      agentId: this.agentId,
      name: 'ShakaAgent Ethical Analysis',
      type: 'ethical',
      capabilities: this.getCapabilities(),
      description: 'Specialized ethical analysis using multiple moral frameworks with intelligent handoff capabilities'
    };
  }
}