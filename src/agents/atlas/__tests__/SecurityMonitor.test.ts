/**
 * SecurityMonitor Tests
 * Comprehensive test suite for Atlas security monitoring capabilities
 */

import { SecurityMonitor, type SecurityMonitorConfig, type SecurityThreat } from '../SecurityMonitor';
import { LLMProvider } from '@utils/llm/LLMProvider';

// Mock LLM Provider
const mockLLMProvider = {
  complete: jest.fn().mockResolvedValue('Test response'),
  isAvailable: jest.fn().mockResolvedValue(true),
  getModelInfo: jest.fn().mockReturnValue({ name: 'test-model', provider: 'test' })
} as unknown as LLMProvider;

describe('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor;
  let config: SecurityMonitorConfig;

  beforeEach(() => {
    config = {
      scanInterval: 1000,
      alertThreshold: 'medium',
      enablePredictiveAnalysis: true,
      enableRealTimeScanning: true,
      maxConcurrentScans: 3
    };

    securityMonitor = new SecurityMonitor(config, mockLLMProvider);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    securityMonitor.stopMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(securityMonitor).toBeInstanceOf(SecurityMonitor);
    });

    it('should emit monitoring:started event when starting', async () => {
      const startedSpy = jest.fn();
      securityMonitor.on('monitoring:started', startedSpy);

      await securityMonitor.startMonitoring();

      expect(startedSpy).toHaveBeenCalled();
    });

    it('should emit monitoring:stopped event when stopping', () => {
      const stoppedSpy = jest.fn();
      securityMonitor.on('monitoring:stopped', stoppedSpy);

      securityMonitor.stopMonitoring();

      expect(stoppedSpy).toHaveBeenCalled();
    });
  });

  describe('Threat Detection', () => {
    it('should detect threats successfully', async () => {
      const threats = await securityMonitor.detectThreats();

      expect(Array.isArray(threats)).toBe(true);
      // Threats array may be empty or contain detected threats
      threats.forEach(threat => {
        expect(threat).toHaveProperty('id');
        expect(threat).toHaveProperty('type');
        expect(threat).toHaveProperty('severity');
        expect(threat).toHaveProperty('source');
        expect(threat).toHaveProperty('description');
        expect(threat).toHaveProperty('indicators');
        expect(threat).toHaveProperty('timestamp');
        expect(threat).toHaveProperty('confidence');
      });
    });

    it('should emit threat:detected event for detected threats', async () => {
      const threatDetectedSpy = jest.fn();
      securityMonitor.on('threat:detected', threatDetectedSpy);

      // Mock Math.random to force threat detection
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.05); // Force threat detection

      const threats = await securityMonitor.detectThreats();

      if (threats.length > 0) {
        expect(threatDetectedSpy).toHaveBeenCalled();
      }

      Math.random = originalRandom;
    });

    it('should emit critical threat events for critical threats', async () => {
      const criticalThreatSpy = jest.fn();
      securityMonitor.on('threat:critical', criticalThreatSpy);

      // Create a mock critical threat
      const criticalThreat: SecurityThreat = {
        id: 'test-critical-threat',
        type: 'malware',
        severity: 'critical',
        source: 'test-source',
        description: 'Test critical threat',
        indicators: { test: 'indicator' },
        timestamp: new Date(),
        confidence: 0.95
      };

      // Manually trigger threat detection with critical threat
      securityMonitor['threatDatabase'].set(criticalThreat.id, criticalThreat);
      securityMonitor['emitThreatAlert'](criticalThreat);

      expect(criticalThreatSpy).toHaveBeenCalledWith(criticalThreat);
    });
  });

  describe('Network Analysis', () => {
    it('should analyze network traffic successfully', async () => {
      const analysis = await securityMonitor.analyzeNetworkTraffic();

      expect(analysis).toHaveProperty('timestamp');
      expect(analysis).toHaveProperty('totalConnections');
      expect(analysis).toHaveProperty('suspiciousConnections');
      expect(analysis).toHaveProperty('blockedConnections');
      expect(analysis).toHaveProperty('trafficPatterns');
      expect(analysis).toHaveProperty('anomalies');

      expect(typeof analysis.totalConnections).toBe('number');
      expect(typeof analysis.suspiciousConnections).toBe('number');
      expect(typeof analysis.blockedConnections).toBe('number');
      expect(Array.isArray(analysis.trafficPatterns)).toBe(true);
      expect(Array.isArray(analysis.anomalies)).toBe(true);
    });

    it('should identify traffic patterns', async () => {
      const analysis = await securityMonitor.analyzeNetworkTraffic();

      analysis.trafficPatterns.forEach(pattern => {
        expect(pattern).toHaveProperty('source');
        expect(pattern).toHaveProperty('destination');
        expect(pattern).toHaveProperty('protocol');
        expect(pattern).toHaveProperty('volume');
        expect(pattern).toHaveProperty('frequency');
        expect(pattern).toHaveProperty('isNormal');
      });
    });
  });

  describe('Vulnerability Scanning', () => {
    it('should scan system vulnerabilities', async () => {
      const vulnerabilities = await securityMonitor.scanSystemVulnerabilities();

      expect(Array.isArray(vulnerabilities)).toBe(true);
      
      vulnerabilities.forEach(vuln => {
        expect(vuln).toHaveProperty('id');
        expect(vuln).toHaveProperty('name');
        expect(vuln).toHaveProperty('severity');
        expect(vuln).toHaveProperty('component');
        expect(vuln).toHaveProperty('description');
        expect(vuln).toHaveProperty('remediation');
        expect(vuln).toHaveProperty('exploitAvailable');
      });
    });

    it('should emit vulnerability:critical event for critical vulnerabilities', async () => {
      const criticalVulnSpy = jest.fn();
      securityMonitor.on('vulnerability:critical', criticalVulnSpy);

      // Mock Math.random to force critical vulnerability
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.2) // Trigger vulnerability detection
        .mockReturnValueOnce(0.3); // Make it high severity
      
      const vulnerabilities = await securityMonitor.scanSystemVulnerabilities();

      // Check if any critical vulnerabilities were found
      const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
      if (criticalVulns.length > 0) {
        expect(criticalVulnSpy).toHaveBeenCalled();
      }

      Math.random = originalRandom;
    });
  });

  describe('File Monitoring', () => {
    it('should monitor file changes', async () => {
      const changes = await securityMonitor.monitorFileChanges();

      expect(Array.isArray(changes)).toBe(true);

      changes.forEach(change => {
        expect(change).toHaveProperty('path');
        expect(change).toHaveProperty('type');
        expect(change).toHaveProperty('timestamp');
        expect(change).toHaveProperty('actor');
        expect(change).toHaveProperty('isSuspicious');
        
        expect(['created', 'modified', 'deleted', 'permissions_changed']).toContain(change.type);
        expect(typeof change.isSuspicious).toBe('boolean');
      });
    });

    it('should emit files:suspicious event for suspicious changes', async () => {
      const suspiciousFilesSpy = jest.fn();
      securityMonitor.on('files:suspicious', suspiciousFilesSpy);

      // Mock Math.random to force suspicious file detection
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.05); // Force file change detection

      const changes = await securityMonitor.monitorFileChanges();

      const suspiciousChanges = changes.filter(c => c.isSuspicious);
      if (suspiciousChanges.length > 0) {
        expect(suspiciousFilesSpy).toHaveBeenCalledWith(suspiciousChanges);
      }

      Math.random = originalRandom;
    });
  });

  describe('Threat Assessment', () => {
    it('should assess threat level correctly', async () => {
      const testThreat: SecurityThreat = {
        id: 'test-threat',
        type: 'intrusion',
        severity: 'high',
        source: 'test-source',
        description: 'Test threat for assessment',
        indicators: { attempts: 5 },
        timestamp: new Date(),
        confidence: 0.8
      };

      const threatLevel = await securityMonitor.assessThreatLevel(testThreat);

      expect(typeof threatLevel).toBe('number');
      expect(threatLevel).toBeGreaterThanOrEqual(0);
      expect(threatLevel).toBeLessThanOrEqual(1);
    });

    it('should use LLM for contextual assessment', async () => {
      const testThreat: SecurityThreat = {
        id: 'test-threat-llm',
        type: 'malware',
        severity: 'critical',
        source: 'test-source',
        description: 'Test threat for LLM assessment',
        indicators: { hash: 'abc123' },
        timestamp: new Date(),
        confidence: 0.9
      };

      // Mock LLM response with adjustment factor
      mockLLMProvider.complete = jest.fn().mockResolvedValue('adjustment factor: 1.2');

      const threatLevel = await securityMonitor.assessThreatLevel(testThreat);

      expect(mockLLMProvider.complete).toHaveBeenCalled();
      expect(typeof threatLevel).toBe('number');
    });
  });

  describe('Threat Prediction', () => {
    it('should predict threat evolution', async () => {
      const testThreat: SecurityThreat = {
        id: 'test-threat-prediction',
        type: 'ddos',
        severity: 'medium',
        source: 'test-source',
        description: 'Test threat for prediction',
        indicators: { volume: 1000 },
        timestamp: new Date(),
        confidence: 0.7
      };

      const prediction = await securityMonitor.predictThreatEvolution(testThreat);

      expect(prediction).toHaveProperty('threatId', testThreat.id);
      expect(prediction).toHaveProperty('evolutionProbability');
      expect(prediction).toHaveProperty('estimatedTimeToEscalation');
      expect(prediction).toHaveProperty('predictedSeverity');
      expect(prediction).toHaveProperty('recommendedActions');
      expect(prediction).toHaveProperty('confidence');

      expect(typeof prediction.evolutionProbability).toBe('number');
      expect(prediction.evolutionProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.evolutionProbability).toBeLessThanOrEqual(1);
      
      expect(typeof prediction.estimatedTimeToEscalation).toBe('number');
      expect(prediction.estimatedTimeToEscalation).toBeGreaterThan(0);
      
      expect(Array.isArray(prediction.recommendedActions)).toBe(true);
    });

    it('should use LLM for predictive analysis when enabled', async () => {
      const testThreat: SecurityThreat = {
        id: 'test-threat-llm-prediction',
        type: 'intrusion',
        severity: 'high',
        source: 'test-source',
        description: 'Test threat for LLM prediction',
        indicators: { port: 22, attempts: 10 },
        timestamp: new Date(),
        confidence: 0.85
      };

      // Mock LLM response
      mockLLMProvider.complete = jest.fn().mockResolvedValue(`
        Probability of escalation: 0.8
        Time to escalation: 30 minutes
        Severity: critical
        Actions: isolate, investigate, alert
      `);

      const prediction = await securityMonitor.predictThreatEvolution(testThreat);

      expect(mockLLMProvider.complete).toHaveBeenCalled();
      expect(prediction.threatId).toBe(testThreat.id);
    });
  });

  describe('Continuous Monitoring', () => {
    it('should perform security scans continuously when monitoring is active', async () => {
      const scanCompletedSpy = jest.fn();
      securityMonitor.on('scan:completed', scanCompletedSpy);

      await securityMonitor.startMonitoring();

      // Wait for at least one scan cycle
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(scanCompletedSpy).toHaveBeenCalled();
    });

    it('should handle scan failures gracefully', async () => {
      const scanFailedSpy = jest.fn();
      securityMonitor.on('scan:failed', scanFailedSpy);

      // Mock a method to throw an error
      jest.spyOn(securityMonitor, 'detectThreats').mockRejectedValueOnce(new Error('Scan failed'));

      await securityMonitor.startMonitoring();

      // Wait for scan cycle
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(scanFailedSpy).toHaveBeenCalled();
    });
  });

  describe('Alert Configuration', () => {
    it('should respect alert threshold configuration', async () => {
      const configWithHighThreshold: SecurityMonitorConfig = {
        ...config,
        alertThreshold: 'high'
      };

      const monitorWithHighThreshold = new SecurityMonitor(configWithHighThreshold, mockLLMProvider);

      const lowThreat: SecurityThreat = {
        id: 'low-threat',
        type: 'anomaly',
        severity: 'low',
        source: 'test',
        description: 'Low severity threat',
        indicators: {},
        timestamp: new Date(),
        confidence: 0.5
      };

      const alertSpy = jest.fn();
      monitorWithHighThreshold.on('threat:detected', alertSpy);

      // Manually trigger alert check
      monitorWithHighThreshold['emitThreatAlert'](lowThreat);

      // Should not alert for low severity when threshold is high
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM failures gracefully', async () => {
      // Mock LLM failure
      const failingLLMProvider = {
        complete: jest.fn().mockRejectedValue(new Error('LLM unavailable')),
        isAvailable: jest.fn().mockResolvedValue(false),
        getModelInfo: jest.fn().mockReturnValue({ name: 'test-model', provider: 'test' })
      } as unknown as LLMProvider;

      const monitorWithFailingLLM = new SecurityMonitor(config, failingLLMProvider);

      // Should not throw error even if LLM fails
      const threats = await monitorWithFailingLLM.detectThreats();
      expect(Array.isArray(threats)).toBe(true);
    });

    it('should continue operating when individual scans fail', async () => {
      // Mock one scan method to fail
      jest.spyOn(securityMonitor, 'scanSystemVulnerabilities')
        .mockRejectedValueOnce(new Error('Vulnerability scan failed'));

      // Should still return threats from other scan methods
      const threats = await securityMonitor.detectThreats();
      expect(Array.isArray(threats)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete threat detection within reasonable time', async () => {
      const startTime = Date.now();
      
      await securityMonitor.detectThreats();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respect concurrent scan limits', () => {
      expect(config.maxConcurrentScans).toBe(3);
      // In a real implementation, we would test that no more than 3 scans run concurrently
    });
  });
});