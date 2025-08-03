/**
 * LangGraph Integration Types
 * Types for Vegapunk Agent Graph workflows
 */

import { BaseMessage } from '@langchain/core/messages';
import { A2AMessage, A2AResponse, AgentCapability, TaskDefinition } from '../a2a/types';

// ================================
// Graph State Schema
// ================================

export interface VegapunkGraphState {
  // Message history for the conversation
  messages: BaseMessage[];
  
  // Current agent context
  currentAgent: string;
  availableAgents: string[];
  
  // A2A Protocol integration
  a2aMessages: A2AMessage[];
  agentCapabilities: Map<string, AgentCapability[]>;
  
  // Task and workflow context
  currentTask?: TaskDefinition;
  taskResults: Map<string, any>;
  
  // User context
  userId?: string;
  sessionId: string;
  
  // Workflow control
  needsHumanInput: boolean;
  workflowStatus: 'running' | 'waiting' | 'completed' | 'error';
  nextAgent?: string;
  
  // Metadata
  metadata: {
    timestamp: Date;
    totalSteps: number;
    currentStep: number;
    processingTime?: number;
  };
}

// ================================
// Node Types
// ================================

export interface AgentNode {
  id: string;
  name: string;
  type: AgentNodeType;
  agentId: string;
  capabilities: string[];
  isOnline: boolean;
  config?: AgentNodeConfig;
}

export enum AgentNodeType {
  TECHNICAL = 'technical',     // Vegapunk - Technical support
  ETHICAL = 'ethical',         // Shaka - Ethical analysis
  SECURITY = 'security',       // Atlas - Security analysis
  CREATIVE = 'creative',       // Edison - Innovation & creativity
  COORDINATOR = 'coordinator', // Workflow coordinator
  HUMAN = 'human'              // Human input required
}

export interface AgentNodeConfig {
  maxRetries?: number;
  timeout?: number;
  fallbackAgent?: string;
  requiresConfirmation?: boolean;
  priority?: number;
}

// ================================
// Workflow Types
// ================================

export interface WorkflowStep {
  id: string;
  name: string;
  nodeType: AgentNodeType;
  targetAgent: string;
  condition?: (state: VegapunkGraphState) => boolean;
  parameters?: Record<string, any>;
  onSuccess?: string; // Next step ID
  onError?: string;   // Error handler step ID
}

export interface VegapunkWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  entryPoint: string;
  errorHandler?: string;
  timeout?: number;
}

// ================================
// Agent Response Types
// ================================

export interface AgentResponse {
  agentId: string;
  success: boolean;
  data?: any;
  error?: string;
  nextAgent?: string;
  requiresHumanInput?: boolean;
  metadata?: {
    processingTime: number;
    capability: string;
    confidence?: number;
  };
}

export interface WorkflowDecision {
  nextNode: string;
  reason: string;
  confidence: number;
  parameters?: Record<string, any>;
}

// ================================
// LangGraph Integration
// ================================

export interface GraphNodeFunction {
  (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>>;
}

export interface GraphEdgeCondition {
  (state: VegapunkGraphState): string;
}

export interface GraphConfig {
  maxIterations: number;
  enableA2AIntegration: boolean;
  enableMCPTools: boolean;
  debugMode: boolean;
  timeout: number;
}

// ================================
// Handoff Types
// ================================

export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  reason: string;
  context: any;
  timestamp: Date;
  metadata?: {
    capability: string;
    priority: number;
    expectedDuration?: number;
  };
}

export interface HandoffDecision {
  shouldHandoff: boolean;
  targetAgent?: string;
  reason: string;
  confidence: number;
  context?: any;
}

// ================================
// Supervisor Types
// ================================

export interface SupervisorDecision {
  selectedAgent: string;
  reasoning: string;
  confidence: number;
  fallbackAgent?: string;
  estimatedDuration?: number;
}

export interface AgentCapabilityScore {
  agentId: string;
  capability: string;
  score: number;
  availability: boolean;
  load: number;
  reasoning: string;
}

// ================================
// Error Handling
// ================================

export interface GraphError {
  code: string;
  message: string;
  agentId?: string;
  step?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'abort' | 'human_intervention';
  targetAgent?: string;
  parameters?: Record<string, any>;
  maxAttempts?: number;
}

// ================================
// Metrics and Monitoring
// ================================

export interface GraphMetrics {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  totalSteps: number;
  completedSteps: number;
  errors: GraphError[];
  handoffs: AgentHandoff[];
  performance: {
    averageStepTime: number;
    totalProcessingTime: number;
    agentUtilization: Map<string, number>;
  };
}

export interface NodeMetrics {
  nodeId: string;
  agentId: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution?: Date;
  errors: string[];
}

// ================================
// Tool Integration Types
// ================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (params: any) => Promise<any>;
  requiredCapabilities?: string[];
  cost?: number;
}

export interface A2AToolCall {
  capability: string;
  parameters: any;
  targetAgent?: string;
  priority?: number;
  timeout?: number;
}

// ================================
// Human Interaction Types
// ================================

export interface HumanInteraction {
  id: string;
  type: 'confirmation' | 'input' | 'choice' | 'approval';
  prompt: string;
  options?: string[];
  required: boolean;
  timeout?: number;
  context?: any;
}

export interface HumanResponse {
  interactionId: string;
  response: any;
  timestamp: Date;
  confidence?: number;
}

// ================================
// Event Types
// ================================

export interface GraphEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
  workflowId?: string;
}

export interface GraphEventHandlers {
  'workflow.started': (workflowId: string, state: VegapunkGraphState) => void;
  'workflow.completed': (workflowId: string, result: any) => void;
  'workflow.error': (workflowId: string, error: GraphError) => void;
  'agent.handoff': (handoff: AgentHandoff) => void;
  'node.executed': (nodeId: string, metrics: NodeMetrics) => void;
  'human.input.required': (interaction: HumanInteraction) => void;
  'tool.called': (tool: string, parameters: any, result: any) => void;
}