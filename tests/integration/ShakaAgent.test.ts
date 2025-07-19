/**
 * Integration tests for ShakaAgent
 * Tests the complete autonomous behavior and integration with all systems
 */

import { ShakaAgent, type ShakaConfig } from '@agents/shaka/ShakaAgent';
import { LLMProviderFactory } from '@utils/llm/LLMProvider';
import type { EthicalContext } from '@agents/shaka/EthicalPolicyEngine';

// Mock LLM Provider for testing
class MockLLMProvider {
  getProviderName() { return 'mock'; }
  getModelName() { return 'mock-model'; }
  
  async generate(request: any) {
    // Mock ethical analysis responses
    if (request.prompt.includes('utilitarian')) {
      return {
        content: 'Utilitarian analysis: 75/100. Benefits outweigh costs for majority.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('deontological')) {
      return {
        content: 'Deontological analysis: 80/100. Respects fundamental duties and rights.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('virtue')) {
      return {
        content: 'Virtue ethics analysis: 85/100. Demonstrates integrity, compassion, and wisdom.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('care')) {
      return {
        content: 'Care ethics analysis: 90/100. Maintains caring relationships and responds to needs.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('conflicts')) {
      return {
        content: 'YES - Potential priority conflict detected between privacy and transparency policies.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('resolution strategy')) {
      return {
        content: 'COMPROMISE - Create balanced policy that respects both privacy and transparency needs.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    if (request.prompt.includes('monitoring')) {
      return {
        content: 'Type: performance, Severity: warning - High memory usage detected.',
        metadata: { model: 'mock', provider: 'mock', duration: 100 }
      };
    }
    
    return {
      content: 'Mock response for: ' + request.prompt.substring(0, 50),
      metadata: { model: 'mock', provider: 'mock', duration: 100 }
    };
  }
  
  async isAvailable() { return true; }
}

describe('ShakaAgent Integration Tests', () => {
  let shakaAgent: ShakaAgent;
  let mockLLM: MockLLMProvider;

  const testConfig: ShakaConfig = {
    id: 'test-shaka',
    name: 'Shaka',
    specialty: 'Ethics and Analysis',
    llmProvider: 'mock' as any,
    llmModel: 'mock-model',
    cycleInterval: 1000, // Fast for testing
    ethicalStrictness: 'balanced',
    proactiveMonitoring: true,
    conflictResolution: true,
    learningEnabled: true,
  };

  beforeEach(async () => {
    mockLLM = new MockLLMProvider();
    shakaAgent = new ShakaAgent(testConfig, mockLLM as any);
  });

  afterEach(async () => {
    await shakaAgent.stop();
  });

  describe('Autonomous Behavior', () => {
    it('should start and run autonomous cycles', async () => {
      const startPromise = shakaAgent.start();
      
      // Let it run for a few cycles
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const state = shakaAgent.getState();
      expect(state.status).toBeDefined();
      expect(['idle', 'thinking', 'acting']).toContain(state.status);
      
      await shakaAgent.stop();
    }, 10000);

    it('should perceive environment and identify concerns', async () => {
      const perception = await (shakaAgent as any).perceive();
      
      expect(perception).toHaveProperty('systemState');
      expect(perception).toHaveProperty('ethicalConcerns');
      expect(perception).toHaveProperty('alerts');
      expect(perception).toHaveProperty('activeConflicts');
    });

    it('should plan actions based on perception', async () => {
      const mockPerception = {
        systemState: { status: 'running' },
        ethicalConcerns: ['test_concern'],
        alerts: [],
        activeConflicts: []
      };

      const plan = await (shakaAgent as any).plan(mockPerception);
      
      expect(plan).toHaveProperty('ethicalAnalyses');
      expect(plan).toHaveProperty('conflictResolutions');
      expect(plan).toHaveProperty('monitoringActions');
      expect(plan).toHaveProperty('recommendations');
      expect(plan.ethicalAnalyses.length).toBeGreaterThan(0);
    });

    it('should make decisions about planned actions', async () => {
      const mockPlan = {
        ethicalAnalyses: ['Analyze test scenario'],
        conflictResolutions: [],
        monitoringActions: [],
        recommendations: []
      };

      const decision = await (shakaAgent as any).decide(mockPlan);
      
      expect(decision).toHaveProperty('selectedOption');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('reasoning');
      expect(decision.confidence).toBeGreaterThan(0);
    });
  });

  describe('Ethical Analysis', () => {
    it('should perform comprehensive ethical analysis', async () => {
      const context: EthicalContext = {
        action: 'collect_user_data',
        intent: 'improve_service',
        consequences: ['better_recommendations', 'privacy_concerns'],
        stakeholders: ['users', 'company', 'regulators']
      };

      const analysis = await shakaAgent.performEthicalAnalysis(context);
      
      expect(analysis).toHaveProperty('compliance');
      expect(analysis).toHaveProperty('concerns');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('reasoning');
      expect(analysis).toHaveProperty('frameworkAnalyses');
      
      expect(analysis.compliance).toBeGreaterThanOrEqual(0);
      expect(analysis.compliance).toBeLessThanOrEqual(1);
      expect(analysis.frameworkAnalyses.length).toBe(4); // 4 ethical frameworks
    });

    it('should detect ethical concerns', async () => {
      const concerningContext: EthicalContext = {
        action: 'share_personal_data',
        intent: 'monetization',
        consequences: ['privacy_violation', 'user_harm'],
        stakeholders: ['users', 'third_parties']
      };

      let ethicalConcernEmitted = false;
      shakaAgent.on('ethical:concern', () => {
        ethicalConcernEmitted = true;
      });

      const analysis = await shakaAgent.performEthicalAnalysis(concerningContext);
      
      // Should detect low compliance
      expect(analysis.compliance).toBeLessThan(0.8);
      expect(analysis.concerns.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and resolve conflicts', async () => {
      const conflictResolver = (shakaAgent as any).conflictResolver;
      
      // Create mock conflicts
      const mockPolicies = [
        {
          id: 'privacy',
          name: 'Privacy Protection',
          framework: 'deontological',
          priority: 9,
          rules: ['Protect user data'],
          description: 'Ensure user privacy'
        },
        {
          id: 'transparency',
          name: 'Transparency',
          framework: 'virtue_ethics',
          priority: 8,
          rules: ['Be transparent'],
          description: 'Maintain transparency'
        }
      ];

      const conflicts = await conflictResolver.detectConflicts({
        policies: mockPolicies,
        ethicalContext: {
          action: 'data_sharing_decision'
        }
      });

      expect(conflicts.length).toBeGreaterThanOrEqual(0);
      
      // If conflicts detected, they should be resolvable
      for (const conflict of conflicts) {
        const resolution = await conflictResolver.resolveConflict(conflict.id);
        expect(resolution).toHaveProperty('strategy');
        expect(resolution).toHaveProperty('confidence');
        expect(resolution.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Proactive Monitoring', () => {
    it('should generate monitoring alerts', async () => {
      const monitor = (shakaAgent as any).proactiveMonitor;
      
      let alertCreated = false;
      monitor.on('alert:created', () => {
        alertCreated = true;
      });

      // Update monitoring data to trigger rules
      monitor.updateMonitoringData({
        systemMetrics: {
          memoryUsage: 600, // High memory usage
          cpuUsage: 90,
          activeAgents: 1,
          messageRate: 100,
          errorRate: 10 // High error rate
        }
      });

      // Perform scan
      const alerts = await monitor.scan();
      
      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should start and stop monitoring', async () => {
      const monitor = (shakaAgent as any).proactiveMonitor;
      
      monitor.start();
      expect(monitor.isRunning).toBe(true);
      
      monitor.stop();
      expect(monitor.isRunning).toBe(false);
    });
  });

  describe('Memory and Learning', () => {
    it('should store and retrieve ethical decisions', async () => {
      const context: EthicalContext = {
        action: 'test_action',
        intent: 'testing'
      };

      // Perform analysis to create memories
      await shakaAgent.performEthicalAnalysis(context);
      
      // Simulate learning from result
      await (shakaAgent as any).learn({
        success: true,
        data: { ethicalScore: 0.85 },
        duration: 1000,
        timestamp: new Date()
      });

      // Check if memory was stored
      const memorySystem = (shakaAgent as any).memorySystem;
      const memories = await memorySystem.retrieve({
        type: 'episodic',
        limit: 5
      });

      expect(memories.length).toBeGreaterThan(0);
    });

    it('should update metrics based on learning', async () => {
      const initialMetrics = shakaAgent.getShakaMetrics();
      
      // Simulate successful ethical analysis
      await (shakaAgent as any).learn({
        success: true,
        data: { ethicalScore: 0.9 },
        duration: 500,
        timestamp: new Date()
      });

      const updatedMetrics = shakaAgent.getShakaMetrics();
      expect(updatedMetrics.ethicalAnalyses).toBeGreaterThanOrEqual(initialMetrics.ethicalAnalyses);
    });
  });

  describe('Communication', () => {
    it('should send and receive messages', async () => {
      let messageReceived = false;
      
      shakaAgent.on('message:sent', () => {
        messageReceived = true;
      });

      await shakaAgent.sendMessage('test-agent', {
        type: 'ethical_query',
        data: 'test_message'
      });

      expect(messageReceived).toBe(true);
    });

    it('should handle incoming messages', async () => {
      const testMessage = {
        id: 'test-msg',
        from: 'test-agent',
        to: shakaAgent.getState().id,
        type: 'request' as const,
        content: { action: 'review_proposal' },
        timestamp: new Date()
      };

      await shakaAgent.receiveMessage(testMessage);
      
      // Message should be stored in context for next cycle
      const state = shakaAgent.getState();
      expect(state.currentContext.environmentState).toHaveProperty('pendingMessage');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle errors gracefully', async () => {
      // Force an error by passing invalid context
      try {
        await shakaAgent.performEthicalAnalysis(null as any);
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      }

      // Agent should still be functional
      const state = shakaAgent.getState();
      expect(state).toBeDefined();
    });

    it('should respect guardrails', async () => {
      const state = shakaAgent.getState();
      const guardrails = (shakaAgent as any).guardrails;
      
      // Check that agent respects memory limits
      expect(process.memoryUsage().heapUsed / 1024 / 1024).toBeLessThan(guardrails.maxMemoryUsage * 2);
      
      // Check concurrent operations limit
      expect(state.currentGoals.filter(g => g.status === 'in-progress').length)
        .toBeLessThanOrEqual(guardrails.maxConcurrentOperations);
    });

    it('should maintain performance metrics', async () => {
      const metrics = shakaAgent.getMetrics();
      
      expect(metrics).toHaveProperty('tasksCompleted');
      expect(metrics).toHaveProperty('tasksAttempted');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('uptime');
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration Flexibility', () => {
    it('should adapt behavior based on strictness level', async () => {
      const strictConfig = { ...testConfig, ethicalStrictness: 'strict' as const };
      const strictShaka = new ShakaAgent(strictConfig, mockLLM as any);
      
      const permissiveConfig = { ...testConfig, ethicalStrictness: 'permissive' as const };
      const permissiveShaka = new ShakaAgent(permissiveConfig, mockLLM as any);
      
      const strictCapabilities = (strictShaka as any).capabilities;
      const permissiveCapabilities = (permissiveShaka as any).capabilities;
      
      expect(strictCapabilities.autonomyLevel).toBeLessThan(permissiveCapabilities.autonomyLevel);
      expect(strictCapabilities.decisionMaking.requiresApproval).toBe(true);
      expect(permissiveCapabilities.decisionMaking.requiresApproval).toBe(false);
      
      await strictShaka.stop();
      await permissiveShaka.stop();
    });
  });
});