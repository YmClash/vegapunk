/**
 * Agent Routes for REST API
 * Handles all agent-related endpoints including CRUD operations and monitoring
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AgentRegistry } from '@core/AgentRegistry';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { z } from 'zod';

// Validation schemas
const createAgentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['Atlas', 'Edison', 'Pythagoras', 'Lilith', 'York', 'Shaka']),
    config: z.object({
      llmProvider: z.enum(['ollama', 'openai', 'mistral']).optional(),
      capabilities: z.array(z.string()).optional(),
      autoStart: z.boolean().optional()
    }).optional()
  })
});

const updateAgentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).optional(),
    config: z.object({
      capabilities: z.array(z.string()).optional(),
      priority: z.number().min(0).max(10).optional()
    }).optional()
  })
});

const agentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export function agentRoutes(agentRegistry: AgentRegistry): Router {
  const router = Router();

  /**
   * GET /agents
   * List all registered agents with their current status
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { status, type, sortBy = 'name', order = 'asc' } = req.query;
    
    let agents = await agentRegistry.getAllAgents();
    
    // Filter by status if provided
    if (status) {
      agents = agents.filter(agent => agent.status === status);
    }
    
    // Filter by type if provided
    if (type) {
      agents = agents.filter(agent => agent.type === type);
    }
    
    // Sort agents
    agents.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      const comparison = aValue > bValue ? 1 : -1;
      return order === 'asc' ? comparison : -comparison;
    });

    res.json({
      success: true,
      data: agents,
      meta: {
        total: agents.length,
        filters: { status, type },
        sort: { field: sortBy, order }
      }
    });
  }));

  /**
   * GET /agents/:id
   * Get detailed information about a specific agent
   */
  router.get('/:id', 
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      
      const agent = await agentRegistry.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      // Get additional agent details
      const status = await agentRegistry.getAgentStatus(id);
      const metrics = await agentRegistry.getAgentMetrics(id);
      const tasks = await agentRegistry.getAgentTasks(id);

      res.json({
        success: true,
        data: {
          ...agent,
          status,
          metrics,
          recentTasks: tasks.slice(0, 10),
          totalTasks: tasks.length
        }
      });
    })
  );

  /**
   * POST /agents
   * Create and register a new agent
   */
  router.post('/',
    validateRequest(createAgentSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { name, type, config } = req.body;

      // Check if agent with same name already exists
      const existingAgent = await agentRegistry.getAgentByName(name);
      if (existingAgent) {
        return res.status(409).json({
          success: false,
          error: 'Agent already exists',
          message: `An agent with name '${name}' already exists`
        });
      }

      // Create new agent
      const agent = await agentRegistry.createAgent({
        name,
        type,
        config: {
          ...config,
          createdAt: new Date(),
          createdBy: req.user?.id || 'system'
        }
      });

      // Auto-start agent if requested
      if (config?.autoStart) {
        await agentRegistry.startAgent(agent.id);
      }

      res.status(201).json({
        success: true,
        data: agent,
        message: `Agent '${name}' created successfully`
      });
    })
  );

  /**
   * PUT /agents/:id
   * Update agent configuration
   */
  router.put('/:id',
    validateRequest(agentIdSchema),
    validateRequest(updateAgentSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const updates = req.body;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      // Update agent
      const updatedAgent = await agentRegistry.updateAgent(id, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'system'
      });

      res.json({
        success: true,
        data: updatedAgent,
        message: `Agent '${agent.name}' updated successfully`
      });
    })
  );

  /**
   * DELETE /agents/:id
   * Remove an agent from the system
   */
  router.delete('/:id',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      // Stop agent if running
      if (agent.status === 'active') {
        await agentRegistry.stopAgent(id);
      }

      // Remove agent
      await agentRegistry.removeAgent(id);

      res.json({
        success: true,
        message: `Agent '${agent.name}' removed successfully`
      });
    })
  );

  /**
   * GET /agents/:id/status
   * Get real-time status of an agent
   */
  router.get('/:id/status',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const status = await agentRegistry.getAgentStatus(id);
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: status
      });
    })
  );

  /**
   * POST /agents/:id/start
   * Start an inactive agent
   */
  router.post('/:id/start',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      if (agent.status === 'active') {
        return res.status(400).json({
          success: false,
          error: 'Agent already active',
          message: `Agent '${agent.name}' is already running`
        });
      }

      await agentRegistry.startAgent(id);

      res.json({
        success: true,
        message: `Agent '${agent.name}' started successfully`
      });
    })
  );

  /**
   * POST /agents/:id/stop
   * Stop a running agent
   */
  router.post('/:id/stop',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      if (agent.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Agent not active',
          message: `Agent '${agent.name}' is not running`
        });
      }

      await agentRegistry.stopAgent(id);

      res.json({
        success: true,
        message: `Agent '${agent.name}' stopped successfully`
      });
    })
  );

  /**
   * GET /agents/:id/tasks
   * Get tasks assigned to an agent
   */
  router.get('/:id/tasks',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      let tasks = await agentRegistry.getAgentTasks(id);

      // Filter by status if provided
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }

      // Apply pagination
      const paginatedTasks = tasks.slice(
        Number(offset),
        Number(offset) + Number(limit)
      );

      res.json({
        success: true,
        data: paginatedTasks,
        meta: {
          total: tasks.length,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: tasks.length > Number(offset) + Number(limit)
        }
      });
    })
  );

  /**
   * GET /agents/:id/metrics
   * Get performance metrics for an agent
   */
  router.get('/:id/metrics',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { period = '24h' } = req.query;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      const metrics = await agentRegistry.getAgentMetrics(id, period as string);

      res.json({
        success: true,
        data: {
          agentId: id,
          agentName: agent.name,
          period,
          metrics
        }
      });
    })
  );

  /**
   * POST /agents/:id/reset
   * Reset agent state and clear memory
   */
  router.post('/:id/reset',
    validateRequest(agentIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { clearMemory = true, resetMetrics = true } = req.body;

      const agent = await agentRegistry.getAgent(id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          message: `No agent found with ID: ${id}`
        });
      }

      await agentRegistry.resetAgent(id, {
        clearMemory,
        resetMetrics
      });

      res.json({
        success: true,
        message: `Agent '${agent.name}' reset successfully`,
        details: {
          memoryCleared: clearMemory,
          metricsReset: resetMetrics
        }
      });
    })
  );

  return router;
}