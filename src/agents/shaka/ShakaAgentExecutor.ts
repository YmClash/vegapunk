import { AgentExecutor, AgentTask, AgentResponse } from '../types/AgentTypes';
import { EthicalPolicyEngine } from './EthicalPolicyEngine';
import { ConflictResolver } from './ConflictResolver';
import { ProactiveMonitor } from './ProactiveMonitor';
import {
  EthicalAnalysisResult,
  ConflictAnalysis,
  ResolutionOption,
  EthicalAssessment
} from './ShakaAgentTypes';
import type { OllamaProvider } from '@/llm/OllamaProvider';
import type { HuggingFaceProvider } from '@/llm/HuggingFaceProvider';

type LLMProvider = OllamaProvider | HuggingFaceProvider;

export class ShakaAgentExecutor implements AgentExecutor {
  private ethicalEngine: EthicalPolicyEngine;
  private conflictResolver: ConflictResolver;
  private proactiveMonitor: ProactiveMonitor;
  private a2aProtocol: any;

  constructor(a2aProtocol: any, llmProvider?: LLMProvider) {
    this.a2aProtocol = a2aProtocol;
    
    // Use fallback provider if none provided (for backward compatibility)
    if (llmProvider) {
      this.ethicalEngine = new EthicalPolicyEngine(llmProvider);
      this.conflictResolver = new ConflictResolver(llmProvider);
      this.proactiveMonitor = new ProactiveMonitor(llmProvider);
    } else {
      // Create stub implementations for when no provider is available
      this.ethicalEngine = new EthicalPolicyEngine(null as any);
      this.conflictResolver = new ConflictResolver(null as any);
      this.proactiveMonitor = new ProactiveMonitor(null as any);
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    console.log(`[Shaka] Executing task: ${task.skill}`);
    
    try {
      switch (task.skill) {
        case 'multi_framework_analysis':
          return await this.handleMultiFrameworkAnalysis(task);
        
        case 'ethical_conflict_resolution':
          return await this.handleConflictResolution(task);
        
        case 'ethical_risk_assessment':
          return await this.handleRiskAssessment(task);
        
        case 'ethical_monitoring':
          return await this.handleEthicalMonitoring(task);
        
        case 'inter_agent_consultation':
          return await this.handleInterAgentConsultation(task);
        
        default:
          return {
            success: false,
            error: `Unknown skill: ${task.skill}`,
            data: null
          };
      }
    } catch (error: any) {
      console.error(`[Shaka] Task execution error:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  private async handleMultiFrameworkAnalysis(task: AgentTask): Promise<AgentResponse> {
    const { content, frameworks = ['all'], context } = task.input;
    
    // Perform ethical analysis using existing engine
    const analysis = await this.ethicalEngine.analyzeContent(content, {
      frameworks: frameworks === ['all'] ? 
        ['utilitarian', 'deontological', 'virtue', 'care'] : 
        frameworks,
      context
    });

    // Generate recommendations
    const recommendations = await this.generateEthicalRecommendations(analysis);

    // Create response with artifacts
    return {
      success: true,
      data: {
        analysis: analysis,
        recommendations: recommendations,
        ethicalScore: analysis.overallScore,
        concerns: analysis.concerns,
        frameworks_applied: analysis.frameworkResults
      },
      artifacts: [{
        type: 'ethical_analysis_report',
        title: `Ethical Analysis Report - ${new Date().toISOString()}`,
        content: this.generateAnalysisReport(analysis, recommendations)
      }]
    };
  }

  private async handleConflictResolution(task: AgentTask): Promise<AgentResponse> {
    const { conflict_description, parties, resolution_strategy } = task.input;
    
    // Analyze the conflict using existing resolver
    const conflictAnalysis = await this.conflictResolver.analyzeConflict({
      description: conflict_description,
      stakeholders: parties || [],
      context: task.context
    });

    // Generate resolution options
    const resolutionOptions = await this.conflictResolver.generateResolutions(
      conflictAnalysis,
      resolution_strategy
    );

    // Evaluate each option ethically
    const evaluatedOptions = await this.evaluateResolutionOptions(resolutionOptions);

    return {
      success: true,
      data: {
        conflict_analysis: conflictAnalysis,
        resolution_options: evaluatedOptions,
        recommended_solution: evaluatedOptions[0],
        ethical_assessment: {
          fairness_score: this.calculateFairnessScore(evaluatedOptions[0]),
          harm_minimization: this.assessHarmMinimization(evaluatedOptions[0])
        }
      },
      artifacts: [{
        type: 'conflict_resolution_report',
        title: 'Ethical Conflict Resolution Analysis',
        content: this.generateConflictReport(conflictAnalysis, evaluatedOptions)
      }]
    };
  }

  private async handleRiskAssessment(task: AgentTask): Promise<AgentResponse> {
    const { proposal, impact_scope, risk_tolerance } = task.input;
    
    // Assess ethical risks
    const riskAnalysis = await this.ethicalEngine.assessRisks(proposal, {
      scope: impact_scope,
      tolerance: risk_tolerance || 0.5
    });

    // Check if we need security consultation
    if (riskAnalysis.requiresSecurityReview) {
      const securityAssessment = await this.consultAtlas({
        proposal: proposal,
        risks: riskAnalysis.risks
      });
      riskAnalysis.securityAssessment = securityAssessment;
    }

    return {
      success: true,
      data: {
        risk_level: riskAnalysis.overallRisk,
        identified_risks: riskAnalysis.risks,
        mitigation_strategies: riskAnalysis.mitigations,
        approval_recommendation: riskAnalysis.approved,
        security_consultation: riskAnalysis.securityAssessment
      },
      artifacts: [{
        type: 'risk_assessment_report',
        title: 'Ethical Risk Assessment',
        content: this.generateRiskReport(riskAnalysis)
      }]
    };
  }

  private async handleEthicalMonitoring(task: AgentTask): Promise<AgentResponse> {
    const { monitoring_scope, alert_conditions, reporting_frequency } = task.input;
    
    // Configure monitoring
    await this.proactiveMonitor.configure({
      scope: monitoring_scope || ['all'],
      conditions: alert_conditions || [],
      frequency: reporting_frequency || 'realtime'
    });

    // Get current status
    const monitoringStatus = await this.proactiveMonitor.getStatus();

    return {
      success: true,
      data: {
        monitoring_active: true,
        current_alerts: monitoringStatus.activeAlerts,
        recent_incidents: monitoringStatus.recentIncidents,
        compliance_status: monitoringStatus.complianceLevel,
        next_report: monitoringStatus.nextReportTime
      }
    };
  }

  private async handleInterAgentConsultation(task: AgentTask): Promise<AgentResponse> {
    const { requesting_agent, action_type, ethical_concerns } = task.input;
    
    // Quick ethical assessment for agent actions
    const assessment: EthicalAssessment = await this.ethicalEngine.quickAssessment({
      action: action_type,
      concerns: ethical_concerns || [],
      requestor: requesting_agent
    });

    // Check if we need to consult with other agents
    if (assessment.requiresSecurityReview) {
      // Consult Atlas for security implications
      const securityInput = await this.consultAtlas({
        action: action_type,
        ethical_flags: assessment.flags
      });
      assessment.securityConsultation = securityInput;
    }

    // Check if innovation is needed for ethical solution
    if (assessment.riskLevel === 'high' || assessment.riskLevel === 'unacceptable') {
      const innovationInput = await this.consultEdison({
        ethical_challenge: action_type,
        constraints: assessment.constraints
      });
      assessment.innovativeAlternatives = innovationInput;
    }

    return {
      success: true,
      data: {
        ethical_clearance: assessment.approved,
        risk_level: assessment.riskLevel,
        recommendations: assessment.recommendations,
        constraints: assessment.constraints,
        monitoring_required: assessment.requiresMonitoring,
        alternative_approaches: assessment.innovativeAlternatives
      }
    };
  }

  private async consultAtlas(params: any): Promise<any> {
    // Use A2A protocol to consult Atlas
    try {
      const response = await this.a2aProtocol.sendMessage({
        from: 'shaka-001',
        to: 'atlas-001',
        type: 'TASK_REQUEST',
        payload: {
          capability: 'security_consultation',
          params: params
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('[Shaka] Atlas consultation failed:', error);
      return null;
    }
  }

  private async consultEdison(params: any): Promise<any> {
    // Use A2A protocol to consult Edison
    try {
      const response = await this.a2aProtocol.sendMessage({
        from: 'shaka-001',
        to: 'edison-001',
        type: 'TASK_REQUEST',
        payload: {
          capability: 'innovative_solutions',
          params: params
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('[Shaka] Edison consultation failed:', error);
      return null;
    }
  }

  private async generateEthicalRecommendations(analysis: EthicalAnalysisResult): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (analysis.concerns.length > 0) {
      // Add specific recommendations for each concern
      for (const concern of analysis.concerns) {
        const rec = await this.ethicalEngine.generateRecommendation(concern);
        recommendations.push(rec);
      }
    }
    
    // Add general best practices
    recommendations.push(...await this.ethicalEngine.getBestPractices(analysis.context));
    
    return recommendations;
  }

  private async evaluateResolutionOptions(options: any[]): Promise<ResolutionOption[]> {
    const evaluated: ResolutionOption[] = [];
    
    for (const option of options) {
      const ethicalScore = await this.ethicalEngine.scoreResolution(option);
      const fairness = this.calculateFairnessScore(option);
      const harm = this.assessHarmMinimization(option);
      
      evaluated.push({
        id: option.id || Date.now().toString(),
        approach: option.approach,
        description: option.description,
        ethicalScore: ethicalScore,
        fairnessScore: fairness,
        harmMinimization: harm,
        tradeoffs: option.tradeoffs || [],
        implementation: option.steps || [],
        consensusProbability: option.consensusChance || 0.5
      });
    }
    
    // Sort by ethical score
    return evaluated.sort((a, b) => b.ethicalScore - a.ethicalScore);
  }

  private calculateFairnessScore(option: any): number {
    // Simplified fairness calculation
    return option.fairness || 0.75;
  }

  private assessHarmMinimization(option: any): number {
    // Simplified harm assessment
    return option.harmReduction || 0.8;
  }

  private generateAnalysisReport(analysis: EthicalAnalysisResult, recommendations: string[]): string {
    return `
# Ethical Analysis Report

## Executive Summary
- Overall Ethical Score: ${analysis.overallScore}/100
- Primary Concerns: ${analysis.concerns.length}
- Recommendations: ${recommendations.length}

## Framework Analysis
${Object.entries(analysis.frameworkResults).map(([framework, result]: [string, any]) => `
### ${framework}
- Score: ${result.score}/100
- Key Findings: ${result.findings.join(', ')}
- Recommendations: ${result.recommendations.join(', ')}
`).join('\n')}

## Ethical Risks
${analysis.ethicalRisks.map(risk => `
- **${risk.risk}** (${risk.severity})
  - Mitigation: ${risk.mitigation}
`).join('\n')}

## Recommendations
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Conclusion
${analysis.conclusion}

---
Generated by ShakaAgent v2.0 - ${new Date().toISOString()}
    `.trim();
  }

  private generateConflictReport(analysis: ConflictAnalysis, options: ResolutionOption[]): string {
    return `
# Ethical Conflict Resolution Report

## Conflict Overview
- Type: ${analysis.type}
- Severity: ${analysis.severity}/10
- Urgency: ${analysis.urgency}
- Affected Parties: ${analysis.affectedParties.join(', ')}

## Description
${analysis.description}

## Ethical Principles at Stake
${analysis.ethicalPrinciples.map(p => `- ${p}`).join('\n')}

## Resolution Options

${options.map((option, i) => `
### Option ${i + 1}: ${option.approach}
- **Description**: ${option.description}
- **Ethical Score**: ${option.ethicalScore}/100
- **Fairness Score**: ${option.fairnessScore}/100
- **Harm Minimization**: ${option.harmMinimization}/100
- **Consensus Probability**: ${(option.consensusProbability * 100).toFixed(1)}%

**Tradeoffs**:
${option.tradeoffs.map(t => `- ${t}`).join('\n')}

**Implementation Steps**:
${option.implementation.map((step, j) => `${j + 1}. ${step}`).join('\n')}
`).join('\n')}

## Recommendation
We recommend **${options[0].approach}** as it achieves the highest ethical score while balancing fairness and harm minimization.

---
Generated by ShakaAgent v2.0 - ${new Date().toISOString()}
    `.trim();
  }

  private generateRiskReport(analysis: any): string {
    return `
# Ethical Risk Assessment Report

## Overall Risk Level: ${analysis.overallRisk}

## Approval Recommendation: ${analysis.approved ? 'APPROVED with conditions' : 'NOT APPROVED'}

## Identified Risks
${analysis.risks.map((risk: any) => `
### ${risk.category}: ${risk.description}
- **Severity**: ${risk.severity}
- **Likelihood**: ${risk.likelihood}
- **Impact**: ${risk.impact}
- **Mitigation**: ${risk.mitigation}
`).join('\n')}

## Mitigation Strategies
${analysis.mitigations.map((strategy: any, i: number) => `
${i + 1}. **${strategy.title}**
   - ${strategy.description}
   - Effectiveness: ${strategy.effectiveness}
   - Implementation Difficulty: ${strategy.difficulty}
`).join('\n')}

${analysis.securityAssessment ? `
## Security Consultation
${JSON.stringify(analysis.securityAssessment, null, 2)}
` : ''}

## Conditions for Approval
${analysis.conditions?.map((condition: string) => `- ${condition}`).join('\n') || 'N/A'}

---
Generated by ShakaAgent v2.0 - ${new Date().toISOString()}
    `.trim();
  }

  async getStatus(): Promise<any> {
    return {
      executor: 'ShakaAgentExecutor',
      version: '2.0.0',
      ethicalEngine: await this.ethicalEngine.getStatus(),
      conflictResolver: this.conflictResolver.getStatus(),
      proactiveMonitor: await this.proactiveMonitor.getStatus()
    };
  }
}