/**
 * Performance and Load Testing for Vegapunk Agentic System
 * Tests system behavior under various load conditions
 */

import { ShakaAgent, type ShakaConfig } from '@agents/shaka/ShakaAgent';
import { MemorySystem } from '@memory/MemorySystem';
import { PlanningEngine } from '@agents/base/PlanningEngine';
import { DecisionEngine } from '@agents/base/DecisionEngine';
import type { MemoryCapabilities, PlanningCapabilities, DecisionCapabilities } from '@interfaces/capabilities.types';

describe('Performance and Load Testing', () => {
  
  describe('Memory System Performance', () => {
    let memorySystem: MemorySystem;
    
    const largeCapacityConfig: MemoryCapabilities = {
      shortTermCapacity: 1000,
      longTermCapacity: 10000,
      canForget: true,
      supportedMemoryTypes: ['episodic', 'semantic', 'procedural'],
      retrievalMethods: ['exact', 'semantic', 'temporal'],
    };

    beforeEach(() => {
      memorySystem = new MemorySystem(largeCapacityConfig);
    });

    afterEach(() => {
      memorySystem.clear();
    });

    it('should handle high-volume memory operations efficiently', async () => {
      const startTime = Date.now();
      const memoryCount = 1000;
      
      // Store large number of memories
      const storePromises = Array.from({ length: memoryCount }, (_, i) => 
        memorySystem.store({
          type: 'episodic',
          content: { 
            event: `test_event_${i}`, 
            data: new Array(100).fill(`data_${i}`) 
          },
          importance: Math.random(),
        })
      );

      await Promise.all(storePromises);
      const storeTime = Date.now() - startTime;

      // Retrieve memories
      const retrieveStart = Date.now();
      const retrievedMemories = await memorySystem.retrieve({ limit: 100 });
      const retrieveTime = Date.now() - retrieveStart;

      // Performance assertions
      expect(storeTime).toBeLessThan(5000); // Should store 1000 memories in < 5s
      expect(retrieveTime).toBeLessThan(1000); // Should retrieve in < 1s
      expect(retrievedMemories.length).toBe(100);

      const stats = memorySystem.getStats();
      expect(stats.totalCount).toBe(memoryCount);
    }, 15000);

    it('should maintain performance during memory consolidation', async () => {
      // Fill memory with mixed importance items
      for (let i = 0; i < 500; i++) {
        await memorySystem.store({
          type: 'episodic',
          content: { event: `event_${i}` },
          importance: i < 250 ? 0.3 : 0.8, // Half low, half high importance
        });
      }

      // Access some memories to increase retrieval count
      for (let i = 0; i < 10; i++) {
        await memorySystem.retrieve({ type: 'episodic', limit: 20 });
      }

      const consolidateStart = Date.now();
      await memorySystem.consolidate();
      const consolidateTime = Date.now() - consolidateStart;

      expect(consolidateTime).toBeLessThan(2000); // Consolidation should be fast

      const stats = memorySystem.getStats();
      expect(stats.longTermCount).toBeGreaterThan(0); // Should have moved some to long-term
    }, 10000);

    it('should handle concurrent memory operations', async () => {
      const concurrentOperations = 50;
      const startTime = Date.now();

      // Concurrent stores and retrievals
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        if (i % 2 === 0) {
          return memorySystem.store({
            type: 'semantic',
            content: { fact: `concurrent_fact_${i}` },
            importance: Math.random(),
          });
        } else {
          return memorySystem.retrieve({ limit: 5 });
        }
      });

      await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(3000); // All operations should complete quickly
    }, 10000);
  });

  describe('Planning Engine Performance', () => {
    let planningEngine: PlanningEngine;
    
    const advancedCapabilities: PlanningCapabilities = {
      canCreatePlans: true,
      canAdaptPlans: true,
      canPrioritizeTasks: true,
      maxPlanningHorizon: 50,
      supportedPlanTypes: ['sequential', 'parallel', 'hierarchical'],
    };

    beforeEach(() => {
      planningEngine = new PlanningEngine(advancedCapabilities);
    });

    afterEach(() => {
      planningEngine.cleanup();
    });

    it('should handle complex planning scenarios efficiently', async () => {
      const complexContext = {
        currentGoals: Array.from({ length: 20 }, (_, i) => ({
          id: `goal_${i}`,
          type: 'short-term' as const,
          priority: Math.floor(Math.random() * 10),
          description: `Complex goal ${i}`,
          status: 'pending' as const,
          createdAt: new Date(),
          deadline: new Date(Date.now() + Math.random() * 86400000), // Random deadline within 24h
        })),
        availableResources: Array.from({ length: 15 }, (_, i) => `resource_${i}`),
        constraints: {
          maxSteps: 30,
          maxDuration: 300000, // 5 minutes
        },
      };

      const thoughts = Array.from({ length: 100 }, (_, i) => `complex_thought_${i}`);

      const startTime = Date.now();
      const result = await planningEngine.createPlan(complexContext, thoughts);
      const planningTime = Date.now() - startTime;

      expect(planningTime).toBeLessThan(2000); // Should plan complex scenario in < 2s
      expect(result.plan.steps.length).toBeGreaterThan(0);
      expect(result.plan.steps.length).toBeLessThanOrEqual(30); // Respects constraints
      expect(result.feasibility).toBeGreaterThan(0);
    }, 10000);

    it('should handle multiple concurrent planning requests', async () => {
      const concurrentPlans = 10;
      const startTime = Date.now();

      const planningPromises = Array.from({ length: concurrentPlans }, async (_, i) => {
        const context = {
          currentGoals: [{
            id: `concurrent_goal_${i}`,
            type: 'immediate' as const,
            priority: 5,
            description: `Concurrent goal ${i}`,
            status: 'pending' as const,
            createdAt: new Date(),
          }],
          availableResources: [`resource_${i}`],
        };

        return planningEngine.createPlan(context, [`thought_${i}`]);
      });

      const results = await Promise.all(planningPromises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(5000); // All plans should complete in reasonable time
      expect(results.length).toBe(concurrentPlans);
      results.forEach(result => {
        expect(result.plan).toBeDefined();
        expect(result.feasibility).toBeGreaterThan(0);
      });
    }, 15000);
  });

  describe('Decision Engine Performance', () => {
    let decisionEngine: DecisionEngine;
    
    const advancedDecisionCapabilities: DecisionCapabilities = {
      canMakeAutonomousDecisions: true,
      requiresApproval: false,
      decisionTypes: ['tactical', 'strategic', 'operational'],
      maxDecisionComplexity: 10,
      canEvaluateRisk: true,
    };

    beforeEach(() => {
      decisionEngine = new DecisionEngine(advancedDecisionCapabilities);
    });

    it('should handle complex decision scenarios with many options', async () => {
      const manyOptions = Array.from({ length: 50 }, (_, i) => ({
        id: `option_${i}`,
        description: `Complex decision option ${i}`,
        expectedBenefit: Math.random(),
        risk: Math.random(),
        feasibility: Math.random(),
        estimatedDuration: Math.random() * 60000,
      }));

      const complexContext = {
        currentState: { complexity: 'high' },
        availableOptions: manyOptions,
        constraints: {
          maxRisk: 0.7,
          minConfidence: 0.6,
          timeLimit: 30000,
        },
      };

      const startTime = Date.now();
      const decision = await decisionEngine.makeDecision(complexContext);
      const decisionTime = Date.now() - startTime;

      expect(decisionTime).toBeLessThan(1000); // Should decide quickly even with many options
      expect(decision.selectedOption).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0.6);
      expect(decision.selectedOption.risk).toBeLessThanOrEqual(0.7);
    }, 5000);

    it('should maintain decision quality under load', async () => {
      const decisions = [];
      const startTime = Date.now();

      // Make many decisions rapidly
      for (let i = 0; i < 20; i++) {
        const options = Array.from({ length: 5 }, (_, j) => ({
          id: `batch_option_${i}_${j}`,
          description: `Batch decision ${i}-${j}`,
          expectedBenefit: Math.random(),
          risk: Math.random(),
          feasibility: Math.random(),
        }));

        const decision = await decisionEngine.makeDecision({
          currentState: { batch: i },
          availableOptions: options,
        });

        decisions.push(decision);
      }

      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(10000); // Should complete batch in reasonable time
      expect(decisions.length).toBe(20);
      
      // All decisions should be valid
      decisions.forEach(decision => {
        expect(decision.selectedOption).toBeDefined();
        expect(decision.confidence).toBeGreaterThan(0);
      });

      // Decision quality should remain consistent
      const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
      expect(avgConfidence).toBeGreaterThan(0.5);
    }, 15000);
  });

  describe('ShakaAgent Load Testing', () => {
    let shakaAgent: ShakaAgent;

    const loadTestConfig: ShakaConfig = {
      id: 'load-test-shaka',
      name: 'LoadTestShaka',
      specialty: 'Load Testing',
      llmProvider: 'mock' as any,
      llmModel: 'mock-model',
      cycleInterval: 500, // Fast cycles for load testing
      ethicalStrictness: 'balanced',
      proactiveMonitoring: true,
      conflictResolution: true,
      learningEnabled: true,
    };

    beforeEach(() => {
      const mockProvider = createHighPerformanceMockProvider();
      shakaAgent = new ShakaAgent(loadTestConfig, mockProvider as any);
    });

    afterEach(async () => {
      await shakaAgent.stop();
    });

    it('should handle high-frequency ethical analyses', async () => {
      const analysisCount = 50;
      const startTime = Date.now();

      const analysisPromises = Array.from({ length: analysisCount }, (_, i) => 
        shakaAgent.performEthicalAnalysis({
          action: `load_test_action_${i}`,
          intent: 'load_testing',
          consequences: [`consequence_${i}`],
          stakeholders: [`stakeholder_${i}`],
        })
      );

      const results = await Promise.all(analysisPromises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(30000); // Should complete 50 analyses in < 30s
      expect(results.length).toBe(analysisCount);
      
      results.forEach(result => {
        expect(result.compliance).toBeGreaterThanOrEqual(0);
        expect(result.compliance).toBeLessThanOrEqual(1);
        expect(result.frameworkAnalyses.length).toBeGreaterThan(0);
      });
    }, 45000);

    it('should maintain performance during extended operation', async () => {
      const operationDuration = 60000; // 1 minute
      let cycleCount = 0;
      let errorCount = 0;
      
      const metrics = {
        initialMemory: process.memoryUsage().heapUsed,
        peakMemory: 0,
        finalMemory: 0,
      };

      shakaAgent.on('status:update', () => {
        cycleCount++;
        const currentMemory = process.memoryUsage().heapUsed;
        metrics.peakMemory = Math.max(metrics.peakMemory, currentMemory);
      });

      shakaAgent.on('error', () => {
        errorCount++;
      });

      await shakaAgent.start();
      
      // Monitor for specified duration
      await new Promise(resolve => setTimeout(resolve, operationDuration));
      
      await shakaAgent.stop();
      
      metrics.finalMemory = process.memoryUsage().heapUsed;
      const agentMetrics = shakaAgent.getMetrics();

      // Performance assertions
      expect(cycleCount).toBeGreaterThan(50); // Should have many cycles
      expect(errorCount).toBeLessThan(cycleCount * 0.05); // Error rate < 5%
      expect(agentMetrics.successRate).toBeGreaterThan(0.9); // High success rate
      
      // Memory growth should be reasonable
      const memoryGrowth = metrics.finalMemory - metrics.initialMemory;
      const maxAllowedGrowth = 100 * 1024 * 1024; // 100MB
      expect(memoryGrowth).toBeLessThan(maxAllowedGrowth);
    }, 90000);

    it('should handle resource starvation gracefully', async () => {
      // Simulate resource pressure by creating memory pressure
      const memoryHogs: any[] = [];
      
      try {
        // Create memory pressure (but not enough to crash)
        for (let i = 0; i < 10; i++) {
          memoryHogs.push(new Array(1000000).fill(`memory_hog_${i}`));
        }

        await shakaAgent.start();
        
        // Let it run under pressure
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const metrics = shakaAgent.getMetrics();
        
        // Should still be functional
        expect(metrics.tasksAttempted).toBeGreaterThan(0);
        expect(metrics.successRate).toBeGreaterThan(0.5); // Some degradation acceptable
        
      } finally {
        // Clean up memory
        memoryHogs.length = 0;
        await shakaAgent.stop();
      }
    }, 30000);
  });

  describe('System Integration Load Testing', () => {
    it('should handle multiple agent instances', async () => {
      const agentCount = 5;
      const agents: ShakaAgent[] = [];
      
      try {
        // Create multiple agents
        for (let i = 0; i < agentCount; i++) {
          const config: ShakaConfig = {
            id: `multi-agent-${i}`,
            name: `MultiShaka${i}`,
            specialty: 'Multi-agent Testing',
            llmProvider: 'mock' as any,
            llmModel: 'mock-model',
            cycleInterval: 1000,
            ethicalStrictness: 'balanced',
            proactiveMonitoring: false, // Reduce load
            conflictResolution: true,
            learningEnabled: false, // Reduce load
          };

          const mockProvider = createHighPerformanceMockProvider();
          const agent = new ShakaAgent(config, mockProvider as any);
          agents.push(agent);
        }

        // Start all agents
        const startTime = Date.now();
        await Promise.all(agents.map(agent => agent.start()));
        
        // Let them run
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Check all agents are functional
        const allMetrics = agents.map(agent => agent.getMetrics());
        allMetrics.forEach((metrics, i) => {
          expect(metrics.tasksAttempted).toBeGreaterThan(0);
          expect(metrics.uptime).toBeGreaterThan(10000); // At least 10 seconds
        });

        // Stop all agents
        await Promise.all(agents.map(agent => agent.stop()));
        
        const totalTime = Date.now() - startTime;
        expect(totalTime).toBeLessThan(30000); // Should complete efficiently

      } finally {
        // Cleanup
        await Promise.all(agents.map(agent => agent.stop().catch(() => {})));
      }
    }, 45000);
  });
});

// Helper function for high-performance mock provider
function createHighPerformanceMockProvider() {
  return {
    getProviderName: () => 'high-perf-mock',
    getModelName: () => 'fast-mock',
    
    async generate(request: any) {
      // Very fast mock responses
      await new Promise(resolve => setTimeout(resolve, 10)); // Minimal delay
      
      // Simple pattern matching for fast responses
      if (request.prompt.includes('utilitarian')) {
        return { content: '80/100. Utilitarian: Good overall benefit.', metadata: { duration: 10 } };
      }
      if (request.prompt.includes('deontological')) {
        return { content: '85/100. Deontological: Respects duties.', metadata: { duration: 10 } };
      }
      if (request.prompt.includes('virtue')) {
        return { content: '75/100. Virtue: Shows good character.', metadata: { duration: 10 } };
      }
      if (request.prompt.includes('care')) {
        return { content: '90/100. Care: Maintains relationships.', metadata: { duration: 10 } };
      }
      
      return { 
        content: 'Fast mock response: 80/100. Generally compliant.',
        metadata: { duration: 10 }
      };
    },
    
    async isAvailable() { return true; }
  };
}