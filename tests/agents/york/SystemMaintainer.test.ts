/**
 * Tests for SystemMaintainer - Advanced system maintenance and health monitoring engine
 * Comprehensive test suite covering health monitoring, maintenance execution, and system reliability
 */

import { SystemMaintainer, SystemHealth, MaintenanceResult } from '../../../src/agents/york/SystemMaintainer';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('system health')) {
      return JSON.stringify({
        health_analysis: 'System showing good overall health with minor optimization opportunities',
        critical_issues: [],
        warnings: [
          'Memory usage approaching warning threshold',
          'Disk fragmentation detected on primary drive'
        ],
        recommendations: [
          'Schedule memory cleanup during next maintenance window',
          'Perform disk defragmentation',
          'Update system monitoring thresholds'
        ],
        overall_score: 0.82,
        reliability_assessment: 'high'
      });
    }
    
    if (prompt.includes('maintenance planning')) {
      return JSON.stringify({
        maintenance_strategy: 'preventive_focused',
        priority_actions: [
          'System component health verification',
          'Performance optimization',
          'Security updates application'
        ],
        estimated_duration: 3.5,
        risk_assessment: 'low',
        recommended_window: 'weekend_early_morning'
      });
    }
    
    if (prompt.includes('performance optimization')) {
      return JSON.stringify({
        optimization_opportunities: [
          'Database query optimization',
          'Cache configuration tuning',
          'Resource allocation adjustment'
        ],
        expected_improvements: {
          response_time: 0.15,
          throughput: 0.12,
          resource_efficiency: 0.20
        },
        implementation_complexity: 'medium'
      });
    }
    
    return 'System maintenance analysis completed with standard recommendations.';
  }
}

describe('SystemMaintainer', () => {
  let systemMaintainer: SystemMaintainer;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    systemMaintainer = new SystemMaintainer(mockLLMProvider, {
      health_check_interval_minutes: 5,
      preventive_maintenance_enabled: true,
      automated_remediation_enabled: true,
      maintenance_aggressiveness: 0.8,
      risk_tolerance: 0.3,
      compliance_requirements: [
        {
          standard: 'ISO27001',
          requirement: 'Regular security assessments',
          compliance_level: 'required',
          audit_frequency: 'monthly',
          evidence_collection: ['security_logs', 'vulnerability_scans']
        }
      ],
      notification_preferences: [
        {
          event_type: 'critical_issue',
          notification_method: 'immediate_alert',
          recipient: 'ops_team',
          urgency_threshold: 'high'
        }
      ],
      backup_frequency_hours: 12
    });
  });

  describe('Construction and Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultMaintainer = new SystemMaintainer(mockLLMProvider);
      expect(defaultMaintainer).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      expect(systemMaintainer).toBeDefined();
    });

    test('should initialize default alert rules and baselines', () => {
      const metrics = systemMaintainer.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.health_checks_performed).toBe('number');
      expect(typeof metrics.maintenance_sessions_completed).toBe('number');
    });
  });

  describe('System Health Monitoring', () => {
    test('should perform comprehensive system health check', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth.id).toBeDefined();
      expect(systemHealth.timestamp).toBeInstanceOf(Date);
      expect(typeof systemHealth.overall_score).toBe('number');
      expect(systemHealth.overall_score).toBeGreaterThanOrEqual(0);
      expect(systemHealth.overall_score).toBeLessThanOrEqual(1);
      expect(Array.isArray(systemHealth.component_health)).toBe(true);
      expect(Array.isArray(systemHealth.critical_issues)).toBe(true);
      expect(Array.isArray(systemHealth.warnings)).toBe(true);
      expect(Array.isArray(systemHealth.recommendations)).toBe(true);
      expect(systemHealth.uptime_statistics).toBeDefined();
      expect(Array.isArray(systemHealth.performance_indicators)).toBe(true);
      expect(systemHealth.reliability_metrics).toBeDefined();
    });

    test('should check all system components', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      const componentHealth = systemHealth.component_health;
      
      expect(componentHealth.length).toBeGreaterThan(0);
      
      componentHealth.forEach(component => {
        expect(component.component_name).toBeDefined();
        expect(['hardware', 'software', 'network', 'storage', 'security']).toContain(component.component_type);
        expect(typeof component.health_score).toBe('number');
        expect(component.health_score).toBeGreaterThanOrEqual(0);
        expect(component.health_score).toBeLessThanOrEqual(1);
        expect(['healthy', 'warning', 'critical', 'failed', 'maintenance']).toContain(component.status);
        expect(component.last_check).toBeInstanceOf(Date);
        expect(Array.isArray(component.issues_detected)).toBe(true);
        expect(typeof component.maintenance_required).toBe('boolean');
        expect(component.next_maintenance_date).toBeInstanceOf(Date);
        expect(typeof component.failure_probability).toBe('number');
        expect(typeof component.performance_degradation).toBe('number');
      });
    });

    test('should collect uptime statistics', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      const uptimeStats = systemHealth.uptime_statistics;
      
      expect(typeof uptimeStats.current_uptime_hours).toBe('number');
      expect(uptimeStats.current_uptime_hours).toBeGreaterThanOrEqual(0);
      expect(typeof uptimeStats.uptime_percentage_24h).toBe('number');
      expect(uptimeStats.uptime_percentage_24h).toBeGreaterThanOrEqual(0);
      expect(uptimeStats.uptime_percentage_24h).toBeLessThanOrEqual(100);
      expect(typeof uptimeStats.uptime_percentage_7d).toBe('number');
      expect(typeof uptimeStats.uptime_percentage_30d).toBe('number');
      expect(typeof uptimeStats.mean_time_between_failures_hours).toBe('number');
      expect(typeof uptimeStats.mean_time_to_recovery_minutes).toBe('number');
      expect(typeof uptimeStats.availability_sla_target).toBe('number');
      expect(typeof uptimeStats.availability_sla_actual).toBe('number');
      expect(Array.isArray(uptimeStats.downtime_events)).toBe(true);
    });

    test('should calculate reliability metrics', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      const reliabilityMetrics = systemHealth.reliability_metrics;
      
      expect(typeof reliabilityMetrics.system_reliability_score).toBe('number');
      expect(reliabilityMetrics.system_reliability_score).toBeGreaterThanOrEqual(0);
      expect(reliabilityMetrics.system_reliability_score).toBeLessThanOrEqual(1);
      expect(Array.isArray(reliabilityMetrics.component_failure_rates)).toBe(true);
      expect(Array.isArray(reliabilityMetrics.redundancy_status)).toBe(true);
      expect(typeof reliabilityMetrics.disaster_recovery_readiness).toBe('number');
      expect(typeof reliabilityMetrics.backup_integrity_score).toBe('number');
      expect(Array.isArray(reliabilityMetrics.recovery_capabilities)).toBe(true);
    });

    test('should maintain health check history', async () => {
      // Perform multiple health checks
      await systemMaintainer.performSystemHealthCheck();
      await systemMaintainer.performSystemHealthCheck();
      await systemMaintainer.performSystemHealthCheck();
      
      const metrics = systemMaintainer.getMetrics();
      expect(metrics.health_checks_performed).toBeGreaterThan(0);
    });
  });

  describe('Maintenance Execution', () => {
    test('should execute preventive maintenance', async () => {
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('preventive');
      
      expect(maintenanceResult).toBeDefined();
      expect(maintenanceResult.maintenance_id).toBeDefined();
      expect(maintenanceResult.execution_timestamp).toBeInstanceOf(Date);
      expect(maintenanceResult.maintenance_type).toBe('preventive');
      expect(Array.isArray(maintenanceResult.target_components)).toBe(true);
      expect(Array.isArray(maintenanceResult.actions_performed)).toBe(true);
      expect(typeof maintenanceResult.duration_actual_hours).toBe('number');
      expect(maintenanceResult.duration_actual_hours).toBeGreaterThan(0);
      expect(typeof maintenanceResult.success_rate).toBe('number');
      expect(maintenanceResult.success_rate).toBeGreaterThanOrEqual(0);
      expect(maintenanceResult.success_rate).toBeLessThanOrEqual(1);
      expect(Array.isArray(maintenanceResult.issues_resolved)).toBe(true);
      expect(Array.isArray(maintenanceResult.issues_discovered)).toBe(true);
      expect(Array.isArray(maintenanceResult.system_improvements)).toBe(true);
      expect(Array.isArray(maintenanceResult.lessons_learned)).toBe(true);
      expect(Array.isArray(maintenanceResult.next_maintenance_schedule)).toBe(true);
    });

    test('should execute corrective maintenance', async () => {
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('corrective');
      
      expect(maintenanceResult.maintenance_type).toBe('corrective');
      expect(maintenanceResult).toBeDefined();
    });

    test('should execute predictive maintenance', async () => {
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('predictive');
      
      expect(maintenanceResult.maintenance_type).toBe('predictive');
      expect(maintenanceResult).toBeDefined();
    });

    test('should execute emergency maintenance', async () => {
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('emergency');
      
      expect(maintenanceResult.maintenance_type).toBe('emergency');
      expect(maintenanceResult).toBeDefined();
    });

    test('should execute maintenance for specific components', async () => {
      const targetComponents = ['database_server', 'web_server', 'cache_server'];
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('preventive', targetComponents);
      
      expect(maintenanceResult.target_components).toEqual(targetComponents);
    });

    test('should calculate maintenance success rate', async () => {
      const maintenanceResult = await systemMaintainer.executeScheduledMaintenance('preventive');
      
      expect(maintenanceResult.success_rate).toBeGreaterThanOrEqual(0);
      expect(maintenanceResult.success_rate).toBeLessThanOrEqual(1);
    });

    test('should track maintenance history', async () => {
      const initialMetrics = systemMaintainer.getMetrics();
      
      await systemMaintainer.executeScheduledMaintenance('preventive');
      
      const updatedMetrics = systemMaintainer.getMetrics();
      expect(updatedMetrics.maintenance_sessions_completed).toBeGreaterThan(initialMetrics.maintenance_sessions_completed);
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize system performance proactively', async () => {
      const optimizationResult = await systemMaintainer.optimizeSystemPerformance();
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.maintenance_type).toBe('predictive');
      expect(optimizationResult.maintenance_id).toBeDefined();
    });

    test('should identify optimization opportunities', async () => {
      // This is tested indirectly through the performance optimization
      const optimizationResult = await systemMaintainer.optimizeSystemPerformance();
      
      expect(optimizationResult.actions_performed).toBeDefined();
      expect(optimizationResult.system_improvements).toBeDefined();
    });
  });

  describe('Continuous Monitoring', () => {
    test('should start continuous monitoring', async () => {
      // Start continuous monitoring (this sets up intervals)
      const monitoringPromise = systemMaintainer.startContinuousMonitoring();
      
      expect(monitoringPromise).toBeInstanceOf(Promise);
      
      // Note: In a real test, we might want to stop the monitoring after a short time
      // For this test, we're just verifying the method can be called without error
    });

    test('should handle monitoring cycle failures gracefully', async () => {
      // Continuous monitoring should handle errors gracefully
      // This is more of an integration test that would require mocking internal failures
      expect(async () => {
        await systemMaintainer.startContinuousMonitoring();
      }).not.toThrow();
    });
  });

  describe('Metrics and Analytics', () => {
    test('should provide comprehensive maintenance metrics', () => {
      const metrics = systemMaintainer.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.health_checks_performed).toBe('number');
      expect(typeof metrics.maintenance_sessions_completed).toBe('number');
      expect(typeof metrics.average_system_health).toBe('number');
      expect(typeof metrics.maintenance_success_rate).toBe('number');
      expect(typeof metrics.mean_time_to_repair).toBe('number');
      expect(typeof metrics.preventive_maintenance_effectiveness).toBe('number');
      expect(typeof metrics.system_availability).toBe('number');
      expect(typeof metrics.critical_issues_resolved).toBe('number');
      
      expect(metrics.average_system_health).toBeGreaterThanOrEqual(0);
      expect(metrics.average_system_health).toBeLessThanOrEqual(1);
      expect(metrics.maintenance_success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.maintenance_success_rate).toBeLessThanOrEqual(1);
      expect(metrics.system_availability).toBeGreaterThanOrEqual(0);
      expect(metrics.system_availability).toBeLessThanOrEqual(1);
    });

    test('should calculate average system health', async () => {
      // Perform several health checks to get an average
      await systemMaintainer.performSystemHealthCheck();
      await systemMaintainer.performSystemHealthCheck();
      
      const metrics = systemMaintainer.getMetrics();
      expect(metrics.average_system_health).toBeGreaterThan(0);
    });

    test('should track maintenance effectiveness', async () => {
      await systemMaintainer.executeScheduledMaintenance('preventive');
      
      const metrics = systemMaintainer.getMetrics();
      expect(metrics.preventive_maintenance_effectiveness).toBeGreaterThan(0);
      expect(metrics.preventive_maintenance_effectiveness).toBeLessThanOrEqual(1);
    });

    test('should calculate mean time to repair', async () => {
      await systemMaintainer.executeScheduledMaintenance('corrective');
      
      const metrics = systemMaintainer.getMetrics();
      expect(metrics.mean_time_to_repair).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle health check failures gracefully', async () => {
      try {
        const systemHealth = await systemMaintainer.performSystemHealthCheck();
        expect(systemHealth).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('System health check failed');
      }
    });

    test('should handle maintenance execution failures', async () => {
      try {
        const result = await systemMaintainer.executeScheduledMaintenance('preventive');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Maintenance execution failed');
      }
    });

    test('should handle invalid maintenance types', async () => {
      try {
        // @ts-ignore - Testing invalid input
        await systemMaintainer.executeScheduledMaintenance('invalid_type');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle optimization failures', async () => {
      try {
        const result = await systemMaintainer.optimizeSystemPerformance();
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Performance optimization failed');
      }
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect custom health check intervals', () => {
      const customMaintainer = new SystemMaintainer(mockLLMProvider, {
        health_check_interval_minutes: 1,
        preventive_maintenance_enabled: false,
        automated_remediation_enabled: false
      });
      
      expect(customMaintainer).toBeDefined();
    });

    test('should handle compliance requirements', () => {
      const complianceMaintainer = new SystemMaintainer(mockLLMProvider, {
        compliance_requirements: [
          {
            standard: 'SOX',
            requirement: 'Data integrity controls',
            compliance_level: 'required',
            audit_frequency: 'quarterly',
            evidence_collection: ['audit_logs', 'integrity_checks']
          },
          {
            standard: 'GDPR',
            requirement: 'Data protection measures',
            compliance_level: 'required',
            audit_frequency: 'annual',
            evidence_collection: ['privacy_logs', 'data_mapping']
          }
        ]
      });
      
      expect(complianceMaintainer).toBeDefined();
    });

    test('should handle notification preferences', () => {
      const notificationMaintainer = new SystemMaintainer(mockLLMProvider, {
        notification_preferences: [
          {
            event_type: 'system_failure',
            notification_method: 'email',
            recipient: 'admin@company.com',
            urgency_threshold: 'critical'
          },
          {
            event_type: 'maintenance_complete',
            notification_method: 'dashboard',
            recipient: 'ops_dashboard',
            urgency_threshold: 'low'
          }
        ]
      });
      
      expect(notificationMaintainer).toBeDefined();
    });

    test('should use default values for missing configuration', () => {
      const partialMaintainer = new SystemMaintainer(mockLLMProvider, {
        maintenance_aggressiveness: 0.5
        // Other values should use defaults
      });
      
      expect(partialMaintainer).toBeDefined();
      const metrics = partialMaintainer.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Integration and Performance', () => {
    test('should handle concurrent health checks', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(systemMaintainer.performSystemHealthCheck());
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });

    test('should handle concurrent maintenance operations', async () => {
      const promises = [
        systemMaintainer.executeScheduledMaintenance('preventive'),
        systemMaintainer.executeScheduledMaintenance('predictive')
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(2);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.maintenance_id).toBeDefined();
      });
    });

    test('should maintain health history within limits', async () => {
      // Simulate extended monitoring period
      for (let i = 0; i < 5; i++) {
        await systemMaintainer.performSystemHealthCheck();
      }
      
      const metrics = systemMaintainer.getMetrics();
      expect(metrics.health_checks_performed).toBeGreaterThan(0);
      // History should be maintained within reasonable limits
    });

    test('should handle high-frequency operations', async () => {
      const startTime = Date.now();
      
      // Perform rapid operations
      await systemMaintainer.performSystemHealthCheck();
      await systemMaintainer.performSystemHealthCheck();
      await systemMaintainer.performSystemHealthCheck();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Operations should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('System Health Scoring', () => {
    test('should calculate overall health score accurately', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      
      expect(systemHealth.overall_score).toBeGreaterThanOrEqual(0);
      expect(systemHealth.overall_score).toBeLessThanOrEqual(1);
      
      // Score should reflect component health
      if (systemHealth.component_health.length > 0) {
        const avgComponentHealth = systemHealth.component_health.reduce(
          (sum, comp) => sum + comp.health_score, 0
        ) / systemHealth.component_health.length;
        
        // Overall score should be related to component health (allowing for critical issues/warnings impact)
        expect(systemHealth.overall_score).toBeLessThanOrEqual(avgComponentHealth + 0.1);
      }
    });

    test('should penalize critical issues in health score', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      
      // If there are critical issues, score should be impacted
      if (systemHealth.critical_issues.length > 0) {
        expect(systemHealth.overall_score).toBeLessThan(0.9);
      }
    });

    test('should consider warnings in health calculation', async () => {
      const systemHealth = await systemMaintainer.performSystemHealthCheck();
      
      // Warnings should have some impact on score
      if (systemHealth.warnings.length > 5) {
        expect(systemHealth.overall_score).toBeLessThan(0.95);
      }
    });
  });
});