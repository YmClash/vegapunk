/**
 * Planning Engine for Vegapunk Agents
 * Implements hierarchical task planning
 * Following Anthropic's principle: Start with simple sequential planning
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type {
  Goal,
  PlanStep,
  ExecutionPlan,
  GoalStatus,
} from '@interfaces/base.types';
import type { PlanningCapabilities } from '@interfaces/capabilities.types';

export interface PlanningContext {
  currentGoals: Goal[];
  availableResources: string[];
  constraints?: {
    maxSteps?: number;
    maxDuration?: number;
    requiredOrder?: string[];
  };
}

export interface PlanningResult {
  plan: ExecutionPlan;
  feasibility: number; // 0-1
  estimatedDuration: number;
  risks: string[];
}

export class PlanningEngine {
  private readonly logger = createLogger('PlanningEngine');
  private readonly capabilities: PlanningCapabilities;
  private activePlans: Map<string, ExecutionPlan> = new Map();

  constructor(capabilities: PlanningCapabilities) {
    this.capabilities = capabilities;
    this.logger.info('Planning engine initialized', {
      maxHorizon: capabilities.maxPlanningHorizon,
      supportedTypes: capabilities.supportedPlanTypes,
    });
  }

  /**
   * Create a plan for achieving goals
   */
  public async createPlan(
    context: PlanningContext,
    thoughts: string[],
  ): Promise<PlanningResult> {
    this.logger.debug('Creating plan', {
      goalsCount: context.currentGoals.length,
      thoughtsCount: thoughts.length,
    });

    // Prioritize goals if capable
    const prioritizedGoals = this.capabilities.canPrioritizeTasks
      ? this.prioritizeGoals(context.currentGoals)
      : context.currentGoals;

    // Select the most important goal to plan for
    const targetGoal = prioritizedGoals[0];
    if (!targetGoal) {
      throw new Error('No goals to plan for');
    }

    // Generate plan steps based on thoughts and goal
    const steps = await this.generateSteps(targetGoal, thoughts, context);

    // Create execution plan
    const plan: ExecutionPlan = {
      id: uuidv4(),
      goal: targetGoal,
      steps,
      estimatedTotalDuration: this.estimateDuration(steps),
      createdAt: new Date(),
      status: 'draft',
    };

    // Validate plan feasibility
    const feasibility = this.validatePlan(plan, context);
    const risks = this.identifyRisks(plan, context);

    // Store active plan
    this.activePlans.set(plan.id, plan);

    return {
      plan,
      feasibility,
      estimatedDuration: plan.estimatedTotalDuration ?? 0,
      risks,
    };
  }

  /**
   * Update plan progress
   */
  public updatePlanProgress(
    planId: string,
    stepId: string,
    status: PlanStep['status'],
  ): void {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const step = plan.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in plan ${planId}`);
    }

    step.status = status;

    // Update plan status based on steps
    if (plan.steps.every(s => s.status === 'completed')) {
      plan.status = 'completed';
    } else if (plan.steps.some(s => s.status === 'failed')) {
      plan.status = 'failed';
    } else if (plan.steps.some(s => s.status === 'in-progress')) {
      plan.status = 'executing';
    }

    this.logger.debug('Plan progress updated', {
      planId,
      stepId,
      status,
      planStatus: plan.status,
    });
  }

  /**
   * Adapt an existing plan based on new information
   */
  public async adaptPlan(
    planId: string,
    newContext: PlanningContext,
  ): Promise<PlanningResult> {
    if (!this.capabilities.canAdaptPlans) {
      throw new Error('Plan adaptation not supported');
    }

    const existingPlan = this.activePlans.get(planId);
    if (!existingPlan) {
      throw new Error(`Plan ${planId} not found`);
    }

    this.logger.info('Adapting plan', { planId });

    // Keep completed steps, regenerate pending ones
    const completedSteps = existingPlan.steps.filter(s => s.status === 'completed');
    const pendingSteps = await this.generateSteps(
      existingPlan.goal,
      [], // No new thoughts for adaptation
      newContext,
      completedSteps.length,
    );

    // Create adapted plan
    const adaptedPlan: ExecutionPlan = {
      ...existingPlan,
      steps: [...completedSteps, ...pendingSteps],
      estimatedTotalDuration: this.estimateDuration([...completedSteps, ...pendingSteps]),
    };

    // Update stored plan
    this.activePlans.set(planId, adaptedPlan);

    return {
      plan: adaptedPlan,
      feasibility: this.validatePlan(adaptedPlan, newContext),
      estimatedDuration: adaptedPlan.estimatedTotalDuration ?? 0,
      risks: this.identifyRisks(adaptedPlan, newContext),
    };
  }

  /**
   * Get all active plans
   */
  public getActivePlans(): ExecutionPlan[] {
    return Array.from(this.activePlans.values());
  }

  /**
   * Clean up completed or failed plans
   */
  public cleanup(): void {
    const toRemove: string[] = [];
    
    for (const [id, plan] of this.activePlans) {
      if (plan.status === 'completed' || plan.status === 'failed') {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.activePlans.delete(id);
    }

    this.logger.debug('Cleaned up plans', { removed: toRemove.length });
  }

  // Private helper methods

  private prioritizeGoals(goals: Goal[]): Goal[] {
    return goals.sort((a, b) => {
      // Priority score calculation
      let scoreA = a.priority;
      let scoreB = b.priority;

      // Urgency factor (deadline)
      if (a.deadline) {
        const urgencyA = 1 / (a.deadline.getTime() - Date.now());
        scoreA += urgencyA * 2;
      }
      if (b.deadline) {
        const urgencyB = 1 / (b.deadline.getTime() - Date.now());
        scoreB += urgencyB * 2;
      }

      // Status factor (in-progress goals get boost)
      if (a.status === 'in-progress') scoreA += 1;
      if (b.status === 'in-progress') scoreB += 1;

      return scoreB - scoreA;
    });
  }

  private async generateSteps(
    goal: Goal,
    thoughts: string[],
    context: PlanningContext,
    startIndex = 0,
  ): Promise<PlanStep[]> {
    const steps: PlanStep[] = [];
    const maxSteps = Math.min(
      context.constraints?.maxSteps ?? this.capabilities.maxPlanningHorizon,
      this.capabilities.maxPlanningHorizon,
    );

    // Simple step generation based on goal type and thoughts
    if (goal.type === 'immediate') {
      // Single step for immediate goals
      steps.push({
        id: uuidv4(),
        action: `Execute: ${goal.description}`,
        description: goal.description,
        estimatedDuration: 5000, // 5 seconds
        status: 'pending',
      });
    } else {
      // Multi-step plan for complex goals
      const relevantThoughts = thoughts.filter(t => 
        t.toLowerCase().includes(goal.description.toLowerCase().split(' ')[0]),
      );

      // Generate steps from thoughts or create default steps
      const stepCount = Math.min(relevantThoughts.length || 3, maxSteps - startIndex);
      
      for (let i = 0; i < stepCount; i++) {
        const thought = relevantThoughts[i];
        steps.push({
          id: uuidv4(),
          action: thought ?? `Step ${startIndex + i + 1}: ${goal.description}`,
          description: thought ?? `Execute part ${i + 1} of ${goal.description}`,
          prerequisites: i > 0 ? [steps[i - 1]!.id] : undefined,
          estimatedDuration: 10000 * (i + 1), // Increasing duration
          status: 'pending',
        });
      }
    }

    // Apply sequential planning if that's all we support
    if (this.capabilities.supportedPlanTypes.includes('sequential') &&
        !this.capabilities.supportedPlanTypes.includes('parallel')) {
      // Ensure all steps are sequential
      for (let i = 1; i < steps.length; i++) {
        steps[i]!.prerequisites = [steps[i - 1]!.id];
      }
    }

    return steps;
  }

  private estimateDuration(steps: PlanStep[]): number {
    if (this.capabilities.supportedPlanTypes.includes('parallel')) {
      // For parallel execution, find the critical path
      return Math.max(...steps.map(s => s.estimatedDuration ?? 0));
    } else {
      // For sequential execution, sum all durations
      return steps.reduce((sum, step) => sum + (step.estimatedDuration ?? 0), 0);
    }
  }

  private validatePlan(plan: ExecutionPlan, context: PlanningContext): number {
    let feasibility = 1.0;

    // Check if plan exceeds constraints
    if (context.constraints?.maxSteps && plan.steps.length > context.constraints.maxSteps) {
      feasibility *= 0.7;
    }

    if (context.constraints?.maxDuration && 
        plan.estimatedTotalDuration && 
        plan.estimatedTotalDuration > context.constraints.maxDuration) {
      feasibility *= 0.8;
    }

    // Check resource availability
    const requiredResources = new Set<string>();
    plan.steps.forEach(step => {
      // Extract resources from action (simplified)
      const resources = step.action.match(/use (\w+)/gi) ?? [];
      resources.forEach(r => requiredResources.add(r));
    });

    const availableSet = new Set(context.availableResources);
    const missingResources = Array.from(requiredResources).filter(r => !availableSet.has(r));
    
    if (missingResources.length > 0) {
      feasibility *= 0.5;
    }

    return Math.max(0, Math.min(1, feasibility));
  }

  private identifyRisks(plan: ExecutionPlan, context: PlanningContext): string[] {
    const risks: string[] = [];

    // Check for deadline risks
    if (plan.goal.deadline && plan.estimatedTotalDuration) {
      const timeLeft = plan.goal.deadline.getTime() - Date.now();
      if (plan.estimatedTotalDuration > timeLeft) {
        risks.push('Plan may not complete before deadline');
      }
    }

    // Check for dependency risks
    const hasDependencies = plan.steps.some(s => s.prerequisites && s.prerequisites.length > 0);
    if (hasDependencies) {
      risks.push('Plan has dependencies that could cause delays');
    }

    // Check for resource risks
    if (context.availableResources.length < 3) {
      risks.push('Limited resources available');
    }

    return risks;
  }
}