/**
 * Edison A2A Server
 * A2A Protocol server implementation for Edison Agent
 */

import express from 'express';
import { createA2AExpressApp } from './EdisonAgentTypes';
import { edisonAgentCard } from './EdisonAgentCard';
import { EdisonAgentExecutor } from './EdisonAgentExecutor';
import { EdisonAgent } from './EdisonAgent';
import { createLogger } from '@utils/logger';

const logger = createLogger('EdisonA2AServer');

export class EdisonA2AServer {
  private app: express.Application;
  private edisonAgent: EdisonAgent;
  private executor: EdisonAgentExecutor;
  private a2aApp: any;

  constructor(edisonAgent: EdisonAgent) {
    this.edisonAgent = edisonAgent;
    this.initialize();
  }

  private initialize(): void {
    logger.info('Initializing Edison A2A Server...');
    
    // Create executor
    this.executor = new EdisonAgentExecutor({
      edisonAgent: this.edisonAgent,
      enableCollaboration: true,
      maxConcurrentTasks: 5
    });
    
    // Create A2A app
    this.a2aApp = createA2AExpressApp(edisonAgentCard, this.executor);
    this.app = this.a2aApp.app;
    
    // Setup custom routes
    this.setupCustomRoutes();
    
    logger.info('Edison A2A Server initialized with tri-protocol support');
  }

  private setupCustomRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        agent: 'edison',
        timestamp: new Date().toISOString(),
        metrics: this.edisonAgent.getMetrics()
      });
    });
    
    // Edison-specific endpoints
    this.app.get('/api/edison/status', (req: any, res: any) => {
      const metrics = this.edisonAgent.getMetrics();
      const context = this.edisonAgent.getInnovationContext();
      const thinkingMode = this.edisonAgent.getCurrentThinkingMode();
      
      res.json({
        status: 'active',
        metrics,
        context: {
          activeProblems: context.currentProblems.length,
          activeInnovations: context.activeInnovations.length,
          researchProjects: context.researchProjects.length
        },
        thinkingMode
      });
    });
    
    // Innovation showcase endpoint
    this.app.get('/api/edison/innovations', async (req: any, res: any) => {
      try {
        const context = this.edisonAgent.getInnovationContext();
        res.json({
          innovations: context.activeInnovations,
          count: context.activeInnovations.length
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve innovations' });
      }
    });
    
    // Problem analysis endpoint
    this.app.post('/api/edison/analyze', async (req: any, res: any) => {
      try {
        const { problem, constraints, objectives } = req.body;
        
        const problemObj = {
          id: `problem_${Date.now()}`,
          type: 'complex' as const,
          description: problem,
          constraints: constraints || [],
          objectives: objectives || [],
          context: {},
          complexity: 7
        };
        
        const solutions = await this.edisonAgent.solveComplexProblem(problemObj);
        
        res.json({
          success: true,
          solutions: solutions.slice(0, 5), // Top 5 solutions
          solutionCount: solutions.length
        });
      } catch (error) {
        logger.error('Problem analysis failed', error);
        res.status(500).json({ 
          success: false,
          error: 'Problem analysis failed' 
        });
      }
    });
    
    // Reasoning endpoint
    this.app.post('/api/edison/reason', async (req: any, res: any) => {
      try {
        const { premises } = req.body;
        const result = await this.edisonAgent.performLogicalAnalysis(premises);
        
        res.json({
          success: true,
          conclusions: result.conclusions,
          fallacies: result.fallacies,
          consistency: result.consistency
        });
      } catch (error) {
        logger.error('Logical reasoning failed', error);
        res.status(500).json({ 
          success: false,
          error: 'Logical reasoning failed' 
        });
      }
    });
    
    // Research endpoint
    this.app.post('/api/edison/research', async (req: any, res: any) => {
      try {
        const { topic } = req.body;
        const research = await this.edisonAgent.conductResearch(topic);
        
        res.json({
          success: true,
          research,
          findingCount: research.findings.length,
          confidence: research.confidenceLevel
        });
      } catch (error) {
        logger.error('Research failed', error);
        res.status(500).json({ 
          success: false,
          error: 'Research failed' 
        });
      }
    });
    
    // Collaboration endpoint
    this.app.post('/api/edison/collaborate', async (req: any, res: any) => {
      try {
        const { objective, participants, duration } = req.body;
        
        const session = await this.edisonAgent.leadInnovationSession(
          objective,
          participants || [],
          duration || 60
        );
        
        res.json({
          success: true,
          session,
          outcomeCount: session.outcomes.length
        });
      } catch (error) {
        logger.error('Collaboration session failed', error);
        res.status(500).json({ 
          success: false,
          error: 'Collaboration session failed' 
        });
      }
    });
    
    logger.info('Custom Edison routes configured');
  }

  public getExpressApp(): express.Application {
    return this.app;
  }

  public async start(port: number = 8083): Promise<void> {
    return new Promise((resolve) => {
      this.a2aApp.start(port).then(() => {
        logger.info(`💡 [EdisonAgent] A2A Server started on http://localhost:${port}`);
        logger.info(`💡 [EdisonAgent] Agent Card: http://localhost:${port}/.well-known/a2a/agent`);
        logger.info(`💡 [EdisonAgent] Health Check: http://localhost:${port}/health`);
        logger.info("💡 [EdisonAgent] Innovation engine active");
        
        // Register with A2A topology
        this.registerWithA2ATopology(port).then(() => {
          resolve();
        });
      }).catch((error: any) => {
        logger.error('Failed to start Edison A2A Server', error);
        throw error;
      });
    });
  }

  public async stop(): Promise<void> {
    logger.info('Stopping EdisonA2AServer...');
    // In production, would properly close server connections
  }

  /**
   * Register Edison with A2A topology
   */
  private async registerWithA2ATopology(port: number): Promise<void> {
    try {
      // In a real implementation, this would register with the central A2A registry
      logger.info('Registering Edison with A2A topology', {
        agent: 'edison',
        url: `http://localhost:${port}`,
        capabilities: edisonAgentCard.capabilities
      });
      
      // Simulate registration success
      logger.info('Edison successfully registered with A2A topology');
    } catch (error) {
      logger.error('Failed to register with A2A topology', error);
    }
  }
}

// Export for backward compatibility if needed
export function createEdisonA2AServer(edisonAgent: EdisonAgent): EdisonA2AServer {
  return new EdisonA2AServer(edisonAgent);
}

// Export for use in main application
export { edisonAgentCard, EdisonAgentExecutor };