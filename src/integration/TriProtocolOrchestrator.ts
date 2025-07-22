/**
 * Tri-Protocol Orchestrator - Complete A2A + LangGraph + MCP Coordination
 * Master orchestrator that coordinates all three protocols for seamless multi-agent workflows
 */

import { EventEmitter } from 'events';
import { A2AProtocol } from '@/a2a';
import { VegapunkAgentGraph } from '@/graph';
import { VegapunkMCPServer } from '@/mcp';
import { A2ALangGraphBridge } from './A2ALangGraphBridge';
import { LangGraphMCPBridge } from './LangGraphMCPBridge';

export interface TriProtocolConfig {
  a2a: {
    enableAutoDiscovery: boolean;
    networkName: string;
    healthMonitoring: boolean;
  };
  langGraph: {
    maxIterations: number;
    timeout: number;
    debugMode: boolean;
  };
  mcp: {
    enableToolCaching: boolean;
    enableResourceCaching: boolean;
    toolTimeout: number;
  };
  coordination: {
    enableCrossProtocolOptimization: boolean;
    enableIntelligentRouting: boolean;
    enablePerformanceMonitoring: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface WorkflowExecutionResult {
  success: boolean;
  response: string;
  metadata: {
    workflowId: string;
    sessionId: string;
    totalExecutionTime: number;
    agentPath: string[];
    protocolsUsed: string[];
    toolsExecuted: string[];
    resourcesAccessed: string[];
    handoffs: number;
    performance: {
      a2aTime: number;
      langGraphTime: number;
      mcpTime: number;
    };
  };
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  protocols: {
    a2a: boolean;
    langGraph: boolean;
    mcp: boolean;
  };
  bridges: {
    a2aLangGraph: boolean;
    langGraphMcp: boolean;
  };
  metrics: {
    totalWorkflows: number;
    successRate: number;
    averageExecutionTime: number;
    activeAgents: number;
    availableTools: number;
    availableResources: number;
  };
  timestamp: Date;
}

export class TriProtocolOrchestrator extends EventEmitter {
  private a2aProtocol: A2AProtocol;
  private agentGraph: VegapunkAgentGraph;
  private mcpServer: VegapunkMCPServer;
  private a2aLangGraphBridge: A2ALangGraphBridge;
  private langGraphMcpBridge: LangGraphMCPBridge;
  private config: TriProtocolConfig;
  private isInitialized = false;
  private workflowMetrics = new Map<string, any>();
  private performanceMetrics = {
    totalWorkflows: 0,
    successfulWorkflows: 0,
    totalExecutionTime: 0
  };

  constructor(
    a2aProtocol: A2AProtocol,
    agentGraph: VegapunkAgentGraph,
    mcpServer: VegapunkMCPServer,
    config?: Partial<TriProtocolConfig>
  ) {
    super();

    this.a2aProtocol = a2aProtocol;
    this.agentGraph = agentGraph;
    this.mcpServer = mcpServer;

    // Default configuration
    this.config = {
      a2a: {
        enableAutoDiscovery: true,
        networkName: 'vegapunk-ecosystem',
        healthMonitoring: true
      },
      langGraph: {
        maxIterations: 10,
        timeout: 120000, // 2 minutes
        debugMode: false
      },
      mcp: {
        enableToolCaching: true,
        enableResourceCaching: true,
        toolTimeout: 30000 // 30 seconds
      },
      coordination: {
        enableCrossProtocolOptimization: true,
        enableIntelligentRouting: true,
        enablePerformanceMonitoring: true,
        logLevel: 'info'
      },
      ...config
    };

    // Initialize bridges
    this.a2aLangGraphBridge = new A2ALangGraphBridge(this.a2aProtocol, this.agentGraph, {
      enableAutoDiscovery: this.config.a2a.enableAutoDiscovery,
      enableCapabilityMatching: true,
      enableHandoffOptimization: this.config.coordination.enableIntelligentRouting,
      logLevel: this.config.coordination.logLevel
    });

    this.langGraphMcpBridge = new LangGraphMCPBridge(this.mcpServer, {
      enableToolCaching: this.config.mcp.enableToolCaching,
      enableResourceCaching: this.config.mcp.enableResourceCaching,
      toolTimeout: this.config.mcp.toolTimeout,
      logLevel: this.config.coordination.logLevel
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize the complete tri-protocol system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('warn', 'Orchestrator already initialized');
      return;
    }

    try {
      this.log('info', 'Initializing Tri-Protocol Orchestrator...');

      // Initialize protocols in dependency order
      this.log('info', 'Step 1/5: Initializing A2A Protocol...');
      await this.a2aProtocol.initialize();

      this.log('info', 'Step 2/5: Initializing LangGraph...');
      await this.agentGraph.initialize();

      this.log('info', 'Step 3/5: Initializing MCP Server...');
      await this.mcpServer.start();

      this.log('info', 'Step 4/5: Initializing Protocol Bridges...');
      await this.a2aLangGraphBridge.initialize();
      await this.langGraphMcpBridge.initialize();

      this.log('info', 'Step 5/5: Setting up Cross-Protocol Optimization...');
      if (this.config.coordination.enableCrossProtocolOptimization) {
        await this.setupCrossProtocolOptimization();
      }

      this.isInitialized = true;
      this.log('info', '🚀 Tri-Protocol Orchestrator fully initialized and operational!');
      
      this.emit('orchestrator.initialized', {
        protocols: ['A2A', 'LangGraph', 'MCP'],
        bridges: ['A2A-LangGraph', 'LangGraph-MCP'],
        timestamp: new Date()
      });

    } catch (error) {
      this.log('error', `Orchestrator initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Execute a complete workflow using all three protocols
   */
  async executeWorkflow(
    message: string,
    sessionId: string,
    userId?: string
  ): Promise<WorkflowExecutionResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startTime = Date.now();
    
    let a2aTime = 0;
    let langGraphTime = 0;
    let mcpTime = 0;
    
    const protocolsUsed: string[] = [];
    const toolsExecuted: string[] = [];
    const resourcesAccessed: string[] = [];

    try {
      this.log('info', `Starting workflow ${workflowId}: "${message}"`);
      this.performanceMetrics.totalWorkflows++;

      // Phase 1: A2A Agent Discovery & Optimization
      const a2aStartTime = Date.now();
      
      if (this.config.coordination.enableIntelligentRouting) {
        protocolsUsed.push('A2A');
        this.log('debug', 'Phase 1: A2A agent discovery and capability matching...');
        
        // Discover optimal agents for this workflow
        const availableAgents = await this.a2aLangGraphBridge.discoverAgentsForWorkflow({
          minReliability: 0.7,
          maxLoad: 80
        });
        
        this.log('debug', `Discovered ${availableAgents.length} capable agents`);
      }
      
      a2aTime = Date.now() - a2aStartTime;

      // Phase 2: LangGraph Workflow Execution with MCP Integration
      const langGraphStartTime = Date.now();
      protocolsUsed.push('LangGraph');
      
      this.log('debug', 'Phase 2: Executing LangGraph workflow with MCP integration...');
      
      // Execute the main workflow
      const workflowResult = await this.agentGraph.processMessage(message, sessionId, userId);
      
      langGraphTime = Date.now() - langGraphStartTime;

      // Phase 3: MCP Tool Execution (if tools were used)
      const mcpStartTime = Date.now();
      
      // Check if any MCP tools were executed during the workflow
      const mcpToolsUsed = this.extractMCPToolsFromResult(workflowResult);
      if (mcpToolsUsed.length > 0) {
        protocolsUsed.push('MCP');
        toolsExecuted.push(...mcpToolsUsed);
        
        this.log('debug', `Phase 3: MCP tools executed: ${mcpToolsUsed.join(', ')}`);
      }
      
      mcpTime = Date.now() - mcpStartTime;

      // Calculate final metrics
      const totalExecutionTime = Date.now() - startTime;
      this.performanceMetrics.totalExecutionTime += totalExecutionTime;
      this.performanceMetrics.successfulWorkflows++;

      // Extract workflow metadata
      const agentPath = workflowResult.metadata?.agentPath || [];
      const handoffs = this.a2aLangGraphBridge.getHandoffAnalytics(sessionId).totalHandoffs;

      // Store workflow metrics
      const workflowMetrics = {
        workflowId,
        sessionId,
        success: true,
        executionTime: totalExecutionTime,
        protocolsUsed,
        toolsExecuted,
        resourcesAccessed,
        agentPath,
        handoffs,
        performance: { a2aTime, langGraphTime, mcpTime }
      };
      
      this.workflowMetrics.set(workflowId, workflowMetrics);

      this.log('info', `✅ Workflow ${workflowId} completed successfully in ${totalExecutionTime}ms`);
      
      this.emit('workflow.completed', workflowMetrics);

      return {
        success: true,
        response: workflowResult.response,
        metadata: {
          workflowId,
          sessionId,
          totalExecutionTime,
          agentPath,
          protocolsUsed,
          toolsExecuted,
          resourcesAccessed,
          handoffs,
          performance: { a2aTime, langGraphTime, mcpTime }
        }
      };

    } catch (error) {
      const totalExecutionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log('error', `❌ Workflow ${workflowId} failed: ${errorMessage}`);
      
      this.emit('workflow.failed', {
        workflowId,
        sessionId,
        error: errorMessage,
        executionTime: totalExecutionTime
      });

      return {
        success: false,
        response: `Workflow execution failed: ${errorMessage}`,
        error: errorMessage,
        metadata: {
          workflowId,
          sessionId,
          totalExecutionTime,
          agentPath: [],
          protocolsUsed,
          toolsExecuted,
          resourcesAccessed,
          handoffs: 0,
          performance: { a2aTime, langGraphTime, mcpTime }
        }
      };
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const protocolStatus = {
      a2a: false,
      langGraph: false,
      mcp: false
    };

    const bridgeStatus = {
      a2aLangGraph: false,
      langGraphMcp: false
    };

    try {
      // Check A2A Protocol
      const a2aStats = this.a2aProtocol.getNetworkStats();
      protocolStatus.a2a = a2aStats.onlineAgents > 0;

      // Check LangGraph
      const graphConfig = this.agentGraph.getConfig();
      protocolStatus.langGraph = !!graphConfig;

      // Check MCP Server
      const mcpHealth = this.mcpServer.getHealthCheck();
      protocolStatus.mcp = mcpHealth.status === 'healthy';

      // Check Bridges
      const a2aBridgeMetrics = this.a2aLangGraphBridge;
      bridgeStatus.a2aLangGraph = !!a2aBridgeMetrics;

      const mcpBridgeMetrics = this.langGraphMcpBridge.getBridgeMetrics();
      bridgeStatus.langGraphMcp = mcpBridgeMetrics.isInitialized;

    } catch (error) {
      this.log('error', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Calculate overall health
    const healthyProtocols = Object.values(protocolStatus).filter(Boolean).length;
    const healthyBridges = Object.values(bridgeStatus).filter(Boolean).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyProtocols === 3 && healthyBridges === 2) {
      overall = 'healthy';
    } else if (healthyProtocols >= 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    // Get metrics
    const successRate = this.performanceMetrics.totalWorkflows > 0 
      ? this.performanceMetrics.successfulWorkflows / this.performanceMetrics.totalWorkflows
      : 0;

    const averageExecutionTime = this.performanceMetrics.totalWorkflows > 0
      ? this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalWorkflows
      : 0;

    let activeAgents = 0;
    let availableTools = 0;
    let availableResources = 0;

    try {
      const a2aStats = this.a2aProtocol.getNetworkStats();
      activeAgents = a2aStats.onlineAgents;

      const tools = await this.langGraphMcpBridge.getAvailableTools();
      availableTools = tools.length;

      const resources = await this.langGraphMcpBridge.getAvailableResources();
      availableResources = resources.length;
    } catch (error) {
      this.log('warn', `Failed to get some metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      overall,
      protocols: protocolStatus,
      bridges: bridgeStatus,
      metrics: {
        totalWorkflows: this.performanceMetrics.totalWorkflows,
        successRate,
        averageExecutionTime,
        activeAgents,
        availableTools,
        availableResources
      },
      timestamp: new Date()
    };
  }

  /**
   * Get orchestrator performance metrics
   */
  getPerformanceMetrics() {
    const recentWorkflows = Array.from(this.workflowMetrics.values())
      .filter(w => (Date.now() - new Date(w.timestamp || 0).getTime()) < 3600000) // Last hour
      .slice(-100); // Last 100 workflows

    return {
      overall: {
        totalWorkflows: this.performanceMetrics.totalWorkflows,
        successfulWorkflows: this.performanceMetrics.successfulWorkflows,
        successRate: this.performanceMetrics.totalWorkflows > 0 
          ? this.performanceMetrics.successfulWorkflows / this.performanceMetrics.totalWorkflows 
          : 0,
        averageExecutionTime: this.performanceMetrics.totalWorkflows > 0
          ? this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalWorkflows
          : 0
      },
      protocols: {
        a2a: this.calculateProtocolMetrics(recentWorkflows, 'a2aTime'),
        langGraph: this.calculateProtocolMetrics(recentWorkflows, 'langGraphTime'),
        mcp: this.calculateProtocolMetrics(recentWorkflows, 'mcpTime')
      },
      bridges: {
        a2aLangGraph: this.a2aLangGraphBridge ? 'healthy' : 'unhealthy',
        langGraphMcp: this.langGraphMcpBridge.getBridgeMetrics()
      },
      recent: recentWorkflows.slice(-10) // Last 10 workflows
    };
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    this.log('info', 'Shutting down Tri-Protocol Orchestrator...');

    try {
      // Shutdown bridges first
      await this.langGraphMcpBridge.shutdown();
      await this.a2aLangGraphBridge.shutdown();

      // Shutdown protocols
      await this.mcpServer.stop();
      await this.a2aProtocol.shutdown();

      // Clear metrics
      this.workflowMetrics.clear();

      this.isInitialized = false;
      this.log('info', 'Tri-Protocol Orchestrator shutdown complete');
      
      this.emit('orchestrator.shutdown');

    } catch (error) {
      this.log('error', `Shutdown error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // ================================
  // Private Methods
  // ================================

  private setupEventHandlers(): void {
    // A2A Protocol events
    this.a2aProtocol.on('agent.registered', (agent) => {
      this.emit('system.agent.registered', agent);
    });

    this.a2aProtocol.on('network.topology.changed', (topology) => {
      this.emit('system.topology.changed', topology);
    });

    // Bridge events
    this.a2aLangGraphBridge.on('handoff.recorded', (handoff, sessionId) => {
      this.emit('system.handoff', handoff, sessionId);
    });

    this.langGraphMcpBridge.on('tool.executed', (toolName, result, executionTime) => {
      this.emit('system.tool.executed', toolName, result, executionTime);
    });
  }

  private async setupCrossProtocolOptimization(): Promise<void> {
    // Set up cross-protocol optimization logic
    this.log('debug', 'Setting up cross-protocol optimization...');
    
    // This could include:
    // - Predictive agent selection based on historical performance
    // - Tool pre-loading based on workflow patterns
    // - Resource caching optimization
    // - Load balancing across protocols
  }

  private extractMCPToolsFromResult(result: any): string[] {
    // Extract MCP tools that were used during workflow execution
    // This would analyze the workflow result metadata
    const tools: string[] = [];
    
    if (result.metadata?.toolsExecuted) {
      tools.push(...result.metadata.toolsExecuted);
    }
    
    return tools;
  }

  private calculateProtocolMetrics(workflows: any[], timeField: string) {
    if (workflows.length === 0) {
      return { averageTime: 0, totalUsage: 0, successRate: 0 };
    }

    const times = workflows
      .map(w => w.performance?.[timeField] || 0)
      .filter(t => t > 0);

    const averageTime = times.length > 0 
      ? times.reduce((sum, time) => sum + time, 0) / times.length 
      : 0;

    return {
      averageTime,
      totalUsage: times.length,
      successRate: times.length / workflows.length
    };
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.langGraphMcpBridge) await this.langGraphMcpBridge.shutdown();
      if (this.a2aLangGraphBridge) await this.a2aLangGraphBridge.shutdown();
      if (this.mcpServer) await this.mcpServer.stop();
    } catch (error) {
      this.log('error', `Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.coordination.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[Tri-Protocol-Orchestrator-${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
    }
  }
}