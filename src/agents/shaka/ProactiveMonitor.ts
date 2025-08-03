/**
 * Proactive Monitor for Shaka Agent
 * Continuously monitors system state for ethical concerns and potential issues
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';
import { createLogger } from '@utils/logger';
import type { LLMProvider } from '@utils/llm/LLMProvider';

export interface MonitorAlert {
  id: string;
  type: 'ethical' | 'security' | 'performance' | 'behavior' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  context: unknown;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface MonitorRule {
  id: string;
  name: string;
  description: string;
  type: MonitorAlert['type'];
  condition: (data: MonitoringData) => boolean | Promise<boolean>;
  severity: MonitorAlert['severity'];
  cooldownMs: number; // Minimum time between alerts
  enabled: boolean;
}

export interface MonitoringData {
  agentActivities: AgentActivity[];
  systemMetrics: SystemMetrics;
  communicationLogs: CommunicationLog[];
  decisionHistory: DecisionRecord[];
  timestamp: Date;
}

export interface AgentActivity {
  agentId: string;
  action: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  messageRate: number;
  errorRate: number;
}

export interface CommunicationLog {
  from: string;
  to: string;
  type: string;
  timestamp: Date;
  success: boolean;
}

export interface DecisionRecord {
  agentId: string;
  decision: string;
  confidence: number;
  ethicalScore?: number;
  timestamp: Date;
}

export interface MonitoringStats {
  totalAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  averageResponseTime: number;
  activeRules: number;
}

export class ProactiveMonitor extends EventEmitter {
  private readonly logger = createLogger('ProactiveMonitor');
  private readonly llmProvider: LLMProvider;
  
  private isRunning = false;
  private monitoringInterval = 5000; // 5 seconds
  private intervalId?: NodeJS.Timeout;
  
  // Storage
  private alerts: Map<string, MonitorAlert> = new Map();
  private rules: Map<string, MonitorRule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  
  // Data collection
  private monitoringData: MonitoringData = {
    agentActivities: [],
    systemMetrics: { cpuUsage: 0, memoryUsage: 0, activeAgents: 0, messageRate: 0, errorRate: 0 },
    communicationLogs: [],
    decisionHistory: [],
    timestamp: new Date(),
  };

  constructor(llmProvider: LLMProvider) {
    super();
    this.llmProvider = llmProvider;
    this.initializeDefaultRules();
    
    this.logger.info('Proactive Monitor initialized');
  }

  /**
   * Start monitoring
   */
  public start(): void {
    if (this.isRunning) {
      this.logger.warn('Monitor already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      void this.performMonitoringCycle();
    }, this.monitoringInterval);

    this.logger.info('Proactive monitoring started');
    this.emit('monitor:started');
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.logger.info('Proactive monitoring stopped');
    this.emit('monitor:stopped');
  }

  /**
   * Perform single monitoring scan
   */
  public async scan(): Promise<MonitorAlert[]> {
    if (!this.isRunning) {
      await this.performMonitoringCycle();
    }

    return this.getRecentAlerts(60000); // Last minute
  }

  /**
   * Add monitoring rule
   */
  public addRule(rule: MonitorRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info('Monitoring rule added', { ruleId: rule.id, name: rule.name });
  }

  /**
   * Remove monitoring rule
   */
  public removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.info('Monitoring rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Update monitoring data
   */
  public updateMonitoringData(data: Partial<MonitoringData>): void {
    this.monitoringData = {
      ...this.monitoringData,
      ...data,
      timestamp: new Date(),
    };
  }

  /**
   * Get recent alerts
   */
  public getRecentAlerts(timeWindowMs: number): MonitorAlert[] {
    const cutoff = Date.now() - timeWindowMs;
    return Array.from(this.alerts.values())
      .filter(alert => alert.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.emit('alert:resolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Get monitoring statistics
   */
  public getStats(): MonitoringStats {
    const alerts = Array.from(this.alerts.values());
    
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};
    
    for (const alert of alerts) {
      alertsByType[alert.type] = (alertsByType[alert.type] ?? 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] ?? 0) + 1;
    }

    return {
      totalAlerts: alerts.length,
      alertsByType,
      alertsBySeverity,
      averageResponseTime: this.calculateAverageResponseTime(),
      activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
    };
  }

  // Private methods

  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect fresh monitoring data
      await this.collectMonitoringData();

      // Evaluate all enabled rules
      const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled);
      
      for (const rule of enabledRules) {
        await this.evaluateRule(rule);
      }

      // Perform intelligent monitoring with LLM
      await this.performIntelligentMonitoring();

    } catch (error) {
      this.logger.error('Monitoring cycle error', error);
    }
  }

  private async collectMonitoringData(): Promise<void> {
    // Collect system metrics
    const systemMetrics: SystemMetrics = {
      cpuUsage: process.cpuUsage ? this.calculateCpuUsage() : 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      activeAgents: 1, // Simplified for now
      messageRate: this.calculateMessageRate(),
      errorRate: this.calculateErrorRate(),
    };

    this.monitoringData = {
      ...this.monitoringData,
      systemMetrics,
      timestamp: new Date(),
    };
  }

  private async evaluateRule(rule: MonitorRule): Promise<void> {
    try {
      // Check cooldown
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert && Date.now() - lastAlert < rule.cooldownMs) {
        return;
      }

      // Evaluate condition
      const triggered = await rule.condition(this.monitoringData);
      
      if (triggered) {
        await this.createAlert({
          type: rule.type,
          severity: rule.severity,
          message: `Rule triggered: ${rule.name}`,
          source: rule.id,
          context: { rule: rule.description, data: this.monitoringData },
        });

        this.lastAlertTime.set(rule.id, Date.now());
      }

    } catch (error) {
      this.logger.error('Rule evaluation error', { ruleId: rule.id, error });
    }
  }

  private async performIntelligentMonitoring(): Promise<void> {
    try {
      const prompt = `
      Analyze this system monitoring data for potential ethical, security, or operational concerns:
      
      System Metrics:
      - CPU Usage: ${this.monitoringData.systemMetrics.cpuUsage}%
      - Memory Usage: ${this.monitoringData.systemMetrics.memoryUsage}MB
      - Active Agents: ${this.monitoringData.systemMetrics.activeAgents}
      - Message Rate: ${this.monitoringData.systemMetrics.messageRate}/min
      - Error Rate: ${this.monitoringData.systemMetrics.errorRate}%
      
      Recent Activities: ${this.monitoringData.agentActivities.length} events
      Communications: ${this.monitoringData.communicationLogs.length} messages
      Decisions: ${this.monitoringData.decisionHistory.length} decisions
      
      Identify any concerning patterns, anomalies, or potential issues.
      For each concern, specify:
      - Type (ethical/security/performance/behavior/compliance)
      - Severity (info/warning/error/critical)
      - Brief description
      
      If no concerns, respond with "NO_CONCERNS".
      `;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.2,
      });

      if (!response.includes('NO_CONCERNS')) {
        await this.processIntelligentAlerts(response);
      }

    } catch (error) {
      this.logger.error('Intelligent monitoring error', error);
    }
  }

  private async processIntelligentAlerts(analysis: string): Promise<void> {
    // Parse LLM response for alert information
    const lines = analysis.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('Type:') || line.includes('Severity:')) {
        // Extract alert information
        const typeMatch = line.match(/Type:\s*(\w+)/i);
        const severityMatch = line.match(/Severity:\s*(\w+)/i);
        
        if (typeMatch && severityMatch) {
          const type = typeMatch[1]!.toLowerCase() as MonitorAlert['type'];
          const severity = severityMatch[1]!.toLowerCase() as MonitorAlert['severity'];
          
          await this.createAlert({
            type,
            severity,
            message: `Intelligent monitoring alert: ${line}`,
            source: 'intelligent_monitor',
            context: { analysis, rawData: this.monitoringData },
          });
        }
      }
    }
  }

  private async createAlert(alertData: {
    type: MonitorAlert['type'];
    severity: MonitorAlert['severity'];
    message: string;
    source: string;
    context: unknown;
  }): Promise<MonitorAlert> {
    const alert: MonitorAlert = {
      id: uuidv4(),
      ...alertData,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.set(alert.id, alert);

    this.logger.warn('Alert created', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      source: alert.source,
    });

    this.emit('alert:created', alert);
    return alert;
  }

  private initializeDefaultRules(): void {
    const defaultRules: MonitorRule[] = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'System memory usage exceeds 80%',
        type: 'performance',
        condition: (data) => data.systemMetrics.memoryUsage > 500, // 500MB threshold
        severity: 'warning',
        cooldownMs: 60000, // 1 minute
        enabled: true,
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        type: 'behavior',
        condition: (data) => data.systemMetrics.errorRate > 5, // 5% threshold
        severity: 'error',
        cooldownMs: 30000, // 30 seconds
        enabled: true,
      },
      {
        id: 'low-ethical-scores',
        name: 'Low Ethical Scores',
        description: 'Recent decisions have low ethical compliance',
        type: 'ethical',
        condition: (data) => {
          const recentDecisions = data.decisionHistory.slice(-5);
          const avgEthicalScore = recentDecisions.reduce(
            (sum, d) => sum + (d.ethicalScore ?? 0),
            0,
          ) / (recentDecisions.length || 1);
          return avgEthicalScore < 0.6;
        },
        severity: 'error',
        cooldownMs: 120000, // 2 minutes
        enabled: true,
      },
      {
        id: 'communication-failures',
        name: 'Communication Failures',
        description: 'High rate of failed inter-agent communications',
        type: 'behavior',
        condition: (data) => {
          const recentLogs = data.communicationLogs.slice(-10);
          const failureRate = recentLogs.filter(log => !log.success).length / (recentLogs.length || 1);
          return failureRate > 0.3; // 30% failure rate
        },
        severity: 'warning',
        cooldownMs: 60000, // 1 minute
        enabled: true,
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }

    this.logger.info('Default monitoring rules initialized', { count: defaultRules.length });
  }

  private calculateCpuUsage(): number {
    // Simplified CPU usage calculation
    const usage = process.cpuUsage();
    const total = usage.user + usage.system;
    return Math.min(100, total / 10000); // Rough approximation
  }

  private calculateMessageRate(): number {
    // Calculate messages per minute based on recent communication logs
    const oneMinuteAgo = Date.now() - 60000;
    const recentMessages = this.monitoringData.communicationLogs.filter(
      log => log.timestamp.getTime() > oneMinuteAgo,
    );
    return recentMessages.length;
  }

  private calculateErrorRate(): number {
    // Calculate error rate based on recent activities
    const recentActivities = this.monitoringData.agentActivities.slice(-20);
    if (recentActivities.length === 0) return 0;
    
    const failedActivities = recentActivities.filter(activity => !activity.success);
    return (failedActivities.length / recentActivities.length) * 100;
  }

  private calculateAverageResponseTime(): number {
    const resolvedAlerts = Array.from(this.alerts.values()).filter(a => a.resolvedAt);
    if (resolvedAlerts.length === 0) return 0;

    const totalResponseTime = resolvedAlerts.reduce((sum, alert) => {
      const responseTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
      return sum + responseTime;
    }, 0);

    return totalResponseTime / resolvedAlerts.length;
  }
}