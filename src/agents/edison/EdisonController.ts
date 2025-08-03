/**
 * Edison Controller
 * API endpoints for Edison Agent dashboard integration
 */

import type { Request, Response } from 'express';
import { EdisonAgent } from './EdisonAgent';
import { createLogger } from '@utils/logger';
import type {
  EdisonStatus,
  AnalyzeProblemRequest,
  AnalyzeProblemResponse,
  GenerateInnovationsRequest,
  GenerateInnovationsResponse,
  PerformReasoningRequest,
  PerformReasoningResponse,
  ResearchRequest,
  ResearchResponse,
  InnovationMetrics
} from './EdisonAgentTypes';

export class EdisonController {
  private readonly logger = createLogger('EdisonController');
  private readonly edison: EdisonAgent;

  constructor(edisonAgent: EdisonAgent) {
    this.edison = edisonAgent;
    this.logger.info('Edison Controller initialized');
  }

  /**
   * GET /api/agents/edison/status
   * Get Edison agent status and metrics
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.edison.getMetrics();
      const context = this.edison.getInnovationContext();
      const thinkingMode = this.edison.getCurrentThinkingMode();
      
      const status: EdisonStatus = {
        status: context.currentProblems.length > 3 ? 'busy' : 
                context.currentProblems.length > 0 ? 'active' : 'idle',
        problemsSolved: metrics.problemsSolved,
        innovationScore: metrics.averageInnovationScore,
        currentStage: context.currentProblems.length > 0 ? 'problem-solving' : 'ready',
        currentReasoning: context.logicalFrameworks[0],
        reasoningType: thinkingMode.logical ? 'logical' : 'creative',
        lastActivity: new Date(),
        activeProblems: context.currentProblems.length,
        pendingSolutions: context.activeInnovations.length
      };
      
      res.json(status);
    } catch (error) {
      this.logger.error('Failed to get Edison status', error);
      res.status(500).json({ error: 'Failed to retrieve Edison status' });
    }
  }

  /**
   * POST /api/agents/edison/analyze
   * Analyze a complex problem
   */
  async analyzeProblem(req: Request, res: Response): Promise<void> {
    try {
      const request: AnalyzeProblemRequest = req.body;
      
      const problem = {
        id: `problem_${Date.now()}`,
        type: 'complex' as const,
        description: request.problem,
        constraints: request.constraints || [],
        objectives: request.objectives || [],
        context: {},
        complexity: request.complexity || 7
      };
      
      // Solve the problem
      const solutions = await this.edison.solveComplexProblem(problem);
      
      // Create decomposition from solutions
      const decomposition = this.createDecomposition(problem, solutions);
      
      const response: AnalyzeProblemResponse = {
        success: true,
        analysis: decomposition,
        subProblems: decomposition.subProblems,
        complexity: problem.complexity
      };
      
      res.json(response);
    } catch (error) {
      this.logger.error('Problem analysis failed', error);
      res.status(500).json({
        success: false,
        error: 'Problem analysis failed',
        analysis: null as any,
        subProblems: [],
        complexity: 0
      });
    }
  }

  /**
   * POST /api/agents/edison/innovate
   * Generate innovative solutions
   */
  async generateInnovations(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateInnovationsRequest = req.body;
      
      // Generate innovations
      const domain = this.extractDomain(request.challenge);
      const innovations = await this.edison.generateBreakthroughInnovations(domain);
      
      // Filter based on criteria
      let filteredInnovations = innovations;
      if (request.criteria) {
        filteredInnovations = innovations.filter(inn => {
          if (request.criteria?.minNovelty && inn.noveltyScore < request.criteria.minNovelty) return false;
          if (request.criteria?.minFeasibility && inn.feasibilityScore < request.criteria.minFeasibility) return false;
          return true;
        });
      }
      
      // Limit count if requested
      if (request.count) {
        filteredInnovations = filteredInnovations.slice(0, request.count);
      }
      
      // Convert to solution format
      const solutions = filteredInnovations.map(inn => ({
        id: inn.id,
        title: inn.title,
        description: inn.description,
        technique: inn.sourceMethod,
        scores: {
          innovation: inn.noveltyScore,
          feasibility: inn.feasibilityScore,
          impact: inn.impactScore
        },
        implementation: this.generateImplementationPlan(inn)
      }));
      
      const response: GenerateInnovationsResponse = {
        success: true,
        solutions,
        metadata: {
          techniquesUsed: request.techniques || ['SCAMPER', 'TRIZ'],
          totalGenerated: innovations.length,
          topRated: solutions[0]
        }
      };
      
      res.json(response);
    } catch (error) {
      this.logger.error('Innovation generation failed', error);
      res.status(500).json({
        success: false,
        error: 'Innovation generation failed',
        solutions: [],
        metadata: {
          techniquesUsed: [],
          totalGenerated: 0,
          topRated: null
        }
      });
    }
  }

  /**
   * POST /api/agents/edison/reason
   * Perform logical reasoning
   */
  async performReasoning(req: Request, res: Response): Promise<void> {
    try {
      const request: PerformReasoningRequest = req.body;
      
      // Perform logical analysis
      const analysis = await this.edison.performLogicalAnalysis(request.premises);
      
      // Build reasoning process
      const reasoningProcess = {
        type: request.type,
        premises: request.premises,
        steps: this.generateReasoningSteps(request.premises, analysis.conclusions),
        conclusions: analysis.conclusions.map(c => ({
          statement: c.statement,
          confidence: c.confidence,
          validity: c.validity
        })),
        confidence: this.calculateOverallConfidence(analysis.conclusions)
      };
      
      const response: PerformReasoningResponse = {
        success: true,
        reasoning: reasoningProcess,
        conclusions: reasoningProcess.conclusions,
        confidence: reasoningProcess.confidence
      };
      
      res.json(response);
    } catch (error) {
      this.logger.error('Logical reasoning failed', error);
      res.status(500).json({
        success: false,
        error: 'Logical reasoning failed',
        reasoning: null as any,
        conclusions: [],
        confidence: 0
      });
    }
  }

  /**
   * POST /api/agents/edison/research
   * Conduct research on a topic
   */
  async conductResearch(req: Request, res: Response): Promise<void> {
    try {
      const request: ResearchRequest = req.body;
      
      // Conduct research
      const research = await this.edison.conductResearch(request.topic);
      
      // Filter findings based on scope
      let findings = research.findings;
      if (request.scope === 'narrow') {
        findings = findings.slice(0, 5);
      } else if (request.scope === 'moderate') {
        findings = findings.slice(0, 10);
      }
      
      const response: ResearchResponse = {
        success: true,
        findings: findings.map(f => ({
          description: f.description,
          significance: f.significance,
          evidence: f.evidence || 'Research-based',
          confidence: f.confidence || 0.8
        })),
        gaps: research.knowledgeGaps,
        hypotheses: research.hypotheses,
        confidence: research.confidenceLevel
      };
      
      res.json(response);
    } catch (error) {
      this.logger.error('Research failed', error);
      res.status(500).json({
        success: false,
        error: 'Research failed',
        findings: [],
        gaps: [],
        hypotheses: [],
        confidence: 0
      });
    }
  }

  /**
   * GET /api/agents/edison/solutions
   * Get current solutions
   */
  async getSolutions(req: Request, res: Response): Promise<void> {
    try {
      const context = this.edison.getInnovationContext();
      const problemId = req.query.problemId as string;
      
      let solutions = context.activeInnovations;
      
      // Filter by problem if specified
      if (problemId) {
        solutions = solutions.filter(inn => 
          inn.associatedProblem === problemId
        );
      }
      
      res.json({
        solutions: solutions.map(inn => ({
          id: inn.id,
          title: inn.title,
          description: inn.description,
          scores: {
            novelty: inn.noveltyScore,
            feasibility: inn.feasibilityScore,
            impact: inn.impactScore
          },
          status: 'active',
          createdAt: inn.timestamp
        })),
        count: solutions.length
      });
    } catch (error) {
      this.logger.error('Failed to retrieve solutions', error);
      res.status(500).json({ error: 'Failed to retrieve solutions' });
    }
  }

  /**
   * GET /api/agents/edison/research
   * Get research projects
   */
  async getResearch(req: Request, res: Response): Promise<void> {
    try {
      const context = this.edison.getInnovationContext();
      
      res.json({
        projects: context.researchProjects.map(project => ({
          id: project.id,
          topic: project.topic,
          findings: project.findings.length,
          confidence: project.confidenceLevel,
          status: 'completed',
          timestamp: project.timestamp
        })),
        count: context.researchProjects.length
      });
    } catch (error) {
      this.logger.error('Failed to retrieve research projects', error);
      res.status(500).json({ error: 'Failed to retrieve research projects' });
    }
  }

  /**
   * GET /api/agents/edison/metrics
   * Get innovation metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = req.query.range as string || '7d';
      const metrics = this.edison.getMetrics();
      const context = this.edison.getInnovationContext();
      
      // Calculate metrics
      const innovationMetrics: InnovationMetrics = {
        totalInnovations: metrics.innovationsGenerated,
        averageNoveltyScore: this.calculateAverageScore(context.activeInnovations, 'noveltyScore'),
        averageFeasibilityScore: this.calculateAverageScore(context.activeInnovations, 'feasibilityScore'),
        averageImpactScore: this.calculateAverageScore(context.activeInnovations, 'impactScore'),
        breakthroughCount: metrics.breakthroughCount,
        implementedCount: context.activeInnovations.filter(inn => 
          inn.implementation?.status === 'completed'
        ).length,
        successRate: metrics.problemsSolved > 0 ? 
          (metrics.problemsSolved / (metrics.problemsSolved + 5)) : 0, // Simplified
        timeRange
      };
      
      res.json(innovationMetrics);
    } catch (error) {
      this.logger.error('Failed to retrieve metrics', error);
      res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  }

  /**
   * POST /api/agents/edison/collaborate
   * Start collaboration session
   */
  async startCollaboration(req: Request, res: Response): Promise<void> {
    try {
      const { objective, participants, duration } = req.body;
      
      const session = await this.edison.leadInnovationSession(
        objective,
        participants || [],
        duration || 60
      );
      
      res.json({
        success: true,
        sessionId: session.id,
        outcomes: session.outcomes.length,
        insights: session.insights,
        nextSteps: session.nextSteps
      });
    } catch (error) {
      this.logger.error('Collaboration session failed', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start collaboration session'
      });
    }
  }

  /**
   * Helper methods
   */
  
  private createDecomposition(problem: any, solutions: any[]) {
    const subProblems = solutions.flatMap((solution, idx) => 
      solution.steps.slice(0, 3).map((step: string, stepIdx: number) => ({
        id: `sub_${idx}_${stepIdx}`,
        description: step,
        complexity: Math.max(1, problem.complexity - 2),
        dependencies: stepIdx > 0 ? [`sub_${idx}_${stepIdx - 1}`] : [],
        priority: 1 - (stepIdx * 0.2)
      }))
    );
    
    const dependencies = subProblems.reduce((deps, sp) => {
      deps[sp.id] = sp.dependencies;
      return deps;
    }, {} as Record<string, string[]>);
    
    return {
      rootProblem: problem.description,
      subProblems,
      dependencies,
      totalComplexity: problem.complexity
    };
  }

  private extractDomain(challenge: string): string {
    const domains = ['technology', 'science', 'business', 'health', 'education'];
    const lower = challenge.toLowerCase();
    
    for (const domain of domains) {
      if (lower.includes(domain)) return domain;
    }
    
    return 'general';
  }

  private generateImplementationPlan(innovation: any) {
    return {
      phases: [
        { phase: 'validation', duration: '2 weeks', status: 'pending' },
        { phase: 'prototype', duration: '4 weeks', status: 'pending' },
        { phase: 'testing', duration: '3 weeks', status: 'pending' },
        { phase: 'deployment', duration: '2 weeks', status: 'pending' }
      ],
      resources: ['Development team', 'Testing infrastructure', 'Stakeholder buy-in'],
      risks: innovation.risks || ['Technical complexity', 'Resource availability']
    };
  }

  private generateReasoningSteps(premises: string[], conclusions: any[]) {
    return premises.map((premise, idx) => ({
      step: idx + 1,
      description: `Analyze premise: ${premise}`,
      rule: 'Logical inference',
      confidence: 0.8 + (idx * 0.05)
    }));
  }

  private calculateOverallConfidence(conclusions: any[]): number {
    if (conclusions.length === 0) return 0;
    const sum = conclusions.reduce((acc, c) => acc + c.confidence, 0);
    return sum / conclusions.length;
  }

  private calculateAverageScore(items: any[], field: string): number {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / items.length;
  }

  /**
   * Register all Edison routes
   */
  static registerRoutes(app: any, edisonAgent: EdisonAgent): void {
    const controller = new EdisonController(edisonAgent);
    
    // Status and monitoring
    app.get('/api/agents/edison/status', (req: Request, res: Response) => 
      controller.getStatus(req, res));
    
    // Problem solving
    app.post('/api/agents/edison/analyze', (req: Request, res: Response) => 
      controller.analyzeProblem(req, res));
    
    // Innovation
    app.post('/api/agents/edison/innovate', (req: Request, res: Response) => 
      controller.generateInnovations(req, res));
    
    // Reasoning
    app.post('/api/agents/edison/reason', (req: Request, res: Response) => 
      controller.performReasoning(req, res));
    
    // Research
    app.post('/api/agents/edison/research', (req: Request, res: Response) => 
      controller.conductResearch(req, res));
    app.get('/api/agents/edison/research', (req: Request, res: Response) => 
      controller.getResearch(req, res));
    
    // Solutions
    app.get('/api/agents/edison/solutions', (req: Request, res: Response) => 
      controller.getSolutions(req, res));
    
    // Metrics
    app.get('/api/agents/edison/metrics', (req: Request, res: Response) => 
      controller.getMetrics(req, res));
    
    // Collaboration
    app.post('/api/agents/edison/collaborate', (req: Request, res: Response) => 
      controller.startCollaboration(req, res));
    
    controller.logger.info('Edison routes registered', {
      routes: [
        'GET /api/agents/edison/status',
        'POST /api/agents/edison/analyze',
        'POST /api/agents/edison/innovate',
        'POST /api/agents/edison/reason',
        'POST /api/agents/edison/research',
        'GET /api/agents/edison/research',
        'GET /api/agents/edison/solutions',
        'GET /api/agents/edison/metrics',
        'POST /api/agents/edison/collaborate'
      ]
    });
  }
}