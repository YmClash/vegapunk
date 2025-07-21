/**
 * MCP (Model Context Protocol) Types & Interfaces
 * Standardized interfaces for external tool and resource access
 */

// ================================
// Core MCP Protocol Types
// ================================

export interface MCPServer {
  name: string;
  version: string;
  description: string;
  capabilities: MCPCapabilities;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPCapabilities {
  tools?: MCPToolCapabilities;
  resources?: MCPResourceCapabilities;
  prompts?: MCPPromptCapabilities;
  sampling?: MCPSamplingCapabilities;
}

export interface MCPToolCapabilities {
  listChanged?: boolean;
}

export interface MCPResourceCapabilities {
  subscribe?: boolean;
  listChanged?: boolean;
}

export interface MCPPromptCapabilities {
  listChanged?: boolean;
}

export interface MCPSamplingCapabilities {
  // Sampling capabilities if needed
}

// ================================
// Tool Types
// ================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  metadata?: MCPToolMetadata;
}

export interface MCPToolMetadata {
  category?: string;
  tags?: string[];
  cost?: number;
  latency?: number;
  reliability?: number;
  requiredCapabilities?: string[];
  version?: string;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
  metadata?: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    cost?: number;
  };
}

// ================================
// Resource Types
// ================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  metadata?: MCPResourceMetadata;
}

export interface MCPResourceMetadata {
  size?: number;
  lastModified?: Date;
  version?: string;
  tags?: string[];
  permissions?: string[];
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  content: MCPContent[];
  metadata?: MCPResourceMetadata;
}

// ================================
// Content Types
// ================================

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string; // Base64 encoded for binary data
  resource?: {
    uri: string;
    mimeType?: string;
  };
  annotations?: MCPAnnotation;
}

export interface MCPAnnotation {
  audience?: 'human' | 'assistant';
  priority?: number;
  confidence?: number;
}

// ================================
// Prompt Types
// ================================

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

// ================================
// JSON Schema Types
// ================================

export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: any[];
  const?: any;
  description?: string;
  examples?: any[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  not?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
}

// ================================
// Vegapunk-Specific MCP Types
// ================================

export interface VegapunkMCPTool extends MCPTool {
  agentId?: string;
  capability?: string;
  a2aIntegration?: boolean;
  langGraphCompatible?: boolean;
}

export interface VegapunkMCPResource extends MCPResource {
  agentId?: string;
  accessLevel?: 'public' | 'internal' | 'restricted';
  capabilities?: string[];
}

// ================================
// Agent Integration Types
// ================================

export interface MCPAgentContext {
  agentId: string;
  sessionId: string;
  userId?: string;
  capabilities: string[];
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface MCPExecutionContext {
  tool: MCPTool;
  arguments: Record<string, any>;
  agent: MCPAgentContext;
  timestamp: Date;
  requestId: string;
}

// ================================
// Tool Categories for Vegapunk
// ================================

export enum VegapunkToolCategory {
  ETHICAL_ANALYSIS = 'ethical-analysis',
  TECHNICAL_SUPPORT = 'technical-support',
  SECURITY_ANALYSIS = 'security-analysis',
  CREATIVE_SOLUTIONS = 'creative-solutions',
  SYSTEM_MONITORING = 'system-monitoring',
  COMMUNICATION = 'communication',
  DATA_ACCESS = 'data-access',
  WORKFLOW_MANAGEMENT = 'workflow-management'
}

// ================================
// MCP Server Configuration
// ================================

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  port?: number;
  host?: string;
  enableA2AIntegration: boolean;
  enableLangGraphIntegration: boolean;
  security: {
    enableAuthentication: boolean;
    allowedOrigins?: string[];
    rateLimiting?: {
      windowMs: number;
      maxRequests: number;
    };
  };
  tools: {
    enabledCategories: VegapunkToolCategory[];
    customTools?: VegapunkMCPTool[];
  };
  resources: {
    enabledResources: string[];
    customResources?: VegapunkMCPResource[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRequestLogging: boolean;
  };
}

// ================================
// Tool Execution Types
// ================================

export interface ToolExecutor {
  execute(context: MCPExecutionContext): Promise<MCPToolResult>;
  validate(arguments: Record<string, any>): boolean;
  getSchema(): JSONSchema;
}

export interface ResourceProvider {
  getResource(uri: string, context: MCPAgentContext): Promise<MCPResourceContent>;
  listResources(context: MCPAgentContext): Promise<MCPResource[]>;
  validateAccess(uri: string, context: MCPAgentContext): boolean;
}

// ================================
// MCP Events
// ================================

export interface MCPEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface MCPEventHandlers {
  'tool.called': (tool: string, context: MCPExecutionContext, result: MCPToolResult) => void;
  'tool.error': (tool: string, context: MCPExecutionContext, error: Error) => void;
  'resource.accessed': (uri: string, context: MCPAgentContext) => void;
  'resource.error': (uri: string, context: MCPAgentContext, error: Error) => void;
  'server.started': (config: MCPServerConfig) => void;
  'server.stopped': () => void;
  'client.connected': (clientId: string) => void;
  'client.disconnected': (clientId: string) => void;
}

// ================================
// Error Types
// ================================

export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPToolError extends MCPError {
  constructor(
    toolName: string,
    message: string,
    public executionContext?: MCPExecutionContext
  ) {
    super(`Tool '${toolName}' error: ${message}`, 'TOOL_ERROR');
  }
}

export class MCPResourceError extends MCPError {
  constructor(
    uri: string,
    message: string,
    public context?: MCPAgentContext
  ) {
    super(`Resource '${uri}' error: ${message}`, 'RESOURCE_ERROR');
  }
}

export class MCPValidationError extends MCPError {
  constructor(
    field: string,
    message: string,
    public value?: any
  ) {
    super(`Validation error for '${field}': ${message}`, 'VALIDATION_ERROR');
  }
}

// ================================
// Metrics and Monitoring
// ================================

export interface MCPMetrics {
  server: {
    uptime: number;
    totalRequests: number;
    totalErrors: number;
    activeConnections: number;
  };
  tools: {
    totalCalls: number;
    callsByTool: Map<string, number>;
    errorsByTool: Map<string, number>;
    averageExecutionTime: Map<string, number>;
  };
  resources: {
    totalAccesses: number;
    accessesByResource: Map<string, number>;
    errorsByResource: Map<string, number>;
  };
  agents: {
    activeAgents: number;
    requestsByAgent: Map<string, number>;
    sessionDuration: Map<string, number>;
  };
}

export interface MCPHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    server: boolean;
    tools: boolean;
    resources: boolean;
    a2aIntegration?: boolean;
    langGraphIntegration?: boolean;
  };
  metrics: MCPMetrics;
  errors?: string[];
}