/**
 * Edison Agent Type Definitions
 * Types for A2A protocol integration and Edison-specific functionality
 */

import type { Request, Response, NextFunction } from 'express';

// A2A Protocol Types (local definitions to avoid module dependency)
export interface AgentTask {
  id: string;
  skill: string;
  input: any;
  context?: any;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  data: any;
  error?: string;
  artifacts?: Array<{
    type: string;
    data: any;
  }>;
  metadata?: Record<string, any>;
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    tools: string[];
  };
  schemes: Array<{
    type: string;
    description: string;
    requiredParams: string[];
    optionalParams?: string[];
  }>;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    inputSchema: any;
    outputSchema?: any;
  }>;
  artifacts?: Array<{
    type: string;
    description: string;
    mimeType: string;
  }>;
  metadata?: Record<string, any>;
}

export interface AgentExecutor {
  executeTask(task: AgentTask): Promise<AgentResponse>;
}

// Task Store Interface
export interface TaskStore {
  create(task: any): Promise<string>;
  get(taskId: string): Promise<any>;
  update(taskId: string, update: any): Promise<void>;
  list(filter?: any): Promise<any[]>;
}

// In-Memory Task Store Implementation
export class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, any> = new Map();

  async create(task: any): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tasks.set(taskId, { ...task, id: taskId, createdAt: new Date() });
    return taskId;
  }

  async get(taskId: string): Promise<any> {
    return this.tasks.get(taskId);
  }

  async update(taskId: string, update: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, { ...task, ...update, updatedAt: new Date() });
    }
  }

  async list(filter?: any): Promise<any[]> {
    const allTasks = Array.from(this.tasks.values());
    if (!filter) return allTasks;
    
    // Simple filtering implementation
    return allTasks.filter(task => {
      for (const [key, value] of Object.entries(filter)) {
        if (task[key] !== value) return false;
      }
      return true;
    });
  }
}

// A2A Express App Interface
export interface A2AExpressApp {
  app: any; // Express app
  taskStore: TaskStore;
  agentCard: AgentCard;
  executor: AgentExecutor;
  start(port: number): Promise<void>;
}

// Edison-specific types
export interface EdisonStatus {
  status: 'active' | 'busy' | 'idle' | 'error';
  problemsSolved: number;
  innovationScore: number;
  currentStage?: string;
  currentReasoning?: string;
  reasoningType?: string;
  lastActivity?: Date;
  activeProblems: number;
  pendingSolutions: number;
}

export interface ProblemDecomposition {
  rootProblem: string;
  subProblems: Array<{
    id: string;
    description: string;
    complexity: number;
    dependencies: string[];
    priority: number;
  }>;
  dependencies: Record<string, string[]>;
  totalComplexity: number;
}

export interface InnovationMetrics {
  totalInnovations: number;
  averageNoveltyScore: number;
  averageFeasibilityScore: number;
  averageImpactScore: number;
  breakthroughCount: number;
  implementedCount: number;
  successRate: number;
  timeRange: string;
}

export interface ReasoningProcess {
  type: 'deductive' | 'inductive' | 'abductive';
  premises: string[];
  steps: Array<{
    step: number;
    description: string;
    rule: string;
    confidence: number;
  }>;
  conclusions: Array<{
    statement: string;
    confidence: number;
    validity: 'valid' | 'invalid' | 'uncertain';
  }>;
  confidence: number;
  diagram?: string;
}

export interface SolutionComparison {
  criteria: string[];
  solutions: Array<{
    id: string;
    scores: Record<string, number>;
    overallScore: number;
  }>;
  recommendation: string;
}

// API Request/Response Types
export interface AnalyzeProblemRequest {
  problem: string;
  constraints?: string[];
  objectives?: string[];
  complexity?: number;
  decompositionDepth?: number;
}

export interface AnalyzeProblemResponse {
  success: boolean;
  analysis: ProblemDecomposition;
  subProblems: any[];
  complexity: number;
  error?: string;
}

export interface GenerateInnovationsRequest {
  challenge: string;
  techniques?: string[];
  criteria?: {
    minNovelty?: number;
    minFeasibility?: number;
    maxRisk?: number;
  };
  count?: number;
}

export interface GenerateInnovationsResponse {
  success: boolean;
  solutions: any[];
  metadata: {
    techniquesUsed: string[];
    totalGenerated: number;
    topRated: any;
  };
  error?: string;
}

export interface PerformReasoningRequest {
  premises: string[];
  type: 'deductive' | 'inductive' | 'abductive';
  goal?: string;
  checkConsistency?: boolean;
  detectFallacies?: boolean;
}

export interface PerformReasoningResponse {
  success: boolean;
  reasoning: ReasoningProcess;
  conclusions: any[];
  confidence: number;
  error?: string;
}

export interface ResearchRequest {
  topic: string;
  scope: 'narrow' | 'moderate' | 'broad';
  depth: 'shallow' | 'moderate' | 'deep';
  sources?: string[];
}

export interface ResearchResponse {
  success: boolean;
  findings: any[];
  gaps: string[];
  hypotheses: string[];
  confidence: number;
  error?: string;
}

// WebSocket Event Types
export interface EdisonWebSocketEvents {
  'edison:status': EdisonStatus;
  'edison:problem:new': {
    problemId: string;
    description: string;
    complexity: number;
  };
  'edison:solution:generated': {
    solutionId: string;
    problemId: string;
    title: string;
    score: number;
  };
  'edison:innovation:breakthrough': {
    innovationId: string;
    title: string;
    impact: string;
  };
  'edison:reasoning:complete': {
    reasoningId: string;
    type: string;
    conclusionCount: number;
  };
  'edison:collaboration:request': {
    fromAgent: string;
    type: string;
    payload: any;
  };
}

// Controller Types
export interface EdisonController {
  getStatus(req: Request, res: Response): Promise<void>;
  analyzeProblem(req: Request, res: Response): Promise<void>;
  generateInnovations(req: Request, res: Response): Promise<void>;
  performReasoning(req: Request, res: Response): Promise<void>;
  conductResearch(req: Request, res: Response): Promise<void>;
  getSolutions(req: Request, res: Response): Promise<void>;
  getMetrics(req: Request, res: Response): Promise<void>;
}

// Frontend Component Props
export interface EdisonMonitorProps {
  onProblemSelect?: (problemId: string) => void;
  onSolutionSelect?: (solutionId: string) => void;
}

export interface ProblemAnalysisPanelProps {
  onAnalysisComplete?: (decomposition: ProblemDecomposition) => void;
}

export interface SolutionExplorerProps {
  problemId?: string;
  onImplement?: (solutionId: string) => void;
}

export interface LogicReasoningViewProps {
  onReasoningComplete?: (process: ReasoningProcess) => void;
}

// Collaboration Types
export interface EdisonShakaCollaboration {
  requestId: string;
  type: 'innovation_ethics' | 'solution_validation';
  innovation?: any;
  solution?: any;
  ethicalConcerns?: string[];
  recommendations?: string[];
}

export interface EdisonAtlasCollaboration {
  requestId: string;
  type: 'security_check' | 'implementation_safety';
  solution?: any;
  securityRisks?: string[];
  mitigations?: string[];
}

// Export utility function for creating A2A Express app
export function createA2AExpressApp(
  agentCard: AgentCard,
  executor: AgentExecutor,
  taskStore: TaskStore = new InMemoryTaskStore()
): A2AExpressApp {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // A2A discovery endpoint
  app.get('/.well-known/a2a/agent', (req: Request, res: Response) => {
    res.json(agentCard);
  });
  
  // Task execution endpoint
  app.post('/tasks', async (req: Request, res: Response) => {
    try {
      const task = req.body;
      const taskId = await taskStore.create(task);
      
      // Execute task asynchronously
      executor.executeTask({ ...task, id: taskId }).then(
        async (result) => {
          await taskStore.update(taskId, { status: 'completed', result });
        },
        async (error) => {
          await taskStore.update(taskId, { status: 'failed', error: error.message });
        }
      );
      
      res.status(202).json({ taskId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  });
  
  // Task status endpoint
  app.get('/tasks/:taskId', async (req: Request, res: Response) => {
    try {
      const task = await taskStore.get(req.params.taskId);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json(task);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  });
  
  return {
    app,
    taskStore,
    agentCard,
    executor,
    start: async (port: number) => {
      return new Promise((resolve) => {
        app.listen(port, () => {
          console.log(`A2A Agent listening on port ${port}`);
          resolve();
        });
      });
    }
  };
}