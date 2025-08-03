/**
 * MCPServerManager - Service pour la gestion du serveur MCP
 * Contrôle lifecycle, métriques, santé et monitoring du serveur MCP
 */

import { MCPServerConfig, MCPHealthCheck, MCPMetrics } from '../../mcp/types';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import * as os from 'os';

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
  private mcpProcess: ChildProcess | null = null;
  private serverLogs: LogEntry[] = [];
  private executions: Map<string, ExecutionInfo> = new Map();
  private resources: MCPResource[] = [];
  private resourceUsage: Map<string, ResourceUsage> = new Map();
  private isServerRunning = false;
  private serverStartTime = 0;
  private shouldStayShutdown = false;
  private serverMetrics: MCPMetrics | null = null;
  private serverConfig: MCPServerConfig = {
    name: 'vegapunk-mcp',
    version: '1.0.0',
    description: 'Vegapunk MCP Server - Multi-agent capabilities exposed through standardized protocol',
    host: 'stdio',
    port: 0, // stdio doesn't use ports
    enableA2AIntegration: true,
    enableLangGraphIntegration: true,
    tools: {
      enabled: true,
      enabledCategories: ['ethical-analysis', 'technical-support'],
      customTools: []
    },
    resources: {
      enabled: true,
      enabledResources: []
    },
    monitoring: {
      healthCheckInterval: 30000,
      loggingEnabled: true
    }
  };

  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;

  /**
   * Initialize the MCP Server Manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize resources and mock data
      this.initializeMockResources();
      this.startHealthCheck();
      this.startMetricsCollection();
      
      this.addLog('info', 'server', 'MCP Server Manager initialized');
      this.emit('initialized');
    } catch (error: any) {
      this.addLog('error', 'server', `Failed to initialize MCP Server Manager: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start MCP server - Launch the real standalone MCP server process
   */
  async startServer(config?: Partial<MCPServerConfig>): Promise<void> {
    if (this.isServerRunning || this.mcpProcess) {
      this.addLog('info', 'server', 'MCP server already running');
      return;
    }

    try {
      this.shouldStayShutdown = false;
      this.addLog('info', 'server', 'Starting MCP server process...');
      
      // Update config if provided
      if (config) {
        this.serverConfig = { ...this.serverConfig, ...config };
      }

      // Determine the MCP server path - accounting for compiled TypeScript in dist folder
      const serverPath = path.join(__dirname, '../../../mcp-server/vegapunk-mcp-server.js');
      this.addLog('debug', 'server', `Server path: ${serverPath}`);
      
      // Verify the server file exists
      const fs = require('fs');
      if (!fs.existsSync(serverPath)) {
        throw new Error(`MCP server not found at: ${serverPath}`);
      }

      // Spawn the MCP server process
      this.mcpProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      });

      // Handle process events
      this.mcpProcess.on('error', (error) => {
        this.addLog('error', 'server', `Failed to start MCP server process: ${error.message}`);
        this.isServerRunning = false;
        this.emit('server.error', error);
      });

      this.mcpProcess.on('exit', (code, signal) => {
        this.addLog('info', 'server', `MCP server process exited with code ${code} and signal ${signal}`);
        this.isServerRunning = false;
        this.mcpProcess = null;
        
        // Only emit stopped if it wasn't a planned shutdown
        if (!this.shouldStayShutdown) {
          this.emit('server.stopped');
        }
      });

      // Capture stderr for logs (MCP protocol uses stderr for logging)
      this.mcpProcess.stderr?.on('data', (data) => {
        const logMessage = data.toString().trim();
        this.handleServerLog(logMessage);
      });

      // Capture stdout (for debugging, but MCP should primarily use stderr)
      this.mcpProcess.stdout?.on('data', (data) => {
        const message = data.toString().trim();
        this.addLog('debug', 'server-stdout', message);
      });

      // Mark as running after successful spawn
      this.isServerRunning = true;
      this.serverStartTime = Date.now();

      // Wait a bit to ensure the server is fully started
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.addLog('info', 'server', 'MCP server started successfully');
      this.emit('server.started');
      
    } catch (error: any) {
      this.isServerRunning = false;
      this.mcpProcess = null;
      this.addLog('error', 'server', `Failed to start MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop MCP server
   */
  async stopServer(): Promise<void> {
    if (!this.isServerRunning && !this.mcpProcess) {
      this.addLog('info', 'server', 'MCP server already stopped');
      return;
    }

    try {
      this.shouldStayShutdown = true;
      this.addLog('info', 'server', 'Stopping MCP server...');
      
      if (this.mcpProcess) {
        // Send SIGTERM for graceful shutdown
        this.mcpProcess.kill('SIGTERM');
        
        // Wait for process to exit (max 5 seconds)
        await new Promise<void>((resolve) => {
          let timeout: NodeJS.Timeout;
          
          const cleanup = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          // Set timeout for force kill
          timeout = setTimeout(() => {
            if (this.mcpProcess && !this.mcpProcess.killed) {
              this.addLog('warn', 'server', 'Force killing MCP server process');
              this.mcpProcess.kill('SIGKILL');
            }
            cleanup();
          }, 5000);
          
          // Wait for process exit
          if (this.mcpProcess) {
            this.mcpProcess.once('exit', cleanup);
          } else {
            cleanup();
          }
        });
      }
      
      this.isServerRunning = false;
      this.mcpProcess = null;
      this.serverStartTime = 0;
      
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
      this.shouldStayShutdown = false; // Allow restart
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    let currentStatus: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
    
    if (this.shouldStayShutdown) {
      currentStatus = 'stopped';
    } else if (this.isServerRunning && this.mcpProcess && !this.mcpProcess.killed) {
      currentStatus = 'running';
    } else if (this.mcpProcess && !this.isServerRunning) {
      currentStatus = 'starting';
    } else {
      currentStatus = 'stopped';
    }
    
    const uptime = (currentStatus === 'running') ? Date.now() - this.serverStartTime : 0;
    
    // Get process metrics if running
    let processMetrics = null;
    if (this.mcpProcess && this.mcpProcess.pid) {
      processMetrics = await this.getProcessMetrics(this.mcpProcess.pid);
    }
    
    return {
      status: currentStatus,
      uptime: uptime,
      pid: this.mcpProcess?.pid,
      version: this.serverConfig.version,
      host: this.serverConfig.host || 'stdio',
      port: this.serverConfig.port || 0,
      connections: (currentStatus === 'running') ? 1 : 0,
      lastHeartbeat: new Date().toISOString(),
      ...processMetrics
    };
  }

  /**
   * Get server metrics
   */
  async getServerMetrics(): Promise<MCPMetrics> {
    if (!this.isServerRunning || !this.serverMetrics) {
      return this.getDefaultMetrics();
    }
    
    // Update server uptime
    this.serverMetrics.server.uptime = Date.now() - this.serverStartTime;
    
    return this.serverMetrics;
  }

  /**
   * Get health check
   */
  async getHealthCheck(): Promise<MCPHealthCheck> {
    const isHealthy = this.isServerRunning && this.mcpProcess && !this.mcpProcess.killed;
    const hasErrors = this.serverLogs.filter(log => log.level === 'error' && 
      new Date(log.timestamp).getTime() > Date.now() - 60000).length > 0;
    
    return {
      status: isHealthy ? (hasErrors ? 'degraded' : 'healthy') : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        server: {
          status: this.isServerRunning ? 'healthy' : 'unhealthy',
          message: this.isServerRunning ? 'MCP server process is running' : 'MCP server process is stopped',
          lastCheck: new Date().toISOString()
        },
        tools: {
          status: this.isServerRunning ? 'healthy' : 'degraded',
          message: this.isServerRunning ? 'Tools subsystem operational' : 'Tools unavailable - server not running',
          lastCheck: new Date().toISOString()
        },
        resources: {
          status: 'healthy',
          message: `${this.resources.length} resources available`,
          lastCheck: new Date().toISOString()
        },
        connectivity: {
          status: this.isServerRunning ? 'healthy' : 'unhealthy',
          message: this.isServerRunning ? 'MCP server accepting connections' : 'No active connections',
          lastCheck: new Date().toISOString()
        }
      },
      metrics: {
        uptime: this.isServerRunning ? Date.now() - this.serverStartTime : 0,
        requestsPerMinute: this.calculateRequestsPerMinute(),
        errorRate: this.calculateErrorRate(),
        avgResponseTime: 45 // Still mocked for now
      }
    };
  }

  /**
   * Get server logs
   */
  async getServerLogs(filters: LogFilters): Promise<LogEntry[]> {
    let logs = [...this.serverLogs];
    
    // Apply filters
    if (filters.level && filters.level !== 'all') {
      logs = logs.filter(log => log.level === filters.level);
    }
    
    if (filters.component) {
      logs = logs.filter(log => log.component.includes(filters.component));
    }
    
    if (filters.startTime) {
      const start = new Date(filters.startTime).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= start);
    }
    
    if (filters.endTime) {
      const end = new Date(filters.endTime).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= end);
    }
    
    // Sort by timestamp desc and limit
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return logs.slice(0, filters.limit);
  }

  /**
   * Get server configuration
   */
  async getServerConfig(): Promise<MCPServerConfig> {
    return { ...this.serverConfig };
  }

  /**
   * Update server configuration
   */
  async updateServerConfig(config: Partial<MCPServerConfig>): Promise<void> {
    this.serverConfig = { ...this.serverConfig, ...config };
    this.addLog('info', 'config', 'Server configuration updated');
    
    // If server is running, it will need restart to apply config
    if (this.isServerRunning) {
      this.addLog('info', 'config', 'Server restart required to apply configuration changes');
    }
  }

  /**
   * Get available resources
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    return [...this.resources];
  }

  /**
   * Get resource usage
   */
  async getResourceUsage(): Promise<ResourceUsage[]> {
    return Array.from(this.resourceUsage.values());
  }

  /**
   * Create resource
   */
  async createResource(resource: MCPResource): Promise<MCPResource> {
    const newResource = {
      ...resource,
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastModified: new Date().toISOString()
    };
    
    this.resources.push(newResource);
    this.addLog('info', 'resources', `Resource created: ${newResource.name}`);
    
    return newResource;
  }

  /**
   * Update resource
   */
  async updateResource(resource: MCPResource): Promise<MCPResource> {
    const index = this.resources.findIndex(r => r.id === resource.id);
    if (index === -1) {
      throw new Error('Resource not found');
    }
    
    const updated = {
      ...resource,
      lastModified: new Date().toISOString()
    };
    
    this.resources[index] = updated;
    this.addLog('info', 'resources', `Resource updated: ${updated.name}`);
    
    return updated;
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    const index = this.resources.findIndex(r => r.id === resourceId);
    if (index === -1) {
      throw new Error('Resource not found');
    }
    
    const deleted = this.resources.splice(index, 1)[0];
    this.resourceUsage.delete(resourceId);
    this.addLog('info', 'resources', `Resource deleted: ${deleted.name}`);
  }

  /**
   * Get active executions
   */
  async getActiveExecutions(): Promise<ExecutionInfo[]> {
    return Array.from(this.executions.values())
      .filter(e => e.status === 'running');
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(filters: ExecutionFilters): Promise<ExecutionInfo[]> {
    let executions = Array.from(this.executions.values());
    
    // Apply filters
    if (filters.status) {
      executions = executions.filter(e => e.status === filters.status);
    }
    
    if (filters.toolId) {
      executions = executions.filter(e => e.toolId === filters.toolId);
    }
    
    // Sort by startTime desc
    executions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    // Apply pagination
    const start = filters.offset || 0;
    const end = start + (filters.limit || 50);
    
    return executions.slice(start, end);
  }

  /**
   * Get execution analytics
   */
  async getExecutionAnalytics(): Promise<ExecutionAnalytics> {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    
    const totalExecutions = executions.length;
    const successRate = totalExecutions > 0 ? completed.length / totalExecutions : 0;
    
    const avgExecutionTime = completed.length > 0
      ? completed.reduce((sum, e) => sum + (e.duration || 0), 0) / completed.length
      : 0;
    
    const failureReasons: { [reason: string]: number } = {};
    failed.forEach(e => {
      const reason = e.error || 'Unknown error';
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });
    
    return {
      totalExecutions,
      successRate,
      avgExecutionTime,
      failureReasons,
      performanceTrends: this.generatePerformanceTrends()
    };
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string): Promise<ExecutionInfo | undefined> {
    return this.executions.get(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }
    
    if (execution.status !== 'running') {
      throw new Error('Execution is not running');
    }
    
    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    execution.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    
    this.addLog('info', 'execution', `Execution cancelled: ${executionId}`);
  }

  /**
   * Get comprehensive health
   */
  async getComprehensiveHealth(): Promise<any> {
    const health = await this.getHealthCheck();
    const metrics = await this.getServerMetrics();
    const status = await this.getServerStatus();
    
    return {
      ...health,
      serverStatus: status,
      systemMetrics: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: Math.random() * 100
      },
      serviceMetrics: metrics
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    const executions = Array.from(this.executions.values());
    const recent = executions.slice(-100);
    const failed = executions.filter(e => e.status === 'failed');
    
    return {
      throughput: {
        current: Math.random() * 200,
        average: 156.3,
        peak: 245.8
      },
      latency: {
        p50: 35,
        p90: 89,
        p95: 134,
        p99: 267
      },
      resources: {
        cpu: {
          current: Math.random() * 100,
          average: 34.2
        },
        memory: {
          used: 512 * 1024 * 1024,
          total: 2 * 1024 * 1024 * 1024,
          percentage: 25
        }
      },
      errors: {
        rate: 0.02,
        total: failed.length,
        recent: failed.slice(-10)
      }
    };
  }

  /**
   * Acknowledge alerts
   */
  async acknowledgeAlerts(alertIds: string[]): Promise<void> {
    alertIds.forEach(id => {
      this.addLog('info', 'alerts', `Alert acknowledged: ${id}`);
    });
  }

  /**
   * Private helper methods
   */
  
  private addLog(level: LogEntry['level'], component: string, message: string, metadata?: any): void {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata
    };
    
    this.serverLogs.push(log);
    
    // Keep only last 1000 logs
    if (this.serverLogs.length > 1000) {
      this.serverLogs = this.serverLogs.slice(-1000);
    }
    
    // Emit log event
    this.emit('log', log);
    
    // Also log to console
    logger[level](`[MCP:${component}] ${message}`, metadata);
  }

  private initializeMockResources(): void {
    this.resources = [
      {
        id: 'res_001',
        uri: 'vegapunk://templates/workflow-orchestration',
        name: 'Workflow Orchestration Template',
        description: 'Template for multi-agent workflow orchestration',
        category: 'template',
        mimeType: 'application/json',
        size: 4096,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      },
      {
        id: 'res_002',
        uri: 'vegapunk://prompts/ethical-analysis',
        name: 'Ethical Analysis Prompts',
        description: 'Curated prompts for AI ethics evaluation',
        category: 'prompt',
        mimeType: 'text/plain',
        size: 2048,
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      },
      {
        id: 'res_003',
        uri: 'vegapunk://integrations/slack',
        name: 'Slack Integration',
        description: 'Integration configuration for Slack messaging',
        category: 'integration',
        mimeType: 'application/json',
        size: 1024,
        lastModified: new Date().toISOString(),
        version: '2.1.0'
      }
    ];
    
    // Initialize mock usage data
    this.resources.forEach(resource => {
      this.resourceUsage.set(resource.id, {
        resourceId: resource.id,
        accessCount: Math.floor(Math.random() * 1000),
        lastAccessed: new Date().toISOString(),
        avgAccessTime: Math.random() * 100,
        errorCount: Math.floor(Math.random() * 10),
        popularityScore: Math.random() * 100
      });
    });
    
    // Initialize server metrics
    this.serverMetrics = this.getDefaultMetrics();
  }

  /**
   * Handle server log messages from MCP server stderr
   */
  private handleServerLog(logMessage: string): void {
    // Parse MCP server log format: [Vegapunk MCP] 2025-08-01T10:38:57.634Z - Message
    const logPattern = /\[Vegapunk MCP\]\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+-\s+(.+)/;
    const match = logMessage.match(logPattern);
    
    let level: LogEntry['level'] = 'info';
    let message = logMessage;
    let timestamp = new Date().toISOString();
    
    if (match) {
      timestamp = match[1];
      message = match[2];
      
      // Determine log level from message content
      if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
        level = 'error';
      } else if (message.toLowerCase().includes('warn')) {
        level = 'warn';
      } else if (message.toLowerCase().includes('debug')) {
        level = 'debug';
      }
    }
    
    // Add to logs
    this.addLog(level, 'mcp-server', message);
    
    // Update metrics based on log content
    if (message.includes('Tool called:')) {
      this.serverMetrics!.tools.totalCalls++;
      const toolName = message.split('Tool called:')[1].trim();
      const currentCount = this.serverMetrics!.tools.callsByTool.get(toolName) || 0;
      this.serverMetrics!.tools.callsByTool.set(toolName, currentCount + 1);
    }
    
    if (message.includes('Listing tools')) {
      this.serverMetrics!.server.totalRequests++;
    }
    
    // Emit log for real-time streaming
    this.emit('log.stream', { level, component: 'mcp-server', message, timestamp });
  }

  /**
   * Get process metrics for a given PID
   */
  private async getProcessMetrics(pid: number): Promise<any> {
    try {
      // For now, we'll use approximations based on Node.js process info
      // In production, you might use a library like pidusage for accurate metrics
      
      // Get memory usage from Node.js process if it's the same process
      const memUsage = process.memoryUsage();
      const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const totalMemoryMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      // CPU usage approximation based on process uptime and server activity
      const cpuUsage = this.serverMetrics?.tools.totalCalls > 0 ? 
        Math.min(10 + (this.serverMetrics.tools.totalCalls * 0.5), 50) : 5;
      
      return {
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryUsage: Math.round(memoryUsage * 10) / 10,
        memoryMB: memoryMB,
        totalMemoryMB: totalMemoryMB,
        uptime: this.isServerRunning ? Date.now() - this.serverStartTime : 0
      };
    } catch (error) {
      this.addLog('debug', 'metrics', `Failed to get process metrics: ${error}`);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryMB: 0
      };
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthCheck();
        this.emit('health.check', health);
      } catch (error: any) {
        this.addLog('error', 'health', `Health check failed: ${error.message}`);
      }
    }, 30000); // Every 30 seconds
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        const metrics = await this.getServerMetrics();
        this.emit('metrics.collected', metrics);
      } catch (error: any) {
        this.addLog('error', 'metrics', `Metrics collection failed: ${error.message}`);
      }
    }, 60000); // Every minute
  }

  private generatePerformanceTrends(): ExecutionAnalytics['performanceTrends'] {
    const trends = [];
    const now = Date.now();
    
    for (let i = 0; i < 24; i++) {
      trends.push({
        timestamp: new Date(now - (i * 60 * 60 * 1000)).toISOString(),
        avgResponseTime: 30 + Math.random() * 70,
        throughput: 100 + Math.random() * 100,
        errorRate: Math.random() * 0.1
      });
    }
    
    return trends.reverse();
  }

  /**
   * Calculate requests per minute from recent logs
   */
  private calculateRequestsPerMinute(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.serverLogs.filter(log => 
      new Date(log.timestamp).getTime() > oneMinuteAgo &&
      (log.message.includes('Tool called') || log.message.includes('Listing'))
    ).length;
    
    return recentRequests;
  }

  /**
   * Calculate error rate from recent logs
   */
  private calculateErrorRate(): number {
    const fiveMinutesAgo = Date.now() - 300000;
    const recentLogs = this.serverLogs.filter(log => 
      new Date(log.timestamp).getTime() > fiveMinutesAgo
    );
    
    if (recentLogs.length === 0) return 0;
    
    const errorLogs = recentLogs.filter(log => log.level === 'error').length;
    return errorLogs / recentLogs.length;
  }

  private getDefaultMetrics(): MCPMetrics {
    return {
      server: {
        uptime: this.isServerRunning ? Date.now() - this.serverStartTime : 0,
        totalRequests: Math.floor(Math.random() * 10000),
        totalErrors: Math.floor(Math.random() * 100),
        activeConnections: this.isServerRunning ? 1 : 0
      },
      tools: {
        totalCalls: Math.floor(Math.random() * 5000),
        callsByTool: new Map(),
        errorsByTool: new Map(),
        averageExecutionTime: new Map()
      },
      resources: {
        totalAccesses: Math.floor(Math.random() * 3000),
        accessesByResource: new Map(),
        errorsByResource: new Map()
      },
      agents: {
        activeAgents: 2,
        requestsByAgent: new Map(),
        sessionDuration: new Map()
      }
    };
  }

  /**
   * Cleanup on destroy
   */
  async destroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    await this.stopServer();
  }
}