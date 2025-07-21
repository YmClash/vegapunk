/**
 * A2A Protocol Types & Interfaces
 * Agent-to-Agent Communication Protocol Core Types
 */

import { EventEmitter } from 'events';

// ================================
// Core A2A Message Protocol
// ================================

export interface A2AMessage {
  id: string;
  from: string; // Source agent ID
  to: string; // Target agent ID or 'broadcast'
  type: A2AMessageType;
  payload: any;
  timestamp: Date;
  priority: A2APriority;
  correlationId?: string; // For workflow tracing
  ttl?: number; // Time to live in milliseconds
  metadata?: Record<string, any>;
}

export enum A2AMessageType {
  // Discovery & Registration
  AGENT_ANNOUNCE = 'agent_announce',
  AGENT_QUERY = 'agent_query',
  CAPABILITY_REQUEST = 'capability_request',
  CAPABILITY_RESPONSE = 'capability_response',
  
  // Task Coordination
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  TASK_DELEGATE = 'task_delegate',
  TASK_STATUS = 'task_status',
  TASK_CANCEL = 'task_cancel',
  
  // Workflow Management
  WORKFLOW_START = 'workflow_start',
  WORKFLOW_STEP = 'workflow_step',
  WORKFLOW_COMPLETE = 'workflow_complete',
  WORKFLOW_ERROR = 'workflow_error',
  
  // Health & Monitoring
  HEALTH_CHECK = 'health_check',
  HEALTH_RESPONSE = 'health_response',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report',
  
  // System Events
  AGENT_ONLINE = 'agent_online',
  AGENT_OFFLINE = 'agent_offline',
  NETWORK_BROADCAST = 'network_broadcast'
}

export type A2APriority = 'low' | 'normal' | 'high' | 'urgent';

export interface A2AResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime?: number;
    agentId?: string;
    capability?: string;
    timestamp?: Date;
  };
}

// ================================
// Agent Capabilities & Discovery
// ================================

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  inputs: ParameterSchema[];
  outputs: ParameterSchema[];
  cost: number; // Computational cost (1-100)
  reliability: number; // Reliability score (0-1)
  version: string;
  tags?: string[];
}

export enum CapabilityCategory {
  ANALYSIS = 'analysis',
  ACTION = 'action',
  MONITORING = 'monitoring',
  CREATIVE = 'creative',
  COORDINATION = 'coordination',
  SECURITY = 'security',
  COMMUNICATION = 'communication'
}

export interface ParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface AgentProfile {
  agentId: string;
  agentType: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  metadata: AgentMetadata;
  lastSeen: Date;
  networkAddress?: string;
}

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface AgentMetadata {
  version: string;
  location: string; // URL or identifier
  load: number; // Current load 0-100
  uptime: number; // Uptime in milliseconds
  capabilities_count: number;
  performance_metrics?: {
    avg_response_time: number;
    success_rate: number;
    total_requests: number;
  };
}

// ================================
// Task & Workflow Types
// ================================

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  requiredCapability: string;
  parameters: Record<string, any>;
  priority: A2APriority;
  timeout?: number;
  retries?: number;
  dependencies?: string[]; // Other task IDs
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executedBy: string;
  executionTime: number;
  timestamp: Date;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  timeout?: number;
  onError?: 'abort' | 'continue' | 'retry';
}

export interface WorkflowStep {
  id: string;
  name: string;
  capability: string;
  parameters: Record<string, any>;
  condition?: string; // Conditional execution
  parallel?: boolean; // Execute in parallel with next step
  onSuccess?: WorkflowAction[];
  onError?: WorkflowAction[];
}

export interface WorkflowAction {
  type: 'goto' | 'abort' | 'retry' | 'notify';
  target?: string; // Step ID or agent ID
  parameters?: Record<string, any>;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: WorkflowStatus;
  currentStep?: string;
  startTime: Date;
  endTime?: Date;
  results: Map<string, TaskResult>;
  error?: string;
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ================================
// Capability Query & Discovery
// ================================

export interface CapabilityQuery {
  query: string; // Natural language or capability name
  requester: string; // Agent ID making the request
  filters?: {
    category?: CapabilityCategory;
    tags?: string[];
    minReliability?: number;
    maxCost?: number;
    availability?: boolean;
  };
  limit?: number;
}

export interface CapabilityMatch {
  agent: AgentProfile;
  capability: AgentCapability;
  score: number; // Match confidence (0-1)
  reason: string; // Why this capability matches
}

// ================================
// Network & Health Monitoring
// ================================

export interface NetworkTopology {
  agents: Map<string, AgentProfile>;
  connections: Map<string, string[]>; // Agent ID -> Connected agent IDs
  messageRoutes: Map<string, Route[]>; // Capability -> Available routes
  lastUpdated: Date;
}

export interface Route {
  agentId: string;
  capability: string;
  cost: number;
  reliability: number;
  responseTime: number;
  load: number;
}

export interface HealthMetrics {
  agentId: string;
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  response_time: number;
  success_rate: number;
  active_tasks: number;
  queue_length: number;
  last_error?: string;
}

// ================================
// A2A Protocol Events
// ================================

export interface A2AEventPayload {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface A2AProtocolEvents {
  'agent.registered': (agent: AgentProfile) => void;
  'agent.unregistered': (agentId: string) => void;
  'agent.status.changed': (agentId: string, status: AgentStatus) => void;
  'message.sent': (message: A2AMessage) => void;
  'message.received': (message: A2AMessage) => void;
  'message.failed': (message: A2AMessage, error: string) => void;
  'workflow.started': (execution: WorkflowExecution) => void;
  'workflow.completed': (execution: WorkflowExecution) => void;
  'workflow.failed': (execution: WorkflowExecution, error: string) => void;
  'network.topology.changed': (topology: NetworkTopology) => void;
  'capability.discovered': (matches: CapabilityMatch[]) => void;
}

// ================================
// A2A Configuration
// ================================

export interface A2AConfig {
  networkName: string;
  broadcastInterval: number; // Health broadcast interval in ms
  messageTimeout: number; // Default message timeout in ms
  maxRetries: number;
  enableHealthMonitoring: boolean;
  enableWorkflowEngine: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performance: {
    maxConcurrentTasks: number;
    queueSize: number;
    routingAlgorithm: 'round-robin' | 'least-loaded' | 'best-match';
  };
}

// ================================
// Error Types
// ================================

export class A2AError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string,
    public messageId?: string
  ) {
    super(message);
    this.name = 'A2AError';
  }
}

export class AgentNotFoundError extends A2AError {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`, 'AGENT_NOT_FOUND', agentId);
  }
}

export class CapabilityNotFoundError extends A2AError {
  constructor(capability: string) {
    super(`Capability not found: ${capability}`, 'CAPABILITY_NOT_FOUND');
  }
}

export class WorkflowExecutionError extends A2AError {
  constructor(workflowId: string, error: string) {
    super(`Workflow execution failed: ${error}`, 'WORKFLOW_FAILED');
  }
}