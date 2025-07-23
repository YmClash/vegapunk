/**
 * LangGraph API Routes
 * REST API endpoints pour exposer les données du VegapunkAgentGraph au cockpit frontend
 */

import express from 'express';
import { VegapunkAgentGraph } from '../../graph/VegapunkAgentGraph';
import { SupervisorAgent } from '../../graph/SupervisorAgent';
import { VegapunkGraphState, GraphMetrics, AgentHandoff } from '../../graph/types';
import { logger } from '../../utils/logger';

const router = express.Router();

// Global state pour partager les instances
let vegapunkGraph: VegapunkAgentGraph | null = null;
let activeWorkflows: Map<string, any> = new Map();
let workflowHistory: any[] = [];
let dataFlowTraces: any[] = [];
let agentHandoffs: AgentHandoff[] = [];
let supervisorDecisions: any[] = [];

/**
 * Initialize LangGraph router with graph instance
 */
export function initializeLangGraphRoutes(graph: VegapunkAgentGraph) {
  vegapunkGraph = graph;
  
  // Setup data collection hooks
  setupDataCollectionHooks();
  
  logger.info('[LangGraph API] Routes initialized with VegapunkAgentGraph instance');
}

/**
 * Setup hooks pour collecter les données en temps réel
 */
function setupDataCollectionHooks() {
  // Cette fonction sera étendue pour capturer les événements du graph
  logger.info('[LangGraph API] Data collection hooks setup complete');
}

// ============================================================================
// WORKFLOW ENDPOINTS
// ============================================================================

/**
 * GET /api/langgraph/workflows
 * Obtenir la liste des workflows actifs
 */
router.get('/workflows', async (req, res) => {
  try {
    if (!vegapunkGraph) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'LangGraph not initialized' }
      });
    }

    // Get real active workflows from VegapunkAgentGraph
    const activeWorkflows = vegapunkGraph ? vegapunkGraph.getActiveWorkflows() : [];
    const workflowHistory = vegapunkGraph ? vegapunkGraph.getWorkflowHistory(5) : [];
    
    // Combine active and recent completed workflows
    const allWorkflows = [...activeWorkflows, ...workflowHistory];

    res.json({
      success: true,
      data: allWorkflows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch workflows' }
    });
  }
});

/**
 * GET /api/langgraph/workflows/:id
 * Obtenir les détails d'un workflow spécifique
 */
router.get('/workflows/:id', async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Pour l'instant, retourner des données mock
    // TODO: Intégrer avec les vrais metrics du VegapunkAgentGraph
    const mockWorkflow = {
      id: workflowId,
      name: 'Security Analysis Pipeline',
      status: 'running',
      startTime: new Date(Date.now() - 300000).toISOString(),
      currentNode: 'shaka_node',
      executionTrace: [
        {
          id: 'step-1',
          nodeId: 'supervisor',
          nodeName: 'Workflow Supervisor',
          timestamp: new Date(Date.now() - 280000).toISOString(),
          duration: 1200,
          status: 'completed',
          data: { selectedAgent: 'shaka-001' },
          agent: 'supervisor-001'
        },
        {
          id: 'step-2',
          nodeId: 'shaka_node',
          nodeName: 'Shaka Ethical Analysis',
          timestamp: new Date(Date.now() - 150000).toISOString(),
          duration: 0,
          status: 'running',
          data: { analysis: 'in-progress' },
          agent: 'shaka-001'
        }
      ]
    };

    res.json({
      success: true,
      data: mockWorkflow,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching workflow details:', error);
    res.status(500).json({
      success: false,
      error: { code: 'WORKFLOW_ERROR', message: 'Failed to fetch workflow details' }
    });
  }
});

/**
 * GET /api/langgraph/workflows/:id/topology
 * Obtenir la topologie/structure d'un workflow
 */
router.get('/workflows/:id/topology', async (req, res) => {
  try {
    // Structure basée sur l'architecture VegapunkAgentGraph existante
    const mockTopology = {
      nodes: [
        {
          id: 'supervisor',
          name: 'Workflow Supervisor',
          type: 'supervisor',
          agent: 'supervisor-001',
          position: { x: 0, y: 0 },
          metadata: {}
        },
        {
          id: 'vegapunk_node',
          name: 'Vegapunk Technical',
          type: 'agent',
          agent: 'vegapunk-001',
          position: { x: 1, y: -1 },
          metadata: {}
        },
        {
          id: 'shaka_node',
          name: 'Shaka Ethical',
          type: 'agent',
          agent: 'shaka-001',
          position: { x: 1, y: 1 },
          metadata: {}
        },
        {
          id: 'end',
          name: 'Workflow End',
          type: 'end',
          position: { x: 2, y: 0 },
          metadata: {}
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'supervisor',
          target: 'vegapunk_node',
          condition: 'technical_support',
          metadata: {}
        },
        {
          id: 'edge-2',
          source: 'supervisor',
          target: 'shaka_node',
          condition: 'ethical_analysis',
          metadata: {}
        },
        {
          id: 'edge-3',
          source: 'vegapunk_node',
          target: 'end',
          metadata: {}
        },
        {
          id: 'edge-4',
          source: 'shaka_node',
          target: 'end',
          metadata: {}
        }
      ],
      metadata: { version: '1.0', type: 'tri-protocol-workflow' }
    };

    res.json({
      success: true,
      data: mockTopology,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching workflow topology:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TOPOLOGY_ERROR', message: 'Failed to fetch workflow topology' }
    });
  }
});

/**
 * POST /api/langgraph/workflows/:id/control
 * Contrôler l'exécution d'un workflow (start/stop/pause/resume)
 */
router.post('/workflows/:id/control', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { action, parameters } = req.body;

    logger.info(`[LangGraph API] Workflow control: ${action} for ${workflowId}`);

    // TODO: Intégrer avec les vraies méthodes de contrôle du VegapunkAgentGraph
    
    res.json({
      success: true,
      message: `Workflow ${action} command executed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error controlling workflow:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CONTROL_ERROR', message: 'Failed to control workflow' }
    });
  }
});

// ============================================================================
// DATAFLOW ENDPOINTS
// ============================================================================

/**
 * GET /api/langgraph/dataflow/traces
 * Obtenir les traces de flux de données
 */
router.get('/dataflow/traces', async (req, res) => {
  try {
    const { field, operation, timerange, limit = 50 } = req.query;

    // Get real dataflow traces from VegapunkAgentGraph
    const allTraces = vegapunkGraph ? vegapunkGraph.getDataFlowTraces(500) : [];

    // Appliquer les filtres
    let filteredTraces = allTraces;
    
    if (field && field !== 'all') {
      filteredTraces = filteredTraces.filter(trace => 
        Object.keys(trace.dataPreview).some(key => 
          key.toLowerCase().includes((field as string).toLowerCase())
        )
      );
    }

    if (operation && operation !== 'all') {
      filteredTraces = filteredTraces.filter(trace => trace.operation === operation);
    }

    filteredTraces = filteredTraces.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: filteredTraces,
      meta: { total: filteredTraces.length, limit: parseInt(limit as string) },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching dataflow traces:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATAFLOW_ERROR', message: 'Failed to fetch dataflow traces' }
    });
  }
});

/**
 * POST /api/langgraph/dataflow/export
 * Exporter les traces de flux de données
 */
router.post('/dataflow/export', async (req, res) => {
  try {
    const { format = 'json' } = req.body;

    const exportData = {
      exportedAt: new Date().toISOString(),
      format,
      traces: dataFlowTraces,
      totalCount: dataFlowTraces.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=dataflow-traces-${Date.now()}.${format}`);
    res.json(exportData);

  } catch (error) {
    logger.error('[LangGraph API] Error exporting dataflow traces:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ERROR', message: 'Failed to export dataflow traces' }
    });
  }
});

// ============================================================================
// HANDOFF ENDPOINTS
// ============================================================================

/**
 * GET /api/langgraph/handoffs
 * Obtenir les handoffs récents entre agents
 */
router.get('/handoffs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Get real handoffs data from VegapunkAgentGraph
    const handoffs = vegapunkGraph ? vegapunkGraph.getAgentHandoffs(limit) : [];

    res.json({
      success: true,
      data: handoffs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching handoffs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HANDOFF_ERROR', message: 'Failed to fetch handoffs' }
    });
  }
});

/**
 * GET /api/langgraph/handoffs/metrics
 * Obtenir les métriques de performance des handoffs
 */
router.get('/handoffs/metrics', async (req, res) => {
  try {
    const mockMetrics = {
      totalHandoffs: 156,
      successRate: 0.94,
      averageLatency: 127,
      averageConfidence: 0.89,
      topReasons: [
        { reason: 'ethical_analysis_required', count: 45, successRate: 0.96 },
        { reason: 'technical_implementation_needed', count: 38, successRate: 0.92 },
        { reason: 'specialized_capability_match', count: 31, successRate: 0.94 }
      ]
    };

    res.json({
      success: true,
      data: mockMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching handoff metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'METRICS_ERROR', message: 'Failed to fetch handoff metrics' }
    });
  }
});

// ============================================================================
// SUPERVISOR ENDPOINTS
// ============================================================================

/**
 * GET /api/langgraph/supervisor/decisions
 * Obtenir l'historique des décisions du SupervisorAgent
 */
router.get('/supervisor/decisions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get real supervisor decisions from VegapunkAgentGraph
    const decisions = vegapunkGraph ? vegapunkGraph.getSupervisorDecisions(limit) : [];

    res.json({
      success: true,
      data: decisions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching supervisor decisions:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUPERVISOR_ERROR', message: 'Failed to fetch supervisor decisions' }
    });
  }
});

/**
 * GET /api/langgraph/supervisor/metrics
 * Obtenir les métriques de performance du SupervisorAgent
 */
router.get('/supervisor/metrics', async (req, res) => {
  try {
    const mockMetrics = {
      totalDecisions: 247,
      averageDecisionTime: 1847,
      successRate: 0.94,
      confidenceScore: 0.89,
      strategiesUsed: {
        'capability-matching': 156,
        'load-balancing': 48,
        'performance-optimization': 31,
        'fallback-routing': 12
      },
      improvementRate: 0.12,
      errorRate: 0.06
    };

    res.json({
      success: true,
      data: mockMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching supervisor metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUPERVISOR_METRICS_ERROR', message: 'Failed to fetch supervisor metrics' }
    });
  }
});

// ============================================================================
// TEMPLATE ENDPOINTS  
// ============================================================================

/**
 * GET /api/langgraph/templates
 * Obtenir la bibliothèque de templates de workflows
 */
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;

    // Mock templates basé sur l'architecture existante
    const mockTemplates = [
      {
        id: 'template-001',
        name: 'Ethical Analysis Pipeline',
        description: 'Multi-step ethical analysis with supervisor coordination',
        category: 'security-ethics',
        agents: ['supervisor-001', 'shaka-001'],
        complexity: 'Moderate',
        estimatedDuration: 25,
        successRate: 0.94,
        avgExecutionTime: 22000,
        totalExecutions: 156,
        isPopular: true
      },
      {
        id: 'template-002',
        name: 'Technical Support Flow',
        description: 'Technical problem solving with intelligent routing',
        category: 'system-maintenance',
        agents: ['supervisor-001', 'vegapunk-001'],
        complexity: 'Simple',
        estimatedDuration: 15,
        successRate: 0.97,
        avgExecutionTime: 13000,
        totalExecutions: 289,
        isPopular: true
      }
    ];

    let filteredTemplates = mockTemplates;
    if (category && category !== 'all') {
      filteredTemplates = mockTemplates.filter(t => t.category === category);
    }

    res.json({
      success: true,
      data: filteredTemplates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEMPLATE_ERROR', message: 'Failed to fetch templates' }
    });
  }
});

/**
 * POST /api/langgraph/templates/:id/execute
 * Exécuter un template de workflow
 */
router.post('/templates/:id/execute', async (req, res) => {
  try {
    const templateId = req.params.id;
    const { parameters } = req.body;

    logger.info(`[LangGraph API] Executing template ${templateId} with parameters:`, parameters);

    // TODO: Intégrer avec VegapunkAgentGraph pour vraie exécution
    const mockExecution = {
      id: `workflow-${Date.now()}`,
      templateId,
      status: 'running',
      startTime: new Date().toISOString(),
      parameters
    };

    res.json({
      success: true,
      data: mockExecution,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error executing template:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEMPLATE_EXECUTION_ERROR', message: 'Failed to execute template' }
    });
  }
});

// ============================================================================
// HEALTH & METRICS ENDPOINTS
// ============================================================================

/**
 * GET /api/langgraph/health
 * Obtenir l'état de santé du système LangGraph
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      activeWorkflows: activeWorkflows.size,
      totalAgents: 3, // supervisor + vegapunk + shaka
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching health status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_ERROR', message: 'Failed to fetch health status' }
    });
  }
});

/**
 * GET /api/langgraph/metrics/performance
 * Obtenir les métriques générales de performance
 */
router.get('/metrics/performance', async (req, res) => {
  try {
    // Get real performance metrics from VegapunkAgentGraph
    const metrics = vegapunkGraph ? vegapunkGraph.getCockpitMetrics() : {
      totalWorkflows: 0,
      activeWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0,
      successRate: 0,
      totalHandoffs: 0,
      totalDataFlowTraces: 0,
      totalSupervisorDecisions: 0,
      averageExecutionTime: 0
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[LangGraph API] Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PERFORMANCE_ERROR', message: 'Failed to fetch performance metrics' }
    });
  }
});

export default router;