/**
 * MCP (Model Context Protocol) Advanced Cockpit API Routes
 * Endpoints pour supporter le frontend MCP cockpit avec contrôle serveur complet
 */

import { Router } from 'express';
import { MCPServerManager } from '../services/MCPServerManager';
import { MCPToolsService } from '../services/MCPToolsService';
import { logger } from '../../utils/logger';

const router = Router();

// Initialize services
let mcpServerManager: MCPServerManager;
let mcpToolsService: MCPToolsService;

/**
 * Initialize MCP routes with required services
 */
export function initializeMCPRoutes(serverManager: MCPServerManager, toolsService: MCPToolsService) {
  mcpServerManager = serverManager;
  mcpToolsService = toolsService;
  logger.info('✅ MCP API routes services initialized');
}

// ====================================
// SERVER LIFECYCLE MANAGEMENT
// ====================================

/**
 * GET /api/mcp/server/status - Get MCP server status and metrics
 */
router.get('/server/status', async (req, res) => {
  try {
    const status = await mcpServerManager.getServerStatus();
    const metrics = await mcpServerManager.getServerMetrics();
    const healthCheck = await mcpServerManager.getHealthCheck();
    
    res.json({
      status,
      metrics,
      health: healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/server/start - Start MCP server
 */
router.post('/server/start', async (req, res) => {
  try {
    const { config } = req.body || {};
    await mcpServerManager.startServer(config);
    
    res.json({
      success: true,
      message: 'MCP server started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server start error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/server/stop - Stop MCP server
 */
router.post('/server/stop', async (req, res) => {
  try {
    await mcpServerManager.stopServer();
    
    res.json({
      success: true,
      message: 'MCP server stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/server/restart - Restart MCP server
 */
router.post('/server/restart', async (req, res) => {
  try {
    await mcpServerManager.restartServer();
    
    res.json({
      success: true,
      message: 'MCP server restarted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server restart error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/server/logs - Get server logs with filtering
 */
router.get('/server/logs', async (req, res) => {
  try {
    const { 
      level = 'all', 
      limit = 100, 
      startTime, 
      endTime,
      component 
    } = req.query;
    
    const filters = {
      level: level as string,
      limit: parseInt(limit as string),
      startTime: startTime as string,
      endTime: endTime as string,
      component: component as string
    };
    
    const logs = await mcpServerManager.getServerLogs(filters);
    
    res.json({
      logs,
      total: logs.length,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/server/config - Get server configuration
 */
router.get('/server/config', async (req, res) => {
  try {
    const config = await mcpServerManager.getServerConfig();
    
    res.json({
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/mcp/server/config - Update server configuration
 */
router.put('/server/config', async (req, res) => {
  try {
    const { config } = req.body;
    await mcpServerManager.updateServerConfig(config);
    
    res.json({
      success: true,
      message: 'Server configuration updated',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP server config update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// TOOLS MANAGEMENT
// ====================================

/**
 * GET /api/mcp/tools/list - Get available tools
 */
router.get('/tools/list', async (req, res) => {
  try {
    const tools = await mcpToolsService.getAvailableTools();
    
    res.json({
      tools,
      total: tools.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP tools list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/tools/test - Test tool execution
 */
router.post('/tools/test', async (req, res) => {
  try {
    const { toolId, parameters } = req.body;
    
    if (!toolId) {
      return res.status(400).json({ error: 'Tool ID is required' });
    }
    
    const result = await mcpToolsService.testTool(toolId, parameters);
    
    res.json({
      success: true,
      toolId,
      parameters,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP tool test error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/tools/register - Register new tool
 */
router.post('/tools/register', async (req, res) => {
  try {
    const { toolDefinition } = req.body;
    
    if (!toolDefinition) {
      return res.status(400).json({ error: 'Tool definition is required' });
    }
    
    await mcpToolsService.registerTool(toolDefinition);
    
    res.json({
      success: true,
      message: 'Tool registered successfully',
      tool: toolDefinition.name,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP tool register error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/tools/analytics - Get tools usage analytics
 */
router.get('/tools/analytics', async (req, res) => {
  try {
    const analytics = await mcpToolsService.getToolAnalytics();
    
    res.json({
      analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP tools analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/mcp/tools/:toolId - Remove tool
 */
router.delete('/tools/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    await mcpToolsService.removeTool(toolId);
    
    res.json({
      success: true,
      message: 'Tool removed successfully',
      toolId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP tool remove error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// RESOURCES MANAGEMENT
// ====================================

/**
 * GET /api/mcp/resources/list - Get available resources
 */
router.get('/resources/list', async (req, res) => {
  try {
    const resources = await mcpServerManager.getAvailableResources();
    
    res.json({
      resources,
      total: resources.length,
      categories: {
        templates: resources.filter(r => r.category === 'template').length,
        prompts: resources.filter(r => r.category === 'prompt').length,
        integrations: resources.filter(r => r.category === 'integration').length,
        configs: resources.filter(r => r.category === 'config').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP resources list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/resources/usage - Get resources usage tracking
 */
router.get('/resources/usage', async (req, res) => {
  try {
    const usage = await mcpServerManager.getResourceUsage();
    
    res.json({
      usage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP resources usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/resources/manage - Add/Edit/Delete resources
 */
router.post('/resources/manage', async (req, res) => {
  try {
    const { action, resource } = req.body;
    
    if (!action || !resource) {
      return res.status(400).json({ error: 'Action and resource are required' });
    }
    
    let result;
    switch (action) {
      case 'create':
        result = await mcpServerManager.createResource(resource);
        break;
      case 'update':
        result = await mcpServerManager.updateResource(resource);
        break;
      case 'delete':
        result = await mcpServerManager.deleteResource(resource.id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP resources manage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// EXECUTION TRACKING
// ====================================

/**
 * GET /api/mcp/executions/active - Get active executions
 */
router.get('/executions/active', async (req, res) => {
  try {
    const executions = await mcpServerManager.getActiveExecutions();
    
    res.json({
      executions,
      total: executions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP active executions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/executions/history - Get execution history and analytics
 */
router.get('/executions/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, toolId } = req.query;
    
    const filters = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      status: status as string,
      toolId: toolId as string
    };
    
    const history = await mcpServerManager.getExecutionHistory(filters);
    const analytics = await mcpServerManager.getExecutionAnalytics();
    
    res.json({
      history,
      analytics,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP execution history error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/executions/:executionId - Get detailed execution information
 */
router.get('/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await mcpServerManager.getExecutionDetails(executionId);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json({
      execution,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP execution details error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/executions/:executionId/cancel - Cancel active execution
 */
router.post('/executions/:executionId/cancel', async (req, res) => {
  try {
    const { executionId } = req.params;
    await mcpServerManager.cancelExecution(executionId);
    
    res.json({
      success: true,
      message: 'Execution cancelled',
      executionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP execution cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// MONITORING & HEALTH
// ====================================

/**
 * GET /api/mcp/health - Comprehensive health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await mcpServerManager.getComprehensiveHealth();
    
    res.json({
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mcp/metrics/performance - Get performance metrics
 */
router.get('/metrics/performance', async (req, res) => {
  try {
    const metrics = await mcpServerManager.getPerformanceMetrics();
    
    res.json({
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP performance metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mcp/alerts/acknowledge - Acknowledge system alerts
 */
router.post('/alerts/acknowledge', async (req, res) => {
  try {
    const { alertIds } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({ error: 'Alert IDs array is required' });
    }
    
    await mcpServerManager.acknowledgeAlerts(alertIds);
    
    res.json({
      success: true,
      message: 'Alerts acknowledged',
      alertIds,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('MCP alerts acknowledge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export router
export default router;