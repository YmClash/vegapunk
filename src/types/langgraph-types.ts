/**
 * LangGraph TypeScript Interfaces
 * Complete type definitions for LangGraph workflow orchestration system
 */

// Core workflow execution types
export interface WorkflowExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentNode?: string;
  executionTrace: ExecutionStep[];
  supervisor: SupervisorAgent;
  agents: string[];
  metadata: Record<string, any>;
  templateId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  creator: string;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: Record<string, any>;
  agent?: string;
  error?: string;
  retryCount?: number;
  performanceMetrics?: StepPerformanceMetrics;
}

export interface StepPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  ioOperations: number;
  networkCalls: number;
  executionTime: number;
}

// Workflow graph structure types
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowGraphMetadata;
  version: string;
  isValid: boolean;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'agent' | 'supervisor' | 'condition' | 'end' | 'parallel' | 'merge';
  agent?: string;
  position: { x: number; y: number };
  metadata: NodeMetadata;
  config?: NodeConfiguration;
}

export interface NodeMetadata {
  description?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  dependencies?: string[];
  resources?: ResourceRequirements;
}

export interface NodeConfiguration {
  parameters?: Record<string, any>;
  environment?: Record<string, string>;
  capabilities?: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  retryDelay: number;
}

export interface ResourceRequirements {
  cpu?: number;
  memory?: number;
  timeout?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  metadata: EdgeMetadata;
  weight?: number;
}

export interface EdgeMetadata {
  label?: string;
  conditionalLogic?: string;
  dataTransformation?: string;
}

export interface WorkflowGraphMetadata {
  version: string;
  created: string;
  lastModified: string;
  creator: string;
  description?: string;
  tags: string[];
}

// SupervisorAgent types
export interface SupervisorAgent {
  id: string;
  name: string;
  decisionsCount: number;
  successRate: number;
  averageDecisionTime: number;
  currentStrategy: string;
  capabilities: string[];
  version: string;
}

export interface SupervisorDecision {
  id: string;
  timestamp: string;
  workflowId: string;
  context: Record<string, any>;
  selectedAgent: string;
  reasoning: string;
  confidence: number;
  alternativesConsidered: AgentAlternative[];
  strategy: string;
  executionTime: number;
  outcome?: DecisionOutcome;
}

export interface AgentAlternative {
  agentId: string;
  score: number;
  reasoning: string;
  capabilities: string[];
}

export interface DecisionOutcome {
  success: boolean;
  executionTime: number;
  qualityScore: number;
  feedback?: string;
}

// DataFlow tracing types
export interface DataFlowTrace {
  id: string;
  workflowId: string;
  timestamp: string;
  nodeName: string;
  operation: string;
  dataSize: number;
  duration: number;
  isActive: boolean;
  dataPreview: Record<string, any>;
  performanceMetrics?: DataFlowPerformanceMetrics;
  dataTransformation?: DataTransformation;
  error?: string;
}

export interface DataFlowPerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  ioOperations: number;
  networkBandwidth: number;
  compressionRatio?: number;
}

export interface DataTransformation {
  inputSchema: string;
  outputSchema: string;
  transformationType: string;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

export interface DataFlowFilters {
  field?: string;
  operation?: string;
  timerange?: string;
  workflowId?: string;
  nodeId?: string;
  limit?: number;
  offset?: number;
}

export interface DataFlowMetrics {
  totalTraces: number;
  averageDataSize: number;
  averageDuration: number;
  throughputPerSecond: number;
  errorRate: number;
  compressionEfficiency: number;
}

// Agent handoff types
export interface AgentHandoff {
  id: string;
  timestamp: string;
  workflowId: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  confidence: number;
  duration: number;
  latency: number;
  success: boolean;
  contextTransferred: Record<string, any>;
  supervisorDecision?: SupervisorDecision;
  performanceImpact?: HandoffPerformanceImpact;
  contextSize: number;
}

export interface HandoffPerformanceImpact {
  executionTimeChange: number;
  resourceUtilization: number;
  qualityImprovement: number;
  costImpact: number;
}

export interface HandoffMetrics {
  totalHandoffs: number;
  successRate: number;
  averageLatency: number;
  averageConfidence?: number;
  topReasons?: HandoffReasonStats[];
  agentPerformance?: Record<string, AgentHandoffPerformance>;
  trends?: HandoffTrends;
}

export interface HandoffReasonStats {
  reason: string;
  count: number;
  successRate: number;
  averageLatency: number;
}

export interface AgentHandoffPerformance {
  handoffsFrom: number;
  handoffsTo: number;
  successRate: number;
  averageLatency: number;
  specializations: string[];
}

export interface HandoffTrends {
  hourly: number[];
  daily: number[];
  successRateTrend: number;
  latencyTrend: number;
}

// Workflow template types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'security-ethics' | 'data-analysis' | 'creative-problem' | 'system-maintenance' | 'custom';
  agents: string[];
  complexity: 'Simple' | 'Moderate' | 'Complex';
  estimatedDuration: number; // in minutes
  successRate: number; // 0-1
  avgExecutionTime: number; // in ms
  totalExecutions: number;
  lastUsed?: string;
  isPopular: boolean;
  isFeatured: boolean;
  tags: string[];
  author: string;
  version: string;
  requiresApproval: boolean;
  workflow: WorkflowGraph;
  metadata: TemplateMetadata;
  pricing?: TemplatePricing;
}

export interface TemplateMetadata {
  nodeCount: number;
  branchingFactor: number;
  parallelCapability: boolean;
  resourceIntensive: boolean;
  created: string;
  lastModified: string;
  rating?: number;
  reviews?: TemplateReview[];
}

export interface TemplateReview {
  userId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface TemplatePricing {
  cost: number;
  currency: string;
  billing: 'per-execution' | 'monthly' | 'yearly';
}

export interface TemplateMetrics {
  executionCount: number;
  successRate: number;
  averageDuration: number;
  resourceUsage: ResourceUsageMetrics;
  popularityScore: number;
  userSatisfaction: number;
}

export interface ResourceUsageMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateCount: number;
}

// Performance and analytics types
export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  successRate: number;
  averageExecutionTime: number;
  totalHandoffs: number;
  handoffSuccessRate: number;
  averageHandoffTime: number;
  supervisorEfficiency: number;
  dataFlowThroughput: number;
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  concurrent: number;
}

export interface SupervisorPerformance {
  totalDecisions: number;
  averageDecisionTime: number;
  successRate: number;
  confidenceScore: number;
  strategiesUsed: Record<string, number>;
  improvementRate: number;
  errorRate: number;
}

export interface DecisionAnalytics {
  decisionAccuracy: number;
  timeToDecision: number;
  contextUtilization: number;
  adaptabilityScore: number;
  consistencyScore: number;
}

export interface OptimizationSuggestion {
  type: 'performance' | 'cost' | 'reliability' | 'scalability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number;
  implementationCost: number;
  timeframe: string;
}

// System health and monitoring types
export interface LangGraphHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activeWorkflows: number;
  systemLoad: number;
  memoryUsage: number;
  uptime: number;
  lastCheck: string;
  issues?: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// WebSocket message types
export interface WebSocketMessage<T> {
  type: string;
  data: T;
  timestamp: string;
  channel: string;
  id?: string;
}

export interface WorkflowUpdateMessage extends WebSocketMessage<WorkflowExecution> {
  type: 'workflow_update' | 'workflow_started' | 'workflow_completed' | 'workflow_failed';
}

export interface DataFlowMessage extends WebSocketMessage<DataFlowTrace> {
  type: 'dataflow_trace' | 'dataflow_error';
}

export interface HandoffMessage extends WebSocketMessage<AgentHandoff> {
  type: 'agent_handoff' | 'handoff_failed';
}

export interface SupervisorMessage extends WebSocketMessage<SupervisorDecision> {
  type: 'supervisor_decision' | 'strategy_change';
}

// Event types for system events
export interface WorkflowEvent {
  type: 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'cancelled';
  workflowId: string;
  timestamp: string;
  data?: Record<string, any>;
  userId?: string;
}

export interface SystemEvent {
  type: 'system_health' | 'performance_alert' | 'resource_warning';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

// Export utility types
export type WorkflowStatus = WorkflowExecution['status'];
export type NodeType = WorkflowNode['type'];
export type TemplateCategory = WorkflowTemplate['category'];
export type ComplexityLevel = WorkflowTemplate['complexity'];