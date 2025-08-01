import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { OllamaProvider } from './llm/OllamaProvider';
import { HuggingFaceProvider } from './llm/HuggingFaceProvider';
import { ChatHandler } from './chat/ChatHandler';
import { ShakaController } from './api/controllers/ShakaController';
import { VegapunkAgentGraph } from './graph/VegapunkAgentGraph';
import langGraphRoutes, { initializeLangGraphRoutes } from './api/routes/langgraph';
import { LangGraphWebSocketHandler } from './websocket/langgraph-handlers';
import a2aRoutes, { initializeA2ARoutes } from './api/routes/a2a';
import { A2AWebSocketHandler } from './websocket/a2a-handlers';
import mcpRoutes, { initializeMCPRoutes } from './api/routes/mcp';
import { MCPServerManager } from './api/services/MCPServerManager';
import { MCPToolsService } from './api/services/MCPToolsService';
import { MCPWebSocketHandler } from './websocket/mcp-handlers';
import { logger } from './utils/logger';

// Chat logs storage
interface ChatLog {
  id: string;
  timestamp: string;
  type: 'user' | 'bot' | 'system' | 'error';
  message: string;
  socketId?: string;
  responseTime?: number;
}

// WebSocket connections tracking
interface SocketConnection {
  id: string;
  connectedAt: string;
  disconnectedAt?: string;
  isActive: boolean;
  messagesCount: number;
  lastActivity: string;
  userAgent?: string;
  remoteAddress?: string;
}

const chatLogs: ChatLog[] = [];
const socketConnections: Map<string, SocketConnection> = new Map();
const connectionHistory: SocketConnection[] = [];
const MAX_LOGS = 1000; // Keep last 1000 messages
const MAX_CONNECTION_HISTORY = 100; // Keep last 100 connections

function addChatLog(type: ChatLog['type'], message: string, socketId?: string, responseTime?: number) {
  const log: ChatLog = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type,
    message,
    socketId,
    responseTime
  };
  
  chatLogs.unshift(log); // Add to beginning
  if (chatLogs.length > MAX_LOGS) {
    chatLogs.splice(MAX_LOGS); // Keep only last MAX_LOGS
  }
  
  logger.info(`Chat log added: ${type} - ${message.substring(0, 50)}...`);
}

function addSocketConnection(socketId: string, req: any) {
  const connection: SocketConnection = {
    id: socketId,
    connectedAt: new Date().toISOString(),
    isActive: true,
    messagesCount: 0,
    lastActivity: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    remoteAddress: req.connection.remoteAddress || req.socket.remoteAddress
  };
  
  socketConnections.set(socketId, connection);
  logger.info(`WebSocket connection added: ${socketId}`);
}

function updateSocketActivity(socketId: string) {
  const connection = socketConnections.get(socketId);
  if (connection) {
    connection.lastActivity = new Date().toISOString();
    connection.messagesCount++;
  }
}

function removeSocketConnection(socketId: string) {
  const connection = socketConnections.get(socketId);
  if (connection) {
    connection.isActive = false;
    connection.disconnectedAt = new Date().toISOString();
    
    // Move to history
    connectionHistory.unshift({ ...connection });
    if (connectionHistory.length > MAX_CONNECTION_HISTORY) {
      connectionHistory.splice(MAX_CONNECTION_HISTORY);
    }
    
    socketConnections.delete(socketId);
    logger.info(`WebSocket connection removed: ${socketId}`);
  }
}

function getWebSocketStats() {
  const activeConnections = Array.from(socketConnections.values());
  const totalMessagesActive = activeConnections.reduce((sum, conn) => sum + conn.messagesCount, 0);
  const totalMessagesHistory = connectionHistory.reduce((sum, conn) => sum + conn.messagesCount, 0);
  
  return {
    activeConnections: activeConnections.length,
    totalConnections: activeConnections.length + connectionHistory.length,
    totalMessages: totalMessagesActive + totalMessagesHistory,
    avgMessagesPerConnection: activeConnections.length > 0 ? 
      Math.round(totalMessagesActive / activeConnections.length) : 0
  };
}

export async function startDashboardOnly(): Promise<void> {
  const app = express();
  const server = createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST']
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Root endpoint - API info
  app.get('/', (_req, res) => {
    res.json({
      name: 'Vegapunk Agentic API',
      version: '1.0.0',
      status: 'operational',
      description: 'Multi-agent AI system with debugging interface',
      endpoints: {
        // Core API
        health: '/api/health',
        chat: '/api/chat',
        models: '/api/models',
        
        // Model Management
        'models/switch': '/api/models/switch (POST)',
        'models/current': '/api/models/current',
        
        // Provider Management (NEW)
        'providers/current': '/api/providers/current',
        'providers/switch': '/api/providers/switch (POST)',
        'providers/status': '/api/providers/status',
        'providers/models': '/api/providers/{provider}/models',
        'providers/model-switch': '/api/providers/{provider}/models/switch (POST)',
        
        // Debug & Monitoring
        'debug/system': '/api/debug/system',
        'debug/ollama': '/api/debug/ollama',
        'debug/logs': '/api/debug/logs',
        'debug/websockets': '/api/debug/websockets',
        'agents/shaka/status': '/api/agents/shaka/status',
        'agents/shaka/query': '/api/agents/shaka/query (POST)',
        'agents/shaka/analyze': '/api/agents/shaka/analyze (POST)',
        'agents/shaka/toggle': '/api/agents/shaka/toggle (PUT)',
        'agents/shaka/policies': '/api/agents/shaka/policies',
        'agents/shaka/metrics': '/api/agents/shaka/metrics',
        'agents/shaka/alerts': '/api/agents/shaka/alerts',
        'agents/shaka/conflicts': '/api/agents/shaka/conflicts',
        'agents/shaka/detect-ethics': '/api/agents/shaka/detect-ethics (POST)',
        
        // A2A Protocol APIs
        'a2a/network/topology': '/api/a2a/network/topology',
        'a2a/agents': '/api/a2a/agents',
        'a2a/messages/flow': '/api/a2a/messages/flow',
        'a2a/messages/recent': '/api/a2a/messages/recent',
        'a2a/logs': '/api/a2a/logs',
        'a2a/metrics/performance': '/api/a2a/metrics/performance',
        'a2a/reports/generate': '/api/a2a/reports/generate (POST)',
        'a2a/reports': '/api/a2a/reports',
        'a2a/health': '/api/a2a/health',
        
        // LangGraph Cockpit APIs
        'langgraph/workflows': '/api/langgraph/workflows',
        'langgraph/workflows/{id}': '/api/langgraph/workflows/{id}',
        'langgraph/workflows/{id}/topology': '/api/langgraph/workflows/{id}/topology',
        'langgraph/workflows/{id}/control': '/api/langgraph/workflows/{id}/control (POST)',
        'langgraph/dataflow/traces': '/api/langgraph/dataflow/traces',
        'langgraph/dataflow/export': '/api/langgraph/dataflow/export (POST)',
        'langgraph/handoffs': '/api/langgraph/handoffs',
        'langgraph/handoffs/metrics': '/api/langgraph/handoffs/metrics',
        'langgraph/supervisor/decisions': '/api/langgraph/supervisor/decisions',
        'langgraph/supervisor/metrics': '/api/langgraph/supervisor/metrics',
        'langgraph/templates': '/api/langgraph/templates',
        'langgraph/templates/{id}/execute': '/api/langgraph/templates/{id}/execute (POST)',
        'langgraph/health': '/api/langgraph/health',
        'langgraph/metrics/performance': '/api/langgraph/metrics/performance',
        
        // MCP Advanced Cockpit APIs
        'mcp/server/status': '/api/mcp/server/status',
        'mcp/server/start': '/api/mcp/server/start (POST)',
        'mcp/server/stop': '/api/mcp/server/stop (POST)',
        'mcp/server/restart': '/api/mcp/server/restart (POST)',
        'mcp/server/logs': '/api/mcp/server/logs',
        'mcp/server/config': '/api/mcp/server/config',
        'mcp/tools/list': '/api/mcp/tools/list',
        'mcp/tools/test': '/api/mcp/tools/test (POST)',
        'mcp/tools/register': '/api/mcp/tools/register (POST)',
        'mcp/tools/analytics': '/api/mcp/tools/analytics',
        'mcp/resources/list': '/api/mcp/resources/list',
        'mcp/resources/usage': '/api/mcp/resources/usage',
        'mcp/resources/manage': '/api/mcp/resources/manage (POST)',
        'mcp/executions/active': '/api/mcp/executions/active',
        'mcp/executions/history': '/api/mcp/executions/history',
        'mcp/health': '/api/mcp/health',
        'mcp/metrics/performance': '/api/mcp/metrics/performance'
      },
      frontend: {
        main: 'http://localhost:5173',
        pages: {
          home: 'http://localhost:5173/',
          debug: 'http://localhost:5173/debug',
          ollama: 'http://localhost:5173/ollama',
          'chat-logs': 'http://localhost:5173/chat-logs',
          websockets: 'http://localhost:5173/websockets',
          errors: 'http://localhost:5173/errors',
          performance: 'http://localhost:5173/performance'
        }
      },
      websocket: 'ws://localhost:8080',
      websocketNamespaces: {
        chat: 'ws://localhost:8080/',
        // A2A Protocol WebSocket Namespaces
        a2aNetwork: 'ws://localhost:8080/api/a2a/network/live',
        a2aMessages: 'ws://localhost:8080/api/a2a/messages/live',
        a2aLogs: 'ws://localhost:8080/api/a2a/logs/live',
        a2aMetrics: 'ws://localhost:8080/api/a2a/metrics/live',
        a2aHealth: 'ws://localhost:8080/api/a2a/health/live',
        // LangGraph WebSocket Namespaces
        langGraphWorkflows: 'ws://localhost:8080/api/langgraph/workflows/live',
        langGraphDataflow: 'ws://localhost:8080/api/langgraph/dataflow/live',
        langGraphHandoffs: 'ws://localhost:8080/api/langgraph/handoffs/live',
        langGraphSupervisor: 'ws://localhost:8080/api/langgraph/supervisor/live',
        langGraphHealth: 'ws://localhost:8080/api/langgraph/health/live',
        // MCP Advanced Cockpit WebSocket Namespaces
        mcpServerStatus: 'ws://localhost:8080/api/mcp/server/live',
        mcpLogsStream: 'ws://localhost:8080/api/mcp/logs/live',
        mcpToolExecutions: 'ws://localhost:8080/api/mcp/executions/live',
        mcpMetrics: 'ws://localhost:8080/api/mcp/metrics/live',
        mcpAlerts: 'ws://localhost:8080/api/mcp/alerts/live'
      },
      features: [
        'Multi-provider LLM support (Ollama + Hugging Face)',
        'Real-time chat with dynamic provider switching',
        'ShakaAgent - Autonomous ethical analysis and monitoring',
        'Ethical query detection and specialized responses',
        'Multi-framework ethical reasoning (utilitarian, deontological, virtue, care)',
        'Proactive monitoring with intelligent alerts',
        'Conflict resolution and ethical policy management',
        'Persistent chat sessions with Context API',
        'System health monitoring for all providers',
        'WebSocket connection tracking and management',
        'Chat logs with advanced filtering',
        'Performance metrics visualization',
        'Error monitoring and automatic recovery',
        'Environment-based configuration management',
        'Provider status monitoring and fallback',
        'LangGraph Advanced Cockpit - Workflow orchestration monitoring',
        'D3.js workflow visualization with hierarchical tree layouts',
        'Real-time dataflow tracing with timeline visualization',
        'Agent handoff monitoring and performance analytics',
        'Supervisor decision intelligence with confidence scoring',
        'Workflow template library with execution management',
        'Multi-protocol architecture (A2A + LangGraph + MCP)',
        'Enterprise-level debugging interfaces and system health monitoring',
        'MCP Advanced Cockpit - Complete server lifecycle management',
        'MCP tools ecosystem with testing, analytics, and registration',
        'Real-time MCP resource monitoring and execution tracking',
        'WebSocket-powered MCP live data streaming and alerts'
      ]
    });
  });

  try {
    // 1. Initialize Ollama
    logger.info('🔧 Initializing Ollama provider...');
    const ollama = new OllamaProvider();
    await ollama.initialize();
    logger.info('✅ Ollama provider initialized');

    // 2. Initialize Hugging Face (optional)
    let huggingface: HuggingFaceProvider | undefined;
    try {
      logger.info('🔧 Initializing Hugging Face provider...');
      huggingface = new HuggingFaceProvider();
      await huggingface.initialize();
      logger.info('✅ Hugging Face provider initialized');
    } catch (error: any) {
      logger.warn('⚠️ Hugging Face provider initialization failed:', error.message);
      logger.error('Full error details:', error);
      logger.info('Continuing without Hugging Face support');
    }

    // 3. Create Chat Handler with both providers
    const chatHandler = new ChatHandler(ollama, huggingface);

    // 4. Initialize A2AProtocol (stub for now)
    const { A2AProtocol } = await import('./a2a/A2AProtocol');
    const a2aProtocol = new A2AProtocol();
    await a2aProtocol.initialize();

    // 5. Initialize VegapunkAgentGraph
    logger.info('🔧 Initializing VegapunkAgentGraph...');
    const vegapunkGraph = new VegapunkAgentGraph(a2aProtocol, chatHandler, {
      enableA2AIntegration: true,
      enableMCPTools: true,
      debugMode: true,
      maxIterations: 10,
      timeout: 120000
    });
    await vegapunkGraph.initialize();
    logger.info('✅ VegapunkAgentGraph initialized');

    // 6. Initialize A2A API Routes
    initializeA2ARoutes(a2aProtocol);
    logger.info('✅ A2A API routes initialized');

    // 7. Initialize A2A WebSocket Handler
    const a2aWsHandler = new A2AWebSocketHandler(io);
    a2aWsHandler.initialize(a2aProtocol);
    logger.info('✅ A2A WebSocket handler initialized');

    // 8. Initialize LangGraph API Routes
    initializeLangGraphRoutes(vegapunkGraph);
    logger.info('✅ LangGraph API routes initialized');

    // 9. Initialize LangGraph WebSocket Handler
    const langGraphWsHandler = new LangGraphWebSocketHandler(io);
    langGraphWsHandler.initialize(vegapunkGraph);
    logger.info('✅ LangGraph WebSocket handler initialized');

    // 10. Initialize MCP Services
    const mcpServerManager = new MCPServerManager();
    const mcpToolsService = new MCPToolsService();
    await mcpServerManager.initialize();
    logger.info('✅ MCP services initialized');

    // 11. Initialize MCP API Routes
    initializeMCPRoutes(mcpServerManager, mcpToolsService);
    logger.info('✅ MCP API routes initialized');
    
    // 11b. Register MCP routes immediately after initialization
    app.use('/api/mcp', mcpRoutes);
    logger.info('🔧 MCP API routes registered immediately after initialization');

    // 12. Initialize MCP WebSocket Handler
    const mcpWsHandler = new MCPWebSocketHandler(io);
    mcpWsHandler.initialize(mcpServerManager, mcpToolsService);
    logger.info('✅ MCP WebSocket handler initialized');

    // 13. Initialize ShakaAgent Controller
    const shakaAgent = chatHandler.getShakaAgent();
    const shakaController = shakaAgent ? new ShakaController(shakaAgent) : null;
    if (shakaController) {
      logger.info('🧠 ShakaAgent Controller initialized');
    } else {
      logger.warn('⚠️ ShakaAgent Controller not available - ShakaAgent not initialized');
    }

    // 14. API Routes
    app.get('/api/health', async (req, res) => {
      const health = await ollama.getHealthStatus();
      const models = await ollama.listModels();
      
      let hfHealth = null;
      let hfModels: string[] = [];
      if (huggingface) {
        try {
          hfHealth = await huggingface.getHealthStatus();
          hfModels = await huggingface.listModels();
        } catch (error) {
          logger.warn('Failed to get Hugging Face status:', error);
        }
      }
      
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          dashboard: 'operational',
          chat: 'operational',
          ollama: {
            ...health,
            currentModel: ollama.getCurrentModel(),
            defaultModel: ollama.getDefaultModel(),
            availableModels: models,
            totalModels: models.length
          },
          huggingface: hfHealth ? {
            ...hfHealth,
            currentModel: huggingface?.getCurrentModel(),
            defaultModel: huggingface?.getDefaultModel(),
            availableModels: hfModels,
            totalModels: hfModels.length,
            apiKeyConfigured: huggingface?.getApiKeyStatus()
          } : {
            status: 'unavailable',
            error: 'Not configured or API key missing'
          },
          currentProvider: chatHandler.getCurrentProvider(),
          availableProviders: chatHandler.getAvailableProviders()
        },
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal
          }
        }
      });
    });

    app.post('/api/chat', async (req, res) => {
      try {
        const { message } = req.body;
        if (!message) {
          addChatLog('error', 'Empty message received via API');
          return res.status(400).json({ error: 'Message is required' });
        }
        
        const startTime = Date.now();
        addChatLog('user', message, 'API');
        
        const response = await chatHandler.processMessage(message);
        const responseTime = Date.now() - startTime;
        
        addChatLog('bot', response.response || response, 'API', responseTime);
        res.json({ response });
      } catch (error: any) {
        logger.error('Chat processing error:', error);
        addChatLog('error', `Chat API error: ${error.message}`, 'API');
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/models', async (req, res) => {
      try {
        const models = await ollama.listModels();
        res.json({ models });
      } catch (error: any) {
        logger.error('Failed to list models:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Debug monitoring endpoints
    app.get('/api/debug/system', async (req, res) => {
      try {
        const systemInfo = {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        };
        res.json(systemInfo);
      } catch (error: any) {
        logger.error('Failed to get system info:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/debug/ollama', async (req, res) => {
      try {
        const ollamaStatus = await ollama.getHealthStatus();
        const models = await ollama.listModels();
        const runningModels = await ollama.getRunningModels();
        const debugInfo = {
          ...ollamaStatus,
          models,
          runningModels,
          currentModel: ollama.getCurrentModel(),
          defaultModel: ollama.getDefaultModel(),
          timestamp: new Date().toISOString()
        };
        res.json(debugInfo);
      } catch (error: any) {
        logger.error('Failed to get Ollama debug info:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/models/switch', async (req, res) => {
      try {
        const { modelName } = req.body;
        if (!modelName) {
          return res.status(400).json({ error: 'Model name is required' });
        }
        
        addChatLog('system', `Switching to model: ${modelName}`);
        await ollama.setModel(modelName);
        
        // Optionally load the model
        try {
          await ollama.loadModel(modelName);
          addChatLog('system', `Model ${modelName} loaded successfully`);
        } catch (loadError: any) {
          logger.warn('Model switch successful but loading failed:', loadError.message);
          addChatLog('system', `Model ${modelName} switched but loading failed: ${loadError.message}`);
        }
        
        res.json({ 
          success: true, 
          currentModel: ollama.getCurrentModel(),
          message: `Switched to model: ${modelName}`
        });
      } catch (error: any) {
        logger.error('Failed to switch model:', error);
        addChatLog('error', `Failed to switch model: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/models/current', (req, res) => {
      try {
        const currentProvider = chatHandler.getCurrentProvider();
        if (currentProvider === 'ollama') {
          res.json({
            provider: 'ollama',
            currentModel: ollama.getCurrentModel(),
            defaultModel: ollama.getDefaultModel()
          });
        } else if (currentProvider === 'huggingface' && huggingface) {
          res.json({
            provider: 'huggingface',
            currentModel: huggingface.getCurrentModel(),
            defaultModel: huggingface.getDefaultModel()
          });
        } else {
          res.status(500).json({ error: 'Unknown provider' });
        }
      } catch (error: any) {
        logger.error('Failed to get current model:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Provider management endpoints
    app.post('/api/providers/switch', async (req, res) => {
      try {
        const { provider } = req.body;
        if (!provider) {
          return res.status(400).json({ error: 'Provider is required' });
        }
        
        addChatLog('system', `Switching to provider: ${provider}`);
        chatHandler.setProvider(provider);
        
        res.json({ 
          success: true, 
          currentProvider: chatHandler.getCurrentProvider(),
          message: `Switched to provider: ${provider}`
        });
      } catch (error: any) {
        logger.error('Failed to switch provider:', error);
        addChatLog('error', `Failed to switch provider: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/providers/current', (req, res) => {
      try {
        res.json({
          currentProvider: chatHandler.getCurrentProvider(),
          availableProviders: chatHandler.getAvailableProviders()
        });
      } catch (error: any) {
        logger.error('Failed to get current provider:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/providers/status', async (req, res) => {
      try {
        const status = await chatHandler.getProviderStatus();
        res.json(status);
      } catch (error: any) {
        logger.error('Failed to get provider status:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/providers/:provider/models', async (req, res) => {
      try {
        const { provider } = req.params;
        
        if (provider === 'ollama') {
          const models = await ollama.listModels();
          res.json({ provider: 'ollama', models });
        } else if (provider === 'huggingface' && huggingface) {
          const models = await huggingface.listModels();
          res.json({ provider: 'huggingface', models });
        } else {
          res.status(404).json({ error: `Provider ${provider} not found or not available` });
        }
      } catch (error: any) {
        logger.error(`Failed to get models for provider ${req.params.provider}:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/providers/:provider/models/switch', async (req, res) => {
      try {
        const { provider } = req.params;
        const { modelName } = req.body;
        
        if (!modelName) {
          return res.status(400).json({ error: 'Model name is required' });
        }
        
        if (provider === 'ollama') {
          await ollama.setModel(modelName);
          addChatLog('system', `Ollama model switched to: ${modelName}`);
          res.json({ 
            success: true, 
            provider: 'ollama',
            currentModel: ollama.getCurrentModel(),
            message: `Switched to Ollama model: ${modelName}`
          });
        } else if (provider === 'huggingface' && huggingface) {
          await huggingface.setModel(modelName);
          addChatLog('system', `Hugging Face model switched to: ${modelName}`);
          res.json({ 
            success: true, 
            provider: 'huggingface',
            currentModel: huggingface.getCurrentModel(),
            message: `Switched to Hugging Face model: ${modelName}`
          });
        } else {
          res.status(404).json({ error: `Provider ${provider} not found or not available` });
        }
      } catch (error: any) {
        logger.error(`Failed to switch model for provider ${req.params.provider}:`, error);
        addChatLog('error', `Failed to switch ${req.params.provider} model: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/debug/logs', (req, res) => {
      try {
        const { limit = 100, type } = req.query;
        let filteredLogs = chatLogs;
        
        if (type && type !== 'all') {
          filteredLogs = chatLogs.filter(log => log.type === type);
        }
        
        const limitNum = Math.min(parseInt(limit as string) || 100, 500);
        const result = filteredLogs.slice(0, limitNum);
        
        res.json({
          logs: result,
          total: filteredLogs.length,
          limit: limitNum
        });
      } catch (error: any) {
        logger.error('Failed to get chat logs:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/debug/websockets', (req, res) => {
      try {
        const stats = getWebSocketStats();
        const activeConnections = Array.from(socketConnections.values());
        const recentHistory = connectionHistory.slice(0, 20); // Last 20 connections
        
        res.json({
          stats,
          activeConnections,
          connectionHistory: recentHistory,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        logger.error('Failed to get WebSocket debug info:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // ShakaAgent API Routes
    if (shakaController) {
      app.get('/api/agents/shaka/status', shakaController.getStatus);
      app.post('/api/agents/shaka/query', shakaController.processQuery);
      app.post('/api/agents/shaka/analyze', shakaController.analyzeContent);
      app.put('/api/agents/shaka/toggle', shakaController.toggleAgent);
      app.get('/api/agents/shaka/policies', shakaController.getPolicies);
      app.get('/api/agents/shaka/metrics', shakaController.getMetrics);
      app.get('/api/agents/shaka/alerts', shakaController.getAlerts);
      app.get('/api/agents/shaka/conflicts', shakaController.getConflicts);
      app.post('/api/agents/shaka/detect-ethics', shakaController.detectEthicalContent);
      
      logger.info('🧠 ShakaAgent API routes registered');
    }

    // A2A API Routes
    app.use('/api/a2a', a2aRoutes);
    logger.info('🔄 A2A API routes registered');

    // LangGraph API Routes
    app.use('/api/langgraph', langGraphRoutes);
    logger.info('🔄 LangGraph API routes registered');
    
    // MCP API Routes - Already registered after initialization
    // (see line 355 - registered immediately after initializeMCPRoutes)

    // 4. WebSocket for real-time chat
    io.on('connection', (socket) => {
      logger.info(`📱 Client connected: ${socket.id}`);
      
      // Track connection
      addSocketConnection(socket.id, socket.request);
      addChatLog('system', `Client connected: ${socket.id}`, socket.id);
      
      socket.on('chat-message', async (data) => {
        try {
          const { message, streamMode = false } = data;
          const startTime = Date.now();
          
          // Update activity
          updateSocketActivity(socket.id);
          addChatLog('user', message, socket.id);
          
          if (streamMode) {
            // Stream response
            await chatHandler.streamMessage(message, (chunk: string) => {
              socket.emit('chat-stream', { chunk });
            });
            socket.emit('chat-complete', { status: 'completed' });
            const responseTime = Date.now() - startTime;
            addChatLog('bot', 'Streaming response completed', socket.id, responseTime);
          } else {
            // Normal response (now supports multi-agent)
            const result = await chatHandler.processMessage(message);
            const responseTime = Date.now() - startTime;
            
            // Log the response with the agent identifier  
            const logAgent = result.agent === 'shaka' ? 'bot' : 'bot'; // Simplify for logging
            addChatLog(logAgent, result.response, socket.id, responseTime);
            
            // Send enhanced response with agent metadata
            socket.emit('chat-response', { 
              response: result.response,
              agent: result.agent,
              ethicalAnalysis: result.ethicalAnalysis,
              isCollaborative: result.isCollaborative
            });
          }
        } catch (error: any) {
          logger.error('WebSocket chat error:', error);
          addChatLog('error', `WebSocket error: ${error.message}`, socket.id);
          socket.emit('chat-error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`📱 Client disconnected: ${socket.id}`);
        
        // Remove connection tracking
        removeSocketConnection(socket.id);
        addChatLog('system', `Client disconnected: ${socket.id}`, socket.id);
      });
    });

    // ================================
    // TRI-PROTOCOL ARCHITECTURE ENDPOINTS
    // A2A + LangGraph + MCP Integration
    // ================================

    // A2A Protocol Endpoints
    app.get('/api/a2a/topology', (req, res) => {
      try {
        // Mock A2A network topology - replace with actual A2A registry
        const topology = {
          agents: [
            {
              agentId: 'vegapunk-001',
              agentType: 'TechnicalSupport',
              status: 'online',
              capabilities: [
                { id: 'tech-support', name: 'Technical Support', category: 'support', reliability: 0.92, cost: 20 },
                { id: 'llm-interaction', name: 'LLM Interaction', category: 'communication', reliability: 0.95, cost: 15 }
              ],
              metadata: { version: '1.0.0', location: 'graph://vegapunk-001', load: 35, uptime: 3600000 },
              lastSeen: new Date().toISOString()
            },
            {
              agentId: 'shaka-001',
              agentType: 'EthicalAnalysis',
              status: 'online',
              capabilities: [
                { id: 'ethical-analysis', name: 'Ethical Analysis', category: 'analysis', reliability: 0.96, cost: 30 },
                { id: 'conflict-resolution', name: 'Conflict Resolution', category: 'analysis', reliability: 0.88, cost: 45 }
              ],
              metadata: { version: '1.0.0', location: 'graph://shaka-001', load: 22, uptime: 3500000 },
              lastSeen: new Date().toISOString()
            }
          ],
          connections: { 'vegapunk-001': ['shaka-001'], 'shaka-001': ['vegapunk-001'] },
          lastUpdated: new Date().toISOString()
        };
        res.json(topology);
      } catch (error: any) {
        logger.error('A2A topology error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/a2a/messages/recent', (req, res) => {
      try {
        const messages = [
          {
            id: 'msg-001',
            from: 'vegapunk-001',
            to: 'shaka-001',
            type: 'task_delegate',
            timestamp: new Date(Date.now() - 30000).toISOString(),
            priority: 'normal',
            status: 'delivered'
          }
        ];
        res.json(messages);
      } catch (error: any) {
        logger.error('A2A messages error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/a2a/stats', (req, res) => {
      try {
        const stats = {
          totalAgents: 2,
          onlineAgents: 2,
          totalCapabilities: 4,
          averageLoad: 28.5,
          messagesPerMinute: 12.3
        };
        res.json(stats);
      } catch (error: any) {
        logger.error('A2A stats error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // LangGraph Workflow Endpoints
    app.get('/api/langgraph/workflows/active', (req, res) => {
      try {
        const workflows = [
          {
            workflowId: 'wf-001',
            sessionId: 'session-123',
            status: 'running',
            startTime: new Date(Date.now() - 30000).toISOString(),
            currentStep: 2,
            totalSteps: 4,
            agentPath: ['supervisor', 'vegapunk-001'],
            executionTime: 30000,
            metadata: {
              message: 'Analyze the ethical implications of AI surveillance',
              protocolsUsed: ['A2A', 'LangGraph'],
              handoffs: 1
            }
          }
        ];
        res.json(workflows);
      } catch (error: any) {
        logger.error('LangGraph workflows error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/langgraph/workflows/recent', (req, res) => {
      try {
        const workflows = [
          {
            workflowId: 'wf-002',
            sessionId: 'session-122',
            status: 'completed',
            startTime: new Date(Date.now() - 120000).toISOString(),
            endTime: new Date(Date.now() - 90000).toISOString(),
            currentStep: 4,
            totalSteps: 4,
            agentPath: ['supervisor', 'vegapunk-001', 'shaka-001'],
            executionTime: 30000,
            metadata: { message: 'Help me optimize my database queries', protocolsUsed: ['A2A', 'LangGraph'], handoffs: 1 }
          }
        ];
        res.json(workflows);
      } catch (error: any) {
        logger.error('LangGraph recent workflows error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/langgraph/metrics', (req, res) => {
      try {
        const metrics = {
          totalWorkflows: 245,
          activeWorkflows: 1,
          completedWorkflows: 220,
          failedWorkflows: 24,
          averageExecutionTime: 15234,
          successRate: 0.902,
          averageHandoffs: 1.2
        };
        res.json(metrics);
      } catch (error: any) {
        logger.error('LangGraph metrics error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // MCP Protocol Endpoints
    app.get('/api/mcp/tools', (req, res) => {
      try {
        const tools = [
          {
            name: 'ethical_analysis',
            description: 'Perform comprehensive ethical analysis using multiple moral frameworks',
            category: 'ethical-analysis',
            inputSchema: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'Content to analyze' },
                frameworks: { type: 'array', items: { type: 'string' } }
              }
            },
            metadata: { cost: 30, latency: 5000, reliability: 0.95, version: '1.0.0' }
          },
          {
            name: 'technical_support',
            description: 'Provide technical support and analysis',
            category: 'technical-support',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Technical question' },
                category: { type: 'string', enum: ['general', 'software', 'hardware'] }
              }
            },
            metadata: { cost: 20, latency: 3000, reliability: 0.92, version: '1.0.0' }
          }
        ];
        res.json(tools);
      } catch (error: any) {
        logger.error('MCP tools error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/mcp/resources', (req, res) => {
      try {
        const resources = [
          {
            uri: 'vegapunk://agents/capabilities',
            name: 'Agent Capabilities',
            description: 'List of all agent capabilities in the Vegapunk ecosystem',
            mimeType: 'application/json',
            metadata: { size: 2048, lastModified: new Date().toISOString(), version: '1.0.0' }
          },
          {
            uri: 'vegapunk://network/topology',
            name: 'Network Topology',
            description: 'Current A2A network topology and connections',
            mimeType: 'application/json',
            metadata: { size: 1024, lastModified: new Date().toISOString(), version: '1.0.0' }
          }
        ];
        res.json(resources);
      } catch (error: any) {
        logger.error('MCP resources error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/mcp/metrics', (req, res) => {
      try {
        const metrics = {
          totalTools: 2,
          totalResources: 3,
          totalExecutions: 156,
          successRate: 0.94,
          averageExecutionTime: 4200,
          errorRate: 0.06
        };
        res.json(metrics);
      } catch (error: any) {
        logger.error('MCP metrics error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Multi-Agent Ecosystem System Health
    app.get('/api/ecosystem/health', (req, res) => {
      try {
        const health = {
          overall: 'healthy',
          protocols: { a2a: true, langGraph: true, mcp: true },
          bridges: { a2aLangGraph: true, langGraphMcp: true },
          metrics: {
            totalWorkflows: 245,
            successRate: 0.94,
            averageExecutionTime: 15234,
            activeAgents: 2,
            availableTools: 2,
            availableResources: 3
          },
          timestamp: new Date().toISOString()
        };
        res.json(health);
      } catch (error: any) {
        logger.error('Ecosystem health error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 5. 404 handler for unmatched routes
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Start server
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      logger.info(`✅ Dashboard server running on http://localhost:${PORT}`);
      logger.info(`📊 Dashboard UI: http://localhost:${PORT}`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
      
      // Add initial system log
      addChatLog('system', `Vegapunk Dashboard started on port ${PORT}`);
    });

    // Graceful shutdown handlers
    const cleanup = async () => {
      logger.info('🔄 Shutting down Vegapunk Dashboard...');
      
      try {
        // Cleanup A2A WebSocket handler
        if (a2aWsHandler) {
          a2aWsHandler.cleanup();
          logger.info('✅ A2A WebSocket handler cleaned up');
        }

        // Cleanup LangGraph WebSocket handler
        if (langGraphWsHandler) {
          langGraphWsHandler.cleanup();
          logger.info('✅ LangGraph WebSocket handler cleaned up');
        }

        // Cleanup MCP WebSocket handler
        if (mcpWsHandler) {
          mcpWsHandler.cleanup();
          logger.info('✅ MCP WebSocket handler cleaned up');
        }
        
        // Cleanup VegapunkAgentGraph
        if (vegapunkGraph) {
          await vegapunkGraph.shutdown?.();
          logger.info('✅ VegapunkAgentGraph shut down');
        }
        
        // Close server
        server.close(() => {
          logger.info('✅ Server closed');
          process.exit(0);
        });
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      cleanup();
    });
    process.on('unhandledRejection', (error) => {
      logger.error('❌ Unhandled Rejection:', error);
      cleanup();
    });

  } catch (error) {
    logger.error('❌ Failed to start dashboard:', error);
    throw error;
  }
}