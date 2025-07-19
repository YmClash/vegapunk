/**
 * Ethical Policy Engine for Shaka Agent
 * Implements multi-framework ethical reasoning
 * Following Anthropic's transparency and safety principles
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type { LLMProvider, LLMRequest } from '@utils/llm/LLMProvider';

export interface EthicalPolicy {
  id: string;
  name: string;
  description: string;
  framework: 'utilitarian' | 'deontological' | 'virtue_ethics' | 'care_ethics';
  priority: number; // 1-10
  rules: string[];
  validator?: (context: unknown) => Promise<number>; // 0-1 compliance score
}

export interface EthicalAnalysis {
  compliance: number; // 0-1 overall compliance
  concerns: EthicalConcern[];
  recommendations: string[];
  reasoning: string;
  frameworkAnalyses: FrameworkAnalysis[];
}

export interface EthicalConcern {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPolicies: string[];
  suggestedActions: string[];
}

export interface FrameworkAnalysis {
  framework: string;
  score: number; // 0-1
  reasoning: string;
  keyPoints: string[];
}

export interface EthicalContext {
  action?: string;
  intent?: string;
  consequences?: string[];
  stakeholders?: string[];
  data?: unknown;
  metadata?: Record<string, unknown>;
}

export class EthicalPolicyEngine {
  private readonly logger = createLogger('EthicalPolicyEngine');
  private readonly llmProvider: LLMProvider;
  private readonly policies: Map<string, EthicalPolicy> = new Map();
  
  // Track policy adaptations
  private policyHistory: Map<string, EthicalPolicy[]> = new Map();

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
    this.initializeDefaultPolicies();
    
    this.logger.info('Ethical Policy Engine initialized', {
      policiesCount: this.policies.size,
      llmProvider: llmProvider.getProviderName(),
    });
  }

  /**
   * Perform comprehensive ethical analysis
   */
  public async analyzeContext(context: EthicalContext): Promise<EthicalAnalysis> {
    this.logger.debug('Starting ethical analysis', { context });

    // Run analysis through multiple ethical frameworks
    const frameworkAnalyses = await Promise.all([
      this.utilitarianAnalysis(context),
      this.deontologicalAnalysis(context),
      this.virtueEthicsAnalysis(context),
      this.careEthicsAnalysis(context),
    ]);

    // Evaluate against policies
    const policyEvaluations = await this.evaluateAgainstPolicies(context);

    // Calculate overall compliance
    const compliance = this.calculateOverallCompliance(frameworkAnalyses, policyEvaluations);

    // Identify concerns
    const concerns = this.identifyConcerns(frameworkAnalyses, policyEvaluations);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(context, concerns);

    // Generate reasoning
    const reasoning = await this.generateReasoning(context, frameworkAnalyses);

    return {
      compliance,
      concerns,
      recommendations,
      reasoning,
      frameworkAnalyses,
    };
  }

  /**
   * Quick ethical check for time-sensitive decisions
   */
  public async quickEthicalCheck(context: EthicalContext): Promise<{
    approved: boolean;
    confidence: number;
    criticalIssues: string[];
  }> {
    // Check against critical policies only
    const criticalPolicies = Array.from(this.policies.values())
      .filter(p => p.priority >= 8);

    const evaluations = await Promise.all(
      criticalPolicies.map(policy => this.evaluatePolicy(policy, context)),
    );

    const minCompliance = Math.min(...evaluations.map(e => e.score));
    const criticalIssues = evaluations
      .filter(e => e.score < 0.7)
      .map(e => `${e.policy.name}: ${e.reasoning}`);

    return {
      approved: minCompliance >= 0.7,
      confidence: minCompliance,
      criticalIssues,
    };
  }

  /**
   * Add or update an ethical policy
   */
  public addPolicy(policy: EthicalPolicy): void {
    // Store history
    const existing = this.policies.get(policy.id);
    if (existing) {
      const history = this.policyHistory.get(policy.id) ?? [];
      history.push(existing);
      this.policyHistory.set(policy.id, history);
    }

    this.policies.set(policy.id, policy);
    this.logger.info('Policy added/updated', { policyId: policy.id, name: policy.name });
  }

  /**
   * Remove a policy
   */
  public removePolicy(policyId: string): boolean {
    const removed = this.policies.delete(policyId);
    if (removed) {
      this.logger.info('Policy removed', { policyId });
    }
    return removed;
  }

  /**
   * Get all policies
   */
  public getPolicies(): EthicalPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Learn from ethical decisions and outcomes
   */
  public async learnFromOutcome(
    context: EthicalContext,
    analysis: EthicalAnalysis,
    actualOutcome: {
      success: boolean;
      consequences: string[];
      stakeholderFeedback?: Record<string, string>;
    },
  ): Promise<void> {
    this.logger.info('Learning from ethical outcome', {
      predictedCompliance: analysis.compliance,
      actualSuccess: actualOutcome.success,
    });

    // Analyze prediction accuracy
    const predictionAccuracy = this.calculatePredictionAccuracy(analysis, actualOutcome);
    
    if (predictionAccuracy < 0.7) {
      this.logger.warn('Low prediction accuracy, consider policy updates', {
        accuracy: predictionAccuracy,
      });
    }

    // Store learning data for future improvements
    await this.storeLearningData({
      context,
      analysis,
      outcome: actualOutcome,
      accuracy: predictionAccuracy,
      timestamp: new Date(),
    });
  }

  // Private methods

  private async utilitarianAnalysis(context: EthicalContext): Promise<FrameworkAnalysis> {
    const prompt = `
    Analyze this situation from a utilitarian ethics perspective (greatest good for greatest number):
    
    Action: ${context.action ?? 'Unknown'}
    Intent: ${context.intent ?? 'Unknown'}
    Potential Consequences: ${context.consequences?.join(', ') ?? 'Unknown'}
    Stakeholders: ${context.stakeholders?.join(', ') ?? 'Unknown'}
    
    Evaluate:
    1. Overall benefit/harm calculation
    2. Distribution of benefits and harms
    3. Short-term vs long-term consequences
    4. Utilitarian score (0-100)
    
    Provide concise analysis with score and key reasoning points.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'You are an expert in utilitarian ethics. Provide clear, structured analysis.',
      temperature: 0.3,
    });

    return this.parseFrameworkAnalysis('utilitarian', response.content);
  }

  private async deontologicalAnalysis(context: EthicalContext): Promise<FrameworkAnalysis> {
    const prompt = `
    Analyze this situation from a deontological ethics perspective (duty-based ethics):
    
    Action: ${context.action ?? 'Unknown'}
    Intent: ${context.intent ?? 'Unknown'}
    
    Evaluate:
    1. Is this action universalizable? (Categorical Imperative)
    2. Does it treat people as ends in themselves, not merely as means?
    3. Does it respect fundamental duties and rights?
    4. Deontological score (0-100)
    
    Provide concise analysis with score and key reasoning points.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'You are an expert in Kantian deontological ethics. Provide clear, structured analysis.',
      temperature: 0.3,
    });

    return this.parseFrameworkAnalysis('deontological', response.content);
  }

  private async virtueEthicsAnalysis(context: EthicalContext): Promise<FrameworkAnalysis> {
    const prompt = `
    Analyze this situation from a virtue ethics perspective (character-based ethics):
    
    Action: ${context.action ?? 'Unknown'}
    Intent: ${context.intent ?? 'Unknown'}
    
    Evaluate against key virtues:
    1. Honesty and integrity
    2. Compassion and empathy
    3. Justice and fairness
    4. Wisdom and prudence
    5. Courage and responsibility
    
    Virtue ethics score (0-100) and key reasoning points.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'You are an expert in Aristotelian virtue ethics. Provide clear, structured analysis.',
      temperature: 0.3,
    });

    return this.parseFrameworkAnalysis('virtue_ethics', response.content);
  }

  private async careEthicsAnalysis(context: EthicalContext): Promise<FrameworkAnalysis> {
    const prompt = `
    Analyze this situation from a care ethics perspective (relationships and caring):
    
    Action: ${context.action ?? 'Unknown'}
    Stakeholders: ${context.stakeholders?.join(', ') ?? 'Unknown'}
    
    Evaluate:
    1. Impact on relationships and caring bonds
    2. Attention to context and particularity
    3. Response to vulnerability and need
    4. Maintenance of caring relationships
    
    Care ethics score (0-100) and key reasoning points.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'You are an expert in care ethics. Provide clear, structured analysis.',
      temperature: 0.3,
    });

    return this.parseFrameworkAnalysis('care_ethics', response.content);
  }

  private parseFrameworkAnalysis(framework: string, content: string): FrameworkAnalysis {
    // Extract score using regex
    const scoreMatch = content.match(/(\d+)(?:\/100|\%)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.5;

    // Extract key points (lines starting with numbers or bullets)
    const keyPoints = content
      .split('\n')
      .filter(line => /^[\d\-\•\*]/.test(line.trim()))
      .map(line => line.replace(/^[\d\-\•\*\.\)\s]+/, '').trim())
      .filter(point => point.length > 0);

    return {
      framework,
      score: Math.max(0, Math.min(1, score)),
      reasoning: content,
      keyPoints: keyPoints.slice(0, 5), // Top 5 points
    };
  }

  private async evaluateAgainstPolicies(context: EthicalContext): Promise<Array<{
    policy: EthicalPolicy;
    score: number;
    reasoning: string;
  }>> {
    const evaluations = [];

    for (const policy of this.policies.values()) {
      const evaluation = await this.evaluatePolicy(policy, context);
      evaluations.push(evaluation);
    }

    return evaluations;
  }

  private async evaluatePolicy(
    policy: EthicalPolicy,
    context: EthicalContext,
  ): Promise<{
    policy: EthicalPolicy;
    score: number;
    reasoning: string;
  }> {
    if (policy.validator) {
      const score = await policy.validator(context);
      return {
        policy,
        score,
        reasoning: `Validated by custom validator: ${score}`,
      };
    }

    // LLM-based evaluation
    const prompt = `
    Evaluate this context against the ethical policy:
    
    Policy: ${policy.name}
    Description: ${policy.description}
    Rules: ${policy.rules.join('; ')}
    
    Context:
    Action: ${context.action ?? 'Unknown'}
    Intent: ${context.intent ?? 'Unknown'}
    
    Rate compliance (0-100) and provide brief reasoning.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Evaluate ethical compliance objectively. Provide score and reasoning.',
      temperature: 0.2,
    });

    const scoreMatch = response.content.match(/(\d+)(?:\/100|\%)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.5;

    return {
      policy,
      score: Math.max(0, Math.min(1, score)),
      reasoning: response.content,
    };
  }

  private calculateOverallCompliance(
    frameworkAnalyses: FrameworkAnalysis[],
    policyEvaluations: Array<{ policy: EthicalPolicy; score: number; reasoning: string }>,
  ): number {
    // Weighted average of framework scores
    const frameworkScore = frameworkAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / frameworkAnalyses.length;
    
    // Weighted average of policy scores (higher priority = higher weight)
    const totalWeight = policyEvaluations.reduce((sum, eval) => sum + eval.policy.priority, 0);
    const policyScore = policyEvaluations.reduce(
      (sum, eval) => sum + (eval.score * eval.policy.priority),
      0,
    ) / (totalWeight || 1);

    // Combine with emphasis on policy compliance
    return (frameworkScore * 0.4) + (policyScore * 0.6);
  }

  private identifyConcerns(
    frameworkAnalyses: FrameworkAnalysis[],
    policyEvaluations: Array<{ policy: EthicalPolicy; score: number; reasoning: string }>,
  ): EthicalConcern[] {
    const concerns: EthicalConcern[] = [];

    // Check for low framework scores
    for (const analysis of frameworkAnalyses) {
      if (analysis.score < 0.6) {
        concerns.push({
          id: uuidv4(),
          severity: analysis.score < 0.3 ? 'critical' : 'medium',
          description: `Low ${analysis.framework} ethics score: ${Math.round(analysis.score * 100)}%`,
          affectedPolicies: [],
          suggestedActions: analysis.keyPoints.slice(0, 2),
        });
      }
    }

    // Check for policy violations
    for (const evaluation of policyEvaluations) {
      if (evaluation.score < 0.7) {
        concerns.push({
          id: uuidv4(),
          severity: evaluation.policy.priority >= 8 ? 'critical' : 'medium',
          description: `Policy violation: ${evaluation.policy.name}`,
          affectedPolicies: [evaluation.policy.id],
          suggestedActions: [`Review and comply with ${evaluation.policy.name}`],
        });
      }
    }

    return concerns;
  }

  private async generateRecommendations(
    context: EthicalContext,
    concerns: EthicalConcern[],
  ): Promise<string[]> {
    if (concerns.length === 0) {
      return ['No ethical concerns identified. Proceed with current approach.'];
    }

    const prompt = `
    Given these ethical concerns, provide specific actionable recommendations:
    
    Context: ${JSON.stringify(context, null, 2)}
    
    Concerns:
    ${concerns.map(c => `- ${c.description}: ${c.suggestedActions.join(', ')}`).join('\n')}
    
    Provide 3-5 specific, actionable recommendations to address these concerns.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Provide practical, specific ethical recommendations.',
      temperature: 0.4,
    });

    return response.content
      .split('\n')
      .filter(line => /^[\d\-\•\*]/.test(line.trim()))
      .map(line => line.replace(/^[\d\-\•\*\.\)\s]+/, '').trim())
      .filter(rec => rec.length > 0)
      .slice(0, 5);
  }

  private async generateReasoning(
    context: EthicalContext,
    frameworkAnalyses: FrameworkAnalysis[],
  ): Promise<string> {
    const prompt = `
    Synthesize the ethical analysis into clear reasoning:
    
    Context: ${JSON.stringify(context, null, 2)}
    
    Framework Analysis Summary:
    ${frameworkAnalyses.map(a => `${a.framework}: ${Math.round(a.score * 100)}% - ${a.keyPoints[0] ?? ''}`).join('\n')}
    
    Provide a clear, concise explanation of the overall ethical assessment.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Synthesize ethical analysis into clear, accessible reasoning.',
      temperature: 0.3,
    });

    return response.content;
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: EthicalPolicy[] = [
      {
        id: 'no-harm',
        name: 'Do No Harm Principle',
        description: 'Actions must not cause unnecessary harm to individuals or groups',
        framework: 'deontological',
        priority: 10,
        rules: [
          'Minimize potential for physical or psychological harm',
          'Consider indirect and long-term consequences',
          'Protect vulnerable populations',
        ],
      },
      {
        id: 'privacy-protection',
        name: 'Privacy Protection',
        description: 'Respect and protect individual privacy rights',
        framework: 'deontological',
        priority: 9,
        rules: [
          'Obtain explicit consent for data collection',
          'Minimize data collection to necessary purposes',
          'Ensure secure data handling and storage',
          'Respect right to data deletion',
        ],
      },
      {
        id: 'fairness-equality',
        name: 'Fairness and Equality',
        description: 'Ensure fair treatment and equal consideration for all individuals',
        framework: 'virtue_ethics',
        priority: 8,
        rules: [
          'Avoid discrimination based on protected characteristics',
          'Ensure equal access to benefits and opportunities',
          'Consider impact on marginalized groups',
        ],
      },
      {
        id: 'transparency',
        name: 'Transparency and Accountability',
        description: 'Maintain transparency in decision-making and be accountable for actions',
        framework: 'virtue_ethics',
        priority: 7,
        rules: [
          'Provide clear explanations for decisions',
          'Enable audit and review of automated decisions',
          'Admit uncertainties and limitations',
        ],
      },
      {
        id: 'autonomy-respect',
        name: 'Respect for Autonomy',
        description: 'Respect individual autonomy and decision-making capacity',
        framework: 'deontological',
        priority: 8,
        rules: [
          'Support informed decision-making',
          'Avoid manipulation or coercion',
          'Respect individual choices and preferences',
        ],
      },
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }

    this.logger.info('Default ethical policies initialized', {
      count: defaultPolicies.length,
    });
  }

  private calculatePredictionAccuracy(
    analysis: EthicalAnalysis,
    outcome: { success: boolean; consequences: string[] },
  ): number {
    // Simple accuracy calculation based on predicted vs actual success
    const predictedSuccess = analysis.compliance > 0.7;
    const correctPrediction = predictedSuccess === outcome.success;
    
    return correctPrediction ? 1.0 : 0.0;
  }

  private async storeLearningData(data: {
    context: EthicalContext;
    analysis: EthicalAnalysis;
    outcome: { success: boolean; consequences: string[] };
    accuracy: number;
    timestamp: Date;
  }): Promise<void> {
    // In a real implementation, this would store to a database
    this.logger.debug('Storing learning data', {
      accuracy: data.accuracy,
      compliance: data.analysis.compliance,
      success: data.outcome.success,
    });
  }
}