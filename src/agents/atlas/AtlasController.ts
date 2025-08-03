/**
 * AtlasController - API Controller for Atlas Agent
 * Handles integration with main Vegapunk dashboard
 * Part of Tri-Protocol Integration
 */

import { Request, Response } from 'express';
import { AtlasAgent } from './AtlasAgent';
import { logger } from '../../utils/logger';
import type { 
  SecurityThreat, 
  SecurityIncident,
  SecurityAuditResult
} from './SecurityMonitor';

export class AtlasController {
  private atlasAgent: AtlasAgent;
  private static instance: AtlasController;

  private constructor() {
    // Initialize Atlas with default config
    this.atlasAgent = new AtlasAgent({
      name: 'Atlas',
      description: 'Security and Automation Specialist',
      autonomyLevel: 7,
      learningRate: 0.15,
      securityStrictness: 'balanced',
      automationLevel: 'supervised',
      proactiveDefense: true,
      learningEnabled: true,
      maintenanceMode: 'proactive'
    });
    
    logger.info('AtlasController initialized');
  }

  public static getInstance(): AtlasController {
    if (!AtlasController.instance) {
      AtlasController.instance = new AtlasController();
    }
    return AtlasController.instance;
  }

  /**
   * Start Atlas services
   */
  public async start(): Promise<void> {
    try {
      // Start Atlas agent
      await this.atlasAgent.start();
      
      logger.info('Atlas services started successfully');
    } catch (error) {
      logger.error('Failed to start Atlas services', error);
      throw error;
    }
  }

  /**
   * Stop Atlas services
   */
  public async stop(): Promise<void> {
    try {
      await this.atlasAgent.stop();
      logger.info('Atlas services stopped');
    } catch (error) {
      logger.error('Failed to stop Atlas services', error);
      throw error;
    }
  }

  /**
   * Get Atlas status
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.atlasAgent.getAtlasMetrics();
      const agentMetrics = this.atlasAgent.getMetrics();
      
      const status = {
        agent: 'atlas',
        version: '2.0.0',
        state: agentMetrics.state || 'running',
        uptime: agentMetrics.uptime,
        security: {
          overallScore: metrics.securityScore,
          threatsDetected: metrics.threatsDetected,
          threatsNeutralized: metrics.threatsNeutralized,
          incidentsResolved: metrics.incidentsResolved,
          falsePositiveRate: metrics.falsePositiveRate
        },
        automation: {
          tasksCompleted: metrics.automationTasksCompleted,
          averageResponseTime: metrics.averageResponseTime
        },
        capabilities: {
          a2aEnabled: true,
          langGraphEnabled: true,
          mcpEnabled: true
        },
        lastUpdate: new Date().toISOString()
      };
      
      res.json(status);
    } catch (error) {
      logger.error('Failed to get status', error);
      res.status(500).json({ error: 'Failed to retrieve status' });
    }
  }

  /**
   * Get active threats
   */
  public async getThreats(req: Request, res: Response): Promise<void> {
    try {
      // In production, this would get real threats from SecurityMonitor
      const threats: SecurityThreat[] = [
        {
          id: 'threat-demo-1',
          type: 'network_anomaly',
          source: '192.168.1.100',
          target: 'web-server',
          severity: 'medium',
          confidence: 0.75,
          timestamp: new Date(),
          metadata: {
            pattern: 'unusual_port_scanning',
            attempts: 15
          }
        }
      ];
      
      res.json(threats);
    } catch (error) {
      logger.error('Failed to get threats', error);
      res.status(500).json({ error: 'Failed to retrieve threats' });
    }
  }

  /**
   * Initiate security scan
   */
  public async inititateScan(req: Request, res: Response): Promise<void> {
    try {
      const { 
        scanType = 'comprehensive',
        targetSystems = [],
        depth = 'standard'
      } = req.body;
      
      // Perform security audit
      const auditResult = await this.atlasAgent.performSecurityAudit();
      
      const scanResult = {
        scanId: auditResult.id,
        scanType,
        targetSystems,
        depth,
        status: 'in_progress',
        startTime: new Date().toISOString(),
        estimatedDuration: '3-5 minutes',
        preliminaryFindings: auditResult.findings.length
      };
      
      res.json(scanResult);
    } catch (error) {
      logger.error('Failed to initiate scan', error);
      res.status(500).json({ error: 'Failed to initiate security scan' });
    }
  }

  /**
   * Execute incident response
   */
  public async respondToIncident(req: Request, res: Response): Promise<void> {
    try {
      const { 
        incidentId,
        severity = 'medium',
        affectedSystems = [],
        responseType = 'automatic'
      } = req.body;
      
      // Create mock incident for demonstration
      const incident: SecurityIncident = {
        id: incidentId || `inc-${Date.now()}`,
        type: 'security_breach',
        severity: severity as any,
        status: 'active',
        affectedSystems,
        threats: [],
        timeline: [{
          timestamp: new Date(),
          event: 'Incident detected',
          actor: 'atlas'
        }],
        containmentActions: [],
        createdAt: new Date()
      };
      
      // Coordinate response
      const coordination = await this.atlasAgent.coordinateIncidentResponse(incident);
      
      res.json({
        incidentId: incident.id,
        responseStatus: 'executing',
        coordination,
        estimatedResolution: `${coordination.estimatedResolutionTime} minutes`,
        message: 'Incident response initiated with multi-agent coordination'
      });
    } catch (error) {
      logger.error('Failed to respond to incident', error);
      res.status(500).json({ error: 'Failed to execute incident response' });
    }
  }

  /**
   * Get incidents
   */
  public async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      // In production, would fetch real incidents
      const incidents: SecurityIncident[] = [];
      res.json(incidents);
    } catch (error) {
      logger.error('Failed to get incidents', error);
      res.status(500).json({ error: 'Failed to retrieve incidents' });
    }
  }

  /**
   * Get compliance status
   */
  public async getCompliance(req: Request, res: Response): Promise<void> {
    try {
      const compliance = {
        overallScore: 9.2,
        lastAudit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextAudit: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        policies: {
          total: 25,
          compliant: 23,
          violations: 2
        },
        certifications: ['SOC2', 'ISO27001', 'GDPR'],
        recommendations: [
          'Update password policy to require 14 characters',
          'Enable MFA for all administrative accounts'
        ]
      };
      
      res.json(compliance);
    } catch (error) {
      logger.error('Failed to get compliance', error);
      res.status(500).json({ error: 'Failed to retrieve compliance status' });
    }
  }

  /**
   * Create automation task
   */
  public async createAutomation(req: Request, res: Response): Promise<void> {
    try {
      const {
        taskType,
        schedule = 'daily',
        parameters = {},
        enabled = true
      } = req.body;
      
      const automation = {
        id: `auto-${Date.now()}`,
        taskType,
        schedule,
        parameters,
        enabled,
        createdAt: new Date().toISOString(),
        nextExecution: this.calculateNextExecution(schedule),
        status: 'scheduled'
      };
      
      res.json(automation);
    } catch (error) {
      logger.error('Failed to create automation', error);
      res.status(500).json({ error: 'Failed to create automation task' });
    }
  }

  /**
   * Get agent info for dashboard
   */
  public async getAgentInfo(req: Request, res: Response): Promise<void> {
    try {
      const info = {
        id: 'atlas',
        name: 'Atlas',
        type: 'security_automation',
        status: 'active',
        description: 'Security and Automation Specialist',
        capabilities: [
          'Threat Detection',
          'Incident Response',
          'Security Automation',
          'Multi-Agent Collaboration'
        ],
        protocols: ['A2A', 'LangGraph', 'MCP'],
        metrics: this.atlasAgent.getAtlasMetrics(),
        version: '2.0.0'
      };
      
      res.json(info);
    } catch (error) {
      logger.error('Failed to get agent info', error);
      res.status(500).json({ error: 'Failed to retrieve agent info' });
    }
  }

  /**
   * Execute security collaboration
   */
  public async collaborate(req: Request, res: Response): Promise<void> {
    try {
      const {
        operation,
        targetAgents = [],
        parameters = {}
      } = req.body;
      
      const collaboration = {
        id: `collab-${Date.now()}`,
        operation,
        initiator: 'atlas',
        participants: ['atlas', ...targetAgents],
        status: 'coordinating',
        parameters,
        startTime: new Date().toISOString()
      };
      
      res.json(collaboration);
    } catch (error) {
      logger.error('Failed to initiate collaboration', error);
      res.status(500).json({ error: 'Failed to initiate security collaboration' });
    }
  }

  /**
   * Helper method to calculate next execution time
   */
  private calculateNextExecution(schedule: string): string {
    const now = new Date();
    switch (schedule) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'immediate':
        return new Date().toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }
}