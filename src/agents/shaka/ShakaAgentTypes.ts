// Local type definitions for Shaka A2A integration
// Avoids dependency on @anthropic/a2a-js-sdk

export interface EthicalAnalysisResult {
  overallScore: number;
  concerns: string[];
  frameworkResults: {
    [framework: string]: {
      score: number;
      findings: string[];
      recommendations: string[];
    };
  };
  conclusion: string;
  ethicalRisks: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
}

export interface ConflictAnalysis {
  type: 'principle' | 'stakeholder' | 'cultural' | 'temporal';
  description: string;
  affectedParties: string[];
  ethicalPrinciples: string[];
  severity: number;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
}

export interface ResolutionOption {
  id: string;
  approach: string;
  description: string;
  ethicalScore: number;
  fairnessScore: number;
  harmMinimization: number;
  tradeoffs: string[];
  implementation: string[];
  consensusProbability: number;
}

export interface EthicalAssessment {
  approved: boolean;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'unacceptable';
  flags: string[];
  recommendations: string[];
  constraints: string[];
  requiresMonitoring: boolean;
  requiresSecurityReview: boolean;
  securityConsultation?: any;
}

export interface ShakaTask {
  id: string;
  skill: string;
  input: any;
  context?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
}

export interface InMemoryTaskStore {
  tasks: Map<string, ShakaTask>;
  
  addTask(task: ShakaTask): void;
  getTask(id: string): ShakaTask | undefined;
  updateTask(id: string, updates: Partial<ShakaTask>): void;
  getAllTasks(): ShakaTask[];
}

export class InMemoryTaskStore implements InMemoryTaskStore {
  tasks: Map<string, ShakaTask> = new Map();

  addTask(task: ShakaTask): void {
    this.tasks.set(task.id, task);
  }

  getTask(id: string): ShakaTask | undefined {
    return this.tasks.get(id);
  }

  updateTask(id: string, updates: Partial<ShakaTask>): void {
    const task = this.tasks.get(id);
    if (task) {
      this.tasks.set(id, { ...task, ...updates });
    }
  }

  getAllTasks(): ShakaTask[] {
    return Array.from(this.tasks.values());
  }
}

export interface EthicalFramework {
  name: string;
  description: string;
  principles: string[];
  evaluate: (content: any, context?: any) => Promise<{
    score: number;
    findings: string[];
    recommendations: string[];
  }>;
}

export interface EthicalMonitoringConfig {
  scope: string[];
  sensitivity: 'low' | 'medium' | 'high' | 'maximum';
  alertThreshold: number;
  reportingFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  alertChannels: string[];
}

export interface EthicalIncident {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  affectedAgents: string[];
  resolution?: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
}