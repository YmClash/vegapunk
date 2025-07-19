/**
 * Unit tests for PlanningEngine
 */

import { PlanningEngine } from '@agents/base/PlanningEngine';
import type { PlanningCapabilities } from '@interfaces/capabilities.types';
import type { Goal } from '@interfaces/base.types';

describe('PlanningEngine', () => {
  let planningEngine: PlanningEngine;
  
  const mockCapabilities: PlanningCapabilities = {
    canCreatePlans: true,
    canAdaptPlans: true,
    canPrioritizeTasks: true,
    maxPlanningHorizon: 10,
    supportedPlanTypes: ['sequential', 'parallel'],
  };

  beforeEach(() => {
    planningEngine = new PlanningEngine(mockCapabilities);
  });

  afterEach(() => {
    planningEngine.cleanup();
  });

  describe('createPlan', () => {
    const mockGoal: Goal = {
      id: 'test-goal',
      type: 'short-term',
      priority: 5,
      description: 'Test goal',
      status: 'pending',
      createdAt: new Date(),
    };

    it('should create a plan for a given goal', async () => {
      const context = {
        currentGoals: [mockGoal],
        availableResources: ['tool1', 'tool2'],
      };

      const result = await planningEngine.createPlan(context, ['thought1', 'thought2']);

      expect(result.plan).toBeDefined();
      expect(result.plan.goal).toBe(mockGoal);
      expect(result.plan.steps.length).toBeGreaterThan(0);
      expect(result.feasibility).toBeGreaterThan(0);
    });

    it('should create single step for immediate goals', async () => {
      const immediateGoal: Goal = {
        ...mockGoal,
        type: 'immediate',
      };

      const context = {
        currentGoals: [immediateGoal],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, []);

      expect(result.plan.steps).toHaveLength(1);
      expect(result.plan.steps[0]?.action).toContain('Execute');
    });

    it('should prioritize goals when capable', async () => {
      const lowPriorityGoal: Goal = {
        ...mockGoal,
        id: 'low-priority',
        priority: 2,
      };

      const highPriorityGoal: Goal = {
        ...mockGoal,
        id: 'high-priority',
        priority: 8,
      };

      const context = {
        currentGoals: [lowPriorityGoal, highPriorityGoal],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, []);

      expect(result.plan.goal.id).toBe('high-priority');
    });

    it('should respect planning horizon constraints', async () => {
      const context = {
        currentGoals: [mockGoal],
        availableResources: [],
        constraints: {
          maxSteps: 2,
        },
      };

      const thoughts = Array(20).fill('').map((_, i) => `thought${i}`);
      const result = await planningEngine.createPlan(context, thoughts);

      expect(result.plan.steps.length).toBeLessThanOrEqual(2);
    });

    it('should estimate total duration', async () => {
      const context = {
        currentGoals: [mockGoal],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, ['thought1', 'thought2']);

      expect(result.plan.estimatedTotalDuration).toBeGreaterThan(0);
      expect(result.estimatedDuration).toBe(result.plan.estimatedTotalDuration);
    });
  });

  describe('updatePlanProgress', () => {
    it('should update step status', async () => {
      const context = {
        currentGoals: [{
          id: 'test-goal',
          type: 'short-term' as const,
          priority: 5,
          description: 'Test goal',
          status: 'pending' as const,
          createdAt: new Date(),
        }],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, ['thought1']);
      const planId = result.plan.id;
      const stepId = result.plan.steps[0]!.id;

      planningEngine.updatePlanProgress(planId, stepId, 'completed');

      const activePlans = planningEngine.getActivePlans();
      const plan = activePlans.find(p => p.id === planId);
      const step = plan?.steps.find(s => s.id === stepId);

      expect(step?.status).toBe('completed');
    });

    it('should update plan status when all steps completed', async () => {
      const context = {
        currentGoals: [{
          id: 'test-goal',
          type: 'immediate' as const,
          priority: 5,
          description: 'Test goal',
          status: 'pending' as const,
          createdAt: new Date(),
        }],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, []);
      const planId = result.plan.id;
      const stepId = result.plan.steps[0]!.id;

      planningEngine.updatePlanProgress(planId, stepId, 'completed');

      const activePlans = planningEngine.getActivePlans();
      const plan = activePlans.find(p => p.id === planId);

      expect(plan?.status).toBe('completed');
    });
  });

  describe('adaptPlan', () => {
    it('should adapt existing plan with new context', async () => {
      const context = {
        currentGoals: [{
          id: 'test-goal',
          type: 'short-term' as const,
          priority: 5,
          description: 'Test goal',
          status: 'pending' as const,
          createdAt: new Date(),
        }],
        availableResources: ['tool1'],
      };

      const result = await planningEngine.createPlan(context, ['thought1', 'thought2']);
      const planId = result.plan.id;

      // Mark first step as completed
      planningEngine.updatePlanProgress(planId, result.plan.steps[0]!.id, 'completed');

      // Adapt with new context
      const newContext = {
        ...context,
        availableResources: ['tool1', 'tool2', 'tool3'],
      };

      const adaptedResult = await planningEngine.adaptPlan(planId, newContext);

      expect(adaptedResult.plan.id).toBe(planId);
      expect(adaptedResult.plan.steps.some(s => s.status === 'completed')).toBe(true);
    });

    it('should throw error when adaptation not supported', async () => {
      const limitedEngine = new PlanningEngine({
        ...mockCapabilities,
        canAdaptPlans: false,
      });

      await expect(limitedEngine.adaptPlan('invalid-id', {
        currentGoals: [],
        availableResources: [],
      })).rejects.toThrow('Plan adaptation not supported');
    });
  });

  describe('cleanup', () => {
    it('should remove completed and failed plans', async () => {
      const context = {
        currentGoals: [{
          id: 'test-goal',
          type: 'immediate' as const,
          priority: 5,
          description: 'Test goal',
          status: 'pending' as const,
          createdAt: new Date(),
        }],
        availableResources: [],
      };

      const result = await planningEngine.createPlan(context, []);
      const planId = result.plan.id;

      // Complete the plan
      planningEngine.updatePlanProgress(planId, result.plan.steps[0]!.id, 'completed');

      expect(planningEngine.getActivePlans()).toHaveLength(1);

      planningEngine.cleanup();

      expect(planningEngine.getActivePlans()).toHaveLength(0);
    });
  });
});