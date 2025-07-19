/**
 * Task Routes for REST API
 * Handles task creation, allocation, monitoring, and management
 */

import { Router, Request, Response } from 'express';
import { StellarOrchestra } from '@orchestration/StellarOrchestra';
import { Task } from '@interfaces/base.types';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const createTaskSchema = z.object({
  body: z.object({
    description: z.string().min(1).max(1000),
    type: z.string().min(1).max(50),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    deadline: z.string().datetime().optional(),
    required_skills: z.array(z.string()).optional(),
    estimated_duration_minutes: z.number().positive().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    context: z.record(z.any()).optional(),
    constraints: z.array(z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high'])
    })).optional(),
    expected_outcomes: z.array(z.object({
      type: z.string(),
      description: z.string(),
      quality_criteria: z.array(z.string()).optional()
    })).optional()
  })
});

const updateTaskSchema = z.object({
  body: z.object({
    description: z.string().min(1).max(1000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    deadline: z.string().datetime().optional(),
    estimated_duration_minutes: z.number().positive().optional(),
    context: z.record(z.any()).optional()
  })
});

const taskIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

const allocateTaskSchema = z.object({
  body: z.object({
    preferred_agent: z.string().uuid().optional(),
    allocation_strategy: z.enum(['optimal', 'balanced', 'fast', 'conservative']).optional(),
    constraints: z.object({
      max_workload: z.number().min(0).max(1).optional(),
      required_availability: z.number().min(0).max(1).optional()
    }).optional()
  })
});

export function taskRoutes(orchestra: StellarOrchestra): Router {
  const router = Router();

  /**
   * GET /tasks
   * List all tasks with filtering and pagination
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      priority,
      type,
      assigned_agent,
      sortBy = 'created_at',
      order = 'desc',
      limit = 50,
      offset = 0
    } = req.query;

    const tasks = await orchestra.getAllTasks({
      filters: {
        status: status as string,
        priority: priority as string,
        type: type as string,
        assigned_agent: assigned_agent as string
      },
      sort: {
        field: sortBy as string,
        order: order as 'asc' | 'desc'
      },
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });

    res.json({
      success: true,
      data: tasks.items,
      meta: {
        total: tasks.total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: tasks.hasMore
      }
    });
  }));

  /**
   * GET /tasks/:id
   * Get detailed information about a specific task
   */
  router.get('/:id',
    validateRequest(taskIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const task = await orchestra.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      // Get allocation details if task is allocated
      let allocation = null;
      if (task.status === 'allocated' || task.status === 'in_progress') {
        allocation = await orchestra.getTaskAllocation(id);
      }

      // Get task progress
      const progress = await orchestra.getTaskProgress(id);

      res.json({
        success: true,
        data: {
          task,
          allocation,
          progress,
          timeline: {
            created_at: task.created_at,
            allocated_at: allocation?.allocation_timestamp,
            started_at: progress?.started_at,
            completed_at: progress?.completed_at,
            estimated_completion: allocation?.expected_completion
          }
        }
      });
    })
  );

  /**
   * POST /tasks
   * Create a new task
   */
  router.post('/',
    validateRequest(createTaskSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const taskData = req.body;

      // Create task object
      const task: Task = {
        id: uuidv4(),
        description: taskData.description,
        type: taskData.type,
        priority: taskData.priority,
        deadline: taskData.deadline ? new Date(taskData.deadline) : undefined,
        required_skills: taskData.required_skills || [],
        estimated_duration_minutes: taskData.estimated_duration_minutes || 60,
        dependencies: taskData.dependencies || [],
        context: {
          ...taskData.context,
          created_by: req.user?.id || 'api',
          created_at: new Date()
        },
        constraints: taskData.constraints || [],
        expected_outcomes: taskData.expected_outcomes || []
      };

      // Submit task to orchestra for allocation
      const allocation = await orchestra.orchestrateTask(task);

      res.status(201).json({
        success: true,
        data: {
          task,
          allocation: {
            id: allocation.id,
            assigned_agent: allocation.assigned_agent,
            priority: allocation.priority,
            expected_completion: allocation.expected_completion
          }
        },
        message: `Task created and allocated to agent: ${allocation.assigned_agent}`
      });
    })
  );

  /**
   * PUT /tasks/:id
   * Update task details (only for pending tasks)
   */
  router.put('/:id',
    validateRequest(taskIdSchema),
    validateRequest(updateTaskSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const updates = req.body;

      const task = await orchestra.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      // Only allow updates for pending tasks
      if (task.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Task cannot be updated',
          message: `Task is ${task.status} and cannot be modified`
        });
      }

      const updatedTask = await orchestra.updateTask(id, {
        ...updates,
        context: {
          ...task.context,
          ...updates.context,
          updated_by: req.user?.id || 'api',
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedTask,
        message: 'Task updated successfully'
      });
    })
  );

  /**
   * DELETE /tasks/:id
   * Cancel a task
   */
  router.delete('/:id',
    validateRequest(taskIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { reason } = req.body;

      const task = await orchestra.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      // Check if task can be cancelled
      if (task.status === 'completed' || task.status === 'failed') {
        return res.status(400).json({
          success: false,
          error: 'Task cannot be cancelled',
          message: `Task is already ${task.status}`
        });
      }

      await orchestra.cancelTask(id, {
        reason: reason || 'Cancelled via API',
        cancelled_by: req.user?.id || 'api'
      });

      res.json({
        success: true,
        message: 'Task cancelled successfully'
      });
    })
  );

  /**
   * POST /tasks/:id/allocate
   * Manually allocate or reallocate a task
   */
  router.post('/:id/allocate',
    validateRequest(taskIdSchema),
    validateRequest(allocateTaskSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { preferred_agent, allocation_strategy, constraints } = req.body;

      const task = await orchestra.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      // Reallocate task
      const allocation = await orchestra.reallocateTask(id, {
        preferred_agent,
        allocation_strategy,
        constraints,
        reason: 'Manual reallocation via API'
      });

      res.json({
        success: true,
        data: allocation,
        message: `Task reallocated to agent: ${allocation.assigned_agent}`
      });
    })
  );

  /**
   * GET /tasks/:id/status
   * Get real-time status of a task
   */
  router.get('/:id/status',
    validateRequest(taskIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const status = await orchestra.getTaskStatus(id);
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: status
      });
    })
  );

  /**
   * GET /tasks/:id/progress
   * Get detailed progress information for a task
   */
  router.get('/:id/progress',
    validateRequest(taskIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;

      const progress = await orchestra.getTaskProgress(id);
      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: progress
      });
    })
  );

  /**
   * POST /tasks/:id/retry
   * Retry a failed task
   */
  router.post('/:id/retry',
    validateRequest(taskIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { strategy = 'same_agent' } = req.body;

      const task = await orchestra.getTask(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
          message: `No task found with ID: ${id}`
        });
      }

      if (task.status !== 'failed') {
        return res.status(400).json({
          success: false,
          error: 'Task cannot be retried',
          message: `Only failed tasks can be retried. Current status: ${task.status}`
        });
      }

      const retryResult = await orchestra.retryTask(id, {
        strategy,
        max_attempts: 3
      });

      res.json({
        success: true,
        data: retryResult,
        message: 'Task retry initiated successfully'
      });
    })
  );

  /**
   * GET /tasks/statistics
   * Get task statistics and analytics
   */
  router.get('/statistics', asyncHandler(async (req: Request, res: Response) => {
    const { period = '24h', group_by = 'status' } = req.query;

    const statistics = await orchestra.getTaskStatistics({
      period: period as string,
      group_by: group_by as string
    });

    res.json({
      success: true,
      data: statistics
    });
  }));

  /**
   * POST /tasks/bulk
   * Create multiple tasks at once
   */
  router.post('/bulk',
    asyncHandler(async (req: Request, res: Response) => {
      const { tasks } = req.body;

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Request must contain an array of tasks'
        });
      }

      if (tasks.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Too many tasks',
          message: 'Maximum 100 tasks can be created at once'
        });
      }

      // Validate and create tasks
      const results = await Promise.allSettled(
        tasks.map(async (taskData) => {
          const task: Task = {
            id: uuidv4(),
            description: taskData.description,
            type: taskData.type,
            priority: taskData.priority,
            deadline: taskData.deadline ? new Date(taskData.deadline) : undefined,
            required_skills: taskData.required_skills || [],
            estimated_duration_minutes: taskData.estimated_duration_minutes || 60,
            dependencies: taskData.dependencies || [],
            context: {
              ...taskData.context,
              created_by: req.user?.id || 'api',
              created_at: new Date(),
              bulk_request: true
            },
            constraints: taskData.constraints || [],
            expected_outcomes: taskData.expected_outcomes || []
          };

          return orchestra.orchestrateTask(task);
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      res.status(successful.length > 0 ? 201 : 400).json({
        success: successful.length > 0,
        data: {
          created: successful.length,
          failed: failed.length,
          tasks: successful.map(r => (r as any).value)
        },
        errors: failed.map((r, i) => ({
          index: i,
          error: (r as any).reason?.message || 'Unknown error'
        }))
      });
    })
  );

  return router;
}