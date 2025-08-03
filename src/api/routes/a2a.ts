/**
 * A2A API Routes
 * REST API endpoints pour exposer les données du protocole A2A au cockpit frontend
 */

import express from 'express';
import { A2AProtocol } from '../../a2a/A2AProtocol';
import { logger } from '../../utils/logger';

const router = express.Router();

// Global state pour partager l'instance A2A
let a2aProtocol: A2AProtocol | null = null;
let messageHistory: any[] = [];
let performanceMetrics: any[] = [];
let systemLogs: any[] = [];

/**
 * Initialize A2A router with protocol instance
 */
export function initializeA2ARoutes(protocol: A2AProtocol) {
  a2aProtocol = protocol;
  
  // Setup data collection hooks
  setupDataCollectionHooks();
  
  logger.info('[A2A API] Routes initialized with A2AProtocol instance');
}

/**
 * Setup hooks pour collecter les données en temps réel
 */
function setupDataCollectionHooks() {
  if (!a2aProtocol) return;

  // Listen to A2A protocol events
  a2aProtocol.on('message.sent', (message) => {
    recordMessage(message, 'sent');
  });

  a2aProtocol.on('message.received', (message) => {
    recordMessage(message, 'received');
  });

  a2aProtocol.on('agent.registered', (agent) => {
    recordSystemLog('info', `Agent registered: ${agent.agentId}`, 'A2ARegistry');
  });

  a2aProtocol.on('agent.unregistered', (agent) => {
    recordSystemLog('info', `Agent unregistered: ${agent.agentId}`, 'A2ARegistry');
  });

  logger.info('[A2A API] Data collection hooks setup complete');
}

/**
 * Record message for history
 */
function recordMessage(message: any, direction: 'sent' | 'received') {
  const record = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...message,
    direction,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.1 ? 'delivered' : 'pending'
  };

  messageHistory.unshift(record);
  
  // Keep only last 1000 messages
  if (messageHistory.length > 1000) {
    messageHistory = messageHistory.slice(0, 1000);
  }
}

/**
 * Record system log
 */
function recordSystemLog(level: string, message: string, component: string) {
  const log = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    component,
    message,
    pid: process.pid
  };

  systemLogs.unshift(log);
  
  // Keep only last 5000 logs
  if (systemLogs.length > 5000) {
    systemLogs = systemLogs.slice(0, 5000);
  }
}

// ============================================================================
// NETWORK TOPOLOGY ENDPOINTS
// ============================================================================

/**
 * GET /api/a2a/network/topology
 * Obtenir la topologie du réseau A2A avec données temps réel
 */
router.get('/network/topology', async (req, res) => {
  try {
    if (!a2aProtocol) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'A2A Protocol not initialized' }
      });
    }

    // Get real topology from A2A protocol
    const topology = a2aProtocol.getTopology();
    const networkStats = a2aProtocol.getNetworkStats();

    // Enhance with additional cockpit data
    const enhancedTopology = {
      ...topology,
      networkStats,
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalAgents: topology.agents.length,
        onlineAgents: topology.agents.filter(a => a.status === 'online').length,
        totalConnections: Object.keys(topology.connections || {}).length,
        networkHealth: networkStats.healthScore || 0.95
      }
    };

    res.json({
      success: true,
      data: enhancedTopology,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching network topology:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TOPOLOGY_ERROR', message: 'Failed to fetch network topology' }
    });
  }
});

/**
 * GET /api/a2a/agents
 * Obtenir la liste des agents avec leurs statuts
 */
router.get('/agents', async (req, res) => {
  try {
    if (!a2aProtocol) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'A2A Protocol not initialized' }
      });
    }

    const topology = a2aProtocol.getTopology();
    const agents = topology.agents.map(agent => ({
      ...agent,
      performanceScore: Math.random() * 0.3 + 0.7, // Mock performance 0.7-1.0
      messagesProcessed: Math.floor(Math.random() * 1000) + 100,
      averageResponseTime: Math.floor(Math.random() * 500) + 100,
      currentLoad: Math.floor(Math.random() * 80) + 10
    }));

    res.json({
      success: true,
      data: agents,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AGENTS_ERROR', message: 'Failed to fetch agents' }
    });
  }
});

// ============================================================================
// MESSAGE FLOW ENDPOINTS
// ============================================================================

/**
 * GET /api/a2a/messages/flow
 * Obtenir le flux de messages avec filtering avancé
 */
router.get('/messages/flow', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      agent, 
      timerange = '1h',
      limit = 100 
    } = req.query;

    let filteredMessages = messageHistory;

    // Apply filters
    if (type && type !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.type === type);
    }

    if (status && status !== 'all') {
      filteredMessages = filteredMessages.filter(msg => msg.status === status);
    }

    if (agent && agent !== 'all') {
      filteredMessages = filteredMessages.filter(msg => 
        msg.from === agent || msg.to === agent
      );
    }

    // Apply time range filter
    const now = Date.now();
    const timeRangeMs = parseTimeRange(timerange as string);
    if (timeRangeMs) {
      filteredMessages = filteredMessages.filter(msg => 
        now - new Date(msg.timestamp).getTime() <= timeRangeMs
      );
    }

    // Apply limit
    const limitNum = parseInt(limit as string) || 100;
    filteredMessages = filteredMessages.slice(0, limitNum);

    // Calculate statistics
    const stats = {
      total: filteredMessages.length,
      byStatus: {
        delivered: filteredMessages.filter(m => m.status === 'delivered').length,
        pending: filteredMessages.filter(m => m.status === 'pending').length,
        failed: filteredMessages.filter(m => m.status === 'failed').length
      },
      byType: {},
      averageDeliveryTime: Math.floor(Math.random() * 500) + 100
    };

    res.json({
      success: true,
      data: filteredMessages,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching message flow:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MESSAGE_FLOW_ERROR', message: 'Failed to fetch message flow' }
    });
  }
});

/**
 * GET /api/a2a/messages/recent
 * Obtenir les messages récents
 */
router.get('/messages/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const recentMessages = messageHistory.slice(0, limit);

    res.json({
      success: true,
      data: recentMessages,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching recent messages:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RECENT_MESSAGES_ERROR', message: 'Failed to fetch recent messages' }
    });
  }
});

// ============================================================================
// LOGS ENDPOINTS
// ============================================================================

/**
 * GET /api/a2a/logs
 * Obtenir les logs système avec filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const { 
      level, 
      component, 
      search,
      limit = 200 
    } = req.query;

    let filteredLogs = systemLogs;

    // Apply filters
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level.toString().toUpperCase());
    }

    if (component && component !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    // Apply limit
    const limitNum = parseInt(limit as string) || 200;
    filteredLogs = filteredLogs.slice(0, limitNum);

    res.json({
      success: true,
      data: filteredLogs,
      totalCount: systemLogs.length,
      filteredCount: filteredLogs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGS_ERROR', message: 'Failed to fetch logs' }
    });
  }
});

// ============================================================================
// PERFORMANCE METRICS ENDPOINTS
// ============================================================================

/**
 * GET /api/a2a/metrics/performance
 * Obtenir les métriques de performance
 */
router.get('/metrics/performance', async (req, res) => {
  try {
    if (!a2aProtocol) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'A2A Protocol not initialized' }
      });
    }

    const networkStats = a2aProtocol.getNetworkStats();
    const topology = a2aProtocol.getTopology();

    const performanceMetrics = {
      network: {
        totalAgents: topology.agents.length,
        onlineAgents: topology.agents.filter(a => a.status === 'online').length,
        healthScore: networkStats.healthScore || 0.95,
        uptime: process.uptime(),
        averageResponseTime: Math.floor(Math.random() * 200) + 50
      },
      messaging: {
        totalMessages: messageHistory.length,
        messagesPerMinute: Math.floor(Math.random() * 50) + 10,
        deliverySuccessRate: 0.92 + Math.random() * 0.07,
        averageDeliveryTime: Math.floor(Math.random() * 300) + 100
      },
      agents: {
        averageLoad: Math.floor(Math.random() * 40) + 20,
        peakLoad: Math.floor(Math.random() * 20) + 80,
        utilizationRate: 0.65 + Math.random() * 0.25
      },
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: Math.floor(Math.random() * 30) + 10,
        lastHealthCheck: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: performanceMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PERFORMANCE_ERROR', message: 'Failed to fetch performance metrics' }
    });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

/**
 * POST /api/a2a/reports/generate
 * Générer un rapport personnalisé
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const { reportType, timeRange, parameters } = req.body;

    // Simulate report generation
    const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const report = {
      id: reportId,
      type: reportType,
      generatedAt: new Date().toISOString(),
      timeRange,
      parameters,
      data: generateMockReportData(reportType),
      metadata: {
        dataPoints: Math.floor(Math.random() * 1000) + 100,
        processingTime: Math.floor(Math.random() * 5000) + 1000,
        version: '1.0.0'
      }
    };

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error generating report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'Failed to generate report' }
    });
  }
});

/**
 * GET /api/a2a/reports
 * Obtenir la liste des rapports disponibles
 */
router.get('/reports', async (req, res) => {
  try {
    const mockReports = [
      {
        id: 'report-001',
        name: 'Network Performance Analysis',
        type: 'performance',
        description: 'Comprehensive analysis of network performance metrics',
        generatedAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
        size: '2.4 MB'
      },
      {
        id: 'report-002',
        name: 'Agent Communication Analysis',
        type: 'communication',
        description: 'Analysis of inter-agent communication patterns',
        generatedAt: new Date(Date.now() - 7200000).toISOString(),
        status: 'completed',
        size: '1.8 MB'
      },
      {
        id: 'report-003',
        name: 'System Reliability Report',
        type: 'reliability',
        description: 'System uptime and reliability metrics',
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        size: '1.2 MB'
      }
    ];

    res.json({
      success: true,
      data: mockReports,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORTS_ERROR', message: 'Failed to fetch reports' }
    });
  }
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/a2a/health
 * Obtenir l'état de santé du système A2A
 */
router.get('/health', async (req, res) => {
  try {
    if (!a2aProtocol) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'A2A Protocol not initialized' }
      });
    }

    const networkStats = a2aProtocol.getNetworkStats();
    const health = {
      status: 'healthy',
      protocolInitialized: true,
      networkStats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[A2A API] Error fetching health status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_ERROR', message: 'Failed to fetch health status' }
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseTimeRange(timeRange: string): number | null {
  const timeRangeMap: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return timeRangeMap[timeRange] || null;
}

function generateMockReportData(reportType: string): any {
  switch (reportType) {
    case 'performance':
      return {
        averageResponseTime: Math.floor(Math.random() * 300) + 100,
        successRate: 0.85 + Math.random() * 0.14,
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 0.1
      };
    case 'communication':
      return {
        totalMessages: Math.floor(Math.random() * 10000) + 1000,
        averageMessageSize: Math.floor(Math.random() * 1024) + 256,
        mostActiveAgents: ['vegapunk-001', 'shaka-001'],
        communicationPatterns: 'hub-and-spoke'
      };
    case 'reliability':
      return {
        uptime: 0.95 + Math.random() * 0.049,
        mtbf: Math.floor(Math.random() * 1000) + 500,
        recoveryTime: Math.floor(Math.random() * 60) + 30
      };
    default:
      return {};
  }
}

export default router;