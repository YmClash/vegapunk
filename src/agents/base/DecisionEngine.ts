/**
 * Decision Engine for Vegapunk Agents
 * Implements autonomous decision making with risk assessment
 * Following Anthropic's principle: Clear, transparent decision logic
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type {
  DecisionOption,
  DecisionResult,
  ExecutionPlan,
} from '@interfaces/base.types';
import type { DecisionCapabilities } from '@interfaces/capabilities.types';

export interface DecisionContext {
  currentState: unknown;
  availableOptions: DecisionOption[];
  constraints?: {
    maxRisk?: number;
    minConfidence?: number;
    timeLimit?: number;
  };
  historicalOutcomes?: DecisionOutcome[];
}

export interface DecisionOutcome {
  decisionId: string;
  selectedOption: DecisionOption;
  actualBenefit: number;
  actualDuration: number;
  success: boolean;
}

export interface DecisionCriteria {
  benefitWeight: number;
  riskWeight: number;
  feasibilityWeight: number;
  speedWeight: number;
}

export class DecisionEngine {
  private readonly logger = createLogger('DecisionEngine');
  private readonly capabilities: DecisionCapabilities;
  private readonly defaultCriteria: DecisionCriteria = {
    benefitWeight: 0.4,
    riskWeight: 0.3,
    feasibilityWeight: 0.2,
    speedWeight: 0.1,
  };
  
  // Track decision history for learning
  private decisionHistory: Map<string, DecisionOutcome> = new Map();

  constructor(capabilities: DecisionCapabilities) {
    this.capabilities = capabilities;
    this.logger.info('Decision engine initialized', {
      autonomousDecisions: capabilities.canMakeAutonomousDecisions,
      maxComplexity: capabilities.maxDecisionComplexity,
    });
  }

  /**
   * Make a decision based on available options
   */
  public async makeDecision(
    context: DecisionContext,
    criteria?: Partial<DecisionCriteria>,
  ): Promise<DecisionResult> {
    this.logger.debug('Making decision', {
      optionsCount: context.availableOptions.length,
      hasConstraints: !!context.constraints,
    });

    // Check if we can make autonomous decisions
    if (!this.capabilities.canMakeAutonomousDecisions && !context.constraints?.minConfidence) {
      throw new Error('Autonomous decisions not allowed without confidence threshold');
    }

    // Filter options based on constraints
    const viableOptions = this.filterOptions(context.availableOptions, context.constraints);
    
    if (viableOptions.length === 0) {
      throw new Error('No viable options after applying constraints');
    }

    // Evaluate each option
    const evaluations = await Promise.all(
      viableOptions.map(option => this.evaluateOption(option, context, criteria)),
    );

    // Select best option
    const bestEvaluation = evaluations.reduce((best, current) => 
      current.score > best.score ? current : best,
    );

    // Check if confidence meets threshold
    if (context.constraints?.minConfidence && 
        bestEvaluation.confidence < context.constraints.minConfidence) {
      throw new Error(`Confidence ${bestEvaluation.confidence} below minimum ${context.constraints.minConfidence}`);
    }

    // Create decision result
    const result: DecisionResult = {
      selectedOption: bestEvaluation.option,
      confidence: bestEvaluation.confidence,
      reasoning: bestEvaluation.reasoning,
      alternatives: evaluations
        .filter(e => e.option.id !== bestEvaluation.option.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) // Top 3 alternatives
        .map(e => e.option),
      timestamp: new Date(),
    };

    // Record decision for future learning
    this.recordDecision(result);

    this.logger.info('Decision made', {
      selectedOptionId: result.selectedOption.id,
      confidence: result.confidence,
    });

    return result;
  }

  /**
   * Decide on a plan execution
   */
  public async decidePlanExecution(
    plan: ExecutionPlan,
    context: DecisionContext,
  ): Promise<DecisionResult> {
    // Convert plan to decision option
    const planOption: DecisionOption = {
      id: plan.id,
      description: `Execute plan for: ${plan.goal.description}`,
      expectedBenefit: 0.7, // Default high benefit for goal achievement
      risk: this.assessPlanRisk(plan),
      feasibility: this.assessPlanFeasibility(plan),
      estimatedDuration: plan.estimatedTotalDuration,
    };

    // Add no-action alternative
    const noActionOption: DecisionOption = {
      id: 'no-action',
      description: 'Do not execute plan',
      expectedBenefit: 0,
      risk: 0,
      feasibility: 1,
      estimatedDuration: 0,
    };

    // Make decision between executing plan or not
    return this.makeDecision({
      ...context,
      availableOptions: [planOption, noActionOption, ...context.availableOptions],
    });
  }

  /**
   * Learn from past decisions
   */
  public updateOutcome(
    decisionId: string,
    outcome: Omit<DecisionOutcome, 'decisionId'>,
  ): void {
    const historicalDecision = this.decisionHistory.get(decisionId);
    if (!historicalDecision) {
      this.logger.warn('Decision not found in history', { decisionId });
      return;
    }

    // Update with actual outcome
    const completeOutcome: DecisionOutcome = {
      ...outcome,
      decisionId,
    };

    this.decisionHistory.set(decisionId, completeOutcome);

    // Learn from outcome if capable
    if (this.capabilities.canEvaluateRisk) {
      this.adjustRiskAssessment(completeOutcome);
    }

    this.logger.debug('Decision outcome updated', {
      decisionId,
      success: outcome.success,
    });
  }

  /**
   * Get decision statistics
   */
  public getStats(): {
    totalDecisions: number;
    successRate: number;
    averageConfidence: number;
    riskAccuracy: number;
  } {
    const decisions = Array.from(this.decisionHistory.values());
    const successfulDecisions = decisions.filter(d => d.success);

    return {
      totalDecisions: decisions.length,
      successRate: decisions.length > 0 ? successfulDecisions.length / decisions.length : 0,
      averageConfidence: this.calculateAverageConfidence(),
      riskAccuracy: this.calculateRiskAccuracy(),
    };
  }

  // Private helper methods

  private filterOptions(
    options: DecisionOption[],
    constraints?: DecisionContext['constraints'],
  ): DecisionOption[] {
    let filtered = [...options];

    if (constraints?.maxRisk !== undefined) {
      filtered = filtered.filter(o => o.risk <= constraints.maxRisk);
    }

    if (constraints?.timeLimit !== undefined) {
      filtered = filtered.filter(o => 
        !o.estimatedDuration || o.estimatedDuration <= constraints.timeLimit,
      );
    }

    return filtered;
  }

  private async evaluateOption(
    option: DecisionOption,
    context: DecisionContext,
    customCriteria?: Partial<DecisionCriteria>,
  ): Promise<{
    option: DecisionOption;
    score: number;
    confidence: number;
    reasoning: string;
  }> {
    const criteria = { ...this.defaultCriteria, ...customCriteria };
    
    // Calculate weighted score
    let score = 0;
    const reasons: string[] = [];

    // Benefit component
    const benefitScore = option.expectedBenefit * criteria.benefitWeight;
    score += benefitScore;
    reasons.push(`Benefit: ${(option.expectedBenefit * 100).toFixed(0)}%`);

    // Risk component (inverted - lower risk is better)
    const riskScore = (1 - option.risk) * criteria.riskWeight;
    score += riskScore;
    reasons.push(`Risk: ${(option.risk * 100).toFixed(0)}%`);

    // Feasibility component
    const feasibilityScore = option.feasibility * criteria.feasibilityWeight;
    score += feasibilityScore;
    reasons.push(`Feasibility: ${(option.feasibility * 100).toFixed(0)}%`);

    // Speed component (normalized inverse of duration)
    if (option.estimatedDuration && criteria.speedWeight > 0) {
      const speedScore = (1 / (1 + option.estimatedDuration / 60000)) * criteria.speedWeight;
      score += speedScore;
      reasons.push(`Duration: ${Math.round(option.estimatedDuration / 1000)}s`);
    }

    // Adjust based on historical outcomes
    if (context.historicalOutcomes) {
      const adjustment = this.calculateHistoricalAdjustment(option, context.historicalOutcomes);
      score *= adjustment;
      if (adjustment !== 1) {
        reasons.push(`Historical adjustment: ${((adjustment - 1) * 100).toFixed(0)}%`);
      }
    }

    // Calculate confidence based on decision complexity
    const confidence = this.calculateConfidence(option, context);

    return {
      option,
      score: Math.max(0, Math.min(1, score)),
      confidence,
      reasoning: reasons.join('; '),
    };
  }

  private calculateConfidence(
    option: DecisionOption,
    context: DecisionContext,
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for simpler decisions
    const complexity = (option.risk + (1 - option.feasibility)) / 2;
    confidence += (1 - complexity) * 0.3;

    // Higher confidence with more historical data
    if (context.historicalOutcomes && context.historicalOutcomes.length > 0) {
      confidence += Math.min(0.2, context.historicalOutcomes.length * 0.02);
    }

    // Adjust based on capability
    if (this.capabilities.maxDecisionComplexity > 5) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateHistoricalAdjustment(
    option: DecisionOption,
    historicalOutcomes: DecisionOutcome[],
  ): number {
    // Find similar past decisions
    const similarOutcomes = historicalOutcomes.filter(outcome => {
      const similarity = this.calculateOptionSimilarity(option, outcome.selectedOption);
      return similarity > 0.7;
    });

    if (similarOutcomes.length === 0) {
      return 1; // No adjustment
    }

    // Calculate success rate of similar decisions
    const successRate = similarOutcomes.filter(o => o.success).length / similarOutcomes.length;
    
    // Adjust score based on historical success
    if (successRate > 0.8) {
      return 1.2; // Boost by 20%
    } else if (successRate < 0.3) {
      return 0.8; // Reduce by 20%
    }

    return 1;
  }

  private calculateOptionSimilarity(option1: DecisionOption, option2: DecisionOption): number {
    // Simple similarity based on characteristics
    const benefitDiff = Math.abs(option1.expectedBenefit - option2.expectedBenefit);
    const riskDiff = Math.abs(option1.risk - option2.risk);
    const feasibilityDiff = Math.abs(option1.feasibility - option2.feasibility);

    const avgDiff = (benefitDiff + riskDiff + feasibilityDiff) / 3;
    return 1 - avgDiff;
  }

  private assessPlanRisk(plan: ExecutionPlan): number {
    let risk = 0;

    // More steps = higher risk
    risk += Math.min(0.3, plan.steps.length * 0.05);

    // Failed steps increase risk
    const failedSteps = plan.steps.filter(s => s.status === 'failed').length;
    risk += failedSteps * 0.1;

    // Long duration increases risk
    if (plan.estimatedTotalDuration) {
      risk += Math.min(0.2, plan.estimatedTotalDuration / (60 * 60 * 1000)); // Hours
    }

    return Math.min(1, risk);
  }

  private assessPlanFeasibility(plan: ExecutionPlan): number {
    let feasibility = 1;

    // Reduce feasibility for each pending step
    const pendingSteps = plan.steps.filter(s => s.status === 'pending').length;
    feasibility -= pendingSteps * 0.1;

    // Completed steps increase feasibility
    const completedSteps = plan.steps.filter(s => s.status === 'completed').length;
    if (plan.steps.length > 0) {
      feasibility = Math.max(feasibility, completedSteps / plan.steps.length);
    }

    return Math.max(0, feasibility);
  }

  private recordDecision(result: DecisionResult): void {
    const decisionId = uuidv4();
    
    // Store initial decision record
    this.decisionHistory.set(decisionId, {
      decisionId,
      selectedOption: result.selectedOption,
      actualBenefit: 0, // To be updated later
      actualDuration: 0, // To be updated later
      success: false, // To be updated later
    });

    // Emit event for tracking
    this.logger.debug('Decision recorded', { decisionId });
  }

  private adjustRiskAssessment(outcome: DecisionOutcome): void {
    // Simple learning: if actual risk was different from expected, adjust future assessments
    const expectedRisk = outcome.selectedOption.risk;
    const actualRisk = outcome.success ? 0 : 1;
    const riskError = actualRisk - expectedRisk;

    if (Math.abs(riskError) > 0.3) {
      this.logger.info('Significant risk assessment error', {
        expected: expectedRisk,
        actual: actualRisk,
        error: riskError,
      });
      // In a real implementation, this would update risk assessment models
    }
  }

  private calculateAverageConfidence(): number {
    // This would track confidence scores from decisions
    // For now, return a placeholder
    return 0.75;
  }

  private calculateRiskAccuracy(): number {
    const outcomes = Array.from(this.decisionHistory.values());
    if (outcomes.length === 0) return 0;

    let totalError = 0;
    for (const outcome of outcomes) {
      const expectedRisk = outcome.selectedOption.risk;
      const actualRisk = outcome.success ? 0 : 1;
      totalError += Math.abs(actualRisk - expectedRisk);
    }

    return 1 - (totalError / outcomes.length);
  }
}