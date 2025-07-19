/**
 * IncidentResponder - Automated incident response and mitigation
 * Part of AtlasAgent's security subsystem
 */

import { EventEmitter } from 'eventemitter3';
import { createLogger } from '@utils/logger';
import { LLMProvider } from '@utils/llm/SimpleLLMProvider';
import type { SecurityThreat, ThreatSeverity } from './SecurityMonitor';

export type ResponseActionType = 
  | 'isolate'
  | 'block'
  | 'quarantine'
  | 'alert'
  | 'investigate'
  | 'remediate'
  | 'rollback'
  | 'escalate';

export interface ResponseAction {
  id: string;
  type: ResponseActionType;
  target: string;
  description: string;
  priority: number; // 1-10
  automated: boolean;
  requiresApproval: boolean;
  estimatedDuration: number; // minutes
  risks: string[];
  dependencies: string[];
}

export interface SecurityIncident {
  id: string;
  threats: SecurityThreat[];
  startTime: Date;
  status: 'detected' | 'responding' | 'contained' | 'resolved' | 'escalated';
  severity: ThreatSeverity;
  affectedSystems: string[];
  responseActions: ResponseAction[];
  timeline: IncidentTimelineEntry[];
}

export interface IncidentTimelineEntry {
  timestamp: Date;
  action: string;
  actor: string;
  result: 'success' | 'failure' | 'partial';
  details: string;
}

export interface IsolationResult {
  success: boolean;
  isolatedSystems: string[];
  failedSystems: string[];
  duration: number; // ms
  rollbackPlan: RollbackPlan;
}

export interface BlockResult {
  success: boolean;
  blockedIPs: string[];
  failedBlocks: string[];
  firewallRules: FirewallRule[];
  duration: number;
}

export interface QuarantineResult {
  success: boolean;
  quarantinedFiles: string[];
  failedQuarantines: string[];
  quarantineLocation: string;
  restorePlan: RestorePlan;
}

export interface EscalationResult {
  success: boolean;
  escalatedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedResponseTime: number; // minutes
  escalationPath: string[];
}

export interface NotificationResult {
  success: boolean;
  notifiedParties: string[];
  failedNotifications: string[];
  method: 'email' | 'sms' | 'webhook' | 'all';
  timestamp: Date;
}

export interface FirewallRule {
  id: string;
  source: string;
  destination: string;
  port?: number;
  protocol?: string;
  action: 'block' | 'allow';
  temporary: boolean;
  expiresAt?: Date;
}

export interface RollbackPlan {
  steps: RollbackStep[];
  estimatedTime: number;
  risks: string[];
}

export interface RollbackStep {
  order: number;
  action: string;
  target: string;
  command: string;
}

export interface RestorePlan {
  files: string[];
  originalLocations: string[];
  verificationSteps: string[];
}

export interface IncidentResponderConfig {
  autoResponseEnabled: boolean;
  maxAutoResponseSeverity: ThreatSeverity;
  escalationThreshold: ThreatSeverity;
  notificationChannels: string[];
  responseTimeout: number; // ms
}

export class IncidentResponder extends EventEmitter {
  private readonly logger = createLogger('Atlas:IncidentResponder');
  private readonly config: IncidentResponderConfig;
  private readonly llmProvider: LLMProvider;
  private readonly activeIncidents = new Map<string, SecurityIncident>();
  private readonly responseHistory = new Map<string, ResponseAction[]>();
  
  constructor(config: IncidentResponderConfig, llmProvider: LLMProvider) {
    super();
    this.config = config;
    this.llmProvider = llmProvider;
    
    this.logger.info('IncidentResponder initialized', { config });
  }

  /**
   * Respond to a detected security threat
   */
  public async respondToThreat(threat: SecurityThreat): Promise<ResponseAction[]> {
    this.logger.info('Responding to threat', { 
      threatId: threat.id, 
      severity: threat.severity 
    });

    const actions: ResponseAction[] = [];

    try {
      // Create or update incident
      const incident = this.createOrUpdateIncident(threat);

      // Determine response strategy
      const strategy = await this.determineResponseStrategy(threat, incident);

      // Generate response actions
      const proposedActions = await this.generateResponseActions(threat, strategy);

      // Filter actions based on automation settings
      const approvedActions = this.filterActionsForAutomation(proposedActions, threat);

      // Execute approved actions
      for (const action of approvedActions) {
        if (action.automated && !action.requiresApproval) {
          await this.executeAction(action, incident);
        }
        actions.push(action);
      }

      // Update incident status
      this.updateIncidentStatus(incident, actions);

      // Store response history
      this.responseHistory.set(threat.id, actions);

      this.emit('response:completed', { threat, actions, incident });

    } catch (error) {
      this.logger.error('Error responding to threat', error);
      this.emit('response:failed', { threat, error });
    }

    return actions;
  }

  /**
   * Isolate compromised systems
   */
  public async isolateCompromisedSystems(indicators: string[]): Promise<IsolationResult> {
    this.logger.info('Isolating compromised systems', { 
      systemCount: indicators.length 
    });

    const startTime = Date.now();
    const isolatedSystems: string[] = [];
    const failedSystems: string[] = [];

    try {
      for (const system of indicators) {
        try {
          await this.isolateSystem(system);
          isolatedSystems.push(system);
          
          this.logger.info('System isolated', { system });
          this.emit('system:isolated', { system });
        } catch (error) {
          failedSystems.push(system);
          this.logger.error('Failed to isolate system', { system, error });
        }
      }

      const rollbackPlan = this.createRollbackPlan(isolatedSystems);

      const result: IsolationResult = {
        success: failedSystems.length === 0,
        isolatedSystems,
        failedSystems,
        duration: Date.now() - startTime,
        rollbackPlan
      };

      this.emit('isolation:completed', result);
      return result;

    } catch (error) {
      this.logger.error('Isolation process failed', error);
      throw error;
    }
  }

  /**
   * Block malicious IP addresses
   */
  public async blockMaliciousIPs(ips: string[]): Promise<BlockResult> {
    this.logger.info('Blocking malicious IPs', { ipCount: ips.length });

    const startTime = Date.now();
    const blockedIPs: string[] = [];
    const failedBlocks: string[] = [];
    const firewallRules: FirewallRule[] = [];

    try {
      for (const ip of ips) {
        try {
          const rule = await this.createFirewallRule(ip);
          firewallRules.push(rule);
          blockedIPs.push(ip);
          
          this.logger.info('IP blocked', { ip, ruleId: rule.id });
          this.emit('ip:blocked', { ip, rule });
        } catch (error) {
          failedBlocks.push(ip);
          this.logger.error('Failed to block IP', { ip, error });
        }
      }

      const result: BlockResult = {
        success: failedBlocks.length === 0,
        blockedIPs,
        failedBlocks,
        firewallRules,
        duration: Date.now() - startTime
      };

      this.emit('blocking:completed', result);
      return result;

    } catch (error) {
      this.logger.error('IP blocking failed', error);
      throw error;
    }
  }

  /**
   * Quarantine suspicious files
   */
  public async quarantineFiles(files: string[]): Promise<QuarantineResult> {
    this.logger.info('Quarantining files', { fileCount: files.length });

    const quarantinedFiles: string[] = [];
    const failedQuarantines: string[] = [];
    const quarantineLocation = '/var/quarantine/atlas';

    try {
      for (const file of files) {
        try {
          await this.quarantineFile(file, quarantineLocation);
          quarantinedFiles.push(file);
          
          this.logger.info('File quarantined', { file });
          this.emit('file:quarantined', { file, location: quarantineLocation });
        } catch (error) {
          failedQuarantines.push(file);
          this.logger.error('Failed to quarantine file', { file, error });
        }
      }

      const restorePlan = this.createRestorePlan(quarantinedFiles, quarantineLocation);

      const result: QuarantineResult = {
        success: failedQuarantines.length === 0,
        quarantinedFiles,
        failedQuarantines,
        quarantineLocation,
        restorePlan
      };

      this.emit('quarantine:completed', result);
      return result;

    } catch (error) {
      this.logger.error('Quarantine process failed', error);
      throw error;
    }
  }

  /**
   * Escalate incident to human operators
   */
  public async escalateToHuman(incident: SecurityIncident): Promise<EscalationResult> {
    this.logger.info('Escalating incident to human', { 
      incidentId: incident.id,
      severity: incident.severity 
    });

    try {
      const escalationPath = this.determineEscalationPath(incident.severity);
      const priority = this.mapSeverityToPriority(incident.severity);

      // Create escalation ticket
      const ticketId = await this.createEscalationTicket(incident, escalationPath);

      // Notify relevant parties
      const notifiedParties = await this.notifyEscalation(
        escalationPath,
        incident,
        ticketId
      );

      const result: EscalationResult = {
        success: true,
        escalatedTo: notifiedParties,
        priority,
        expectedResponseTime: this.getExpectedResponseTime(priority),
        escalationPath
      };

      // Update incident status
      incident.status = 'escalated';
      incident.timeline.push({
        timestamp: new Date(),
        action: 'escalated_to_human',
        actor: 'AtlasAgent',
        result: 'success',
        details: `Escalated to ${notifiedParties.join(', ')}`
      });

      this.emit('incident:escalated', { incident, result });
      return result;

    } catch (error) {
      this.logger.error('Escalation failed', error);
      throw error;
    }
  }

  /**
   * Notify security team
   */
  public async notifySecurityTeam(alert: SecurityAlert): Promise<NotificationResult> {
    this.logger.info('Notifying security team', { 
      alertId: alert.id,
      severity: alert.severity 
    });

    const notifiedParties: string[] = [];
    const failedNotifications: string[] = [];

    try {
      // Send notifications through configured channels
      for (const channel of this.config.notificationChannels) {
        try {
          await this.sendNotification(channel, alert);
          notifiedParties.push(channel);
        } catch (error) {
          failedNotifications.push(channel);
          this.logger.error('Notification failed', { channel, error });
        }
      }

      const result: NotificationResult = {
        success: failedNotifications.length === 0,
        notifiedParties,
        failedNotifications,
        method: 'all',
        timestamp: new Date()
      };

      this.emit('notification:sent', result);
      return result;

    } catch (error) {
      this.logger.error('Notification process failed', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private createOrUpdateIncident(threat: SecurityThreat): SecurityIncident {
    // Check if threat belongs to existing incident
    for (const [_id, incident] of this.activeIncidents) {
      if (this.shouldAddToIncident(threat, incident)) {
        incident.threats.push(threat);
        this.updateIncidentSeverity(incident);
        return incident;
      }
    }

    // Create new incident
    const incident: SecurityIncident = {
      id: `inc-${Date.now()}`,
      threats: [threat],
      startTime: new Date(),
      status: 'detected',
      severity: threat.severity,
      affectedSystems: [threat.source],
      responseActions: [],
      timeline: [{
        timestamp: new Date(),
        action: 'incident_created',
        actor: 'AtlasAgent',
        result: 'success',
        details: `Initial threat: ${threat.type}`
      }]
    };

    this.activeIncidents.set(incident.id, incident);
    this.emit('incident:created', incident);
    
    return incident;
  }

  private async determineResponseStrategy(
    threat: SecurityThreat,
    incident: SecurityIncident
  ): Promise<string> {
    // Use LLM to determine optimal response strategy
    const context = {
      threat,
      incidentSeverity: incident.severity,
      affectedSystems: incident.affectedSystems.length,
      previousActions: incident.responseActions.map(a => a.type)
    };

    const strategy = await this.llmProvider.complete({
      prompt: `Determine optimal response strategy for security threat:
               Threat: ${JSON.stringify(threat)}
               Incident severity: ${incident.severity}
               Affected systems: ${context.affectedSystems}
               Previous actions: ${context.previousActions.join(', ')}
               
               Recommend strategy: containment, eradication, or recovery`,
      maxTokens: 100
    });

    return strategy.toLowerCase().includes('eradication') ? 'eradicate' :
           strategy.toLowerCase().includes('recovery') ? 'recover' : 'contain';
  }

  private async generateResponseActions(
    threat: SecurityThreat,
    _strategy: string
  ): Promise<ResponseAction[]> {
    const actions: ResponseAction[] = [];

    // Generate base actions based on threat type
    switch (threat.type) {
      case 'intrusion':
        actions.push(
          this.createAction('isolate', threat.source, 'Isolate compromised system', 9),
          this.createAction('investigate', threat.source, 'Investigate intrusion source', 7)
        );
        break;
      
      case 'malware':
        actions.push(
          this.createAction('quarantine', threat.source, 'Quarantine malicious file', 10),
          this.createAction('remediate', threat.source, 'Remove malware', 8)
        );
        break;
      
      case 'ddos':
        actions.push(
          this.createAction('block', threat.source, 'Block attack source', 10),
          this.createAction('alert', 'network_team', 'Alert network team', 8)
        );
        break;
      
      default:
        actions.push(
          this.createAction('investigate', threat.source, 'Investigate anomaly', 6),
          this.createAction('alert', 'security_team', 'Alert security team', 7)
        );
    }

    // Add escalation if severity is high/critical
    if (threat.severity === 'high' || threat.severity === 'critical') {
      actions.push(
        this.createAction('escalate', 'security_lead', 'Escalate to security lead', 8)
      );
    }

    return actions;
  }

  private createAction(
    type: ResponseActionType,
    target: string,
    description: string,
    priority: number
  ): ResponseAction {
    return {
      id: `action-${Date.now()}-${Math.random()}`,
      type,
      target,
      description,
      priority,
      automated: this.canAutomate(type),
      requiresApproval: this.requiresApproval(type),
      estimatedDuration: this.estimateDuration(type),
      risks: this.assessRisks(type),
      dependencies: []
    };
  }

  private canAutomate(type: ResponseActionType): boolean {
    const automatable = ['block', 'isolate', 'quarantine', 'alert'];
    return this.config.autoResponseEnabled && automatable.includes(type);
  }

  private requiresApproval(type: ResponseActionType): boolean {
    const highRiskActions = ['remediate', 'rollback'];
    return highRiskActions.includes(type);
  }

  private estimateDuration(type: ResponseActionType): number {
    const durations: Record<ResponseActionType, number> = {
      isolate: 2,
      block: 1,
      quarantine: 3,
      alert: 1,
      investigate: 30,
      remediate: 15,
      rollback: 20,
      escalate: 5
    };
    return durations[type] || 10;
  }

  private assessRisks(type: ResponseActionType): string[] {
    const risks: Record<ResponseActionType, string[]> = {
      isolate: ['Service disruption', 'Data accessibility'],
      block: ['Legitimate traffic blocked'],
      quarantine: ['File unavailability'],
      alert: [],
      investigate: ['Resource consumption'],
      remediate: ['System instability', 'Data loss'],
      rollback: ['Configuration loss', 'Service downtime'],
      escalate: ['Response delay']
    };
    return risks[type] || [];
  }

  private filterActionsForAutomation(
    actions: ResponseAction[],
    threat: SecurityThreat
  ): ResponseAction[] {
    if (!this.config.autoResponseEnabled) {
      return actions;
    }

    const severityLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const maxAutoLevel = severityLevels[this.config.maxAutoResponseSeverity];
    const threatLevel = severityLevels[threat.severity];

    if (threatLevel > maxAutoLevel) {
      // Only allow non-automated actions for high severity
      return actions.map(a => ({ ...a, automated: false }));
    }

    return actions;
  }

  private async executeAction(
    action: ResponseAction,
    incident: SecurityIncident
  ): Promise<void> {
    this.logger.info('Executing action', { 
      actionId: action.id,
      type: action.type 
    });


    try {
      switch (action.type) {
        case 'isolate':
          await this.isolateSystem(action.target);
          break;
        case 'block':
          await this.blockTarget(action.target);
          break;
        case 'quarantine':
          await this.quarantineFile(action.target, '/var/quarantine/atlas');
          break;
        case 'alert':
          await this.sendAlert(action.target, incident);
          break;
        default:
          this.logger.warn('Action type not implemented', { type: action.type });
      }

      incident.timeline.push({
        timestamp: new Date(),
        action: `executed_${action.type}`,
        actor: 'AtlasAgent',
        result: 'success',
        details: action.description
      });

    } catch (error) {
      this.logger.error('Action execution failed', { action, error });
      
      incident.timeline.push({
        timestamp: new Date(),
        action: `failed_${action.type}`,
        actor: 'AtlasAgent',
        result: 'failure',
        details: (error as Error).message
      });
    }
  }

  private async isolateSystem(system: string): Promise<void> {
    // Simulate system isolation
    this.logger.info('Simulating system isolation', { system });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async blockTarget(target: string): Promise<void> {
    // Simulate blocking
    this.logger.info('Simulating target blocking', { target });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async quarantineFile(file: string, location: string): Promise<void> {
    // Simulate file quarantine
    this.logger.info('Simulating file quarantine', { file, location });
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async sendAlert(target: string, incident: SecurityIncident): Promise<void> {
    // Simulate alert sending
    this.logger.info('Simulating alert', { target, incidentId: incident.id });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async createFirewallRule(ip: string): Promise<FirewallRule> {
    return {
      id: `fw-rule-${Date.now()}`,
      source: ip,
      destination: 'any',
      action: 'block',
      temporary: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private createRollbackPlan(systems: string[]): RollbackPlan {
    const steps: RollbackStep[] = systems.map((system, index) => ({
      order: index + 1,
      action: 'reconnect',
      target: system,
      command: `atlas rollback isolate ${system}`
    }));

    return {
      steps,
      estimatedTime: steps.length * 2,
      risks: ['Service restoration delay', 'Potential re-infection']
    };
  }

  private createRestorePlan(files: string[], _location: string): RestorePlan {
    return {
      files,
      originalLocations: files,
      verificationSteps: [
        'Verify file integrity',
        'Scan for malware',
        'Check file permissions',
        'Validate functionality'
      ]
    };
  }

  private shouldAddToIncident(threat: SecurityThreat, incident: SecurityIncident): boolean {
    // Group threats that are likely related
    const timeDiff = new Date().getTime() - incident.startTime.getTime();
    const timeWindow = 30 * 60 * 1000; // 30 minutes

    return timeDiff < timeWindow && 
           incident.affectedSystems.includes(threat.source);
  }

  private updateIncidentSeverity(incident: SecurityIncident): void {
    // Update severity based on all threats
    const severityLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const maxSeverity = Math.max(
      ...incident.threats.map(t => severityLevels[t.severity])
    );

    incident.severity = Object.entries(severityLevels)
      .find(([_, level]) => level === maxSeverity)?.[0] as ThreatSeverity || 'medium';
  }

  private updateIncidentStatus(incident: SecurityIncident, actions: ResponseAction[]): void {
    if (actions.some(a => a.type === 'escalate')) {
      incident.status = 'escalated';
    } else if (actions.every(a => a.type === 'investigate' || a.type === 'alert')) {
      incident.status = 'responding';
    } else {
      incident.status = 'contained';
    }

    incident.responseActions.push(...actions);
  }

  private determineEscalationPath(severity: ThreatSeverity): string[] {
    const paths = {
      low: ['security_analyst'],
      medium: ['security_analyst', 'security_engineer'],
      high: ['security_engineer', 'security_lead'],
      critical: ['security_lead', 'ciso', 'incident_commander']
    };
    return paths[severity];
  }

  private mapSeverityToPriority(severity: ThreatSeverity): 'low' | 'medium' | 'high' | 'critical' {
    return severity;
  }

  private getExpectedResponseTime(priority: string): number {
    const times: Record<string, number> = {
      low: 240,      // 4 hours
      medium: 60,    // 1 hour
      high: 30,      // 30 minutes
      critical: 15   // 15 minutes
    };
    return times[priority] || 60;
  }

  private async createEscalationTicket(
    _incident: SecurityIncident,
    _escalationPath: string[]
  ): Promise<string> {
    // Simulate ticket creation
    return `ATLAS-ESC-${Date.now()}`;
  }

  private async notifyEscalation(
    escalationPath: string[],
    _incident: SecurityIncident,
    _ticketId: string
  ): Promise<string[]> {
    // Simulate notification
    return escalationPath;
  }

  private async sendNotification(channel: string, _alert: any): Promise<void> {
    // Simulate sending notification
    this.logger.info('Sending notification', { channel });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Type definitions for external use
export interface SecurityAlert {
  id: string;
  severity: ThreatSeverity;
  title: string;
  description: string;
  timestamp: Date;
}