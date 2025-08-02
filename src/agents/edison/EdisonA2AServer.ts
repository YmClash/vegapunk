/**
 * Edison A2A Server
 * A2A Protocol server implementation for Edison Agent
 */

import { createA2AExpressApp } from './EdisonAgentTypes';
import { edisonAgentCard } from './EdisonAgentCard';
import { EdisonAgentExecutor } from './EdisonAgentExecutor';
import { EdisonAgent } from './EdisonAgent';
import { createLogger } from '@utils/logger';

const logger = createLogger('EdisonA2AServer');

/**
 * Start Edison A2A Server
 */
export async function startEdisonA2AServer(
  edisonAgent: EdisonAgent,
  port: number = 8082
): Promise<void> {
  try {
    logger.info('Starting Edison A2A Server...', { port });
    
    // Create executor
    const executor = new EdisonAgentExecutor({
      edisonAgent,
      enableCollaboration: true,
      maxConcurrentTasks: 5
    });
    
    // Create A2A app
    const a2aApp = createA2AExpressApp(edisonAgentCard, executor);
    
    // Add health check endpoint
    a2aApp.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        agent: 'edison',
        timestamp: new Date().toISOString(),
        metrics: edisonAgent.getMetrics()
      });
    });
    
    // Add Edison-specific endpoints
    a2aApp.app.get('/api/edison/status', (req: any, res: any) => {
      const metrics = edisonAgent.getMetrics();
      const context = edisonAgent.getInnovationContext();
      const thinkingMode = edisonAgent.getCurrentThinkingMode();
      
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
    a2aApp.app.get('/api/edison/innovations', async (req: any, res: any) => {
      try {
        const context = edisonAgent.getInnovationContext();
        res.json({
          innovations: context.activeInnovations,
          count: context.activeInnovations.length
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve innovations' });
      }
    });
    
    // Problem analysis endpoint
    a2aApp.app.post('/api/edison/analyze', async (req: any, res: any) => {
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
        
        const solutions = await edisonAgent.solveComplexProblem(problemObj);
        
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
    a2aApp.app.post('/api/edison/reason', async (req: any, res: any) => {
      try {
        const { premises } = req.body;
        const result = await edisonAgent.performLogicalAnalysis(premises);
        
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
    a2aApp.app.post('/api/edison/research', async (req: any, res: any) => {
      try {
        const { topic } = req.body;
        const research = await edisonAgent.conductResearch(topic);
        
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
    a2aApp.app.post('/api/edison/collaborate', async (req: any, res: any) => {
      try {
        const { objective, participants, duration } = req.body;
        
        const session = await edisonAgent.leadInnovationSession(
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
    
    // Start the server
    await a2aApp.start(port);
    
    logger.info('Edison A2A Server started successfully', {
      port,
      endpoints: [
        '/.well-known/a2a/agent',
        '/tasks',
        '/health',
        '/api/edison/status',
        '/api/edison/innovations',
        '/api/edison/analyze',
        '/api/edison/reason',
        '/api/edison/research',
        '/api/edison/collaborate'
      ]
    });
    
    // Register with A2A topology
    await registerWithA2ATopology(port);
    
  } catch (error) {
    logger.error('Failed to start Edison A2A Server', error);
    throw error;
  }
}

/**
 * Register Edison with A2A topology
 */
async function registerWithA2ATopology(port: number): Promise<void> {
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

// Export for use in main application
export { edisonAgentCard, EdisonAgentExecutor };