/**
 * A2A WebSocket Handlers
 * Real-time streaming handlers pour les données du cockpit A2A
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { A2AProtocol } from '../a2a/A2AProtocol';
import { logger } from '../utils/logger';

export class A2AWebSocketHandler {
  private io: SocketIOServer;
  private a2aProtocol: A2AProtocol | null = null;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectedClients: Set<string> = new Set();

  // Data stores for real-time updates
  private systemLogs: any[] = [];
  private networkEvents: any[] = [];
  private messageFlow: any[] = [];
  private performanceHistory: any[] = [];

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupNamespaces();
    logger.info('[A2A WebSocket] Handler initialized');
  }

  /**
   * Initialize with A2AProtocol instance
   */
  initialize(protocol: A2AProtocol) {
    this.a2aProtocol = protocol;
    this.setupProtocolEventListeners();
    logger.info('[A2A WebSocket] Initialized with A2AProtocol instance');
  }

  /**
   * Setup WebSocket namespaces pour different data streams
   */
  private setupNamespaces() {
    // Network topology updates namespace
    this.io.of('/api/a2a/network/live').on('connection', (socket) => {
      this.handleNetworkConnection(socket);
    });

    // Message flow namespace
    this.io.of('/api/a2a/messages/live').on('connection', (socket) => {
      this.handleMessageFlowConnection(socket);
    });

    // System logs streaming namespace
    this.io.of('/api/a2a/logs/live').on('connection', (socket) => {
      this.handleLogsConnection(socket);
    });

    // Performance metrics namespace
    this.io.of('/api/a2a/metrics/live').on('connection', (socket) => {
      this.handleMetricsConnection(socket);
    });

    // System health namespace
    this.io.of('/api/a2a/health/live').on('connection', (socket) => {
      this.handleHealthConnection(socket);
    });
  }

  /**
   * Handle network topology connection
   */
  private handleNetworkConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[A2A WebSocket] Client ${clientId} connected to network live`);

    // Send initial network data
    const initialNetworkData = this.getNetworkTopologyData();
    socket.emit('network_topology', {
      type: 'network_topology',
      data: initialNetworkData,
      timestamp: new Date().toISOString(),
      channel: 'a2a/network/live'
    });

    // Setup periodic updates
    const interval = setInterval(() => {
      if (socket.connected) {
        const networkData = this.getNetworkTopologyData();
        socket.emit('network_update', {
          type: 'network_update',
          data: networkData,
          timestamp: new Date().toISOString(),
          channel: 'a2a/network/live'
        });
      }
    }, 3000);

    this.updateIntervals.set(`network-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`network-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`network-${clientId}`);
      }
      logger.info(`[A2A WebSocket] Client ${clientId} disconnected from network`);
    });
  }

  /**
   * Handle message flow connection
   */
  private handleMessageFlowConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[A2A WebSocket] Client ${clientId} connected to message flow live`);

    // Send initial message flow data
    socket.emit('message_flow_list', {
      type: 'message_flow_list',
      data: this.messageFlow.slice(-20), // Last 20 messages
      timestamp: new Date().toISOString(),
      channel: 'a2a/messages/live'
    });

    // Setup periodic updates for new messages
    const interval = setInterval(() => {
      if (socket.connected) {
        // Simulate new message occasionally
        if (Math.random() < 0.3) { // 30% chance per interval
          const newMessage = this.generateMockMessage();
          this.messageFlow.unshift(newMessage);
          
          // Keep only last 1000 messages
          if (this.messageFlow.length > 1000) {
            this.messageFlow = this.messageFlow.slice(0, 1000);
          }
          
          socket.emit('new_message', {
            type: 'new_message',
            data: newMessage,
            timestamp: new Date().toISOString(),
            channel: 'a2a/messages/live'
          });
        }
      }
    }, 2000);

    this.updateIntervals.set(`messages-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`messages-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`messages-${clientId}`);
      }
      logger.info(`[A2A WebSocket] Client ${clientId} disconnected from messages`);
    });
  }

  /**
   * Handle logs streaming connection
   */
  private handleLogsConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[A2A WebSocket] Client ${clientId} connected to logs live`);

    // Send initial logs data
    socket.emit('logs_list', {
      type: 'logs_list',
      data: this.systemLogs.slice(-50), // Last 50 logs
      timestamp: new Date().toISOString(),
      channel: 'a2a/logs/live'
    });

    // Setup periodic updates for new logs
    const interval = setInterval(() => {
      if (socket.connected) {
        // Generate new log entry occasionally
        if (Math.random() < 0.4) { // 40% chance per interval
          const newLog = this.generateMockLog();
          this.systemLogs.unshift(newLog);
          
          // Keep only last 5000 logs
          if (this.systemLogs.length > 5000) {
            this.systemLogs = this.systemLogs.slice(0, 5000);
          }
          
          socket.emit('new_log', {
            type: 'new_log',
            data: newLog,
            timestamp: new Date().toISOString(),
            channel: 'a2a/logs/live'
          });
        }
      }
    }, 1500);

    this.updateIntervals.set(`logs-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`logs-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`logs-${clientId}`);
      }
      logger.info(`[A2A WebSocket] Client ${clientId} disconnected from logs`);
    });
  }

  /**
   * Handle performance metrics connection
   */
  private handleMetricsConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[A2A WebSocket] Client ${clientId} connected to metrics live`);

    // Send initial metrics data
    socket.emit('metrics_data', {
      type: 'metrics_data',
      data: this.getPerformanceData(),
      timestamp: new Date().toISOString(),
      channel: 'a2a/metrics/live'
    });

    // Setup periodic metrics updates
    const interval = setInterval(() => {
      if (socket.connected) {
        const metricsData = this.getPerformanceData();
        this.performanceHistory.unshift(metricsData);
        
        // Keep only last 100 metrics snapshots
        if (this.performanceHistory.length > 100) {
          this.performanceHistory = this.performanceHistory.slice(0, 100);
        }
        
        socket.emit('metrics_update', {
          type: 'metrics_update',
          data: metricsData,
          timestamp: new Date().toISOString(),
          channel: 'a2a/metrics/live'
        });
      }
    }, 5000);

    this.updateIntervals.set(`metrics-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`metrics-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`metrics-${clientId}`);
      }
      logger.info(`[A2A WebSocket] Client ${clientId} disconnected from metrics`);
    });
  }

  /**
   * Handle system health connection
   */
  private handleHealthConnection(socket: Socket) {
    const clientId = socket.id;
    this.connectedClients.add(clientId);
    
    logger.info(`[A2A WebSocket] Client ${clientId} connected to health live`);

    // Send initial health data
    socket.emit('health_status', {
      type: 'health_status',
      data: this.getSystemHealthData(),
      timestamp: new Date().toISOString(),
      channel: 'a2a/health/live'
    });

    // Setup periodic health updates
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('health_update', {
          type: 'health_update',
          data: this.getSystemHealthData(),
          timestamp: new Date().toISOString(),
          channel: 'a2a/health/live'
        });
      }
    }, 10000);

    this.updateIntervals.set(`health-${clientId}`, interval);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      const intervalId = this.updateIntervals.get(`health-${clientId}`);
      if (intervalId) {
        clearInterval(intervalId);
        this.updateIntervals.delete(`health-${clientId}`);
      }
      logger.info(`[A2A WebSocket] Client ${clientId} disconnected from health`);
    });
  }

  /**
   * Setup event listeners pour A2AProtocol
   */
  private setupProtocolEventListeners() {
    if (!this.a2aProtocol) return;

    // Listen to protocol events and broadcast to connected clients
    this.a2aProtocol.on('agent.registered', (agent) => {
      this.broadcastNetworkUpdate('agent_registered', agent);
      this.addSystemLog('INFO', `Agent registered: ${agent.agentId}`, 'A2ARegistry');
    });

    this.a2aProtocol.on('agent.unregistered', (agent) => {
      this.broadcastNetworkUpdate('agent_unregistered', agent);
      this.addSystemLog('INFO', `Agent unregistered: ${agent.agentId}`, 'A2ARegistry');
    });

    this.a2aProtocol.on('message.sent', (message) => {
      this.broadcastMessageUpdate('message_sent', message);
      this.addSystemLog('DEBUG', `Message sent: ${message.id}`, 'MessageRouter');
    });

    this.a2aProtocol.on('message.received', (message) => {
      this.broadcastMessageUpdate('message_received', message);
      this.addSystemLog('DEBUG', `Message received: ${message.id}`, 'MessageRouter');
    });

    logger.info('[A2A WebSocket] Protocol event listeners setup complete');
  }

  /**
   * Get network topology data
   */
  private getNetworkTopologyData(): any {
    if (!this.a2aProtocol) {
      return { agents: [], connections: {}, lastUpdated: new Date().toISOString() };
    }
    
    return this.a2aProtocol.getTopology();
  }

  /**
   * Get performance data
   */
  private getPerformanceData(): any {
    const memUsage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: Math.floor(Math.random() * 50) + 10 // Mock CPU usage 10-60%
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      network: {
        connectedAgents: this.a2aProtocol ? this.a2aProtocol.getTopology().agents.filter(a => a.status === 'online').length : 0,
        messageRate: Math.floor(Math.random() * 100) + 10,
        averageLatency: Math.floor(Math.random() * 200) + 50
      },
      system: {
        uptime: process.uptime(),
        loadAverage: Math.random() * 2,
        healthScore: 0.8 + Math.random() * 0.2
      }
    };
  }

  /**
   * Get system health data
   */
  private getSystemHealthData(): any {
    return {
      status: Math.random() > 0.9 ? 'degraded' : 'healthy',
      protocolInitialized: !!this.a2aProtocol,
      connectedClients: this.connectedClients.size,
      activeStreams: this.updateIntervals.size,
      uptime: process.uptime(),
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Generate mock message for testing
   */
  private generateMockMessage(): any {
    const agents = ['vegapunk-001', 'shaka-001', 'supervisor-001'];
    const messageTypes = ['task_delegate', 'capability_query', 'status_update', 'response'];
    const statuses = ['delivered', 'pending', 'failed'];

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: agents[Math.floor(Math.random() * agents.length)],
      to: agents[Math.floor(Math.random() * agents.length)],
      type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      timestamp: new Date().toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: Math.random() > 0.7 ? 'high' : 'normal',
      size: Math.floor(Math.random() * 2048) + 256
    };
  }

  /**
   * Generate mock log entry
   */
  private generateMockLog(): any {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const components = ['A2AProtocol', 'MessageRouter', 'AgentRegistry', 'HealthMonitor'];
    const messages = [
      'Agent heartbeat received',
      'Message routing completed',
      'Network topology updated',
      'Health check passed',
      'Capability query processed',
      'Agent discovery completed',
      'Performance metrics collected',
      'System health evaluated'
    ];

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      component: components[Math.floor(Math.random() * components.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      pid: process.pid
    };
  }

  /**
   * Add system log
   */
  private addSystemLog(level: string, message: string, component: string) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      pid: process.pid
    };

    this.systemLogs.unshift(log);
    
    // Keep only last 5000 logs
    if (this.systemLogs.length > 5000) {
      this.systemLogs = this.systemLogs.slice(0, 5000);
    }

    // Broadcast to connected log clients
    this.io.of('/api/a2a/logs/live').emit('new_log', {
      type: 'new_log',
      data: log,
      timestamp: new Date().toISOString(),
      channel: 'a2a/logs/live'
    });
  }

  /**
   * Broadcast network update to all connected clients
   */
  private broadcastNetworkUpdate(eventType: string, data: any) {
    this.io.of('/api/a2a/network/live').emit('network_event', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      channel: 'a2a/network/live'
    });
  }

  /**
   * Broadcast message update to all connected clients
   */
  private broadcastMessageUpdate(eventType: string, data: any) {
    this.io.of('/api/a2a/messages/live').emit('message_event', {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      channel: 'a2a/messages/live'
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      activeStreams: this.updateIntervals.size,
      dataStores: {
        systemLogs: this.systemLogs.length,
        messageFlow: this.messageFlow.length,
        networkEvents: this.networkEvents.length,
        performanceHistory: this.performanceHistory.length
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all intervals
    for (const interval of this.updateIntervals.values()) {
      clearInterval(interval);
    }
    this.updateIntervals.clear();
    this.connectedClients.clear();
    
    logger.info('[A2A WebSocket] Cleanup completed');
  }
}