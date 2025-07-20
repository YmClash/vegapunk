import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { OllamaProvider } from './llm/OllamaProvider';
import { HuggingFaceProvider } from './llm/HuggingFaceProvider';
import { ChatHandler } from './chat/ChatHandler';
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
        'debug/websockets': '/api/debug/websockets'
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
      features: [
        'Multi-provider LLM support (Ollama + Hugging Face)',
        'Real-time chat with dynamic provider switching',
        'Persistent chat sessions with Context API',
        'System health monitoring for all providers',
        'WebSocket connection tracking and management',
        'Chat logs with advanced filtering',
        'Performance metrics visualization',
        'Error monitoring and automatic recovery',
        'Environment-based configuration management',
        'Provider status monitoring and fallback'
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

    // 4. API Routes
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
        
        addChatLog('bot', response, 'API', responseTime);
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
            // Normal response
            const response = await chatHandler.processMessage(message);
            const responseTime = Date.now() - startTime;
            
            addChatLog('bot', response, socket.id, responseTime);
            socket.emit('chat-response', { response });
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

  } catch (error) {
    logger.error('❌ Failed to start dashboard:', error);
    throw error;
  }
}