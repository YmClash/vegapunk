/**
 * GraphQL API Server for Vegapunk Agentic System
 * Provides GraphQL endpoints for complex queries and real-time subscriptions
 * Integrates with LangGraph for advanced graph-based agent workflows
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { Application } from 'express';
import { createServer } from 'http';
import { StateGraph, StateGraphArgs } from '@langchain/langgraph';
import { createLogger } from '@utils/logger';
import { StellarOrchestra } from '@orchestration/StellarOrchestra';
import { AgentRegistry } from '@core/AgentRegistry';
import { authDirective } from './directives/auth';
import { rateLimitDirective } from './directives/rateLimit';
import { cacheDirective } from './directives/cache';

// Import resolvers
import { agentResolvers } from './resolvers/agents';
import { taskResolvers } from './resolvers/tasks';
import { collaborationResolvers } from './resolvers/collaborations';
import { workflowResolvers } from './resolvers/workflows';
import { metricsResolvers } from './resolvers/metrics';
import { subscriptionResolvers } from './resolvers/subscriptions';

const logger = createLogger('GraphQLServer');

export interface GraphQLServerConfig {
  port: number;
  path: string;
  playground: boolean;
  introspection: boolean;
  subscriptions: boolean;
  tracing: boolean;
  cacheControl: boolean;
  persistedQueries: boolean;
  maxComplexity: number;
  maxDepth: number;
}

export interface GraphQLContext {
  orchestra: StellarOrchestra;
  agentRegistry: AgentRegistry;
  pubsub: PubSub;
  user?: any;
  langGraph: StateGraph<any, any>;
  dataSources: {
    agents: AgentDataSource;
    tasks: TaskDataSource;
    workflows: WorkflowDataSource;
  };
}

/**
 * LangGraph Integration for Agent Workflows
 */
export class AgentWorkflowGraph {
  private graph: StateGraph<any, any>;
  private orchestra: StellarOrchestra;

  constructor(orchestra: StellarOrchestra) {
    this.orchestra = orchestra;
    this.initializeGraph();
  }

  private initializeGraph(): void {
    // Define the state for agent workflows
    const graphState: StateGraphArgs<any>['channels'] = {
      messages: {
        value: (x: any[], y: any[]) => x.concat(y),
        default: () => []
      },
      current_agent: {
        value: (x: any, y: any) => y ?? x,
        default: () => null
      },
      task_status: {
        value: (x: any, y: any) => ({ ...x, ...y }),
        default: () => ({})
      },
      collaboration_state: {
        value: (x: any, y: any) => ({ ...x, ...y }),
        default: () => ({})
      },
      workflow_metadata: {
        value: (x: any, y: any) => ({ ...x, ...y }),
        default: () => ({})
      }
    };

    // Create the state graph
    this.graph = new StateGraph({
      channels: graphState
    });

    // Add nodes for each agent type
    this.graph.addNode('atlas', async (state) => {
      // Atlas agent for security and automation
      const result = await this.orchestra.executeAgentTask('atlas', state);
      return {
        messages: [result.message],
        current_agent: 'atlas',
        task_status: result.status
      };
    });

    this.graph.addNode('edison', async (state) => {
      // Edison agent for innovation and logic
      const result = await this.orchestra.executeAgentTask('edison', state);
      return {
        messages: [result.message],
        current_agent: 'edison',
        task_status: result.status
      };
    });

    this.graph.addNode('pythagoras', async (state) => {
      // Pythagoras agent for data and research
      const result = await this.orchestra.executeAgentTask('pythagoras', state);
      return {
        messages: [result.message],
        current_agent: 'pythagoras',
        task_status: result.status
      };
    });

    this.graph.addNode('lilith', async (state) => {
      // Lilith agent for creativity and exploration
      const result = await this.orchestra.executeAgentTask('lilith', state);
      return {
        messages: [result.message],
        current_agent: 'lilith',
        task_status: result.status
      };
    });

    this.graph.addNode('york', async (state) => {
      // York agent for resources and maintenance
      const result = await this.orchestra.executeAgentTask('york', state);
      return {
        messages: [result.message],
        current_agent: 'york',
        task_status: result.status
      };
    });

    this.graph.addNode('orchestrator', async (state) => {
      // Orchestrator for coordination
      const result = await this.orchestra.coordinateAgents(state);
      return {
        messages: [result.message],
        current_agent: 'orchestrator',
        collaboration_state: result.collaboration
      };
    });

    // Add conditional edges for dynamic routing
    this.graph.addConditionalEdges(
      'orchestrator',
      async (state) => {
        // Determine next agent based on task requirements
        const taskType = state.workflow_metadata?.task_type;
        const requiredSkills = state.workflow_metadata?.required_skills || [];

        if (taskType === 'security' || requiredSkills.includes('security')) {
          return 'atlas';
        } else if (taskType === 'innovation' || requiredSkills.includes('innovation')) {
          return 'edison';
        } else if (taskType === 'research' || requiredSkills.includes('data_analysis')) {
          return 'pythagoras';
        } else if (taskType === 'creative' || requiredSkills.includes('creativity')) {
          return 'lilith';
        } else if (taskType === 'optimization' || requiredSkills.includes('resource_management')) {
          return 'york';
        } else {
          return 'END';
        }
      },
      {
        atlas: 'atlas',
        edison: 'edison',
        pythagoras: 'pythagoras',
        lilith: 'lilith',
        york: 'york',
        END: '__end__'
      }
    );

    // Add edges from agents back to orchestrator
    ['atlas', 'edison', 'pythagoras', 'lilith', 'york'].forEach(agent => {
      this.graph.addEdge(agent, 'orchestrator');
    });

    // Set entry point
    this.graph.setEntryPoint('orchestrator');
  }

  public getGraph(): StateGraph<any, any> {
    return this.graph;
  }

  public async executeWorkflow(input: any): Promise<any> {
    const app = this.graph.compile();
    const result = await app.invoke(input);
    return result;
  }
}

export class GraphQLServer {
  private app: Application;
  private httpServer: any;
  private apolloServer: ApolloServer<GraphQLContext>;
  private config: GraphQLServerConfig;
  private orchestra: StellarOrchestra;
  private agentRegistry: AgentRegistry;
  private pubsub: PubSub;
  private wsServer: WebSocketServer;
  private agentWorkflowGraph: AgentWorkflowGraph;

  constructor(
    app: Application,
    orchestra: StellarOrchestra,
    agentRegistry: AgentRegistry,
    config?: Partial<GraphQLServerConfig>
  ) {
    this.app = app;
    this.orchestra = orchestra;
    this.agentRegistry = agentRegistry;
    this.pubsub = new PubSub();
    this.config = {
      port: 4000,
      path: '/graphql',
      playground: true,
      introspection: true,
      subscriptions: true,
      tracing: true,
      cacheControl: true,
      persistedQueries: true,
      maxComplexity: 1000,
      maxDepth: 10,
      ...config
    };

    this.httpServer = createServer(app);
    this.agentWorkflowGraph = new AgentWorkflowGraph(orchestra);
  }

  /**
   * Initialize and start the GraphQL server
   */
  public async start(): Promise<void> {
    // Load schema
    const typeDefs = loadSchemaSync('./src/api/graphql/schema/*.graphql', {
      loaders: [new GraphQLFileLoader()]
    });

    // Combine resolvers
    const resolvers = {
      Query: {
        ...agentResolvers.Query,
        ...taskResolvers.Query,
        ...collaborationResolvers.Query,
        ...workflowResolvers.Query,
        ...metricsResolvers.Query
      },
      Mutation: {
        ...agentResolvers.Mutation,
        ...taskResolvers.Mutation,
        ...collaborationResolvers.Mutation,
        ...workflowResolvers.Mutation
      },
      Subscription: {
        ...subscriptionResolvers.Subscription
      },
      ...agentResolvers.Types,
      ...taskResolvers.Types,
      ...collaborationResolvers.Types,
      ...workflowResolvers.Types
    };

    // Create executable schema with directives
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      schemaDirectives: {
        auth: authDirective,
        rateLimit: rateLimitDirective,
        cache: cacheDirective
      }
    });

    // Setup WebSocket server for subscriptions
    if (this.config.subscriptions) {
      this.wsServer = new WebSocketServer({
        server: this.httpServer,
        path: this.config.path
      });

      const serverCleanup = useServer(
        {
          schema,
          context: async (ctx, msg, args) => {
            return {
              orchestra: this.orchestra,
              agentRegistry: this.agentRegistry,
              pubsub: this.pubsub,
              langGraph: this.agentWorkflowGraph.getGraph(),
              user: await this.authenticateWebSocket(ctx),
              dataSources: this.createDataSources()
            };
          }
        },
        this.wsServer
      );
    }

    // Create Apollo Server
    this.apolloServer = new ApolloServer<GraphQLContext>({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        // Custom plugins for monitoring, caching, etc.
        this.createTracingPlugin(),
        this.createCacheControlPlugin(),
        this.createComplexityPlugin()
      ],
      introspection: this.config.introspection,
      persistedQueries: this.config.persistedQueries ? {
        cache: 'bounded'
      } : false,
      formatError: (err) => {
        logger.error('GraphQL Error:', err);
        return {
          message: err.message,
          code: err.extensions?.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Start Apollo Server
    await this.apolloServer.start();

    // Apply middleware
    this.app.use(
      this.config.path,
      expressMiddleware(this.apolloServer, {
        context: async ({ req }) => ({
          orchestra: this.orchestra,
          agentRegistry: this.agentRegistry,
          pubsub: this.pubsub,
          langGraph: this.agentWorkflowGraph.getGraph(),
          user: req.user,
          dataSources: this.createDataSources()
        })
      })
    );

    // Start HTTP server
    await new Promise<void>((resolve) => {
      this.httpServer.listen(this.config.port, () => {
        logger.info(`GraphQL Server ready at http://localhost:${this.config.port}${this.config.path}`);
        if (this.config.subscriptions) {
          logger.info(`GraphQL Subscriptions ready at ws://localhost:${this.config.port}${this.config.path}`);
        }
        resolve();
      });
    });
  }

  /**
   * Stop the GraphQL server
   */
  public async stop(): Promise<void> {
    await this.apolloServer.stop();
    if (this.wsServer) {
      this.wsServer.close();
    }
    this.httpServer.close();
    logger.info('GraphQL Server stopped');
  }

  /**
   * Create data sources for resolvers
   */
  private createDataSources(): any {
    return {
      agents: new AgentDataSource(this.agentRegistry),
      tasks: new TaskDataSource(this.orchestra),
      workflows: new WorkflowDataSource(this.agentWorkflowGraph)
    };
  }

  /**
   * Authenticate WebSocket connections
   */
  private async authenticateWebSocket(ctx: any): Promise<any> {
    const token = ctx.connectionParams?.authorization;
    if (!token) return null;

    try {
      // Verify JWT token
      const user = await this.verifyToken(token);
      return user;
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      return null;
    }
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    // Implementation depends on your auth system
    // This is a placeholder
    return { id: 'user-id', role: 'admin' };
  }

  /**
   * Create tracing plugin for performance monitoring
   */
  private createTracingPlugin(): any {
    return {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext: any) {
            const { response, request } = requestContext;
            const tracing = response.extensions?.tracing;
            if (tracing) {
              logger.info('GraphQL Query Performance:', {
                query: request.query,
                duration: tracing.duration,
                startTime: tracing.startTime
              });
            }
          }
        };
      }
    };
  }

  /**
   * Create cache control plugin
   */
  private createCacheControlPlugin(): any {
    return {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext: any) {
            const { response } = requestContext;
            // Add cache headers based on query type
            if (response.http) {
              response.http.headers.set(
                'Cache-Control',
                'max-age=60, must-revalidate'
              );
            }
          }
        };
      }
    };
  }

  /**
   * Create complexity analysis plugin
   */
  private createComplexityPlugin(): any {
    return {
      async requestDidStart() {
        return {
          async didResolveOperation(requestContext: any) {
            // Analyze query complexity
            const complexity = this.calculateQueryComplexity(
              requestContext.document,
              requestContext.request.variables
            );

            if (complexity > this.config.maxComplexity) {
              throw new Error(
                `Query too complex. Complexity: ${complexity}, Max allowed: ${this.config.maxComplexity}`
              );
            }
          }
        };
      }
    };
  }

  /**
   * Calculate query complexity
   */
  private calculateQueryComplexity(document: any, variables: any): number {
    // Simplified complexity calculation
    // In production, use a proper GraphQL complexity analysis library
    return 100; // Placeholder
  }

  /**
   * Get LangGraph workflow executor
   */
  public getWorkflowExecutor(): AgentWorkflowGraph {
    return this.agentWorkflowGraph;
  }
}

// Data source classes
class AgentDataSource {
  constructor(private agentRegistry: AgentRegistry) {}

  async getAgent(id: string) {
    return this.agentRegistry.getAgent(id);
  }

  async getAllAgents() {
    return this.agentRegistry.getAllAgents();
  }
}

class TaskDataSource {
  constructor(private orchestra: StellarOrchestra) {}

  async getTask(id: string) {
    return this.orchestra.getTask(id);
  }

  async getAllTasks(filters: any) {
    return this.orchestra.getAllTasks(filters);
  }
}

class WorkflowDataSource {
  constructor(private workflowGraph: AgentWorkflowGraph) {}

  async executeWorkflow(input: any) {
    return this.workflowGraph.executeWorkflow(input);
  }

  async getWorkflowState(id: string) {
    // Get workflow state from graph
    return {};
  }
}