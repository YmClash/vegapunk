/**
 * Workflow Resolvers for GraphQL API
 * Integrates with LangGraph for advanced agent workflow management
 */

import { GraphQLContext } from '../server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';

const logger = createLogger('WorkflowResolvers');

interface WorkflowInput {
  name: string;
  description: string;
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      agentType?: string;
      config: any;
    }>;
    edges: Array<{
      from: string;
      to: string;
      condition?: string;
    }>;
    entryPoint: string;
    conditionalEdges?: Array<{
      from: string;
      conditions: Array<{
        expression: string;
        target: string;
      }>;
    }>;
  };
  autoStart?: boolean;
}

export const workflowResolvers = {
  Query: {
    /**
     * Get all workflows with pagination
     */
    workflows: async (
      _: any,
      args: { status?: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      try {
        const workflows = await context.dataSources.workflows.getAllWorkflows({
          status: args.status,
          limit: args.limit || 50,
          offset: args.offset || 0
        });

        return {
          edges: workflows.items.map(workflow => ({
            node: workflow,
            cursor: Buffer.from(workflow.id).toString('base64')
          })),
          pageInfo: {
            hasNextPage: workflows.hasMore,
            hasPreviousPage: args.offset > 0,
            startCursor: workflows.items.length > 0 
              ? Buffer.from(workflows.items[0].id).toString('base64')
              : null,
            endCursor: workflows.items.length > 0
              ? Buffer.from(workflows.items[workflows.items.length - 1].id).toString('base64')
              : null
          },
          totalCount: workflows.total
        };
      } catch (error) {
        logger.error('Error fetching workflows:', error);
        throw new Error('Failed to fetch workflows');
      }
    },

    /**
     * Get a specific workflow by ID
     */
    workflow: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const workflow = await context.dataSources.workflows.getWorkflow(args.id);
        if (!workflow) {
          throw new Error(`Workflow not found: ${args.id}`);
        }
        return workflow;
      } catch (error) {
        logger.error('Error fetching workflow:', error);
        throw error;
      }
    },

    /**
     * Get workflow graph structure
     */
    workflowGraph: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const workflow = await context.dataSources.workflows.getWorkflow(args.id);
        if (!workflow) {
          throw new Error(`Workflow not found: ${args.id}`);
        }

        // Convert LangGraph structure to GraphQL format
        const graph = workflow.graph;
        return {
          nodes: graph.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            agentType: node.agentType,
            config: node.config
          })),
          edges: graph.edges.map((edge: any) => ({
            from: edge.from,
            to: edge.to,
            condition: edge.condition
          })),
          entryPoint: graph.entryPoint,
          conditionalEdges: graph.conditionalEdges || []
        };
      } catch (error) {
        logger.error('Error fetching workflow graph:', error);
        throw error;
      }
    }
  },

  Mutation: {
    /**
     * Create a new workflow
     */
    createWorkflow: async (
      _: any,
      args: { input: WorkflowInput },
      context: GraphQLContext
    ) => {
      try {
        const workflowId = uuidv4();
        const { input } = args;

        // Create workflow definition
        const workflow = {
          id: workflowId,
          name: input.name,
          description: input.description,
          status: 'DRAFT',
          graph: input.graph,
          currentState: {
            messages: [],
            currentAgent: null,
            taskStatus: {},
            collaborationState: {},
            workflowMetadata: {
              workflowId,
              createdAt: new Date()
            }
          },
          executions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Save workflow
        const savedWorkflow = await context.dataSources.workflows.createWorkflow(workflow);

        // Auto-start if requested
        if (input.autoStart) {
          await context.dataSources.workflows.startWorkflow(workflowId);
        }

        // Publish creation event
        context.pubsub.publish('WORKFLOW_CREATED', {
          workflowCreated: savedWorkflow
        });

        return savedWorkflow;
      } catch (error) {
        logger.error('Error creating workflow:', error);
        throw new Error('Failed to create workflow');
      }
    },

    /**
     * Execute a workflow with given input
     */
    executeWorkflow: async (
      _: any,
      args: { id: string; input?: any },
      context: GraphQLContext
    ) => {
      try {
        const { id, input = {} } = args;

        // Get workflow
        const workflow = await context.dataSources.workflows.getWorkflow(id);
        if (!workflow) {
          throw new Error(`Workflow not found: ${id}`);
        }

        // Create execution record
        const executionId = uuidv4();
        const execution = {
          id: executionId,
          workflow,
          status: 'ACTIVE',
          startedAt: new Date(),
          completedAt: null,
          steps: [],
          result: null,
          error: null
        };

        // Execute workflow using LangGraph
        const initialState = {
          messages: [],
          current_agent: null,
          task_status: {},
          collaboration_state: {},
          workflow_metadata: {
            workflowId: id,
            executionId,
            input,
            startedAt: new Date()
          }
        };

        // Start async execution
        context.dataSources.workflows.executeWorkflow(id, initialState)
          .then(result => {
            // Update execution with result
            execution.status = 'COMPLETED';
            execution.completedAt = new Date();
            execution.result = result;

            // Publish completion event
            context.pubsub.publish('WORKFLOW_EXECUTION_COMPLETED', {
              workflowExecutionCompleted: execution
            });
          })
          .catch(error => {
            // Update execution with error
            execution.status = 'FAILED';
            execution.completedAt = new Date();
            execution.error = error.message;

            // Publish failure event
            context.pubsub.publish('WORKFLOW_EXECUTION_FAILED', {
              workflowExecutionFailed: execution
            });
          });

        // Save and return execution
        const savedExecution = await context.dataSources.workflows.saveExecution(execution);

        // Publish start event
        context.pubsub.publish('WORKFLOW_EXECUTION_STARTED', {
          workflowExecutionStarted: savedExecution
        });

        return savedExecution;
      } catch (error) {
        logger.error('Error executing workflow:', error);
        throw new Error('Failed to execute workflow');
      }
    },

    /**
     * Pause a running workflow
     */
    pauseWorkflow: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const workflow = await context.dataSources.workflows.pauseWorkflow(args.id);
        
        // Publish pause event
        context.pubsub.publish('WORKFLOW_STATE_CHANGED', {
          workflowStateChanged: {
            workflowId: args.id,
            newStatus: 'PAUSED',
            timestamp: new Date()
          }
        });

        return workflow;
      } catch (error) {
        logger.error('Error pausing workflow:', error);
        throw new Error('Failed to pause workflow');
      }
    },

    /**
     * Resume a paused workflow
     */
    resumeWorkflow: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      try {
        const workflow = await context.dataSources.workflows.resumeWorkflow(args.id);
        
        // Publish resume event
        context.pubsub.publish('WORKFLOW_STATE_CHANGED', {
          workflowStateChanged: {
            workflowId: args.id,
            newStatus: 'ACTIVE',
            timestamp: new Date()
          }
        });

        return workflow;
      } catch (error) {
        logger.error('Error resuming workflow:', error);
        throw new Error('Failed to resume workflow');
      }
    },

    /**
     * Cancel a workflow
     */
    cancelWorkflow: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      try {
        await context.dataSources.workflows.cancelWorkflow(args.id);
        
        // Publish cancel event
        context.pubsub.publish('WORKFLOW_STATE_CHANGED', {
          workflowStateChanged: {
            workflowId: args.id,
            newStatus: 'CANCELLED',
            timestamp: new Date()
          }
        });

        return true;
      } catch (error) {
        logger.error('Error cancelling workflow:', error);
        throw new Error('Failed to cancel workflow');
      }
    }
  },

  Subscription: {
    /**
     * Subscribe to workflow state changes
     */
    workflowStateChanged: {
      subscribe: (_: any, args: { workflowId: string }, context: GraphQLContext) => {
        return context.pubsub.asyncIterator(['WORKFLOW_STATE_CHANGED']);
      },
      resolve: (payload: any, args: { workflowId: string }) => {
        // Filter by workflow ID if specified
        if (args.workflowId && payload.workflowStateChanged.workflowId !== args.workflowId) {
          return null;
        }
        return payload.workflowStateChanged;
      }
    },

    /**
     * Subscribe to workflow node execution events
     */
    workflowNodeExecuted: {
      subscribe: (_: any, args: { workflowId: string }, context: GraphQLContext) => {
        return context.pubsub.asyncIterator(['WORKFLOW_NODE_EXECUTED']);
      },
      resolve: (payload: any, args: { workflowId: string }) => {
        // Filter by workflow ID
        if (payload.workflowNodeExecuted.workflowId !== args.workflowId) {
          return null;
        }
        return payload.workflowNodeExecuted;
      }
    }
  },

  // Type resolvers
  Types: {
    Workflow: {
      executions: async (workflow: any, _: any, context: GraphQLContext) => {
        return context.dataSources.workflows.getWorkflowExecutions(workflow.id);
      },

      currentState: async (workflow: any, _: any, context: GraphQLContext) => {
        return context.dataSources.workflows.getWorkflowState(workflow.id);
      }
    },

    WorkflowExecution: {
      workflow: async (execution: any, _: any, context: GraphQLContext) => {
        return context.dataSources.workflows.getWorkflow(execution.workflowId);
      },

      steps: async (execution: any, _: any, context: GraphQLContext) => {
        return context.dataSources.workflows.getExecutionSteps(execution.id);
      }
    },

    WorkflowNode: {
      // Resolve agent type to proper enum value
      agentType: (node: any) => {
        if (!node.agentType) return null;
        return node.agentType.toUpperCase();
      }
    }
  }
};