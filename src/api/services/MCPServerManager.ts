/**
 * MCPServerManager - Service pour la gestion du serveur MCP
 * Contrôle lifecycle, métriques, santé et monitoring du serveur MCP
 */

import { VegapunkMCPServer } from '../../mcp/VegapunkMCPServer';
import { MCPServerConfig, MCPHealthCheck, MCPMetrics } from '../../mcp/types';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

interface ServerStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  uptime: number;
  pid?: number;
  version: string;
  host: string;
  port: number;
  connections: number;
  lastHeartbeat: string;
}

interface LogFilters {
  level: string;
  limit: number;
  startTime?: string;
  endTime?: string;
  component?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  metadata?: any;
}

interface MCPResource {
  id: string;
  uri: string;
  name: string;
  description: string;
  category: 'template' | 'prompt' | 'integration' | 'config';
  mimeType: string;
  size: number;
  lastModified: string;
  version: string;
  metadata?: any;
}

interface ResourceUsage {
  resourceId: string;
  accessCount: number;
  lastAccessed: string;
  avgAccessTime: number;
  errorCount: number;
  popularityScore: number;
}

interface ExecutionInfo {
  id: string;
  toolId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  parameters: any;
  result?: any;
  error?: string;
  performance: {
    memoryUsage: number;
    cpuTime: number;
    networkCalls: number;
  };
}

interface ExecutionFilters {
  limit: number;
  offset: number;
  status?: string;
  toolId?: string;
}

interface ExecutionAnalytics {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  failureReasons: { [reason: string]: number };
  performanceTrends: {
    timestamp: string;
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  }[];
}

export class MCPServerManager extends EventEmitter {
  private mcpServer: VegapunkMCPServer | null = null;
  private serverLogs: LogEntry[] = [];
  private mcpResources: MCPResource[] = [];
  private resourceUsage: Map<string, ResourceUsage> = new Map();
  private activeExecutions: Map<string, ExecutionInfo> = new Map();
  private executionHistory: ExecutionInfo[] = [];
  private isInitialized = false;
  private isServerRunning = false;
  private serverStartTime: number = Date.now();
  private shouldStayShutdown = false;

  constructor() {
    super();
    this.initializeDefaultResources();
  }

  /**
   * Initialize default MCP resources
   */
  private initializeDefaultResources(): void {
    this.mcpResources = [
      {
        id: 'res-001',
        uri: 'vegapunk://agents/capabilities',
        name: 'Agent Capabilities',
        description: 'List of all agent capabilities in the Vegapunk ecosystem',
        category: 'config',
        mimeType: 'application/json',
        size: 2048,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      },
      {
        id: 'res-002',
        uri: 'vegapunk://network/topology',
        name: 'Network Topology',
        description: 'Current A2A network topology and connections',
        category: 'config',
        mimeType: 'application/json',
        size: 1024,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      },
      {
        id: 'res-003',
        uri: 'vegapunk://templates/ethical-analysis',
        name: 'Ethical Analysis Template',
        description: 'Template for ethical analysis workflows',
        category: 'template',
        mimeType: 'application/json',
        size: 512,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      },
      {
        id: 'res-004',
        uri: 'vegapunk://prompts/technical-support',
        name: 'Technical Support Prompts',
        description: 'Collection of technical support prompt templates',
        category: 'prompt',
        mimeType: 'text/plain',
        size: 1536,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    ];

    // Initialize usage tracking
    this.mcpResources.forEach(resource => {
      this.resourceUsage.set(resource.id, {
        resourceId: resource.id,
        accessCount: Math.floor(Math.random() * 100),
        lastAccessed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        avgAccessTime: Math.floor(Math.random() * 1000) + 100,
        errorCount: Math.floor(Math.random() * 5),
        popularityScore: Math.random()
      });
    });
  }

  /**
   * Initialize MCP server
   */
  async initialize(config?: MCPServerConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const defaultConfig: MCPServerConfig = {
        name: 'vegapunk-mcp-server',
        version: '1.0.0',
        description: 'Vegapunk MCP Server with Advanced Cockpit Support',
        host: 'localhost',
        port: 3000,
        enableA2AIntegration: true,
        enableLangGraphIntegration: true,
        tools: {
          enabled: true,
          customTools: []
        },
        resources: {
          enabled: true,
          customResources: []
        },
        logging: {
          level: 'info',
          enableConsole: true,
          enableFile: false
        }
      };

      this.mcpServer = new VegapunkMCPServer(config || defaultConfig);
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.isServerRunning = true; // MCP server starts with the main application
      this.serverStartTime = Date.now();
      this.addLog('info', 'server', 'MCPServerManager initialized successfully');
      
    } catch (error: any) {
      this.addLog('error', 'server', `Failed to initialize MCPServerManager: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup event listeners for MCP server
   */
  private setupEventListeners(): void {
    if (!this.mcpServer) return;

    this.mcpServer.on('server.started', (config) => {
      this.addLog('info', 'server', 'MCP server started');
      this.emit('server.started', config);
    });

    this.mcpServer.on('server.stopped', () => {
      this.addLog('info', 'server', 'MCP server stopped');
      this.emit('server.stopped');
    });

    this.mcpServer.on('tool.called', (toolName, context, result) => {
      this.addLog('info', 'tools', `Tool executed: ${toolName}`);
      this.trackExecution(toolName, context, result);
    });

    this.mcpServer.on('tool.error', (toolName, context, error) => {
      this.addLog('error', 'tools', `Tool execution failed: ${toolName} - ${error.message}`);
      this.trackExecutionError(toolName, context, error);
    });
  }

  /**
   * Start MCP server
   */
  async startServer(config?: MCPServerConfig): Promise<void> {
    if (this.isServerRunning && !this.shouldStayShutdown) {
      this.addLog('info', 'server', 'MCP server already running');
      return;
    }

    if (!this.mcpServer) {
      await this.initialize(config);
    }

    if (!this.mcpServer) {
      throw new Error('MCP server not initialized');
    }

    try {
      this.shouldStayShutdown = false;
      this.isServerRunning = true;
      this.serverStartTime = Date.now();
      await this.mcpServer.start();
      this.addLog('info', 'server', 'MCP server started successfully');
      this.emit('server.started', config);
    } catch (error: any) {
      this.isServerRunning = false;
      this.addLog('error', 'server', `Failed to start MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop MCP server
   */
  async stopServer(): Promise<void> {
    if (!this.isServerRunning) {
      this.addLog('info', 'server', 'MCP server already stopped');
      return;
    }

    try {
      this.shouldStayShutdown = true; // Prevent automatic restart
      this.isServerRunning = false;
      
      if (this.mcpServer) {
        await this.mcpServer.stop();
      }
      
      this.addLog('info', 'server', 'MCP server stopped successfully');
      this.emit('server.stopped');
    } catch (error: any) {
      this.addLog('error', 'server', `Failed to stop MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restart MCP server
   */
  async restartServer(): Promise<void> {
    this.addLog('info', 'server', 'Restarting MCP server...');
    
    try {
      await this.stopServer();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await this.startServer();
      
      this.addLog('info', 'server', 'MCP server restarted successfully');
    } catch (error: any) {
      this.addLog('error', 'server', `Failed to restart MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<ServerStatus> {
    // Determine actual status based on state flags
    let currentStatus: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
    
    if (this.shouldStayShutdown) {
      currentStatus = 'stopped';
    } else if (this.isServerRunning) {
      currentStatus = 'running';
    } else {
      currentStatus = 'stopped';
    }
    
    const uptime = (currentStatus === 'running') ? this.serverStartTime : 0;
    
    // Log current state for debugging
    this.addLog('debug', 'server', `Status check: isRunning=${this.isServerRunning}, shouldStayShutdown=${this.shouldStayShutdown}, status=${currentStatus}`);
    
    return {
      status: currentStatus,
      uptime: uptime,
      pid: (currentStatus === 'running') ? process.pid : undefined,
      version: '1.0.0',
      host: 'integrated', // MCP server is integrated, not separate
      port: 8080, // Uses main server port, not separate port  
      connections: (currentStatus === 'running') ? 1 : 0, // Integrated with main server
      lastHeartbeat: new Date().toISOString()
    };
  }

  /**
   * Get server metrics
   */
  async getServerMetrics(): Promise<MCPMetrics> {
    if (!this.mcpServer) {
      throw new Error('MCP server not initialized');
    }

    return this.mcpServer.getMetrics();
  }

  /**
   * Get health check
   */
  async getHealthCheck(): Promise<MCPHealthCheck> {
    if (!this.mcpServer) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        checks: {
          server: false,
          tools: false,
          resources: false,
          a2aIntegration: false,
          langGraphIntegration: false
        },
        metrics: {
          server: { uptime: 0, totalRequests: 0, totalErrors: 0, activeConnections: 0 },
          tools: { totalCalls: 0, callsByTool: new Map(), errorsByTool: new Map(), averageExecutionTime: new Map() },
          resources: { totalAccesses: 0, accessesByResource: new Map(), errorsByResource: new Map() },
          agents: { activeAgents: 0, requestsByAgent: new Map(), sessionDuration: new Map() }
        },
        errors: ['Server not initialized']
      };
    }

    return this.mcpServer.getHealthCheck();
  }

  /**
   * Get server logs with filtering
   */
  async getServerLogs(filters: LogFilters): Promise<LogEntry[]> {
    let filteredLogs = [...this.serverLogs];

    // Filter by level
    if (filters.level && filters.level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    // Filter by component
    if (filters.component) {
      filteredLogs = filteredLogs.filter(log => log.component === filters.component);
    }

    // Filter by time range
    if (filters.startTime) {
      const startTime = new Date(filters.startTime);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startTime);
    }

    if (filters.endTime) {
      const endTime = new Date(filters.endTime);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endTime);
    }

    // Apply limit
    return filteredLogs.slice(0, filters.limit);
  }

  /**
   * Get server configuration
   */
  async getServerConfig(): Promise<MCPServerConfig> {
    if (!this.mcpServer) {
      throw new Error('MCP server not initialized');
    }

    return this.mcpServer.getConfig();
  }

  /**
   * Update server configuration
   */
  async updateServerConfig(config: Partial<MCPServerConfig>): Promise<void> {
    // In real implementation, would update server config and apply changes
    this.addLog('info', 'config', 'Server configuration updated');
  }

  /**
   * Get available resources
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    return [...this.mcpResources];
  }

  /**
   * Get resource usage statistics
   */
  async getResourceUsage(): Promise<ResourceUsage[]> {
    return Array.from(this.resourceUsage.values());
  }

  /**
   * Create new resource
   */
  async createResource(resource: Omit<MCPResource, 'id' | 'lastModified'>): Promise<MCPResource> {
    const newResource: MCPResource = {
      ...resource,
      id: `res-${Date.now()}`,
      lastModified: new Date().toISOString()
    };

    this.mcpResources.push(newResource);
    this.resourceUsage.set(newResource.id, {
      resourceId: newResource.id,
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      avgAccessTime: 0,
      errorCount: 0,
      popularityScore: 0
    });

    this.addLog('info', 'resources', `Resource created: ${newResource.name}`);
    return newResource;
  }

  /**
   * Update existing resource
   */
  async updateResource(resource: MCPResource): Promise<MCPResource> {
    const index = this.mcpResources.findIndex(r => r.id === resource.id);
    if (index === -1) {
      throw new Error('Resource not found');
    }

    const updatedResource = {
      ...resource,
      lastModified: new Date().toISOString()
    };

    this.mcpResources[index] = updatedResource;
    this.addLog('info', 'resources', `Resource updated: ${updatedResource.name}`);
    return updatedResource;
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    const index = this.mcpResources.findIndex(r => r.id === resourceId);
    if (index === -1) {
      throw new Error('Resource not found');
    }

    const resource = this.mcpResources[index];
    this.mcpResources.splice(index, 1);
    this.resourceUsage.delete(resourceId);

    this.addLog('info', 'resources', `Resource deleted: ${resource.name}`);
  }

  /**
   * Get active executions
   */
  async getActiveExecutions(): Promise<ExecutionInfo[]> {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(filters: ExecutionFilters): Promise<ExecutionInfo[]> {
    let filteredHistory = [...this.executionHistory];

    if (filters.status) {
      filteredHistory = filteredHistory.filter(exec => exec.status === filters.status);
    }

    if (filters.toolId) {
      filteredHistory = filteredHistory.filter(exec => exec.toolId === filters.toolId);
    }

    return filteredHistory.slice(filters.offset, filters.offset + filters.limit);
  }

  /**
   * Get execution analytics
   */
  async getExecutionAnalytics(): Promise<ExecutionAnalytics> {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(exec => exec.status === 'completed').length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    const completedExecutions = this.executionHistory.filter(exec => exec.duration);
    const avgExecutionTime = completedExecutions.length > 0 ? 
      completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / completedExecutions.length : 0;

    const failureReasons: { [reason: string]: number } = {};
    this.executionHistory.filter(exec => exec.status === 'failed').forEach(exec => {
      const reason = exec.error || 'Unknown error';
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });

    // Generate performance trends (mock data)
    const performanceTrends = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      avgResponseTime: Math.floor(Math.random() * 2000) + 1000,
      throughput: Math.floor(Math.random() * 50) + 20,
      errorRate: Math.random() * 0.1
    }));

    return {
      totalExecutions,
      successRate,
      avgExecutionTime,
      failureReasons,
      performanceTrends
    };
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string): Promise<ExecutionInfo | null> {
    // Check active executions first
    const activeExecution = this.activeExecutions.get(executionId);
    if (activeExecution) {
      return activeExecution;
    }

    // Check history
    return this.executionHistory.find(exec => exec.id === executionId) || null;
  }

  /**
   * Cancel active execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found or not active');
    }

    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    execution.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();

    // Move to history
    this.executionHistory.unshift(execution);
    this.activeExecutions.delete(executionId);

    this.addLog('info', 'executions', `Execution cancelled: ${executionId}`);
  }

  /**
   * Get comprehensive health status
   */
  async getComprehensiveHealth(): Promise<any> {
    const healthCheck = await this.getHealthCheck();
    const metrics = await this.getServerMetrics();
    const status = await this.getServerStatus();

    return {
      server: status,
      health: healthCheck,
      metrics,
      resources: {
        total: this.mcpResources.length,
        categories: {
          templates: this.mcpResources.filter(r => r.category === 'template').length,
          prompts: this.mcpResources.filter(r => r.category === 'prompt').length,
          integrations: this.mcpResources.filter(r => r.category === 'integration').length,
          configs: this.mcpResources.filter(r => r.category === 'config').length
        }
      },
      executions: {
        active: this.activeExecutions.size,
        total: this.executionHistory.length
      }
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    const metrics = await this.getServerMetrics();
    
    return {
      server: metrics.server,
      performance: {
        cpuUsage: Math.random() * 50 + 20, // Mock CPU usage
        memoryUsage: Math.random() * 60 + 30, // Mock memory usage
        diskUsage: Math.random() * 40 + 10, // Mock disk usage
        networkRx: Math.random() * 10 + 1, // Mock network RX
        networkTx: Math.random() * 8 + 0.5, // Mock network TX
        responseTime: Math.random() * 500 + 100, // Mock response time
        throughput: Math.random() * 100 + 50 // Mock throughput
      },
      tools: metrics.tools,
      resources: metrics.resources
    };
  }

  /**
   * Acknowledge alerts
   */
  async acknowledgeAlerts(alertIds: string[]): Promise<void> {
    this.addLog('info', 'alerts', `Acknowledged ${alertIds.length} alerts`);
  }

  /**
   * Track tool execution
   */
  private trackExecution(toolName: string, context: any, result: any): void {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const execution: ExecutionInfo = {
      id: executionId,
      toolId: toolName,
      status: 'running',
      startTime: new Date().toISOString(),
      parameters: context.arguments,
      performance: {
        memoryUsage: Math.random() * 100,
        cpuTime: Math.random() * 1000,
        networkCalls: Math.floor(Math.random() * 5)
      }
    };

    this.activeExecutions.set(executionId, execution);

    // Simulate completion after random delay
    setTimeout(() => {
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.duration = Math.random() * 3000 + 500;
      execution.result = result;

      this.executionHistory.unshift(execution);
      this.activeExecutions.delete(executionId);
    }, Math.random() * 2000 + 500);
  }

  /**
   * Track tool execution error
   */
  private trackExecutionError(toolName: string, context: any, error: any): void {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const execution: ExecutionInfo = {
      id: executionId,
      toolId: toolName,
      status: 'failed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.random() * 1000 + 100,
      parameters: context.arguments,
      error: error.message,
      performance: {
        memoryUsage: Math.random() * 100,
        cpuTime: Math.random() * 1000,
        networkCalls: Math.floor(Math.random() * 5)
      }
    };

    this.executionHistory.unshift(execution);
  }

  /**
   * Add log entry
   */
  private addLog(level: LogEntry['level'], component: string, message: string, metadata?: any): void {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata
    };

    this.serverLogs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (this.serverLogs.length > 1000) {
      this.serverLogs.splice(1000);
    }

    // Also log to console
    logger.log(level, `[MCP-${component.toUpperCase()}] ${message}`, metadata);
  }
}