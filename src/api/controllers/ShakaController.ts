/**
 * Shaka Agent API Controller
 * REST API endpoints for ShakaAgent Dashboard integration
 * Provides ethical analysis, monitoring, and agent management
 */

import { Request, Response } from 'express';
import { createLogger } from '@utils/logger';
import { SimplifiedShakaAgent, type EthicalQueryRequest } from '@agents/shaka/SimplifiedShakaAgent';
import type { EthicalContext } from '@agents/shaka/EthicalPolicyEngine';

const logger = createLogger('ShakaController');

export class ShakaController {
  constructor(private shakaAgent: SimplifiedShakaAgent) {
    this.setupEventListeners();
  }

  /**
   * GET /api/agents/shaka/status
   * Get current ShakaAgent status
   */
  public getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = this.shakaAgent.getStatus();
      const health = await this.shakaAgent.healthCheck();
      
      res.json({
        success: true,
        data: {
          ...status,
          health: health.status,
          healthDetails: health.details,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get Shaka status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent status',
        message: (error as Error).message,
      });
    }
  };

  /**
   * POST /api/agents/shaka/query
   * Process ethical query
   */
  public processQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, context, framework } = req.body as EthicalQueryRequest;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query is required and must be a string',
        });
        return;
      }

      logger.info('Processing ethical query', {
        queryLength: query.length,
        framework,
        hasContext: !!context,
      });

      const result = await this.shakaAgent.processEthicalQuery({
        query,
        context,
        framework,
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to process ethical query', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process ethical query',
        message: (error as Error).message,
      });
    }
  };

  /**
   * POST /api/agents/shaka/analyze
   * Analyze content for ethical concerns
   */
  public analyzeContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, metadata } = req.body;

      if (!content || typeof content !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Content is required and must be a string',
        });
        return;
      }

      logger.info('Analyzing content', {
        contentLength: content.length,
        hasMetadata: !!metadata,
      });

      const analysis = await this.shakaAgent.analyzeContent(content, metadata);

      res.json({
        success: true,
        data: {
          analysis,
          summary: {
            compliance: analysis.compliance,
            concernsCount: analysis.concerns.length,
            recommendationsCount: analysis.recommendations.length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to analyze content', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze content',
        message: (error as Error).message,
      });
    }
  };

  /**
   * PUT /api/agents/shaka/toggle
   * Activate or deactivate ShakaAgent
   */
  public toggleAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'Active status must be a boolean',
        });
        return;
      }

      const currentStatus = this.shakaAgent.getStatus();

      if (active && !currentStatus.isActive) {
        this.shakaAgent.activate();
        logger.info('ShakaAgent activated via API');
      } else if (!active && currentStatus.isActive) {
        this.shakaAgent.deactivate();
        logger.info('ShakaAgent deactivated via API');
      }

      const newStatus = this.shakaAgent.getStatus();

      res.json({
        success: true,
        data: {
          previousState: currentStatus.isActive,
          currentState: newStatus.isActive,
          status: newStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to toggle ShakaAgent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle agent',
        message: (error as Error).message,
      });
    }
  };

  /**
   * GET /api/agents/shaka/policies
   * Get current ethical policies
   */
  public getPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const policies = this.shakaAgent.getEthicalPolicies();

      res.json({
        success: true,
        data: {
          policies,
          count: policies.length,
          byFramework: this.groupPoliciesByFramework(policies),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get ethical policies', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve policies',
        message: (error as Error).message,
      });
    }
  };

  /**
   * GET /api/agents/shaka/metrics
   * Get ShakaAgent performance metrics
   */
  public getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = this.shakaAgent.getMetrics();
      const status = this.shakaAgent.getStatus();
      const recentAlerts = this.shakaAgent.getRecentAlerts(3600000); // 1 hour
      const activeConflicts = this.shakaAgent.getActiveConflicts();

      const enhancedMetrics = {
        ...metrics,
        alertsByType: this.groupAlertsByType(recentAlerts),
        alertsBySeverity: this.groupAlertsBySeverity(recentAlerts),
        activeConflictsCount: activeConflicts.length,
        uptime: status.uptime,
        avgResponseTime: metrics.responseTime,
        ethicalComplianceLevel: this.getComplianceLevel(metrics.averageEthicalScore),
      };

      res.json({
        success: true,
        data: enhancedMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
        message: (error as Error).message,
      });
    }
  };

  /**
   * GET /api/agents/shaka/alerts
   * Get recent alerts
   */
  public getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeWindow = parseInt(req.query.timeWindow as string) || 3600000; // 1 hour default
      const severity = req.query.severity as string;

      let alerts = this.shakaAgent.getRecentAlerts(timeWindow);

      // Filter by severity if specified
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          timeWindow,
          summary: {
            byType: this.groupAlertsByType(alerts),
            bySeverity: this.groupAlertsBySeverity(alerts),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get alerts', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts',
        message: (error as Error).message,
      });
    }
  };

  /**
   * GET /api/agents/shaka/conflicts
   * Get active conflicts
   */
  public getConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const conflicts = this.shakaAgent.getActiveConflicts();

      res.json({
        success: true,
        data: {
          conflicts,
          count: conflicts.length,
          byType: this.groupConflictsByType(conflicts),
          bySeverity: this.groupConflictsBySeverity(conflicts),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get conflicts', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conflicts',
        message: (error as Error).message,
      });
    }
  };

  /**
   * POST /api/agents/shaka/detect-ethics
   * Quick ethical detection for chat messages
   */
  public detectEthicalContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Message is required and must be a string',
        });
        return;
      }

      const requiresAnalysis = this.shakaAgent.requiresEthicalAnalysis(message);

      res.json({
        success: true,
        data: {
          requiresEthicalAnalysis: requiresAnalysis,
          message: requiresAnalysis 
            ? 'Cette requête nécessite une analyse éthique' 
            : 'Aucune analyse éthique requise',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to detect ethical content', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect ethical content',
        message: (error as Error).message,
      });
    }
  };

  // Private helper methods

  private setupEventListeners(): void {
    this.shakaAgent.on('shaka:alert', (alert) => {
      logger.info('ShakaAgent alert', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
      });
    });

    this.shakaAgent.on('shaka:ethical-concern', (concern) => {
      logger.warn('Ethical concern detected', {
        compliance: concern.analysis.compliance,
        concernsCount: concern.analysis.concerns.length,
      });
    });

    this.shakaAgent.on('shaka:intervention-required', (alert) => {
      logger.error('Critical intervention required', {
        alertId: alert.id,
        message: alert.message,
      });
    });
  }

  private groupPoliciesByFramework(policies: any[]) {
    const grouped: Record<string, number> = {};
    policies.forEach(policy => {
      grouped[policy.framework] = (grouped[policy.framework] || 0) + 1;
    });
    return grouped;
  }

  private groupAlertsByType(alerts: any[]) {
    const grouped: Record<string, number> = {};
    alerts.forEach(alert => {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    });
    return grouped;
  }

  private groupAlertsBySeverity(alerts: any[]) {
    const grouped: Record<string, number> = {};
    alerts.forEach(alert => {
      grouped[alert.severity] = (grouped[alert.severity] || 0) + 1;
    });
    return grouped;
  }

  private groupConflictsByType(conflicts: any[]) {
    const grouped: Record<string, number> = {};
    conflicts.forEach(conflict => {
      grouped[conflict.type] = (grouped[conflict.type] || 0) + 1;
    });
    return grouped;
  }

  private groupConflictsBySeverity(conflicts: any[]) {
    const grouped: Record<string, number> = {};
    conflicts.forEach(conflict => {
      grouped[conflict.severity] = (grouped[conflict.severity] || 0) + 1;
    });
    return grouped;
  }

  private getComplianceLevel(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'acceptable';
    if (score >= 0.6) return 'concerning';
    return 'critical';
  }
}