/**
 * Base class for all Vegapunk satellite agents
 * Following Anthropic's principle: Start simple, ensure transparency
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type {
  AgentState,
  AgentStatus,
  AgentContext,
  Goal,
  Memory,
  AgentMessage,
  PerformanceMetrics,
  AgentConfig,
  AgentGuardrails,
  ToolResult,
  AgentTool,
} from '@interfaces/base.types';
import type { AgenticCapabilities } from '@interfaces/capabilities.types';
import { MemorySystem } from '@memory/MemorySystem';
import { PlanningEngine } from './PlanningEngine';
import { DecisionEngine } from './DecisionEngine';

export abstract class AgenticSatellite extends EventEmitter {
  protected readonly logger;
  protected state: AgentState;
  protected readonly config: AgentConfig;
  protected readonly capabilities: AgenticCapabilities;
  protected readonly guardrails: AgentGuardrails;
  protected readonly memorySystem: MemorySystem;
  protected readonly planningEngine: PlanningEngine;
  protected readonly decisionEngine: DecisionEngine;
  protected readonly tools: Map<string, AgentTool> = new Map();
  
  private isRunning = false;
  private cycleCount = 0;
  private readonly startTime = Date.now();
  private readonly performanceMetrics: PerformanceMetrics = {
    tasksCompleted: 0,
    tasksAttempted: 0,
    successRate: 0,
    averageResponseTime: 0,
    uptime: 0,
  };

  constructor(
    config: AgentConfig,
    capabilities: AgenticCapabilities,
    guardrails: AgentGuardrails,
  ) {
    super();
    
    this.config = config;
    this.capabilities = capabilities;
    this.guardrails = guardrails;
    this.logger = createLogger(`Agent:${config.name}`);
    
    // Initialize state
    this.state = this.initializeState();
    
    // Initialize core systems
    this.memorySystem = new MemorySystem(capabilities.memory);
    this.planningEngine = new PlanningEngine(capabilities.planning);
    this.decisionEngine = new DecisionEngine(capabilities.decisionMaking);
    
    // Setup event handlers
    this.setupEventHandlers();
    
    this.logger.info('Agent initialized', {
      name: config.name,
      specialty: config.specialty,
      autonomyLevel: capabilities.autonomyLevel,
    });
  }

  /**
   * Start the autonomous agent cycle
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent already running');
      return;
    }

    this.isRunning = true;
    this.emit('agent:started', { agentId: this.state.id });
    
    try {
      await this.runAutonomousCycle();
    } catch (error) {
      this.logger.error('Agent cycle error', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('agent:stopped', { agentId: this.state.id });
    this.logger.info('Agent stopped');
  }

  /**
   * Main autonomous cycle - Following Anthropic's workflow pattern
   */
  private async runAutonomousCycle(): Promise<void> {
    while (this.isRunning) {
      const cycleStart = Date.now();
      
      try {
        // Check guardrails
        if (!this.checkGuardrails()) {
          this.logger.warn('Guardrails check failed, pausing cycle');
          await this.pause(5000);
          continue;
        }

        // 1. Perceive environment
        this.updateStatus('thinking');
        const perception = await this.perceive();
        
        // 2. Update context
        await this.updateContext(perception);
        
        // 3. Plan actions based on goals and perception
        const plan = await this.plan(perception);
        
        // 4. Make decisions about the plan
        const decision = await this.decide(plan);
        
        // 5. Execute the decision
        if (decision.selectedOption) {
          this.updateStatus('acting');
          const result = await this.execute(decision.selectedOption);
          
          // 6. Learn from the result
          await this.learn(result);
        }
        
        // 7. Communicate if needed
        await this.communicateStatus();
        
        // Update metrics
        this.updateMetrics(Date.now() - cycleStart);
        
        // Rate limiting
        await this.pause(this.config.cycleInterval);
        
      } catch (error) {
        this.logger.error('Cycle error', error);
        await this.handleError(error as Error);
      }
      
      this.cycleCount++;
      
      // Check iteration limit
      if (this.guardrails.maxExecutionTime && 
          Date.now() - this.startTime > this.guardrails.maxExecutionTime) {
        this.logger.info('Max execution time reached, stopping');
        await this.stop();
      }
    }
  }

  /**
   * Check if agent is within guardrails
   */
  private checkGuardrails(): boolean {
    // Check memory usage
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > this.guardrails.maxMemoryUsage) {
      this.logger.warn('Memory usage exceeds limit', { memUsage });
      return false;
    }
    
    // Check concurrent operations
    const activeGoals = this.state.currentGoals.filter(g => g.status === 'in-progress');
    if (activeGoals.length > this.guardrails.maxConcurrentOperations) {
      this.logger.warn('Too many concurrent operations', { activeGoals: activeGoals.length });
      return false;
    }
    
    return true;
  }

  /**
   * Register a tool for the agent to use
   */
  public registerTool(tool: AgentTool): void {
    if (!this.guardrails.allowedTools.includes(tool.name)) {
      throw new Error(`Tool ${tool.name} not allowed by guardrails`);
    }
    
    this.tools.set(tool.name, tool);
    this.logger.info('Tool registered', { toolName: tool.name });
  }

  /**
   * Send a message to another agent
   */
  public async sendMessage(to: string, content: unknown): Promise<void> {
    if (!this.capabilities.communication.canInitiateConversation) {
      throw new Error('Agent cannot initiate conversations');
    }
    
    const message: AgentMessage = {
      id: uuidv4(),
      from: this.state.id,
      to,
      type: 'request',
      content,
      timestamp: new Date(),
    };
    
    this.emit('message:sent', message);
    await this.memorySystem.store({
      type: 'episodic',
      content: { action: 'sent_message', message },
      importance: 0.5,
    });
  }

  /**
   * Receive and process a message
   */
  public async receiveMessage(message: AgentMessage): Promise<void> {
    this.logger.info('Message received', { from: message.from });
    
    await this.memorySystem.store({
      type: 'episodic',
      content: { action: 'received_message', message },
      importance: 0.6,
    });
    
    // Process message in next cycle
    this.state.currentContext.environmentState.pendingMessage = message;
  }

  /**
   * Get current agent state
   */
  public getState(): Readonly<AgentState> {
    return { ...this.state };
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): Readonly<PerformanceMetrics> {
    return {
      ...this.performanceMetrics,
      uptime: Date.now() - this.startTime,
    };
  }

  // Abstract methods to be implemented by specific agents
  protected abstract perceive(): Promise<unknown>;
  protected abstract plan(perception: unknown): Promise<unknown>;
  protected abstract decide(plan: unknown): Promise<DecisionResult>;
  protected abstract execute(decision: unknown): Promise<ToolResult>;
  protected abstract learn(result: ToolResult): Promise<void>;
  
  // Helper methods
  private initializeState(): AgentState {
    return {
      id: `${this.config.name.toLowerCase()}-${uuidv4()}`,
      name: this.config.name,
      specialty: this.config.specialty,
      status: 'idle',
      currentGoals: [],
      activeMemories: [],
      currentContext: {
        environmentState: {},
        collaboratingAgents: [],
        availableResources: [...this.tools.keys()],
        timestamp: new Date(),
      },
      lastActivity: new Date(),
      errorCount: 0,
    };
  }

  private updateStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastActivity = new Date();
    this.emit('status:changed', { agentId: this.state.id, status });
  }

  private async updateContext(perception: unknown): Promise<void> {
    this.state.currentContext = {
      ...this.state.currentContext,
      environmentState: {
        ...this.state.currentContext.environmentState,
        perception,
      },
      timestamp: new Date(),
    };
  }

  private async communicateStatus(): Promise<void> {
    if (this.cycleCount % 10 === 0) { // Every 10 cycles
      this.emit('status:update', {
        agentId: this.state.id,
        status: this.state.status,
        metrics: this.getMetrics(),
        activeGoals: this.state.currentGoals.filter(g => g.status === 'in-progress').length,
      });
    }
  }

  private updateMetrics(cycleTime: number): void {
    this.performanceMetrics.tasksAttempted++;
    
    // Update average response time
    const totalTime = this.performanceMetrics.averageResponseTime * 
                     (this.performanceMetrics.tasksAttempted - 1) + cycleTime;
    this.performanceMetrics.averageResponseTime = 
      totalTime / this.performanceMetrics.tasksAttempted;
    
    // Update success rate
    this.performanceMetrics.successRate = 
      this.performanceMetrics.tasksCompleted / this.performanceMetrics.tasksAttempted;
  }

  private async handleError(error: Error): Promise<void> {
    this.state.errorCount++;
    this.performanceMetrics.lastError = new Date();
    
    await this.memorySystem.store({
      type: 'episodic',
      content: { error: error.message, stack: error.stack },
      importance: 0.8,
    });
    
    this.updateStatus('error');
    this.emit('error', { agentId: this.state.id, error });
    
    // Pause before retrying
    await this.pause(5000);
    this.updateStatus('idle');
  }

  private pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupEventHandlers(): void {
    this.on('goal:completed', (goal: Goal) => {
      this.performanceMetrics.tasksCompleted++;
      this.logger.info('Goal completed', { goalId: goal.id });
    });
  }
}