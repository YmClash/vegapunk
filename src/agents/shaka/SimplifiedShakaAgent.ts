/**
 * Simplified Shaka Agent for Dashboard Integration
 * Lightweight version of ShakaAgent focused on dashboard functionality
 * Provides ethical analysis, monitoring, and chat integration
 */

import { EventEmitter } from 'events';
import { createLogger } from '@utils/logger';
import type { OllamaProvider } from '@/llm/OllamaProvider';
import type { HuggingFaceProvider } from '@/llm/HuggingFaceProvider';
import { EthicalPolicyEngine, type EthicalContext, type EthicalAnalysis } from './EthicalPolicyEngine';
import { ProactiveMonitor, type MonitorAlert } from './ProactiveMonitor';
import { ConflictResolver, type Conflict } from './ConflictResolver';

type LLMProvider = OllamaProvider | HuggingFaceProvider;

export interface ShakaStatus {
  isActive: boolean;
  isAnalyzing: boolean;
  lastActivity: Date;
  ethicalScore: number;
  alertsCount: number;
  analysisCount: number;
  uptime: number;
}

export interface ShakaMetrics {
  ethicalAnalyses: number;
  conflictsResolved: number;
  alertsGenerated: number;
  averageEthicalScore: number;
  interventionRate: number;
  responseTime: number;
}

export interface EthicalQueryRequest {
  query: string;
  context?: EthicalContext;
  framework?: 'all' | 'utilitarian' | 'deontological' | 'virtue_ethics' | 'care_ethics';
}

export interface EthicalQueryResponse {
  analysis: EthicalAnalysis;
  recommendations: string[];
  response: string;
  confidence: number;
  processingTime: number;
}

export class SimplifiedShakaAgent extends EventEmitter {
  private readonly logger = createLogger('SimplifiedShakaAgent');
  private readonly llmProvider: LLMProvider;
  private readonly ethicalEngine: EthicalPolicyEngine;
  private readonly proactiveMonitor: ProactiveMonitor;
  private readonly conflictResolver: ConflictResolver;

  // Agent state
  private isActive = false;
  private isAnalyzing = false;
  private startTime = Date.now();
  private metrics: ShakaMetrics = {
    ethicalAnalyses: 0,
    conflictsResolved: 0,
    alertsGenerated: 0,
    averageEthicalScore: 0.8,
    interventionRate: 0,
    responseTime: 0,
  };

  constructor(llmProvider: LLMProvider) {
    super();
    this.llmProvider = llmProvider;
    
    // Initialize components
    this.ethicalEngine = new EthicalPolicyEngine(llmProvider);
    this.proactiveMonitor = new ProactiveMonitor(llmProvider);
    this.conflictResolver = new ConflictResolver(llmProvider);

    // Setup event handlers
    this.setupEventHandlers();

    this.logger.info('SimplifiedShakaAgent initialized for Dashboard');
  }

  /**
   * Activate ShakaAgent
   */
  public activate(): void {
    if (this.isActive) {
      this.logger.warn('ShakaAgent already active');
      return;
    }

    this.isActive = true;
    this.proactiveMonitor.start();
    
    this.logger.info('🧠 ShakaAgent activated - ethical monitoring started');
    this.emit('shaka:activated');
  }

  /**
   * Deactivate ShakaAgent
   */
  public deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.proactiveMonitor.stop();
    
    this.logger.info('ShakaAgent deactivated');
    this.emit('shaka:deactivated');
  }

  /**
   * Process ethical query from chat or API
   */
  public async processEthicalQuery(request: EthicalQueryRequest): Promise<EthicalQueryResponse> {
    const startTime = Date.now();
    this.isAnalyzing = true;

    try {
      this.logger.info('Processing ethical query', {
        query: request.query.substring(0, 100),
        framework: request.framework,
      });

      // Create ethical context
      const context: EthicalContext = {
        action: request.query,
        intent: 'Ethical guidance request',
        stakeholders: ['user', 'system'],
        ...request.context,
      };

      // Perform comprehensive ethical analysis
      const analysis = await this.ethicalEngine.analyzeContext(context);

      // Generate human-readable response
      const response = await this.generateEthicalResponse(request.query, analysis);

      // Generate specific recommendations
      const recommendations = analysis.recommendations.length > 0 
        ? analysis.recommendations 
        : await this.generateDefaultRecommendations(context, analysis);

      const processingTime = Date.now() - startTime;

      // Update metrics
      this.metrics.ethicalAnalyses++;
      this.metrics.averageEthicalScore = 
        (this.metrics.averageEthicalScore * 0.9) + (analysis.compliance * 0.1);
      this.metrics.responseTime = 
        (this.metrics.responseTime * 0.9) + (processingTime * 0.1);

      const result: EthicalQueryResponse = {
        analysis,
        recommendations,
        response,
        confidence: analysis.compliance,
        processingTime,
      };

      this.emit('shaka:analysis-complete', result);
      return result;

    } catch (error) {
      this.logger.error('Ethical query processing error', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze content for ethical concerns
   */
  public async analyzeContent(content: string, metadata?: Record<string, unknown>): Promise<EthicalAnalysis> {
    const context: EthicalContext = {
      action: 'content_analysis',
      intent: 'Review content for ethical compliance',
      data: content,
      metadata,
    };

    const analysis = await this.ethicalEngine.analyzeContext(context);
    this.metrics.ethicalAnalyses++;

    // Emit alert if concerning
    if (analysis.compliance < 0.7) {
      this.emit('shaka:ethical-concern', {
        analysis,
        content: content.substring(0, 200),
        severity: analysis.compliance < 0.5 ? 'critical' : 'warning',
      });
    }

    return analysis;
  }

  /**
   * Get current agent status
   */
  public getStatus(): ShakaStatus {
    const alerts = this.proactiveMonitor.getRecentAlerts(300000); // 5 minutes
    
    return {
      isActive: this.isActive,
      isAnalyzing: this.isAnalyzing,
      lastActivity: new Date(),
      ethicalScore: this.metrics.averageEthicalScore,
      alertsCount: alerts.length,
      analysisCount: this.metrics.ethicalAnalyses,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get agent metrics
   */
  public getMetrics(): ShakaMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  public getRecentAlerts(timeWindowMs = 300000): MonitorAlert[] {
    return this.proactiveMonitor.getRecentAlerts(timeWindowMs);
  }

  /**
   * Get active conflicts
   */
  public getActiveConflicts(): Conflict[] {
    return this.conflictResolver.getActiveConflicts();
  }

  /**
   * Get ethical policies
   */
  public getEthicalPolicies() {
    return this.ethicalEngine.getPolicies();
  }

  /**
   * Check if query requires ethical analysis
   */
  public requiresEthicalAnalysis(query: string): boolean {
    const ethicalKeywords = [
      'ethical', 'ethics', 'moral', 'right', 'wrong', 'should', 'ought',
      'fair', 'unfair', 'bias', 'discrimination', 'privacy', 'consent',
      'harm', 'safety', 'risk', 'responsibility', 'transparency'
    ];

    const lowerQuery = query.toLowerCase();
    return ethicalKeywords.some(keyword => lowerQuery.includes(keyword)) ||
           lowerQuery.includes('what would shaka') ||
           lowerQuery.includes('ethical analysis');
  }

  // Private methods

  private setupEventHandlers(): void {
    // Monitor alerts
    this.proactiveMonitor.on('alert:created', (alert: MonitorAlert) => {
      this.metrics.alertsGenerated++;
      this.emit('shaka:alert', alert);
      
      if (alert.severity === 'critical') {
        this.metrics.interventionRate++;
        this.emit('shaka:intervention-required', alert);
      }
    });

    // Conflict resolution
    this.conflictResolver.on('conflict:detected', (conflict: Conflict) => {
      this.emit('shaka:conflict-detected', conflict);
    });
  }

  private async generateEthicalResponse(query: string, analysis: EthicalAnalysis): Promise<string> {
    const prompt = `
    Tu es Shaka, l'agent éthique du système Vegapunk. Réponds à cette question éthique de manière claire et utile.

    Question: ${query}

    Analyse éthique:
    - Score de conformité: ${Math.round(analysis.compliance * 100)}%
    - Préoccupations: ${analysis.concerns.length} identifiées
    - Recommandations: ${analysis.recommendations.length} suggérées

    Frameworks analysés:
    ${analysis.frameworkAnalyses.map(f => 
      `- ${f.framework}: ${Math.round(f.score * 100)}% - ${f.keyPoints[0] ?? ''}`
    ).join('\n')}

    Fournis une réponse éthique personnalisée, empathique et pratique. Sois concis mais complet.
    Si le score est bas (<70%), explique les préoccupations. Si élevé, encourage la poursuite.
    `;

    const response = await this.llmProvider.generateResponse(prompt);
    return response;
  }

  private async generateDefaultRecommendations(
    context: EthicalContext, 
    analysis: EthicalAnalysis
  ): Promise<string[]> {
    if (analysis.compliance >= 0.8) {
      return [
        'Continue avec cette approche éthique solide',
        'Maintenir la transparence dans les communications',
        'Surveiller les impacts à long terme'
      ];
    } else if (analysis.compliance >= 0.6) {
      return [
        'Réexaminer les implications éthiques',
        'Consulter les parties prenantes concernées',
        'Considérer des alternatives plus éthiques',
        'Mettre en place des garde-fous supplémentaires'
      ];
    } else {
      return [
        '⚠️ Revoir complètement cette approche',
        'Identifier et adresser les risques éthiques majeurs',
        'Consulter des experts éthiques',
        'Considérer l\'abstention si les risques persistent'
      ];
    }
  }

  /**
   * Quick health check for dashboard
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    details: Record<string, unknown>;
  }> {
    try {
      const status = this.getStatus();
      const alerts = this.getRecentAlerts(60000); // 1 minute
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

      let health: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (criticalAlerts > 0) {
        health = 'error';
      } else if (alerts.length > 5 || status.ethicalScore < 0.7) {
        health = 'warning';
      }

      return {
        status: health,
        details: {
          isActive: status.isActive,
          ethicalScore: status.ethicalScore,
          alertsCount: alerts.length,
          criticalAlerts,
          uptime: status.uptime,
          analysisCount: status.analysisCount,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        details: { error: (error as Error).message },
      };
    }
  }
}