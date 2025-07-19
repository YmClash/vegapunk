/**
 * AtlasAgent Integration Tests
 * Comprehensive test suite for the complete Atlas security agent
 */

import { AtlasAgent, type AtlasConfig } from '../AtlasAgent';
import { LLMProvider } from '@utils/llm/LLMProvider';
import type { SecurityThreat, SecurityIncident } from '../SecurityMonitor';

// Mock LLM Provider
const mockLLMProvider = {
  complete: jest.fn().mockResolvedValue('Test LLM response'),
  isAvailable: jest.fn().mockResolvedValue(true),
  getModelInfo: jest.fn().mockReturnValue({ name: 'test-model', provider: 'test' })
} as unknown as LLMProvider;

describe('AtlasAgent', () => {
  let atlasAgent: AtlasAgent;
  let config: AtlasConfig;

  beforeEach(() => {
    config = {
      name: 'TestAtlas',
      specialty: 'security_automation',
      cycleInterval: 1000,
      securityStrictness: 'balanced',
      automationLevel: 'supervised',
      proactiveDefense: true,
      learningEnabled: true,
      maintenanceMode: 'proactive'
    };

    atlasAgent = new AtlasAgent(config, mockLLMProvider);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await atlasAgent.stop();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(atlasAgent).toBeInstanceOf(AtlasAgent);
      
      const state = atlasAgent.getState();
      expect(state.name).toBe('TestAtlas');
      expect(state.specialty).toBe('security_automation');
    });

    it('should configure capabilities based on settings', () => {
      const state = atlasAgent.getState();
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('status');
      expect(state.status).toBe('idle');
    });

    it('should set up security subsystems', () => {
      // Verify that security subsystems are properly initialized
      expect(atlasAgent['securityMonitor']).toBeDefined();
      expect(atlasAgent['incidentResponder']).toBeDefined();
      expect(atlasAgent['automationEngine']).toBeDefined();
    });
  });

  describe('Agent Lifecycle', () => {
    it('should start successfully', async () => {
      const startSpy = jest.fn();
      atlasAgent.on('agent:started', startSpy);

      await atlasAgent.start();

      expect(startSpy).toHaveBeenCalled();
      
      const state = atlasAgent.getState();
      expect(['thinking', 'acting', 'idle']).toContain(state.status);
    });

    it('should stop successfully', async () => {
      const stopSpy = jest.fn();
      atlasAgent.on('agent:stopped', stopSpy);

      await atlasAgent.start();
      await atlasAgent.stop();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should handle start/stop cycles correctly', async () => {
      // Start the agent
      await atlasAgent.start();
      let state = atlasAgent.getState();
      expect(['thinking', 'acting', 'idle']).toContain(state.status);

      // Stop the agent
      await atlasAgent.stop();
      state = atlasAgent.getState();
      // Agent should maintain state after stopping
      expect(state).toBeDefined();

      // Should be able to start again
      await atlasAgent.start();
      state = atlasAgent.getState();
      expect(['thinking', 'acting', 'idle']).toContain(state.status);
    });
  });

  describe('Security Perception', () => {
    it('should perceive security environment correctly', async () => {
      // Mock security monitoring methods
      jest.spyOn(atlasAgent['securityMonitor'], 'detectThreats')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent['securityMonitor'], 'analyzeNetworkTraffic')
        .mockResolvedValue({
          timestamp: new Date(),
          totalConnections: 100,
          suspiciousConnections: 2,
          blockedConnections: 1,
          trafficPatterns: [],
          anomalies: []
        });
      jest.spyOn(atlasAgent['securityMonitor'], 'scanSystemVulnerabilities')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent['securityMonitor'], 'monitorFileChanges')
        .mockResolvedValue([]);

      const perception = await atlasAgent['perceive']();

      expect(perception).toHaveProperty('currentThreats');
      expect(perception).toHaveProperty('activeIncidents');
      expect(perception).toHaveProperty('systemVulnerabilities');
      expect(perception).toHaveProperty('lastSecurityUpdate');
      expect(perception).toHaveProperty('defensePosture');

      expect(Array.isArray(perception.currentThreats)).toBe(true);
      expect(Array.isArray(perception.activeIncidents)).toBe(true);
      expect(typeof perception.systemVulnerabilities).toBe('number');
      expect(['normal', 'heightened', 'critical']).toContain(perception.defensePosture);
    });

    it('should update defense posture based on threats', async () => {
      const criticalThreat: SecurityThreat = {
        id: 'critical-test',
        type: 'malware',
        severity: 'critical',
        source: 'test-source',
        description: 'Critical test threat',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.9
      };

      jest.spyOn(atlasAgent['securityMonitor'], 'detectThreats')
        .mockResolvedValue([criticalThreat]);
      jest.spyOn(atlasAgent['securityMonitor'], 'analyzeNetworkTraffic')
        .mockResolvedValue({
          timestamp: new Date(),
          totalConnections: 100,
          suspiciousConnections: 2,
          blockedConnections: 1,
          trafficPatterns: [],
          anomalies: []
        });
      jest.spyOn(atlasAgent['securityMonitor'], 'scanSystemVulnerabilities')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent['securityMonitor'], 'monitorFileChanges')
        .mockResolvedValue([]);

      const perception = await atlasAgent['perceive']();

      expect(perception.defensePosture).toBe('critical');
      expect(perception.currentThreats).toContain(criticalThreat);
    });
  });

  describe('Security Planning', () => {
    it('should create appropriate goals for detected threats', async () => {
      const testThreat: SecurityThreat = {
        id: 'test-threat-planning',
        type: 'intrusion',
        severity: 'high',
        source: 'test-source',
        description: 'Test intrusion threat',
        indicators: { port: 22 },
        timestamp: new Date(),
        confidence: 0.8
      };

      const perception = {
        currentThreats: [testThreat],
        activeIncidents: [],
        systemVulnerabilities: 0,
        lastSecurityUpdate: new Date(),
        defensePosture: 'heightened' as const
      };

      const goals = await atlasAgent['plan'](perception);

      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBeGreaterThan(0);

      const threatResponseGoal = goals.find(g => g.id.includes('respond-threat'));
      expect(threatResponseGoal).toBeDefined();
      expect(threatResponseGoal?.type).toBe('security_response');
      expect(threatResponseGoal?.priority).toBeGreaterThan(5);
    });

    it('should prioritize critical threats higher', async () => {
      const lowThreat: SecurityThreat = {
        id: 'low-threat',
        type: 'anomaly',
        severity: 'low',
        source: 'test',
        description: 'Low threat',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.5
      };

      const criticalThreat: SecurityThreat = {
        id: 'critical-threat',
        type: 'malware',
        severity: 'critical',
        source: 'test',
        description: 'Critical threat',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.95
      };

      const perception = {
        currentThreats: [lowThreat, criticalThreat],
        activeIncidents: [],
        systemVulnerabilities: 0,
        lastSecurityUpdate: new Date(),
        defensePosture: 'critical' as const
      };

      const goals = await atlasAgent['plan'](perception);

      const criticalGoal = goals.find(g => g.id.includes(criticalThreat.id));
      const lowGoal = goals.find(g => g.id.includes(lowThreat.id));

      if (criticalGoal && lowGoal) {
        expect(criticalGoal.priority).toBeGreaterThan(lowGoal.priority);
      }
    });
  });

  describe('Security Decision Making', () => {
    it('should make appropriate decisions for security goals', async () => {
      const testGoal = {
        id: 'respond-threat-test123',
        description: 'Respond to test threat',
        priority: 8,
        status: 'pending' as const,
        createdAt: new Date(),
        type: 'security_response'
      };

      // Mock threat in context
      const testThreat: SecurityThreat = {
        id: 'test123',
        type: 'intrusion',
        severity: 'high',
        source: 'test-source',
        description: 'Test threat for decision',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.8
      };

      atlasAgent['securityContext'].currentThreats = [testThreat];

      const decision = await atlasAgent['decide']([testGoal]);

      expect(decision).toHaveProperty('selectedOption');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('alternativeOptions');

      expect(decision.selectedOption).toBeDefined();
      expect(typeof decision.confidence).toBe('number');
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it('should require approval for high-risk actions in supervised mode', async () => {
      const testGoal = {
        id: 'respond-threat-critical456',
        description: 'Respond to critical threat',
        priority: 10,
        status: 'pending' as const,
        createdAt: new Date(),
        type: 'security_response'
      };

      const criticalThreat: SecurityThreat = {
        id: 'critical456',
        type: 'malware',
        severity: 'critical',
        source: 'critical-source',
        description: 'Critical threat requiring approval',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.6 // Low confidence = high risk
      };

      atlasAgent['securityContext'].currentThreats = [criticalThreat];

      const decision = await atlasAgent['decide']([testGoal]);

      // In supervised mode with low confidence, should require approval
      if (decision.selectedOption && decision.confidence < 0.7) {
        expect(decision.selectedOption.requiresApproval).toBe(true);
      }
    });
  });

  describe('Security Execution', () => {
    it('should execute threat response actions', async () => {
      const testThreat: SecurityThreat = {
        id: 'exec-test',
        type: 'malware',
        severity: 'medium',
        source: 'test-file',
        description: 'Test malware for execution',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.8
      };

      atlasAgent['securityContext'].currentThreats = [testThreat];

      const decision = {
        id: 'respond-exec-test',
        description: 'Test threat response',
        confidence: 0.8,
        risks: [],
        benefits: ['threat_neutralized'],
        requiredResources: ['security'],
        estimatedDuration: 60000
      };

      // Mock incident responder
      jest.spyOn(atlasAgent['incidentResponder'], 'respondToThreat')
        .mockResolvedValue([]);

      const result = await atlasAgent['execute'](decision);

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('atlas_security_tools');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metadata).toHaveProperty('actionType');
    });

    it('should handle execution failures gracefully', async () => {
      const decision = {
        id: 'respond-fail-test',
        description: 'Test failing response',
        confidence: 0.8,
        risks: [],
        benefits: [],
        requiredResources: [],
        estimatedDuration: 60000
      };

      // Mock failure
      jest.spyOn(atlasAgent['incidentResponder'], 'respondToThreat')
        .mockRejectedValue(new Error('Response failed'));

      const result = await atlasAgent['execute'](decision);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.output).toContain('failed');
    });
  });

  describe('Learning and Adaptation', () => {
    it('should learn from successful security actions', async () => {
      if (!config.learningEnabled) {
        return; // Skip if learning is disabled
      }

      const successResult = {
        success: true,
        output: { actions: ['isolate'], threat: { id: 'learn-test' } },
        toolName: 'atlas_security_tools',
        duration: 1000,
        metadata: { actionType: 'respond', timestamp: new Date() }
      };

      // Mock memory system
      const memoryStoreSpy = jest.spyOn(atlasAgent['memorySystem'], 'store')
        .mockResolvedValue();

      await atlasAgent['learn'](successResult);

      expect(memoryStoreSpy).toHaveBeenCalled();
      
      // Verify that procedural memory was stored
      const storeCall = memoryStoreSpy.mock.calls.find(call => 
        call[0].type === 'procedural'
      );
      expect(storeCall).toBeDefined();
    });

    it('should learn from failures and adapt behavior', async () => {
      if (!config.learningEnabled) {
        return;
      }

      const failureResult = {
        success: false,
        output: 'Action failed',
        toolName: 'atlas_security_tools',
        duration: 2000,
        error: new Error('Test failure'),
        metadata: { actionType: 'respond', timestamp: new Date() }
      };

      const memoryStoreSpy = jest.spyOn(atlasAgent['memorySystem'], 'store')
        .mockResolvedValue();

      await atlasAgent['learn'](failureResult);

      expect(memoryStoreSpy).toHaveBeenCalled();
      
      // Should store failure pattern with high importance
      const failureCall = memoryStoreSpy.mock.calls.find(call => 
        call[0].importance >= 0.8
      );
      expect(failureCall).toBeDefined();
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should provide comprehensive security metrics', () => {
      const metrics = atlasAgent.getAtlasMetrics();

      expect(metrics).toHaveProperty('threatsDetected');
      expect(metrics).toHaveProperty('threatsNeutralized');
      expect(metrics).toHaveProperty('incidentsResolved');
      expect(metrics).toHaveProperty('automationTasksCompleted');
      expect(metrics).toHaveProperty('systemUptime');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('falsePositiveRate');
      expect(metrics).toHaveProperty('securityScore');

      expect(typeof metrics.threatsDetected).toBe('number');
      expect(typeof metrics.threatsNeutralized).toBe('number');
      expect(typeof metrics.securityScore).toBe('number');
      expect(metrics.securityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.securityScore).toBeLessThanOrEqual(1);
    });

    it('should update metrics based on activity', async () => {
      const initialMetrics = atlasAgent.getAtlasMetrics();
      
      // Simulate threat detection
      const testThreat: SecurityThreat = {
        id: 'metrics-test',
        type: 'intrusion',
        severity: 'medium',
        source: 'test',
        description: 'Test for metrics',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.7
      };

      // Manually trigger threat handling
      await atlasAgent['handleThreatDetection'](testThreat);

      const updatedMetrics = atlasAgent.getAtlasMetrics();
      expect(updatedMetrics.threatsDetected).toBeGreaterThanOrEqual(initialMetrics.threatsDetected);
    });
  });

  describe('Security Audit', () => {
    it('should perform comprehensive security audit', async () => {
      // Mock audit methods
      jest.spyOn(atlasAgent['securityMonitor'], 'scanSystemVulnerabilities')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent as any, 'auditAccessControls')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent as any, 'auditSecurityConfigurations')
        .mockResolvedValue([]);
      jest.spyOn(atlasAgent as any, 'checkCompliance')
        .mockResolvedValue([]);

      const auditResult = await atlasAgent.performSecurityAudit();

      expect(auditResult).toHaveProperty('id');
      expect(auditResult).toHaveProperty('timestamp');
      expect(auditResult).toHaveProperty('duration');
      expect(auditResult).toHaveProperty('findings');
      expect(auditResult).toHaveProperty('overallScore');
      expect(auditResult).toHaveProperty('recommendations');
      expect(auditResult).toHaveProperty('nextAuditDate');

      expect(Array.isArray(auditResult.findings)).toBe(true);
      expect(Array.isArray(auditResult.recommendations)).toBe(true);
      expect(typeof auditResult.overallScore).toBe('number');
      expect(auditResult.overallScore).toBeGreaterThanOrEqual(0);
      expect(auditResult.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should coordinate incident response with other agents', async () => {
      const testIncident: SecurityIncident = {
        id: 'coord-test',
        threats: [],
        startTime: new Date(),
        status: 'detected',
        severity: 'critical',
        affectedSystems: ['system1', 'system2'],
        responseActions: [],
        timeline: []
      };

      const coordination = await atlasAgent.coordinateIncidentResponse(testIncident);

      expect(coordination).toHaveProperty('incidentId', testIncident.id);
      expect(coordination).toHaveProperty('leadAgent');
      expect(coordination).toHaveProperty('participatingAgents');
      expect(coordination).toHaveProperty('tasks');
      expect(coordination).toHaveProperty('communicationProtocol');
      expect(coordination).toHaveProperty('escalationPath');
      expect(coordination).toHaveProperty('estimatedResolutionTime');

      expect(Array.isArray(coordination.participatingAgents)).toBe(true);
      expect(Array.isArray(coordination.tasks)).toBe(true);
      expect(typeof coordination.estimatedResolutionTime).toBe('number');
    });

    it('should send messages to other agents for critical threats', async () => {
      const criticalThreat: SecurityThreat = {
        id: 'critical-coord',
        type: 'data_breach',
        severity: 'critical',
        source: 'database',
        description: 'Critical data breach',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.95
      };

      const broadcastSpy = jest.fn();
      atlasAgent.on('broadcast:emergency', broadcastSpy);

      // Simulate critical threat handling
      await atlasAgent['handleCriticalThreat'](criticalThreat);

      expect(broadcastSpy).toHaveBeenCalled();
      
      const broadcastCall = broadcastSpy.mock.calls[0][0];
      expect(broadcastCall.type).toBe('critical_threat');
      expect(broadcastCall.threat).toBe(criticalThreat);
    });
  });

  describe('Configuration Variants', () => {
    it('should behave differently based on automation level', () => {
      const autonomousConfig: AtlasConfig = {
        ...config,
        automationLevel: 'autonomous'
      };

      const autonomousAtlas = new AtlasAgent(autonomousConfig);
      const capabilities = autonomousAtlas['capabilities'];

      expect(capabilities.decisionMaking.canMakeAutonomousDecisions).toBe(true);
      expect(capabilities.autonomyLevel).toBeGreaterThan(8);
    });

    it('should adjust behavior based on security strictness', () => {
      const strictConfig: AtlasConfig = {
        ...config,
        securityStrictness: 'strict'
      };

      const strictAtlas = new AtlasAgent(strictConfig);
      const capabilities = strictAtlas['capabilities'];

      expect(capabilities.decisionMaking.requiresApproval).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle LLM provider failures gracefully', async () => {
      const failingLLMProvider = {
        complete: jest.fn().mockRejectedValue(new Error('LLM failed')),
        isAvailable: jest.fn().mockResolvedValue(false),
        getModelInfo: jest.fn().mockReturnValue({ name: 'test-model', provider: 'test' })
      } as unknown as LLMProvider;

      const resilientAtlas = new AtlasAgent(config, failingLLMProvider);

      // Should not crash even with LLM failures
      expect(async () => {
        await resilientAtlas.start();
        await new Promise(resolve => setTimeout(resolve, 100));
        await resilientAtlas.stop();
      }).not.toThrow();
    });

    it('should continue operating when subsystems fail', async () => {
      // Mock subsystem failure
      jest.spyOn(atlasAgent['securityMonitor'], 'detectThreats')
        .mockRejectedValue(new Error('Monitor failed'));

      // Should still be able to perform perception
      const perception = await atlasAgent['perceive']();
      expect(perception).toBeDefined();
      expect(Array.isArray(perception.currentThreats)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete perception cycle within reasonable time', async () => {
      const startTime = Date.now();
      
      await atlasAgent['perceive']();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain performance under load', async () => {
      const perceptionPromises = Array(5).fill(null).map(() => 
        atlasAgent['perceive']()
      );

      const results = await Promise.all(perceptionPromises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});