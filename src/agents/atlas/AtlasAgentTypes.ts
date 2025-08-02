/**
 * AtlasAgent Type Definitions
 * Local A2A protocol types until official SDK is available
 */

export interface AgentExecutor {
  cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void>;
  execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void>;
}

export interface RequestContext {
  userMessage: any;
  task?: Task;
  taskId: string;
  contextId: string;
}

export interface ExecutionEventBus {
  publish(event: any): void;
  finished(): void;
}

export interface Task {
  kind: "task";
  id: string;
  contextId: string;
  status: {
    state: string;
    timestamp: string;
  };
  history: any[];
  metadata: Record<string, any>;
  artifacts: any[];
}

export interface TaskStatusUpdateEvent {
  kind: "status-update";
  taskId: string;
  contextId: string;
  status: {
    state: string;
    message?: {
      kind: "message";
      role: string;
      messageId: string;
      parts: Array<{
        kind: string;
        text: string;
      }>;
      taskId: string;
      contextId: string;
    };
    timestamp: string;
  };
  final: boolean;
}

export interface TaskArtifactUpdateEvent {
  kind: "artifact-update";
  taskId: string;
  contextId: string;
  artifact: {
    artifactId: string;
    name: string;
    parts: Array<{
      kind: string;
      text: string;
    }>;
  };
  append: boolean;
  lastChunk: boolean;
}

export interface TaskStore {
  getTask(taskId: string): Promise<Task | null>;
  storeTask(task: Task): Promise<void>;
  updateTask(taskId: string, update: Partial<Task>): Promise<void>;
}

export class InMemoryTaskStore implements TaskStore {
  private tasks = new Map<string, Task>();

  async getTask(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async storeTask(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async updateTask(taskId: string, update: Partial<Task>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, { ...task, ...update });
    }
  }
}

export interface A2AExpressApp {
  setupRoutes(app: any, basePath: string): void;
}

export class A2AExpressApp {
  constructor(private requestHandler: DefaultRequestHandler) {}

  setupRoutes(app: any, basePath: string): void {
    // Agent card endpoint
    app.get(`${basePath}/.well-known/agent.json`, (req: any, res: any) => {
      res.json(this.requestHandler.agentCard);
    });

    // Task endpoints
    app.post(`${basePath}/tasks`, async (req: any, res: any) => {
      try {
        const task = await this.requestHandler.createTask(req.body);
        res.json(task);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get(`${basePath}/tasks/:taskId`, async (req: any, res: any) => {
      try {
        const task = await this.requestHandler.getTask(req.params.taskId);
        if (!task) {
          res.status(404).json({ error: 'Task not found' });
        } else {
          res.json(task);
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}

export class DefaultRequestHandler {
  constructor(
    public agentCard: any,
    private taskStore: TaskStore,
    private agentExecutor: AgentExecutor
  ) {}

  async createTask(requestData: any): Promise<Task> {
    const task: Task = {
      kind: "task",
      id: `task-${Date.now()}`,
      contextId: requestData.contextId || `ctx-${Date.now()}`,
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
      },
      history: [requestData],
      metadata: requestData.metadata || {},
      artifacts: [],
    };

    await this.taskStore.storeTask(task);
    return task;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.taskStore.getTask(taskId);
  }
}