/**
 * MCP WebSocket Handler - Real-time data streaming for MCP Advanced Cockpit
 * Fournit des WebSocket channels pour server status, logs, executions, metrics et alerts
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { MCPServerManager } from '../api/services/MCPServerManager';
import { MCPToolsService } from '../api/services/MCPToolsService';
import { logger } from '../utils/logger';

interface MCPWebSocketData {
  serverStatus?: any;
  logs?: any[];
  executions?: any[];
  metrics?: any;
  alerts?: any[];
  tools?: any[];
  resources?: any[];
}

export class MCPWebSocketHandler {
  private io: SocketServer;
  private mcpServerManager?: MCPServerManager;
  private mcpToolsService?: MCPToolsService;
  private activeConnections: Set<string> = new Set();
  private dataStreamIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(io: SocketServer) {
    this.io = io;
  }

  /**
   * Initialize MCP WebSocket handler
   */
  initialize(serverManager: MCPServerManager, toolsService: MCPToolsService): void {
    this.mcpServerManager = serverManager;
    this.mcpToolsService = toolsService;

    // Setup WebSocket namespaces for MCP data
    this.setupServerStatusNamespace();
    this.setupLogsStreamNamespace();
    this.setupExecutionsNamespace();
    this.setupMetricsNamespace();
    this.setupAlertsNamespace();

    // Setup event listeners
    this.setupEventListeners();

    this.isInitialized = true;
    logger.info('✅ MCP WebSocket handler initialized with 5 namespaces');
  }

  /**
   * Setup server status WebSocket namespace
   */
  private setupServerStatusNamespace(): void {
    const serverNamespace = this.io.of('/api/mcp/server/live');

    serverNamespace.on('connection', (socket: Socket) => {
      logger.info(`🔧 MCP Server status client connected: ${socket.id}`);
      this.activeConnections.add(socket.id);

      // Send initial server status
      this.sendServerStatusUpdate(socket);

      // Setup periodic status updates
      const statusInterval = setInterval(async () => {
        try {
          await this.sendServerStatusUpdate(socket);
        } catch (error) {
          logger.error('Error sending server status update:', error);
        }
      }, 2000); // Update every 2 seconds

      this.dataStreamIntervals.set(`server-${socket.id}`, statusInterval);

      socket.on('disconnect', () => {
        logger.info(`🔧 MCP Server status client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
        const interval = this.dataStreamIntervals.get(`server-${socket.id}`);
        if (interval) {
          clearInterval(interval);
          this.dataStreamIntervals.delete(`server-${socket.id}`);
        }
      });

      // Handle server control commands
      socket.on('mcp-server-start', async (data) => {
        try {
          await this.mcpServerManager?.startServer(data.config);
          socket.emit('mcp-server-command-result', {
            command: 'start',
            success: true,
            message: 'Server started successfully'
          });
        } catch (error: any) {
          socket.emit('mcp-server-command-result', {
            command: 'start',
            success: false,
            error: error.message
          });
        }
      });

      socket.on('mcp-server-stop', async () => {
        try {
          await this.mcpServerManager?.stopServer();
          socket.emit('mcp-server-command-result', {
            command: 'stop',
            success: true,
            message: 'Server stopped successfully'
          });
        } catch (error: any) {
          socket.emit('mcp-server-command-result', {
            command: 'stop',
            success: false,
            error: error.message
          });
        }
      });

      socket.on('mcp-server-restart', async () => {
        try {
          await this.mcpServerManager?.restartServer();
          socket.emit('mcp-server-command-result', {
            command: 'restart',
            success: true,
            message: 'Server restarted successfully'
          });
        } catch (error: any) {
          socket.emit('mcp-server-command-result', {
            command: 'restart',
            success: false,
            error: error.message
          });
        }
      });
    });
  }

  /**
   * Setup logs stream WebSocket namespace
   */
  private setupLogsStreamNamespace(): void {
    const logsNamespace = this.io.of('/api/mcp/logs/live');

    logsNamespace.on('connection', (socket: Socket) => {
      logger.info(`📝 MCP Logs client connected: ${socket.id}`);
      this.activeConnections.add(socket.id);

      // Send initial logs
      this.sendLogsUpdate(socket);

      // Setup periodic logs updates
      const logsInterval = setInterval(async () => {
        try {
          await this.sendLogsUpdate(socket);
        } catch (error) {
          logger.error('Error sending logs update:', error);
        }
      }, 1000); // Update every 1 second

      this.dataStreamIntervals.set(`logs-${socket.id}`, logsInterval);

      socket.on('disconnect', () => {
        logger.info(`📝 MCP Logs client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
        const interval = this.dataStreamIntervals.get(`logs-${socket.id}`);
        if (interval) {
          clearInterval(interval);
          this.dataStreamIntervals.delete(`logs-${socket.id}`);
        }
      });

      // Handle log filtering
      socket.on('mcp-logs-filter', async (filters) => {
        try {
          const logs = await this.mcpServerManager?.getServerLogs(filters);
          socket.emit('mcp-logs-filtered', {
            logs,
            filters,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('mcp-logs-error', { error: error.message });
        }
      });
    });
  }

  /**
   * Setup executions WebSocket namespace
   */
  private setupExecutionsNamespace(): void {
    const executionsNamespace = this.io.of('/api/mcp/executions/live');

    executionsNamespace.on('connection', (socket: Socket) => {
      logger.info(`⚡ MCP Executions client connected: ${socket.id}`);
      this.activeConnections.add(socket.id);

      // Send initial executions data
      this.sendExecutionsUpdate(socket);

      // Setup periodic executions updates
      const executionsInterval = setInterval(async () => {
        try {
          await this.sendExecutionsUpdate(socket);
        } catch (error) {
          logger.error('Error sending executions update:', error);
        }
      }, 1500); // Update every 1.5 seconds

      this.dataStreamIntervals.set(`executions-${socket.id}`, executionsInterval);

      socket.on('disconnect', () => {
        logger.info(`⚡ MCP Executions client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
        const interval = this.dataStreamIntervals.get(`executions-${socket.id}`);
        if (interval) {
          clearInterval(interval);
          this.dataStreamIntervals.delete(`executions-${socket.id}`);
        }
      });

      // Handle execution control
      socket.on('mcp-execution-cancel', async (data) => {
        try {
          await this.mcpServerManager?.cancelExecution(data.executionId);
          socket.emit('mcp-execution-cancelled', {
            executionId: data.executionId,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('mcp-execution-error', { error: error.message });
        }
      });
    });
  }

  /**
   * Setup metrics WebSocket namespace
   */
  private setupMetricsNamespace(): void {
    const metricsNamespace = this.io.of('/api/mcp/metrics/live');

    metricsNamespace.on('connection', (socket: Socket) => {
      logger.info(`📊 MCP Metrics client connected: ${socket.id}`);
      this.activeConnections.add(socket.id);

      // Send initial metrics
      this.sendMetricsUpdate(socket);

      // Setup periodic metrics updates
      const metricsInterval = setInterval(async () => {
        try {
          await this.sendMetricsUpdate(socket);
        } catch (error) {
          logger.error('Error sending metrics update:', error);
        }
      }, 3000); // Update every 3 seconds

      this.dataStreamIntervals.set(`metrics-${socket.id}`, metricsInterval);

      socket.on('disconnect', () => {
        logger.info(`📊 MCP Metrics client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
        const interval = this.dataStreamIntervals.get(`metrics-${socket.id}`);
        if (interval) {
          clearInterval(interval);
          this.dataStreamIntervals.delete(`metrics-${socket.id}`);
        }
      });
    });
  }

  /**
   * Setup alerts WebSocket namespace
   */
  private setupAlertsNamespace(): void {
    const alertsNamespace = this.io.of('/api/mcp/alerts/live');

    alertsNamespace.on('connection', (socket: Socket) => {
      logger.info(`🚨 MCP Alerts client connected: ${socket.id}`);
      this.activeConnections.add(socket.id);

      // Send initial alerts
      this.sendAlertsUpdate(socket);

      // Setup periodic alerts updates
      const alertsInterval = setInterval(async () => {
        try {
          await this.sendAlertsUpdate(socket);
        } catch (error) {
          logger.error('Error sending alerts update:', error);
        }
      }, 5000); // Update every 5 seconds

      this.dataStreamIntervals.set(`alerts-${socket.id}`, alertsInterval);

      socket.on('disconnect', () => {
        logger.info(`🚨 MCP Alerts client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
        const interval = this.dataStreamIntervals.get(`alerts-${socket.id}`);
        if (interval) {
          clearInterval(interval);
          this.dataStreamIntervals.delete(`alerts-${socket.id}`);
        }
      });

      // Handle alert acknowledgment
      socket.on('mcp-alerts-acknowledge', async (data) => {
        try {
          await this.mcpServerManager?.acknowledgeAlerts(data.alertIds);
          socket.emit('mcp-alerts-acknowledged', {
            alertIds: data.alertIds,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          socket.emit('mcp-alerts-error', { error: error.message });
        }
      });
    });
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners(): void {
    if (!this.mcpServerManager || !this.mcpToolsService) return;

    // Server events
    this.mcpServerManager.on('server.started', (config) => {
      this.broadcastToNamespace('/api/mcp/server/live', 'mcp-server-started', { config });
    });

    this.mcpServerManager.on('server.stopped', () => {
      this.broadcastToNamespace('/api/mcp/server/live', 'mcp-server-stopped', {});
    });

    // Tool events
    this.mcpToolsService.on('tool.tested', (toolId, result) => {
      this.broadcastToNamespace('/api/mcp/executions/live', 'mcp-tool-tested', { toolId, result });
    });

    this.mcpToolsService.on('tool.registered', (toolName) => {
      this.broadcastToNamespace('/api/mcp/metrics/live', 'mcp-tool-registered', { toolName });
    });

    this.mcpToolsService.on('tool.removed', (toolId) => {
      this.broadcastToNamespace('/api/mcp/metrics/live', 'mcp-tool-removed', { toolId });
    });
  }

  /**
   * Send server status update to client
   */
  private async sendServerStatusUpdate(socket: Socket): Promise<void> {
    if (!this.mcpServerManager) return;

    try {
      const status = await this.mcpServerManager.getServerStatus();
      const health = await this.mcpServerManager.getHealthCheck();
      
      socket.emit('mcp-server-status', {
        status,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting server status:', error);
    }
  }

  /**
   * Send logs update to client
   */
  private async sendLogsUpdate(socket: Socket): Promise<void> {
    if (!this.mcpServerManager) return;

    try {
      const logs = await this.mcpServerManager.getServerLogs({
        level: 'all',
        limit: 50
      });
      
      // Simulate new log entry occasionally
      if (Math.random() < 0.3) {
        const levels = ['info', 'warn', 'error', 'debug'];
        const components = ['server', 'tools', 'resources', 'executions'];
        const messages = [
          'Tool execution completed successfully',
          'Resource accessed by client',
          'Server health check passed',
          'New tool registered in system',
          'Execution metrics updated',
          'Configuration change detected'
        ];

        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          level: levels[Math.floor(Math.random() * levels.length)],
          component: components[Math.floor(Math.random() * components.length)],
          message: messages[Math.floor(Math.random() * messages.length)]
        };

        socket.emit('mcp-logs-new', { log: newLog });
      }

      socket.emit('mcp-logs-update', {
        logs,
        total: logs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting logs:', error);
    }
  }

  /**
   * Send executions update to client
   */
  private async sendExecutionsUpdate(socket: Socket): Promise<void> {
    if (!this.mcpServerManager) return;

    try {
      const activeExecutions = await this.mcpServerManager.getActiveExecutions();
      const analytics = await this.mcpServerManager.getExecutionAnalytics();
      
      socket.emit('mcp-executions-update', {
        activeExecutions,
        analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting executions:', error);
    }
  }

  /**
   * Send metrics update to client
   */
  private async sendMetricsUpdate(socket: Socket): Promise<void> {
    if (!this.mcpServerManager || !this.mcpToolsService) return;

    try {
      const serverMetrics = await this.mcpServerManager.getPerformanceMetrics();
      const toolAnalytics = await this.mcpToolsService.getToolAnalytics();
      
      socket.emit('mcp-metrics-update', {
        server: serverMetrics,
        tools: toolAnalytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting metrics:', error);
    }
  }

  /**
   * Send alerts update to client
   */
  private async sendAlertsUpdate(socket: Socket): Promise<void> {
    if (!this.mcpServerManager) return;

    try {
      // Generate mock alerts for demonstration
      const mockAlerts = [];
      
      if (Math.random() < 0.2) {
        const alertTypes = ['warning', 'error', 'info'];
        const alertMessages = [
          'High memory usage detected in tool execution',
          'Server response time above threshold',
          'Failed tool execution retry limit reached',
          'Resource access rate limit approaching',
          'Configuration validation warning'
        ];

        mockAlerts.push({
          id: `alert-${Date.now()}`,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          title: 'System Alert',
          message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      }

      socket.emit('mcp-alerts-update', {
        alerts: mockAlerts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error generating alerts:', error);
    }
  }

  /**
   * Broadcast message to all clients in a namespace
   */
  private broadcastToNamespace(namespace: string, event: string, data: any): void {
    this.io.of(namespace).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      activeConnections: this.activeConnections.size,
      dataStreams: this.dataStreamIntervals.size,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Cleanup handler
   */
  cleanup(): void {
    logger.info('🔧 Cleaning up MCP WebSocket handler...');
    
    // Clear all intervals
    for (const [key, interval] of this.dataStreamIntervals.entries()) {
      clearInterval(interval);
      logger.info(`Cleared interval: ${key}`);
    }
    
    this.dataStreamIntervals.clear();
    this.activeConnections.clear();
    
    logger.info('✅ MCP WebSocket handler cleanup completed');
  }
}