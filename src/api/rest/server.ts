/**
 * REST API Server for Vegapunk Agentic System
 * Provides RESTful endpoints for agent interaction, monitoring, and control
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createLogger } from '@utils/logger';
import { StellarOrchestra } from '@orchestration/StellarOrchestra';
import { AgentRegistry } from '@core/AgentRegistry';
import { authMiddleware } from '@auth/middleware';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validateRequest';

// Import route handlers
import { agentRoutes } from './routes/agents';
import { taskRoutes } from './routes/tasks';
import { collaborationRoutes } from './routes/collaborations';
import { systemRoutes } from './routes/system';
import { metricsRoutes } from './routes/metrics';
import { authRoutes } from './routes/auth';

const logger = createLogger('RESTAPIServer');

export interface APIServerConfig {
  port: number;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  apiPrefix: string;
  enableCompression: boolean;
  enableHelmet: boolean;
  enableRequestLogging: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export class RESTAPIServer {
  private app: Application;
  private config: APIServerConfig;
  private orchestra: StellarOrchestra;
  private agentRegistry: AgentRegistry;
  private server: any;

  constructor(
    orchestra: StellarOrchestra,
    agentRegistry: AgentRegistry,
    config?: Partial<APIServerConfig>
  ) {
    this.orchestra = orchestra;
    this.agentRegistry = agentRegistry;
    this.config = {
      port: 3000,
      corsOrigins: ['http://localhost:3001', 'http://localhost:3000'],
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
      rateLimitMaxRequests: 100,
      apiPrefix: '/api/v1',
      enableCompression: true,
      enableHelmet: true,
      enableRequestLogging: true,
      jwtSecret: process.env.JWT_SECRET || 'vegapunk-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware
    if (this.config.enableHelmet) {
      this.app.use(helmet());
    }

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Compression
    if (this.config.enableCompression) {
      this.app.use(compression());
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(this.config.apiPrefix, limiter);

    // Request logging
    if (this.config.enableRequestLogging) {
      this.app.use(requestLogger);
    }

    // Health check endpoint (no auth required)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.API_VERSION || '1.0.0'
      });
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const router = express.Router();

    // Public routes (no auth required)
    router.use('/auth', authRoutes);

    // Protected routes (auth required)
    router.use(authMiddleware(this.config.jwtSecret));

    // Agent management routes
    router.use('/agents', agentRoutes(this.agentRegistry));

    // Task management routes
    router.use('/tasks', taskRoutes(this.orchestra));

    // Collaboration routes
    router.use('/collaborations', collaborationRoutes(this.orchestra));

    // System management routes
    router.use('/system', systemRoutes(this.orchestra));

    // Metrics and monitoring routes
    router.use('/metrics', metricsRoutes(this.orchestra, this.agentRegistry));

    // Mount router with API prefix
    this.app.use(this.config.apiPrefix, router);

    // API documentation endpoint
    this.app.get(`${this.config.apiPrefix}/docs`, (req: Request, res: Response) => {
      res.json({
        version: '1.0.0',
        endpoints: {
          auth: {
            login: 'POST /auth/login',
            logout: 'POST /auth/logout',
            refresh: 'POST /auth/refresh',
            profile: 'GET /auth/profile'
          },
          agents: {
            list: 'GET /agents',
            get: 'GET /agents/:id',
            create: 'POST /agents',
            update: 'PUT /agents/:id',
            delete: 'DELETE /agents/:id',
            status: 'GET /agents/:id/status',
            tasks: 'GET /agents/:id/tasks',
            metrics: 'GET /agents/:id/metrics'
          },
          tasks: {
            list: 'GET /tasks',
            get: 'GET /tasks/:id',
            create: 'POST /tasks',
            update: 'PUT /tasks/:id',
            cancel: 'DELETE /tasks/:id',
            allocate: 'POST /tasks/:id/allocate',
            status: 'GET /tasks/:id/status',
            progress: 'GET /tasks/:id/progress'
          },
          collaborations: {
            list: 'GET /collaborations',
            get: 'GET /collaborations/:id',
            create: 'POST /collaborations',
            update: 'PUT /collaborations/:id',
            cancel: 'DELETE /collaborations/:id',
            participants: 'GET /collaborations/:id/participants',
            messages: 'GET /collaborations/:id/messages'
          },
          system: {
            status: 'GET /system/status',
            config: 'GET /system/config',
            updateConfig: 'PUT /system/config',
            optimize: 'POST /system/optimize',
            emergency: 'POST /system/emergency',
            events: 'GET /system/events',
            logs: 'GET /system/logs'
          },
          metrics: {
            overview: 'GET /metrics/overview',
            agents: 'GET /metrics/agents',
            tasks: 'GET /metrics/tasks',
            collaborations: 'GET /metrics/collaborations',
            system: 'GET /metrics/system',
            performance: 'GET /metrics/performance',
            realtime: 'WS /metrics/realtime'
          }
        },
        authentication: {
          type: 'JWT Bearer Token',
          header: 'Authorization: Bearer <token>',
          tokenEndpoint: '/auth/login',
          refreshEndpoint: '/auth/refresh'
        }
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `The requested endpoint ${req.method} ${req.path} does not exist`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the API server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`REST API Server started on port ${this.config.port}`);
        logger.info(`API documentation available at http://localhost:${this.config.port}${this.config.apiPrefix}/docs`);
        resolve();
      });
    });
  }

  /**
   * Stop the API server
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('REST API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get server configuration
   */
  public getConfig(): APIServerConfig {
    return { ...this.config };
  }
}