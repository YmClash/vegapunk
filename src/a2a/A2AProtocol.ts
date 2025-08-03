/**
 * A2A Protocol - Main Agent-to-Agent Communication Protocol
 * Orchestrates agent registry, message routing, and network coordination
 */

import { EventEmitter } from 'events';
import {
  A2AMessage,
  A2AMessageType,
  A2AResponse,
  A2APriority,
  AgentProfile,
  AgentStatus,
  CapabilityQuery,
  CapabilityMatch,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStatus,
  TaskDefinition,
  TaskResult,
  NetworkTopology,
  A2AConfig,
  A2AProtocolEvents,
  HealthMetrics,
  A2AError
} from './types';
import { AgentRegistry } from './AgentRegistry';
import { MessageRouter } from './MessageRouter';

export class A2AProtocol extends EventEmitter {
  private registry: AgentRegistry;
  private router: MessageRouter;
  private config: A2AConfig;
  private isInitialized = false;
  private healthMonitorInterval?: NodeJS.Timeout;
  private workflowExecutions = new Map<string, WorkflowExecution>();
  private messageIdCounter = 0;

  constructor(config?: Partial<A2AConfig>) {
    super();
    
    // Default configuration
    this.config = {
      networkName: 'vegapunk-a2a-network',
      broadcastInterval: 30000, // 30 seconds
      messageTimeout: 10000, // 10 seconds
      maxRetries: 3,
      enableHealthMonitoring: true,
      enableWorkflowEngine: true,
      logLevel: 'info',
      performance: {
        maxConcurrentTasks: 50,
        queueSize: 1000,
        routingAlgorithm: 'best-match'
      },
      ...config
    };

    // Initialize components
    this.registry = new AgentRegistry();
    this.router = new MessageRouter(this.registry, this.config);

    this.setupEventHandlers();
  }

  /**
   * Initialize the A2A protocol
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new A2AError('Protocol already initialized', 'ALREADY_INITIALIZED');
    }

    try {
      // Setup health monitoring
      if (this.config.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }

      this.isInitialized = true;
      this.log('info', `A2A Protocol initialized - Network: ${this.config.networkName}`);
      
      this.emit('protocol.initialized', { networkName: this.config.networkName });
    } catch (error) {
      throw new A2AError(
        `Failed to initialize A2A protocol: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED'
      );
    }
  }

  /**
   * Shutdown the A2A protocol
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    // Stop health monitoring
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }

    // Cancel active workflows
    for (const execution of this.workflowExecutions.values()) {
      if (execution.status === WorkflowStatus.RUNNING) {
        execution.status = WorkflowStatus.CANCELLED;
        execution.endTime = new Date();
      }
    }

    this.isInitialized = false;
    this.log('info', 'A2A Protocol shutdown complete');
    
    this.emit('protocol.shutdown');
  }

  // ================================
  // Agent Management
  // ================================

  /**
   * Register an agent with the A2A network
   */
  async registerAgent(profile: AgentProfile): Promise<void> {
    this.ensureInitialized();
    
    await this.registry.register(profile);
    
    // Announce agent to network
    const announcement: A2AMessage = {
      id: this.generateMessageId(),
      from: profile.agentId,
      to: 'broadcast',
      type: A2AMessageType.AGENT_ANNOUNCE,
      payload: {
        profile,
        capabilities: profile.capabilities,
        timestamp: new Date()
      },
      timestamp: new Date(),
      priority: 'normal'
    };

    await this.router.broadcastMessage(announcement);
    this.log('info', `Agent registered: ${profile.agentId} with ${profile.capabilities.length} capabilities`);
  }

  /**
   * Unregister an agent from the network
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.ensureInitialized();
    
    // Announce agent offline
    const offlineMessage: A2AMessage = {
      id: this.generateMessageId(),
      from: agentId,
      to: 'broadcast',
      type: A2AMessageType.AGENT_OFFLINE,
      payload: { agentId, timestamp: new Date() },
      timestamp: new Date(),
      priority: 'normal'
    };

    await this.router.broadcastMessage(offlineMessage);
    await this.registry.unregister(agentId);
    
    this.log('info', `Agent unregistered: ${agentId}`);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus, metadata?: any): Promise<void> {
    this.ensureInitialized();
    
    await this.registry.updateStatus(agentId, status, metadata);
    
    // Broadcast status update
    const statusMessage: A2AMessage = {
      id: this.generateMessageId(),
      from: agentId,
      to: 'broadcast',
      type: A2AMessageType.STATUS_UPDATE,
      payload: { agentId, status, metadata, timestamp: new Date() },
      timestamp: new Date(),
      priority: 'low'
    };

    await this.router.broadcastMessage(statusMessage);
  }

  // ================================
  // Communication Methods
  // ================================

  /**
   * Send a message to a specific agent
   */
  async sendMessage(message: A2AMessage): Promise<A2AResponse> {
    this.ensureInitialized();
    return this.router.routeMessage(message);
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(message: A2AMessage): Promise<A2AResponse[]> {
    this.ensureInitialized();
    return this.router.broadcastMessage(message);
  }

  /**
   * Send a task request to capable agents
   */
  async requestTask(task: TaskDefinition, fromAgent: string): Promise<TaskResult> {
    this.ensureInitialized();
    
    const taskMessage: A2AMessage = {
      id: this.generateMessageId(),
      from: fromAgent,
      to: 'auto', // Router will find best agent
      type: A2AMessageType.TASK_REQUEST,
      payload: task,
      timestamp: new Date(),
      priority: task.priority || 'normal',
      ttl: task.timeout
    };

    const response = await this.router.routeMessage(taskMessage);
    
    if (!response.success) {
      throw new A2AError(`Task request failed: ${response.error}`, 'TASK_FAILED');
    }

    return response.data as TaskResult;
  }

  // ================================
  // Discovery Methods
  // ================================

  /**
   * Discover agents in the network
   */
  async discoverAgents(): Promise<AgentProfile[]> {
    this.ensureInitialized();
    return this.registry.discover();
  }

  /**
   * Query capabilities across the network
   */
  async queryCapabilities(query: CapabilityQuery): Promise<CapabilityMatch[]> {
    this.ensureInitialized();
    return this.registry.queryCapabilities(query);
  }

  /**
   * Find agents with specific capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentProfile[]> {
    this.ensureInitialized();
    return this.registry.findByCapability(capability);
  }

  /**
   * Find best agent for a capability
   */
  async findBestAgent(capability: string, criteria?: any): Promise<AgentProfile | null> {
    this.ensureInitialized();
    return this.router.findBestAgent(capability, criteria);
  }

  // ================================
  // Workflow Management
  // ================================

  /**
   * Execute a workflow across multiple agents
   */
  async executeWorkflow(workflow: WorkflowDefinition, initiator: string): Promise<WorkflowExecution> {
    this.ensureInitialized();
    
    if (!this.config.enableWorkflowEngine) {
      throw new A2AError('Workflow engine is disabled', 'WORKFLOW_DISABLED');
    }

    const executionId = `wf-${workflow.id}-${Date.now()}`;
    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      executionId,
      status: WorkflowStatus.PENDING,
      startTime: new Date(),
      results: new Map()
    };

    this.workflowExecutions.set(executionId, execution);

    try {
      // Start workflow
      execution.status = WorkflowStatus.RUNNING;
      
      const workflowMessage: A2AMessage = {
        id: this.generateMessageId(),
        from: initiator,
        to: 'workflow-engine',
        type: A2AMessageType.WORKFLOW_START,
        payload: { workflow, executionId },
        timestamp: new Date(),
        priority: 'high',
        correlationId: executionId
      };

      await this.router.routeMessage(workflowMessage);
      
      this.emit('workflow.started', execution);
      this.log('info', `Workflow started: ${workflow.name} (${executionId})`);
      
      return execution;
      
    } catch (error) {
      execution.status = WorkflowStatus.FAILED;
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : 'Workflow execution failed';
      
      this.emit('workflow.failed', execution, execution.error);
      throw new A2AError(`Workflow execution failed: ${execution.error}`, 'WORKFLOW_FAILED');
    }
  }

  /**
   * Get workflow execution status
   */
  getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    return this.workflowExecutions.get(executionId);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.workflowExecutions.values())
      .filter(execution => execution.status === WorkflowStatus.RUNNING);
  }

  // ================================
  // Network Monitoring
  // ================================

  /**
   * Get current network topology
   */
  getNetworkTopology(): NetworkTopology {
    this.ensureInitialized();
    return this.registry.getTopology();
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    const registryStats = this.registry.getNetworkStats();
    const routingStats = this.router.getRoutingStats();
    
    return {
      ...registryStats,
      routing: routingStats,
      workflows: {
        total: this.workflowExecutions.size,
        active: this.getActiveWorkflows().length,
        completed: Array.from(this.workflowExecutions.values())
          .filter(ex => ex.status === WorkflowStatus.COMPLETED).length,
        failed: Array.from(this.workflowExecutions.values())
          .filter(ex => ex.status === WorkflowStatus.FAILED).length
      },
      protocol: {
        initialized: this.isInitialized,
        networkName: this.config.networkName,
        uptime: this.isInitialized ? Date.now() - (this.registry as any).startTime : 0
      }
    };
  }

  /**
   * Perform network health check
   */
  async performHealthCheck(): Promise<HealthMetrics[]> {
    this.ensureInitialized();
    
    const agents = await this.registry.discover();
    const healthChecks: Promise<HealthMetrics>[] = [];
    
    for (const agent of agents) {
      if (agent.status === AgentStatus.ONLINE) {
        const healthPromise = this.checkAgentHealth(agent.agentId);
        healthChecks.push(healthPromise);
      }
    }
    
    const results = await Promise.allSettled(healthChecks);
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<HealthMetrics>).value);
  }

  // ================================
  // Private Methods
  // ================================

  private setupEventHandlers(): void {
    // Registry events
    this.registry.on('agent.registered', (agent: AgentProfile) => {
      this.emit('agent.registered', agent);
    });

    this.registry.on('agent.unregistered', (agentId: string) => {
      this.emit('agent.unregistered', agentId);
    });

    this.registry.on('agent.status.changed', (agentId: string, status: AgentStatus) => {
      this.emit('agent.status.changed', agentId, status);
    });

    this.registry.on('network.topology.changed', (topology: NetworkTopology) => {
      this.emit('network.topology.changed', topology);
    });

    // Router events
    this.router.on('message.sent', (message: A2AMessage) => {
      this.emit('message.sent', message);
    });

    this.router.on('message.received', (message: A2AMessage) => {
      this.emit('message.received', message);
    });

    this.router.on('message.failed', (message: A2AMessage, error: string) => {
      this.emit('message.failed', message, error);
    });
  }

  private startHealthMonitoring(): void {
    this.healthMonitorInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.log('error', `Health monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, this.config.broadcastInterval);
  }

  private async checkAgentHealth(agentId: string): Promise<HealthMetrics> {
    const healthMessage: A2AMessage = {
      id: this.generateMessageId(),
      from: 'a2a-protocol',
      to: agentId,
      type: A2AMessageType.HEALTH_CHECK,
      payload: { timestamp: new Date() },
      timestamp: new Date(),
      priority: 'low'
    };

    const startTime = Date.now();
    const response = await this.router.routeMessage(healthMessage);
    const responseTime = Date.now() - startTime;

    return {
      agentId,
      timestamp: new Date(),
      cpu_usage: 0, // Would be provided by agent
      memory_usage: 0, // Would be provided by agent
      response_time: responseTime,
      success_rate: response.success ? 1 : 0,
      active_tasks: 0, // Would be provided by agent
      queue_length: 0, // Would be provided by agent
      last_error: response.success ? undefined : response.error
    };
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${++this.messageIdCounter}`;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new A2AError('Protocol not initialized', 'NOT_INITIALIZED');
    }
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[A2A-${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
    }
  }
}