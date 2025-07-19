/**
 * SecurityMonitor - Real-time security threat detection and analysis
 * Part of AtlasAgent's security subsystem
 */

import { EventEmitter } from 'eventemitter3';
import { createLogger } from '@utils/logger';
import { LLMProvider } from '@utils/llm/SimpleLLMProvider';

export type ThreatType = 'intrusion' | 'malware' | 'ddos' | 'data_breach' | 'anomaly' | 'unauthorized_access' | 'suspicious_activity';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  source: string;
  description: string;
  indicators: Record<string, any>;
  timestamp: Date;
  confidence: number; // 0-1 confidence score
  falsePositiveRate?: number;
}

export interface NetworkAnalysis {
  timestamp: Date;
  totalConnections: number;
  suspiciousConnections: number;
  blockedConnections: number;
  trafficPatterns: TrafficPattern[];
  anomalies: NetworkAnomaly[];
}

export interface TrafficPattern {
  source: string;
  destination: string;
  protocol: string;
  volume: number;
  frequency: number;
  isNormal: boolean;
}

export interface NetworkAnomaly {
  type: 'unusual_port' | 'high_volume' | 'suspicious_pattern' | 'unknown_protocol';
  description: string;
  severity: ThreatSeverity;
  indicators: string[];
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: ThreatSeverity;
  component: string;
  description: string;
  remediation: string;
  cve?: string;
  exploitAvailable: boolean;
}

export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted' | 'permissions_changed';
  timestamp: Date;
  actor: string;
  previousHash?: string;
  currentHash?: string;
  isSuspicious: boolean;
  suspicionReason?: string;
}

export interface ThreatPrediction {
  threatId: string;
  evolutionProbability: number;
  estimatedTimeToEscalation: number; // minutes
  predictedSeverity: ThreatSeverity;
  recommendedActions: string[];
  confidence: number;
}

export interface SecurityMonitorConfig {
  scanInterval: number; // ms
  alertThreshold: ThreatSeverity;
  enablePredictiveAnalysis: boolean;
  enableRealTimeScanning: boolean;
  maxConcurrentScans: number;
}

export class SecurityMonitor extends EventEmitter {
  private readonly logger = createLogger('Atlas:SecurityMonitor');
  private readonly config: SecurityMonitorConfig;
  private readonly llmProvider: LLMProvider;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly threatDatabase = new Map<string, SecurityThreat>();
  private readonly vulnerabilityCache = new Map<string, Vulnerability>();
  
  constructor(config: SecurityMonitorConfig, llmProvider: LLMProvider) {
    super();
    this.config = config;
    this.llmProvider = llmProvider;
    
    this.logger.info('SecurityMonitor initialized', { config });
  }

  /**
   * Start continuous security monitoring
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting security monitoring');

    // Initial scan
    await this.performSecurityScan();

    // Set up continuous monitoring
    this.monitoringInterval = setInterval(
      () => this.performSecurityScan(),
      this.config.scanInterval
    );

    this.emit('monitoring:started');
  }

  /**
   * Stop security monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.logger.info('Security monitoring stopped');
    this.emit('monitoring:stopped');
  }

  /**
   * Detect security threats in real-time
   */
  public async detectThreats(): Promise<SecurityThreat[]> {
    this.logger.debug('Detecting threats');

    const threats: SecurityThreat[] = [];

    try {
      // Simulate various threat detection mechanisms
      const [
        networkThreats,
        systemThreats,
        behavioralThreats
      ] = await Promise.all([
        this.detectNetworkThreats(),
        this.detectSystemThreats(),
        this.detectBehavioralThreats()
      ]);

      threats.push(...networkThreats, ...systemThreats, ...behavioralThreats);

      // Use LLM for advanced threat correlation
      if (threats.length > 0 && this.config.enablePredictiveAnalysis) {
        const correlatedThreats = await this.correlateThreats(threats);
        threats.push(...correlatedThreats);
      }

      // Update threat database
      threats.forEach(threat => {
        this.threatDatabase.set(threat.id, threat);
        this.emitThreatAlert(threat);
      });

    } catch (error) {
      this.logger.error('Error detecting threats', error);
    }

    return threats;
  }

  /**
   * Analyze network traffic for anomalies
   */
  public async analyzeNetworkTraffic(): Promise<NetworkAnalysis> {
    this.logger.debug('Analyzing network traffic');

    // Simulate network analysis
    const analysis: NetworkAnalysis = {
      timestamp: new Date(),
      totalConnections: Math.floor(Math.random() * 1000) + 500,
      suspiciousConnections: Math.floor(Math.random() * 10),
      blockedConnections: Math.floor(Math.random() * 5),
      trafficPatterns: await this.identifyTrafficPatterns(),
      anomalies: await this.detectNetworkAnomalies()
    };

    return analysis;
  }

  /**
   * Scan system for vulnerabilities
   */
  public async scanSystemVulnerabilities(): Promise<Vulnerability[]> {
    this.logger.debug('Scanning for vulnerabilities');

    const vulnerabilities: Vulnerability[] = [];

    try {
      // Simulate vulnerability scanning
      const components = ['os', 'web_server', 'database', 'application', 'network'];
      
      for (const component of components) {
        const vulns = await this.scanComponent(component);
        vulnerabilities.push(...vulns);
      }

      // Cache vulnerabilities
      vulnerabilities.forEach(vuln => {
        this.vulnerabilityCache.set(vuln.id, vuln);
      });

      // Emit high/critical vulnerabilities
      vulnerabilities
        .filter(v => v.severity === 'high' || v.severity === 'critical')
        .forEach(v => this.emit('vulnerability:critical', v));

    } catch (error) {
      this.logger.error('Error scanning vulnerabilities', error);
    }

    return vulnerabilities;
  }

  /**
   * Monitor file system changes
   */
  public async monitorFileChanges(): Promise<FileChange[]> {
    this.logger.debug('Monitoring file changes');

    // Simulate file monitoring
    const changes: FileChange[] = [];
    const criticalPaths = ['/etc/', '/var/www/', '/home/', '/root/'];

    for (const path of criticalPaths) {
      const pathChanges = await this.checkPathChanges(path);
      changes.push(...pathChanges);
    }

    // Analyze changes for suspicious activity
    const suspiciousChanges = changes.filter(c => c.isSuspicious);
    if (suspiciousChanges.length > 0) {
      this.emit('files:suspicious', suspiciousChanges);
    }

    return changes;
  }

  /**
   * Assess threat level with confidence scoring
   */
  public async assessThreatLevel(threat: SecurityThreat): Promise<number> {
    this.logger.debug('Assessing threat level', { threatId: threat.id });

    // Base score from severity
    const severityScores = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0
    };

    let score = severityScores[threat.severity];

    // Adjust based on confidence
    score *= threat.confidence;

    // Use LLM for contextual assessment
    if (this.llmProvider) {
      const context = {
        threat,
        recentThreats: Array.from(this.threatDatabase.values()).slice(-10),
        systemVulnerabilities: Array.from(this.vulnerabilityCache.values())
      };

      const llmAssessment = await this.llmProvider.complete({
        prompt: `Assess the real threat level of this security threat considering the context. 
                 Threat: ${JSON.stringify(threat)}
                 Recent threats: ${context.recentThreats.length}
                 Known vulnerabilities: ${context.systemVulnerabilities.length}
                 Provide a threat score adjustment factor between 0.5 and 1.5.`,
        maxTokens: 50
      });

      const adjustmentFactor = this.parseAdjustmentFactor(llmAssessment);
      score *= adjustmentFactor;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Predict threat evolution using ML/LLM
   */
  public async predictThreatEvolution(threat: SecurityThreat): Promise<ThreatPrediction> {
    this.logger.debug('Predicting threat evolution', { threatId: threat.id });

    const prediction: ThreatPrediction = {
      threatId: threat.id,
      evolutionProbability: 0.5,
      estimatedTimeToEscalation: 60,
      predictedSeverity: threat.severity,
      recommendedActions: [],
      confidence: 0.7
    };

    if (this.llmProvider && this.config.enablePredictiveAnalysis) {
      const historicalData = this.getHistoricalThreatData(threat.type);
      
      const llmPrediction = await this.llmProvider.complete({
        prompt: `Analyze this security threat and predict its evolution:
                 Current threat: ${JSON.stringify(threat)}
                 Historical similar threats: ${historicalData.length}
                 
                 Predict:
                 1. Probability of escalation (0-1)
                 2. Time to escalation in minutes
                 3. Likely severity if escalated
                 4. Top 3 recommended actions`,
        maxTokens: 200
      });

      // Parse LLM response and update prediction
      this.updatePredictionFromLLM(prediction, llmPrediction);
    }

    return prediction;
  }

  /**
   * Private helper methods
   */
  private async performSecurityScan(): Promise<void> {
    try {
      const threats = await this.detectThreats();
      const vulnerabilities = await this.scanSystemVulnerabilities();
      
      this.logger.info('Security scan completed', {
        threatsFound: threats.length,
        vulnerabilitiesFound: vulnerabilities.length
      });

      this.emit('scan:completed', { threats, vulnerabilities });
    } catch (error) {
      this.logger.error('Security scan failed', error);
      this.emit('scan:failed', error);
    }
  }

  private async detectNetworkThreats(): Promise<SecurityThreat[]> {
    // Simulate network threat detection
    const threats: SecurityThreat[] = [];
    
    if (Math.random() < 0.1) { // 10% chance of network threat
      threats.push({
        id: `net-threat-${Date.now()}`,
        type: 'intrusion',
        severity: 'medium',
        source: '192.168.1.100',
        description: 'Suspicious connection attempt detected',
        indicators: {
          port: 22,
          attempts: 5,
          pattern: 'brute_force'
        },
        timestamp: new Date(),
        confidence: 0.85
      });
    }

    return threats;
  }

  private async detectSystemThreats(): Promise<SecurityThreat[]> {
    // Simulate system threat detection
    const threats: SecurityThreat[] = [];
    
    if (Math.random() < 0.05) { // 5% chance of system threat
      threats.push({
        id: `sys-threat-${Date.now()}`,
        type: 'malware',
        severity: 'high',
        source: '/tmp/suspicious_file',
        description: 'Potential malware detected in temporary directory',
        indicators: {
          fileHash: 'abc123def456',
          behavior: 'file_encryption',
          processName: 'unknown_process'
        },
        timestamp: new Date(),
        confidence: 0.75
      });
    }

    return threats;
  }

  private async detectBehavioralThreats(): Promise<SecurityThreat[]> {
    // Simulate behavioral threat detection
    const threats: SecurityThreat[] = [];
    
    if (Math.random() < 0.08) { // 8% chance of behavioral threat
      threats.push({
        id: `beh-threat-${Date.now()}`,
        type: 'anomaly',
        severity: 'low',
        source: 'user_behavior',
        description: 'Unusual user activity pattern detected',
        indicators: {
          user: 'john_doe',
          activity: 'mass_file_download',
          deviation: 3.5
        },
        timestamp: new Date(),
        confidence: 0.65
      });
    }

    return threats;
  }

  private async correlateThreats(threats: SecurityThreat[]): Promise<SecurityThreat[]> {
    // Use LLM to find correlated threats
    const correlatedThreats: SecurityThreat[] = [];
    
    if (threats.length >= 2) {
      const correlation = await this.llmProvider.complete({
        prompt: `Analyze these security threats for correlations: ${JSON.stringify(threats)}
                 Identify if they might be part of a coordinated attack.`,
        maxTokens: 150
      });

      if (correlation.includes('coordinated') || correlation.includes('related')) {
        correlatedThreats.push({
          id: `corr-threat-${Date.now()}`,
          type: 'anomaly',
          severity: 'critical',
          source: 'threat_correlation',
          description: 'Potential coordinated attack detected',
          indicators: {
            relatedThreats: threats.map(t => t.id),
            pattern: 'multi-vector'
          },
          timestamp: new Date(),
          confidence: 0.9
        });
      }
    }

    return correlatedThreats;
  }

  private async identifyTrafficPatterns(): Promise<TrafficPattern[]> {
    // Simulate traffic pattern identification
    return [
      {
        source: '10.0.0.1',
        destination: '10.0.0.2',
        protocol: 'HTTP',
        volume: 1000,
        frequency: 100,
        isNormal: true
      }
    ];
  }

  private async detectNetworkAnomalies(): Promise<NetworkAnomaly[]> {
    const anomalies: NetworkAnomaly[] = [];
    
    if (Math.random() < 0.2) {
      anomalies.push({
        type: 'unusual_port',
        description: 'Connection on rarely used port detected',
        severity: 'medium',
        indicators: ['Port 8888', 'External IP']
      });
    }

    return anomalies;
  }

  private async scanComponent(component: string): Promise<Vulnerability[]> {
    // Simulate component vulnerability scanning
    const vulnerabilities: Vulnerability[] = [];
    
    if (Math.random() < 0.3) {
      vulnerabilities.push({
        id: `vuln-${component}-${Date.now()}`,
        name: `${component} Security Update`,
        severity: Math.random() < 0.5 ? 'medium' : 'high',
        component,
        description: `Security patch available for ${component}`,
        remediation: `Update ${component} to latest version`,
        exploitAvailable: Math.random() < 0.2
      });
    }

    return vulnerabilities;
  }

  private async checkPathChanges(path: string): Promise<FileChange[]> {
    // Simulate file change detection
    const changes: FileChange[] = [];
    
    if (Math.random() < 0.1) {
      changes.push({
        path: `${path}suspicious_file`,
        type: 'created',
        timestamp: new Date(),
        actor: 'unknown',
        isSuspicious: true,
        suspicionReason: 'Created by unknown process'
      });
    }

    return changes;
  }

  private emitThreatAlert(threat: SecurityThreat): void {
    if (this.shouldAlert(threat)) {
      this.emit('threat:detected', threat);
      
      if (threat.severity === 'critical') {
        this.emit('threat:critical', threat);
      }
    }
  }

  private shouldAlert(threat: SecurityThreat): boolean {
    const severityLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    return severityLevels[threat.severity] >= severityLevels[this.config.alertThreshold];
  }

  private parseAdjustmentFactor(llmResponse: string): number {
    const match = llmResponse.match(/(\d+\.?\d*)/);
    if (match && match[1]) {
      const factor = parseFloat(match[1]);
      return Math.min(1.5, Math.max(0.5, factor));
    }
    return 1.0;
  }

  private getHistoricalThreatData(type: ThreatType): SecurityThreat[] {
    return Array.from(this.threatDatabase.values())
      .filter(t => t.type === type)
      .slice(-20);
  }

  private updatePredictionFromLLM(prediction: ThreatPrediction, llmResponse: string): void {
    // Parse LLM response to update prediction
    // This is a simplified implementation
    const lines = llmResponse.split('\n');
    lines.forEach(line => {
      if (line.includes('escalation') && line.includes('0.')) {
        const match = line.match(/0\.\d+/);
        if (match) {
          prediction.evolutionProbability = parseFloat(match[0]);
        }
      }
    });
  }
}