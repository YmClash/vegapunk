/**
 * Vegapunk MCP Server - Model Context Protocol Server
 * Exposes Vegapunk agent capabilities as standardized MCP tools and resources
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import {
  MCPServer,
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPToolCall,
  MCPToolResult,
  MCPResourceContent,
  MCPAgentContext,
  MCPExecutionContext,
  MCPMetrics,
  MCPHealthCheck,
  ToolExecutor,
  ResourceProvider,
  MCPError as VegapunkMCPError
} from './types';

import { EthicalAnalysisTool } from './tools/EthicalAnalysisTool';
import { TechnicalSupportTool } from './tools/TechnicalSupportTool';
import { A2AProtocol } from '../a2a/A2AProtocol';
import { EventEmitter } from 'events';

export class VegapunkMCPServer extends EventEmitter implements MCPServer {
  name = 'vegapunk-mcp-server';
  version = '1.0.0';
  description = 'Vegapunk Agent Ecosystem MCP Server - Exposes multi-agent capabilities through standardized protocol';
  
  private server: Server;
  private config: MCPServerConfig;
  private toolExecutors = new Map<string, ToolExecutor>();
  private resourceProviders = new Map<string, ResourceProvider>();
  private a2aProtocol?: A2AProtocol;
  private metrics: MCPMetrics;
  private isRunning = false;
  private startTime: Date;

  capabilities = {
    tools: {
      listChanged: true
    },
    resources: {
      subscribe: false,
      listChanged: true
    }
  };

  tools: MCPTool[] = [];
  resources: MCPResource[] = [];

  constructor(config: MCPServerConfig, a2aProtocol?: A2AProtocol) {
    super();
    
    this.config = config;
    this.a2aProtocol = a2aProtocol;
    this.startTime = new Date();
    
    // Initialize metrics
    this.metrics = {
      server: {
        uptime: 0,
        totalRequests: 0,
        totalErrors: 0,
        activeConnections: 0
      },
      tools: {
        totalCalls: 0,
        callsByTool: new Map(),
        errorsByTool: new Map(),
        averageExecutionTime: new Map()
      },
      resources: {
        totalAccesses: 0,
        accessesByResource: new Map(),
        errorsByResource: new Map()
      },
      agents: {
        activeAgents: 0,
        requestsByAgent: new Map(),
        sessionDuration: new Map()
      }
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.name,
        version: this.version,
        description: this.description
      },
      {
        capabilities: this.capabilities
      }
    );

    this.setupTools();
    this.setupResources();
    this.setupRequestHandlers();
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new VegapunkMCPError('Server already running', 'ALREADY_RUNNING');
    }

    try {
      // Initialize tools and resources
      await this.initializeToolsAndResources();
      
      // Setup transport (stdio for now, could be extended to HTTP/WebSocket)
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.emit('server.started', this.config);
      this.log('info', 'Vegapunk MCP Server started successfully');
      
    } catch (error) {
      this.log('error', `Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.server.close();
      this.isRunning = false;
      
      this.emit('server.stopped');
      this.log('info', 'Vegapunk MCP Server stopped');
      
    } catch (error) {
      this.log('error', `Error stopping MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Setup tool executors
   */
  private setupTools(): void {
    // Register core tools
    const ethicalTool = new EthicalAnalysisTool();
    const technicalTool = new TechnicalSupportTool();
    
    this.toolExecutors.set('ethical_analysis', ethicalTool);
    this.toolExecutors.set('technical_support', technicalTool);
    
    // Build tools array
    this.tools = [
      ethicalTool.getDefinition(),
      technicalTool.getDefinition()
    ];

    // Add custom tools from config
    if (this.config.tools.customTools) {
      this.tools.push(...this.config.tools.customTools);
    }

    this.log('info', `Registered ${this.tools.length} MCP tools`);
  }

  /**
   * Setup resource providers
   */
  private setupResources(): void {
    // Core resources
    this.resources = [
      {
        uri: 'vegapunk://agents/capabilities',
        name: 'Agent Capabilities',
        description: 'List of all agent capabilities in the Vegapunk ecosystem',
        mimeType: 'application/json'
      },
      {
        uri: 'vegapunk://agents/status',
        name: 'Agent Status',
        description: 'Current status of all agents in the network',
        mimeType: 'application/json'
      },
      {
        uri: 'vegapunk://network/topology',
        name: 'Network Topology',
        description: 'Current A2A network topology and connections',
        mimeType: 'application/json'
      },
      {
        uri: 'vegapunk://metrics/performance',
        name: 'Performance Metrics',
        description: 'System performance metrics and analytics',
        mimeType: 'application/json'
      }
    ];

    // Add custom resources from config
    if (this.config.resources.customResources) {
      this.resources.push(...this.config.resources.customResources);
    }

    this.log('info', `Registered ${this.resources.length} MCP resources`);
  }

  /**
   * Setup MCP request handlers
   */
  private setupRequestHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.metrics.server.totalRequests++;
      
      return {
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.metrics.server.totalRequests++;
      this.metrics.tools.totalCalls++;
      
      const { name, arguments: toolArgs } = request.params;
      
      try {
        const result = await this.executeTool(name, toolArgs);
        
        // Update metrics
        this.metrics.tools.callsByTool.set(
          name, 
          (this.metrics.tools.callsByTool.get(name) || 0) + 1
        );
        
        return {
          content: result.content,
          isError: result.isError
        };
        
      } catch (error) {
        this.metrics.server.totalErrors++;
        this.metrics.tools.errorsByTool.set(
          name,
          (this.metrics.tools.errorsByTool.get(name) || 0) + 1
        );
        
        this.log('error', `Tool execution failed: ${name}`, error);
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.metrics.server.totalRequests++;
      
      return {
        resources: this.resources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType
        }))
      };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.metrics.server.totalRequests++;
      this.metrics.resources.totalAccesses++;
      
      const { uri } = request.params;
      
      try {
        const content = await this.readResource(uri);
        
        // Update metrics
        this.metrics.resources.accessesByResource.set(
          uri,
          (this.metrics.resources.accessesByResource.get(uri) || 0) + 1
        );
        
        return {
          contents: content.content
        };
        
      } catch (error) {
        this.metrics.server.totalErrors++;
        this.metrics.resources.errorsByResource.set(
          uri,
          (this.metrics.resources.errorsByResource.get(uri) || 0) + 1
        );
        
        this.log('error', `Resource access failed: ${uri}`, error);
        
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Resource not found or access denied: ${uri}`
        );
      }
    });
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolName: string, toolArguments: Record<string, any>): Promise<MCPToolResult> {
    const executor = this.toolExecutors.get(toolName);
    if (!executor) {
      throw new VegapunkMCPError(`Tool not found: ${toolName}`, 'TOOL_NOT_FOUND');
    }

    // Validate arguments
    if (!executor.validate(toolArguments)) {
      throw new VegapunkMCPError(`Invalid arguments for tool: ${toolName}`, 'INVALID_ARGUMENTS');
    }

    // Create execution context
    const context: MCPExecutionContext = {
      tool: this.tools.find(t => t.name === toolName)!,
      arguments: toolArguments,
      agent: {
        agentId: 'mcp-client',
        sessionId: `session-${Date.now()}`,
        capabilities: [],
        permissions: []
      },
      timestamp: new Date(),
      requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    const startTime = Date.now();
    
    try {
      const result = await executor.execute(context);
      
      const executionTime = Date.now() - startTime;
      this.updateExecutionMetrics(toolName, executionTime);
      
      this.emit('tool.called', toolName, context, result);
      return result;
      
    } catch (error) {
      this.emit('tool.error', toolName, context, error);
      throw error;
    }
  }

  /**
   * Read a resource
   */
  private async readResource(uri: string): Promise<MCPResourceContent> {
    // Handle built-in resources
    if (uri.startsWith('vegapunk://')) {
      return this.readBuiltinResource(uri);
    }

    // Check custom resource providers
    for (const [pattern, provider] of this.resourceProviders) {
      if (uri.includes(pattern)) {
        const context: MCPAgentContext = {
          agentId: 'mcp-client',
          sessionId: `session-${Date.now()}`,
          capabilities: [],
          permissions: []
        };
        
        return provider.getResource(uri, context);
      }
    }

    throw new VegapunkMCPError(`Resource not found: ${uri}`, 'RESOURCE_NOT_FOUND');
  }

  /**
   * Read built-in Vegapunk resources
   */
  private async readBuiltinResource(uri: string): Promise<MCPResourceContent> {
    const content: MCPResourceContent = {
      uri,
      mimeType: 'application/json',
      content: [],
      metadata: {
        lastModified: new Date(),
        version: '1.0.0'
      }
    };

    switch (uri) {
      case 'vegapunk://agents/capabilities':
        if (this.a2aProtocol) {
          const agents = await this.a2aProtocol.discoverAgents();
          const capabilities = agents.map(agent => ({
            agentId: agent.agentId,
            agentType: agent.agentType,
            capabilities: agent.capabilities,
            status: agent.status
          }));
          
          content.content = [{
            type: 'text',
            text: JSON.stringify(capabilities, null, 2)
          }];
        } else {
          content.content = [{
            type: 'text',
            text: JSON.stringify({ error: 'A2A protocol not available' }, null, 2)
          }];
        }
        break;

      case 'vegapunk://agents/status':
        if (this.a2aProtocol) {
          const networkStats = this.a2aProtocol.getNetworkStats();
          content.content = [{
            type: 'text',
            text: JSON.stringify(networkStats, null, 2)
          }];
        } else {
          content.content = [{
            type: 'text',
            text: JSON.stringify({ error: 'A2A protocol not available' }, null, 2)
          }];
        }
        break;

      case 'vegapunk://network/topology':
        if (this.a2aProtocol) {
          const topology = this.a2aProtocol.getNetworkTopology();
          content.content = [{
            type: 'text',
            text: JSON.stringify({
              agents: Array.from(topology.agents.values()),
              connections: Object.fromEntries(topology.connections),
              lastUpdated: topology.lastUpdated
            }, null, 2)
          }];
        } else {
          content.content = [{
            type: 'text',
            text: JSON.stringify({ error: 'A2A protocol not available' }, null, 2)
          }];
        }
        break;

      case 'vegapunk://metrics/performance':
        const healthCheck = this.getHealthCheck();
        content.content = [{
          type: 'text',
          text: JSON.stringify(healthCheck, null, 2)
        }];
        break;

      default:
        throw new VegapunkMCPError(`Unknown resource: ${uri}`, 'UNKNOWN_RESOURCE');
    }

    return content;
  }

  /**
   * Initialize tools and resources
   */
  private async initializeToolsAndResources(): Promise<void> {
    // Initialize tool executors if needed
    for (const [name, executor] of this.toolExecutors) {
      if ('initialize' in executor && typeof executor.initialize === 'function') {
        await executor.initialize();
      }
    }

    // Initialize resource providers if needed
    for (const [name, provider] of this.resourceProviders) {
      if ('initialize' in provider && typeof provider.initialize === 'function') {
        await provider.initialize();
      }
    }
  }

  /**
   * Update execution metrics
   */
  private updateExecutionMetrics(toolName: string, executionTime: number): void {
    const currentAvg = this.metrics.tools.averageExecutionTime.get(toolName) || 0;
    const callCount = this.metrics.tools.callsByTool.get(toolName) || 1;
    
    // Calculate new average
    const newAvg = (currentAvg * (callCount - 1) + executionTime) / callCount;
    this.metrics.tools.averageExecutionTime.set(toolName, newAvg);
  }

  /**
   * Get health check status
   */
  getHealthCheck(): MCPHealthCheck {
    this.metrics.server.uptime = Date.now() - this.startTime.getTime();
    
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      checks: {
        server: this.isRunning,
        tools: this.toolExecutors.size > 0,
        resources: this.resources.length > 0,
        a2aIntegration: !!this.a2aProtocol,
        langGraphIntegration: this.config.enableLangGraphIntegration
      },
      metrics: this.metrics,
      errors: []
    };
  }

  /**
   * Get server metrics
   */
  getMetrics(): MCPMetrics {
    this.metrics.server.uptime = Date.now() - this.startTime.getTime();
    return this.metrics;
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Register custom tool executor
   */
  registerToolExecutor(name: string, executor: ToolExecutor): void {
    this.toolExecutors.set(name, executor);
    this.log('info', `Registered custom tool executor: ${name}`);
  }

  /**
   * Register custom resource provider
   */
  registerResourceProvider(pattern: string, provider: ResourceProvider): void {
    this.resourceProviders.set(pattern, provider);
    this.log('info', `Registered custom resource provider: ${pattern}`);
  }

  /**
   * Logging utility
   */
  private log(level: string, message: string, error?: any): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logging.level);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[MCP-${level.toUpperCase()}] ${timestamp} - ${message}`;
      
      if (error) {
        console.error(logMessage, error);
      } else {
        console.log(logMessage);
      }
    }
  }
}