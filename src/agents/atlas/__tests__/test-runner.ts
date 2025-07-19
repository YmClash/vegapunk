/**
 * Atlas Agent Test Runner
 * Simplified test runner to validate Atlas functionality without full Jest setup
 */

import { AtlasAgent, type AtlasConfig } from '../AtlasAgent';
import { LLMProviderFactory } from '@utils/llm/LLMProvider';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
}

class AtlasTestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name} - PASSED (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        duration: Date.now() - startTime,
        error: error as Error
      });
      console.log(`❌ ${name} - FAILED (${Date.now() - startTime}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${passed}/${total} passed`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log('='.repeat(60));

    if (passed === total) {
      console.log('🎉 All tests passed! Atlas is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Review issues before deployment.');
      
      const failures = this.results.filter(r => !r.passed);
      failures.forEach(failure => {
        console.log(`   - ${failure.name}: ${failure.error?.message}`);
      });
    }
  }
}

async function runAtlasTests(): Promise<void> {
  console.log('🛡️  Starting Atlas Agent Tests...\n');
  
  const runner = new AtlasTestRunner();
  
  // Test configuration
  const config: AtlasConfig = {
    name: 'TestAtlas',
    specialty: 'security_automation',
    cycleInterval: 1000,
    securityStrictness: 'balanced',
    automationLevel: 'supervised',
    proactiveDefense: true,
    learningEnabled: true,
    maintenanceMode: 'proactive'
  };

  let atlasAgent: AtlasAgent;
  let llmProvider: any;

  // Setup
  await runner.runTest('Setup: Initialize LLM Provider', async () => {
    try {
      llmProvider = await LLMProviderFactory.create({
        preferredProvider: 'ollama',
        fallbackProviders: ['openai'],
        modelPreferences: {
          ollama: 'llama2',
          openai: 'gpt-3.5-turbo'
        }
      });
      
      if (!llmProvider) {
        throw new Error('No LLM provider available');
      }
    } catch (error) {
      // Create mock provider for testing
      llmProvider = {
        complete: async () => 'Mock response for testing',
        isAvailable: async () => true,
        getModelInfo: () => ({ name: 'mock-model', provider: 'mock' })
      };
      console.log('   Using mock LLM provider (no real LLM available)');
    }
  });

  await runner.runTest('Setup: Initialize Atlas Agent', async () => {
    atlasAgent = new AtlasAgent(config, llmProvider);
    
    if (!atlasAgent) {
      throw new Error('Failed to initialize Atlas Agent');
    }
  });

  // Basic Functionality Tests
  await runner.runTest('Basic: Agent State', async () => {
    const state = atlasAgent.getState();
    
    if (!state.id || !state.name || !state.specialty) {
      throw new Error('Invalid agent state');
    }
    
    if (state.name !== 'TestAtlas') {
      throw new Error(`Expected name 'TestAtlas', got '${state.name}'`);
    }
    
    if (state.specialty !== 'security_automation') {
      throw new Error(`Expected specialty 'security_automation', got '${state.specialty}'`);
    }
  });

  await runner.runTest('Basic: Metrics Access', async () => {
    const metrics = atlasAgent.getAtlasMetrics();
    
    const requiredMetrics = [
      'threatsDetected', 'threatsNeutralized', 'incidentsResolved',
      'automationTasksCompleted', 'systemUptime', 'averageResponseTime',
      'falsePositiveRate', 'securityScore'
    ];

    for (const metric of requiredMetrics) {
      if (typeof metrics[metric] === 'undefined') {
        throw new Error(`Missing metric: ${metric}`);
      }
    }

    if (metrics.securityScore < 0 || metrics.securityScore > 1) {
      throw new Error(`Invalid security score: ${metrics.securityScore}`);
    }
  });

  // Security Monitoring Tests
  await runner.runTest('Security: Monitor Initialization', async () => {
    const monitor = atlasAgent['securityMonitor'];
    
    if (!monitor) {
      throw new Error('Security monitor not initialized');
    }
  });

  await runner.runTest('Security: Threat Detection', async () => {
    const monitor = atlasAgent['securityMonitor'];
    const threats = await monitor.detectThreats();
    
    if (!Array.isArray(threats)) {
      throw new Error('Threat detection should return an array');
    }
    
    // Validate threat structure if any threats are detected
    threats.forEach((threat, index) => {
      const requiredFields = ['id', 'type', 'severity', 'source', 'description', 'indicators', 'timestamp', 'confidence'];
      for (const field of requiredFields) {
        if (!threat[field]) {
          throw new Error(`Threat ${index} missing required field: ${field}`);
        }
      }
      
      if (threat.confidence < 0 || threat.confidence > 1) {
        throw new Error(`Invalid confidence score for threat ${index}: ${threat.confidence}`);
      }
    });
  });

  await runner.runTest('Security: Network Analysis', async () => {
    const monitor = atlasAgent['securityMonitor'];
    const analysis = await monitor.analyzeNetworkTraffic();
    
    const requiredFields = ['timestamp', 'totalConnections', 'suspiciousConnections', 'blockedConnections', 'trafficPatterns', 'anomalies'];
    for (const field of requiredFields) {
      if (typeof analysis[field] === 'undefined') {
        throw new Error(`Network analysis missing field: ${field}`);
      }
    }
    
    if (!Array.isArray(analysis.trafficPatterns) || !Array.isArray(analysis.anomalies)) {
      throw new Error('Traffic patterns and anomalies should be arrays');
    }
  });

  await runner.runTest('Security: Vulnerability Scanning', async () => {
    const monitor = atlasAgent['securityMonitor'];
    const vulnerabilities = await monitor.scanSystemVulnerabilities();
    
    if (!Array.isArray(vulnerabilities)) {
      throw new Error('Vulnerability scan should return an array');
    }
    
    vulnerabilities.forEach((vuln, index) => {
      const requiredFields = ['id', 'name', 'severity', 'component', 'description', 'remediation', 'exploitAvailable'];
      for (const field of requiredFields) {
        if (typeof vuln[field] === 'undefined') {
          throw new Error(`Vulnerability ${index} missing field: ${field}`);
        }
      }
    });
  });

  // Incident Response Tests
  await runner.runTest('Incident: Responder Initialization', async () => {
    const responder = atlasAgent['incidentResponder'];
    
    if (!responder) {
      throw new Error('Incident responder not initialized');
    }
  });

  // Automation Tests
  await runner.runTest('Automation: Engine Initialization', async () => {
    const automation = atlasAgent['automationEngine'];
    
    if (!automation) {
      throw new Error('Automation engine not initialized');
    }
  });

  await runner.runTest('Automation: System Maintenance', async () => {
    const automation = atlasAgent['automationEngine'];
    const result = await automation.performSystemMaintenance();
    
    const requiredFields = ['taskId', 'success', 'startTime', 'endTime', 'changes', 'metrics', 'issues'];
    for (const field of requiredFields) {
      if (typeof result[field] === 'undefined') {
        throw new Error(`Maintenance result missing field: ${field}`);
      }
    }
    
    if (!Array.isArray(result.changes) || !Array.isArray(result.issues)) {
      throw new Error('Changes and issues should be arrays');
    }
  });

  // Agent Lifecycle Tests
  await runner.runTest('Lifecycle: Start Agent', async () => {
    await atlasAgent.start();
    
    // Wait a bit for the agent to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const state = atlasAgent.getState();
    if (!['thinking', 'acting', 'idle'].includes(state.status)) {
      throw new Error(`Unexpected agent status: ${state.status}`);
    }
  });

  await runner.runTest('Lifecycle: Agent Perception', async () => {
    const perception = await atlasAgent['perceive']();
    
    const requiredFields = ['currentThreats', 'activeIncidents', 'systemVulnerabilities', 'lastSecurityUpdate', 'defensePosture'];
    for (const field of requiredFields) {
      if (typeof perception[field] === 'undefined') {
        throw new Error(`Perception missing field: ${field}`);
      }
    }
    
    if (!['normal', 'heightened', 'critical'].includes(perception.defensePosture)) {
      throw new Error(`Invalid defense posture: ${perception.defensePosture}`);
    }
  });

  await runner.runTest('Lifecycle: Stop Agent', async () => {
    await atlasAgent.stop();
    
    // Agent should still be accessible after stopping
    const state = atlasAgent.getState();
    if (!state) {
      throw new Error('Agent state unavailable after stop');
    }
  });

  // Security Audit Test
  await runner.runTest('Advanced: Security Audit', async () => {
    const auditResult = await atlasAgent.performSecurityAudit();
    
    const requiredFields = ['id', 'timestamp', 'duration', 'findings', 'overallScore', 'recommendations', 'nextAuditDate'];
    for (const field of requiredFields) {
      if (typeof auditResult[field] === 'undefined') {
        throw new Error(`Audit result missing field: ${field}`);
      }
    }
    
    if (auditResult.overallScore < 0 || auditResult.overallScore > 1) {
      throw new Error(`Invalid audit score: ${auditResult.overallScore}`);
    }
    
    if (!Array.isArray(auditResult.findings) || !Array.isArray(auditResult.recommendations)) {
      throw new Error('Findings and recommendations should be arrays');
    }
  });

  // Configuration Tests
  await runner.runTest('Config: Different Automation Levels', async () => {
    const autonomousConfig: AtlasConfig = {
      ...config,
      automationLevel: 'autonomous'
    };
    
    const autonomousAtlas = new AtlasAgent(autonomousConfig, llmProvider);
    const capabilities = autonomousAtlas['capabilities'];
    
    if (!capabilities.decisionMaking.canMakeAutonomousDecisions) {
      throw new Error('Autonomous agent should be able to make autonomous decisions');
    }
    
    if (capabilities.autonomyLevel <= 8) {
      throw new Error('Autonomous agent should have high autonomy level');
    }
  });

  await runner.runTest('Config: Security Strictness', async () => {
    const strictConfig: AtlasConfig = {
      ...config,
      securityStrictness: 'strict'
    };
    
    const strictAtlas = new AtlasAgent(strictConfig, llmProvider);
    const capabilities = strictAtlas['capabilities'];
    
    if (!capabilities.decisionMaking.requiresApproval) {
      throw new Error('Strict agent should require approval for decisions');
    }
  });

  // Performance Tests
  await runner.runTest('Performance: Perception Speed', async () => {
    const startTime = Date.now();
    await atlasAgent['perceive']();
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      throw new Error(`Perception took too long: ${duration}ms`);
    }
  });

  await runner.runTest('Performance: Concurrent Operations', async () => {
    const operations = [
      atlasAgent['perceive'](),
      atlasAgent.getAtlasMetrics(),
      atlasAgent.performSecurityAudit()
    ];
    
    const results = await Promise.all(operations);
    
    if (results.length !== 3) {
      throw new Error('Not all concurrent operations completed');
    }
  });

  // Error Handling Tests
  await runner.runTest('Resilience: Invalid LLM Provider', async () => {
    const failingLLM = {
      complete: async () => { throw new Error('LLM failed'); },
      isAvailable: async () => false,
      getModelInfo: () => ({ name: 'failing-model', provider: 'fail' })
    };
    
    const resilientAtlas = new AtlasAgent(config, failingLLM);
    
    // Should not crash
    const state = resilientAtlas.getState();
    if (!state) {
      throw new Error('Agent failed to initialize with failing LLM');
    }
  });

  // Print final results
  runner.printSummary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAtlasTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAtlasTests };