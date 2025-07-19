import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { OllamaProvider } from './llm/OllamaProvider';
import { ChatHandler } from './chat/ChatHandler';
import { logger } from './utils/logger';

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
  // Ne pas servir les fichiers statiques pour l'instant - frontend séparé

  try {
    // 1. Initialize Ollama
    logger.info('🔧 Initializing Ollama provider...');
    const ollama = new OllamaProvider();
    await ollama.initialize();
    logger.info('✅ Ollama provider initialized');

    // 2. Create Chat Handler
    const chatHandler = new ChatHandler(ollama);

    // 3. API Routes
    app.get('/api/health', async (req, res) => {
      const health = await ollama.getHealthStatus();
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          dashboard: 'operational',
          chat: 'operational',
          ollama: health
        }
      });
    });

    app.post('/api/chat', async (req, res) => {
      try {
        const { message } = req.body;
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        
        const response = await chatHandler.processMessage(message);
        res.json({ response });
      } catch (error: any) {
        logger.error('Chat processing error:', error);
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

    // 4. WebSocket for real-time chat
    io.on('connection', (socket) => {
      logger.info(`📱 Client connected: ${socket.id}`);
      
      socket.on('chat-message', async (data) => {
        try {
          const { message, streamMode = false } = data;
          
          if (streamMode) {
            // Stream response
            await chatHandler.streamMessage(message, (chunk: string) => {
              socket.emit('chat-stream', { chunk });
            });
            socket.emit('chat-complete', { status: 'completed' });
          } else {
            // Normal response
            const response = await chatHandler.processMessage(message);
            socket.emit('chat-response', { response });
          }
        } catch (error: any) {
          logger.error('WebSocket chat error:', error);
          socket.emit('chat-error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`📱 Client disconnected: ${socket.id}`);
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
    });

  } catch (error) {
    logger.error('❌ Failed to start dashboard:', error);
    throw error;
  }
}