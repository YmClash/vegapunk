/**
 * Base types and interfaces for the Vegapunk Agentic System
 * Following Anthropic's principle: Start simple, add complexity only when needed
 */

// Note: zod import commented out to avoid dependency issues
// import type { z } from 'zod';

// Simple type alias for schema validation
export type ValidationSchema<T = unknown> = {
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => { success: boolean; data?: T; error?: Error };
};

/**
 * Agent Status - Simple state machine
 */
export type AgentStatus = 'idle' | 'thinking' | 'acting' | 'error';

/**
 * Goal Types - Following hierarchical planning pattern
 */
export type GoalType = 'immediate' | 'short-term' | 'long-term';
export type GoalStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

/**
 * Memory Types - Different memory storage strategies
 */
export type MemoryType = 'episodic' | 'semantic' | 'procedural';

/**
 * Basic Goal structure
 */
export interface Goal {
  id: string;
  type: GoalType;
  priority: number; // 0-10, higher is more important
  description: string;
  status: GoalStatus;
  createdAt: Date;
  deadline?: Date;
  dependencies?: string[]; // IDs of other goals
}

/**
 * Memory item structure
 */
export interface Memory {
  id: string;
  type: MemoryType;
  content: unknown;
  importance: number; // 0-1, higher is more important
  timestamp: Date;
  retrievalCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Agent Context - Current state and environment
 */
export interface AgentContext {
  currentTask?: string;
  environmentState: Record<string, unknown>;
  collaboratingAgents: string[];
  availableResources: string[];
  timestamp: Date;
}

/**
 * Agent State - Complete state representation
 */
export interface AgentState {
  id: string;
  name: string;
  specialty: string;
  status: AgentStatus;
  currentGoals: Goal[];
  activeMemories: Memory[];
  currentContext: AgentContext;
  lastActivity: Date;
  errorCount: number;
}

/**
 * Tool Definition - Clear interface as recommended by Anthropic
 */
export interface AgentTool<TParams = unknown, TResult = unknown> {
  name: string;
  description: string;
  parameters: ValidationSchema<TParams>;
  execute: (params: TParams) => Promise<ToolResult<TResult>>;
  timeout?: number; // milliseconds
}

/**
 * Tool Execution Result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number; // milliseconds
  timestamp: Date;
}

/**
 * Agent Capabilities - What an agent can do
 */
export interface AgentCapabilities {
  canPlan: boolean;
  canLearn: boolean;
  canCommunicate: boolean;
  canMakeDecisions: boolean;
  maxConcurrentTasks: number;
  supportedTools: string[]; // tool names
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  tasksCompleted: number;
  tasksAttempted: number;
  successRate: number;
  averageResponseTime: number; // milliseconds
  uptime: number; // milliseconds
  lastError?: Date;
}

/**
 * Agent Message - For inter-agent communication
 */
export interface AgentMessage {
  id: string;
  from: string; // agent ID
  to: string | string[]; // agent ID(s) or 'broadcast'
  type: 'request' | 'response' | 'notification' | 'error';
  content: unknown;
  timestamp: Date;
  replyTo?: string; // message ID if this is a response
}

/**
 * Decision Option - For decision making
 */
export interface DecisionOption {
  id: string;
  description: string;
  expectedBenefit: number; // 0-1
  risk: number; // 0-1
  feasibility: number; // 0-1
  estimatedDuration?: number; // milliseconds
}

/**
 * Decision Result
 */
export interface DecisionResult {
  selectedOption: DecisionOption;
  confidence: number; // 0-1
  reasoning: string;
  alternatives: DecisionOption[];
  timestamp: Date;
}

/**
 * Plan Step - For planning engine
 */
export interface PlanStep {
  id: string;
  action: string;
  description: string;
  prerequisites?: string[]; // step IDs
  estimatedDuration?: number; // milliseconds
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

/**
 * Execution Plan
 */
export interface ExecutionPlan {
  id: string;
  goal: Goal;
  steps: PlanStep[];
  estimatedTotalDuration?: number; // milliseconds
  createdAt: Date;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  specialty: string;
  llmProvider: 'openai' | 'mistral' | 'local' | 'ollama';
  llmModel: string;
  temperature?: number;
  maxTokens?: number;
  cycleInterval: number; // milliseconds
  maxIterations?: number;
  timeout?: number; // milliseconds
}

/**
 * Guardrails - Safety constraints as recommended by Anthropic
 */
export interface AgentGuardrails {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  maxConcurrentOperations: number;
  allowedTools: string[];
  ethicalConstraints: string[];
  errorTolerance?: number; // 0-1, how many errors are acceptable
}

/**
 * Memory Query - For memory retrieval
 */
export interface MemoryQuery {
  type?: MemoryType;
  timeRange?: {
    start: Date;
    end: Date;
  };
  importance?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  searchTerm?: string;
}