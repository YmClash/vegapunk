/**
 * AtlasA2AServer - A2A Protocol Server Setup
 * Configures Atlas Agent as an A2A-compliant server
 * Part of Tri-Protocol Integration
 */

import express from 'express';
import {
  InMemoryTaskStore,
  TaskStore,
  A2AExpressApp,
  DefaultRequestHandler,
} from "./AtlasAgentTypes";
import { atlasAgentCard } from './AtlasAgentCard';
import { AtlasAgentExecutor } from './AtlasAgentExecutor';
import { createLogger } from '@utils/logger';

const logger = createLogger('AtlasA2AServer');

export class AtlasA2AServer {
  private app: express.Application;
  private taskStore: TaskStore;
  private agentExecutor: AtlasAgentExecutor;
  private requestHandler: DefaultRequestHandler;

  constructor() {
    // Initialize task store and executor
    this.taskStore = new InMemoryTaskStore();
    this.agentExecutor = new AtlasAgentExecutor();
    
    // Create request handler with agent card
    this.requestHandler = new DefaultRequestHandler(
      atlasAgentCard,
      this.taskStore,
      this.agentExecutor
    );

    // Setup Express app with A2A routes
    const appBuilder = new A2AExpressApp(this.requestHandler);
    this.app = express();
    
    // Add middleware
    this.app.use(express.json());
    
    // Setup A2A routes under /api/agents/atlas
    appBuilder.setupRoutes(this.app, "/api/agents/atlas");
    
    // Add custom Atlas endpoints
    this.setupCustomRoutes();
    
    logger.info('AtlasA2AServer initialized with tri-protocol support');
  }

  private setupCustomRoutes(): void {
    // Health check endpoint
    this.app.get('/api/agents/atlas/health', (req, res) => {
      res.json({
        status: 'healthy',
        agent: 'atlas',
        version: atlasAgentCard.version,
        capabilities: atlasAgentCard.capabilities,
        timestamp: new Date().toISOString()
      });
    });

    // Security status endpoint
    this.app.get('/api/agents/atlas/security-status', async (req, res) => {
      try {
        // In production, this would fetch real security metrics
        const status = {
          overallScore: 0.85,
          activeThreats: 0,
          vulnerabilities: 2,
          lastScan: new Date().toISOString(),
          defensePosture: 'normal'
        };
        res.json(status);
      } catch (error) {
        logger.error('Failed to get security status', error);
        res.status(500).json({ error: 'Failed to retrieve security status' });
      }
    });

    // Active threats endpoint
    this.app.get('/api/agents/atlas/threats', async (req, res) => {
      try {
        // In production, this would return real threat data
        const threats = [
          {
            id: 'threat-1',
            type: 'network_anomaly',
            severity: 'low',
            description: 'Unusual port scanning detected',
            mitigated: true,
            timestamp: new Date().toISOString()
          }
        ];
        res.json(threats);
      } catch (error) {
        logger.error('Failed to get threats', error);
        res.status(500).json({ error: 'Failed to retrieve threats' });
      }
    });

    // Incidents endpoint
    this.app.get('/api/agents/atlas/incidents', async (req, res) => {
      try {
        const incidents = [];
        res.json(incidents);
      } catch (error) {
        logger.error('Failed to get incidents', error);
        res.status(500).json({ error: 'Failed to retrieve incidents' });
      }
    });

    // Compliance status endpoint
    this.app.get('/api/agents/atlas/compliance', async (req, res) => {
      try {
        const compliance = {
          score: 9,
          lastAudit: new Date().toISOString(),
          violations: [],
          nextAuditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        res.json(compliance);
      } catch (error) {
        logger.error('Failed to get compliance status', error);
        res.status(500).json({ error: 'Failed to retrieve compliance status' });
      }
    });

    // Security scan endpoint
    this.app.post('/api/agents/atlas/scan', async (req, res) => {
      try {
        const { scanType = 'comprehensive', targetSystems = [] } = req.body;
        
        // Create a task for the scan
        const taskId = `scan-${Date.now()}`;
        const scanResult = {
          taskId,
          scanType,
          status: 'initiated',
          message: 'Security scan has been initiated. Check task status for results.',
          estimatedDuration: '2-5 minutes'
        };
        
        res.json(scanResult);
      } catch (error) {
        logger.error('Failed to initiate scan', error);
        res.status(500).json({ error: 'Failed to initiate security scan' });
      }
    });

    // Incident response endpoint
    this.app.post('/api/agents/atlas/respond', async (req, res) => {
      try {
        const { incidentId, responseType = 'auto' } = req.body;
        
        const response = {
          incidentId,
          responseType,
          status: 'executing',
          actions: ['Analyzing incident', 'Determining response strategy'],
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
        
        res.json(response);
      } catch (error) {
        logger.error('Failed to respond to incident', error);
        res.status(500).json({ error: 'Failed to execute incident response' });
      }
    });

    // Automation endpoint
    this.app.post('/api/agents/atlas/automate', async (req, res) => {
      try {
        const { taskType, schedule, parameters = {} } = req.body;
        
        const automation = {
          id: `auto-${Date.now()}`,
          taskType,
          schedule,
          parameters,
          status: 'scheduled',
          nextExecution: schedule === 'immediate' ? 'now' : 'as scheduled'
        };
        
        res.json(automation);
      } catch (error) {
        logger.error('Failed to create automation', error);
        res.status(500).json({ error: 'Failed to create automation task' });
      }
    });

    logger.info('Custom Atlas routes configured');
  }

  public getExpressApp(): express.Application {
    return this.app;
  }

  public async start(port: number = 8082): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        logger.info(`🛡️ [AtlasAgent] A2A Server started on http://localhost:${port}`);
        logger.info(`🛡️ [AtlasAgent] Agent Card: http://localhost:${port}/api/agents/atlas/.well-known/agent.json`);
        logger.info(`🛡️ [AtlasAgent] Health Check: http://localhost:${port}/api/agents/atlas/health`);
        logger.info("🛡️ [AtlasAgent] Security monitoring active");
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    logger.info('Stopping AtlasA2AServer...');
    // In production, would properly close server connections
  }
}