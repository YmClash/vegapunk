/**
 * LangGraph ↔ MCP Bridge - Integration between workflow engine and external tools
 * Enables LangGraph workflows to access MCP tools and resources seamlessly
 */

import { EventEmitter } from 'events';
import { VegapunkGraphState, GraphNodeFunction } from '../graph/types';
import { 
  VegapunkMCPServer, 
  MCPTool, 
  MCPResource, 
  MCPToolCall, 
  MCPToolResult, 
  MCPExecutionContext,
  MCPAgentContext 
} from '../mcp/types';

export interface LangGraphMCPBridgeConfig {
  enableToolCaching: boolean;
  enableResourceCaching: boolean;
  toolTimeout: number;
  resourceTimeout: number;
  maxConcurrentCalls: number;
  retryAttempts: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface MCPToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  metadata: {
    toolName: string;
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface MCPResourceAccessResult {
  success: boolean;
  content?: any;
  error?: string;
  metadata: {
    uri: string;
    accessTime: number;
    size?: number;
  };
}

export class LangGraphMCPBridge extends EventEmitter {
  private mcpServer: VegapunkMCPServer;
  private config: LangGraphMCPBridgeConfig;
  private toolCache = new Map<string, { tool: MCPTool; timestamp: Date }>();
  private resourceCache = new Map<string, { content: any; timestamp: Date }>();
  private activeCalls = new Set<string>();
  private isInitialized = false;

  constructor(
    mcpServer: VegapunkMCPServer,
    config?: Partial<LangGraphMCPBridgeConfig>
  ) {
    super();
    
    this.mcpServer = mcpServer;
    this.config = {
      enableToolCaching: true,
      enableResourceCaching: true,
      toolTimeout: 30000, // 30 seconds
      resourceTimeout: 10000, // 10 seconds
      maxConcurrentCalls: 10,
      retryAttempts: 2,
      logLevel: 'info',
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the bridge
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure MCP server is running
      if (!this.mcpServer) {
        throw new Error('MCP server not provided');
      }

      // Cache available tools and resources if enabled
      if (this.config.enableToolCaching) {
        await this.cacheAvailableTools();
      }

      if (this.config.enableResourceCaching) {
        await this.cacheAvailableResources();
      }

      this.isInitialized = true;
      this.log('info', 'LangGraph-MCP bridge initialized successfully');
      
    } catch (error) {
      this.log('error', `Failed to initialize bridge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Create an MCP tool executor node for LangGraph
   */
  createToolExecutorNode(toolName: string): GraphNodeFunction {
    return async (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>> => {
      const startTime = Date.now();
      
      try {
        // Extract tool parameters from state
        const toolParams = this.extractToolParameters(state, toolName);
        
        // Execute MCP tool
        const result = await this.executeMCPTool(toolName, toolParams, {
          agentId: state.currentAgent,
          sessionId: state.sessionId,
          userId: state.userId
        });

        // Update state with results
        const updatedTaskResults = new Map(state.taskResults);
        updatedTaskResults.set(`mcp-tool-${toolName}`, result);

        return {
          taskResults: updatedTaskResults,
          metadata: {
            ...state.metadata,
            processingTime: Date.now() - startTime,
            currentStep: state.metadata.currentStep + 1
          }
        };

      } catch (error) {
        this.log('error', `Tool executor node failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        return {
          workflowStatus: 'error',
          metadata: {
            ...state.metadata,
            processingTime: Date.now() - startTime
          }
        };
      }
    };
  }

  /**
   * Execute MCP tool from LangGraph workflow
   */
  async executeMCPTool(
    toolName: string,
    parameters: Record<string, any>,
    context: {
      agentId: string;
      sessionId: string;
      userId?: string;
    }
  ): Promise<MCPToolExecutionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check concurrent call limit
    if (this.activeCalls.size >= this.config.maxConcurrentCalls) {
      throw new Error(`Maximum concurrent MCP calls (${this.config.maxConcurrentCalls}) exceeded`);
    }

    const callId = `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.activeCalls.add(callId);

    const startTime = Date.now();

    try {
      // Get tool definition (from cache if available)
      const tool = await this.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }

      // Create execution context
      const executionContext: MCPExecutionContext = {
        tool,
        arguments: parameters,
        agent: {
          agentId: context.agentId,
          sessionId: context.sessionId,
          userId: context.userId,
          capabilities: [],
          permissions: []
        },
        timestamp: new Date(),
        requestId: callId
      };

      // Execute with timeout
      const result = await Promise.race([
        this.executeWithRetry(toolName, executionContext),
        this.createTimeoutPromise(this.config.toolTimeout, `Tool ${toolName} execution timeout`)
      ]);

      const executionTime = Date.now() - startTime;

      this.emit('tool.executed', toolName, result, executionTime);

      return {
        success: !result.isError,
        result: result.content,
        metadata: {
          toolName,
          executionTime,
          tokensUsed: result.metadata?.tokensUsed,
          cost: result.metadata?.cost
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.emit('tool.error', toolName, error, executionTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          toolName,
          executionTime
        }
      };
      
    } finally {
      this.activeCalls.delete(callId);
    }
  }

  /**
   * Access MCP resource from LangGraph workflow
   */
  async accessMCPResource(
    resourceUri: string,
    context: {
      agentId: string;
      sessionId: string;
      userId?: string;
    }
  ): Promise<MCPResourceAccessResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Check cache first if enabled
      if (this.config.enableResourceCaching) {
        const cached = this.resourceCache.get(resourceUri);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return {
            success: true,
            content: cached.content,
            metadata: {
              uri: resourceUri,
              accessTime: Date.now() - startTime
            }
          };
        }
      }

      // Access resource with timeout
      const content = await Promise.race([
        this.accessResourceWithRetry(resourceUri, context),
        this.createTimeoutPromise(this.config.resourceTimeout, `Resource ${resourceUri} access timeout`)
      ]);

      const accessTime = Date.now() - startTime;

      // Cache if enabled
      if (this.config.enableResourceCaching) {
        this.resourceCache.set(resourceUri, {
          content,
          timestamp: new Date()
        });
      }

      this.emit('resource.accessed', resourceUri, content, accessTime);

      return {
        success: true,
        content,
        metadata: {
          uri: resourceUri,
          accessTime,
          size: JSON.stringify(content).length
        }
      };

    } catch (error) {
      const accessTime = Date.now() - startTime;
      
      this.emit('resource.error', resourceUri, error, accessTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          uri: resourceUri,
          accessTime
        }
      };
    }
  }

  /**
   * Get available MCP tools for LangGraph planning
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.config.enableToolCaching && this.toolCache.size > 0) {
      return Array.from(this.toolCache.values()).map(cached => cached.tool);
    }

    try {
      // Get tools from MCP server
      return this.mcpServer.tools || [];
      
    } catch (error) {
      this.log('error', `Failed to get available tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get available MCP resources for LangGraph workflows
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get resources from MCP server
      return this.mcpServer.resources || [];
      
    } catch (error) {
      this.log('error', `Failed to get available resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Create MCP-enhanced LangGraph state enhancer
   */
  createStateEnhancer() {
    return async (state: VegapunkGraphState): Promise<Partial<VegapunkGraphState>> => {
      const enhancements: Partial<VegapunkGraphState> = {};

      try {
        // Add available MCP tools to state metadata
        const tools = await this.getAvailableTools();
        const resources = await this.getAvailableResources();

        enhancements.metadata = {
          ...state.metadata,
          mcpTools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.metadata?.category
          })),
          mcpResources: resources.map(resource => ({
            uri: resource.uri,
            name: resource.name,
            description: resource.description
          }))
        };

        return enhancements;

      } catch (error) {
        this.log('error', `State enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {};
      }
    };
  }

  /**
   * Get bridge metrics
   */
  getBridgeMetrics() {
    return {
      toolCacheSize: this.toolCache.size,
      resourceCacheSize: this.resourceCache.size,
      activeCalls: this.activeCalls.size,
      maxConcurrentCalls: this.config.maxConcurrentCalls,
      isInitialized: this.isInitialized,
      mcpServerHealth: this.mcpServer.getHealthCheck()
    };
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.toolCache.clear();
    this.resourceCache.clear();
    this.log('info', 'MCP bridge caches cleared');
  }

  /**
   * Shutdown the bridge
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Wait for active calls to complete or timeout
      const timeout = 5000; // 5 seconds
      const startTime = Date.now();
      
      while (this.activeCalls.size > 0 && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Clear caches
      this.clearCaches();

      this.isInitialized = false;
      this.log('info', 'LangGraph-MCP bridge shutdown complete');
      
    } catch (error) {
      this.log('error', `Bridge shutdown error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // Private Methods
  // ================================

  private setupEventHandlers(): void {
    // Listen to MCP server events if available
    if (this.mcpServer) {
      this.mcpServer.on('tool.called', (toolName: string, context: any, result: any) => {
        this.emit('mcp.tool.called', toolName, context, result);
      });

      this.mcpServer.on('tool.error', (toolName: string, context: any, error: any) => {
        this.emit('mcp.tool.error', toolName, context, error);
      });
    }
  }

  private async cacheAvailableTools(): Promise<void> {
    try {
      const tools = await this.getAvailableTools();
      
      this.toolCache.clear();
      for (const tool of tools) {
        this.toolCache.set(tool.name, {
          tool,
          timestamp: new Date()
        });
      }

      this.log('debug', `Cached ${tools.length} MCP tools`);
      
    } catch (error) {
      this.log('error', `Failed to cache tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cacheAvailableResources(): Promise<void> {
    try {
      const resources = await this.getAvailableResources();
      this.log('debug', `Found ${resources.length} MCP resources`);
      
    } catch (error) {
      this.log('error', `Failed to cache resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTool(toolName: string): Promise<MCPTool | null> {
    // Check cache first
    if (this.config.enableToolCaching) {
      const cached = this.toolCache.get(toolName);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.tool;
      }
    }

    // Get from MCP server
    const tools = await this.getAvailableTools();
    return tools.find(tool => tool.name === toolName) || null;
  }

  private async executeWithRetry(
    toolName: string,
    context: MCPExecutionContext
  ): Promise<MCPToolResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // This would call the actual MCP tool execution
        // For now, we'll simulate the call
        return await this.simulateToolExecution(toolName, context);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          this.log('warn', `Tool ${toolName} execution attempt ${attempt + 1} failed, retrying...`);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Tool execution failed after retries');
  }

  private async accessResourceWithRetry(
    resourceUri: string,
    context: {
      agentId: string;
      sessionId: string;
      userId?: string;
    }
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // This would call the actual MCP resource access
        // For now, we'll simulate the call
        return await this.simulateResourceAccess(resourceUri, context);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          this.log('warn', `Resource ${resourceUri} access attempt ${attempt + 1} failed, retrying...`);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Resource access failed after retries');
  }

  private async simulateToolExecution(
    toolName: string,
    context: MCPExecutionContext
  ): Promise<MCPToolResult> {
    // Simulate tool execution based on tool name
    await this.delay(Math.random() * 2000 + 500); // 500-2500ms delay

    return {
      content: [{
        type: 'text',
        text: `Simulated execution of ${toolName} with parameters: ${JSON.stringify(context.arguments, null, 2)}`
      }],
      isError: false,
      metadata: {
        executionTime: Date.now() - context.timestamp.getTime(),
        tokensUsed: Math.ceil(JSON.stringify(context.arguments).length / 4),
        cost: 0.01
      }
    };
  }

  private async simulateResourceAccess(
    resourceUri: string,
    context: {
      agentId: string;
      sessionId: string;
      userId?: string;
    }
  ): Promise<any> {
    // Simulate resource access
    await this.delay(Math.random() * 1000 + 200); // 200-1200ms delay

    return {
      uri: resourceUri,
      content: `Simulated content for resource: ${resourceUri}`,
      metadata: {
        accessedBy: context.agentId,
        timestamp: new Date().toISOString()
      }
    };
  }

  private extractToolParameters(state: VegapunkGraphState, toolName: string): Record<string, any> {
    // Extract parameters from state based on tool requirements
    // This is a simplified implementation
    
    const params: Record<string, any> = {};
    
    // Get last human message as primary input
    const humanMessages = state.messages.filter(m => m.constructor.name === 'HumanMessage');
    const lastMessage = humanMessages[humanMessages.length - 1];
    
    if (lastMessage) {
      if (toolName === 'ethical_analysis') {
        params.content = lastMessage.content;
        params.frameworks = ['all'];
        params.includeRecommendations = true;
      } else if (toolName === 'technical_support') {
        params.query = lastMessage.content;
        params.category = 'general';
        params.includeCodeExample = false;
        params.includeTroubleshooting = true;
      }
    }

    return params;
  }

  private createTimeoutPromise<T>(timeout: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });
  }

  private isCacheValid(timestamp: Date): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return (Date.now() - timestamp.getTime()) < maxAge;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[LangGraph-MCP-Bridge-${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
    }
  }
}