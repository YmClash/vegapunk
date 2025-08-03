/**
 * MCP (Model Context Protocol) Integration - Export all MCP components
 */

// Main MCP Server
export { VegapunkMCPServer } from './VegapunkMCPServer';

// Tools
export { EthicalAnalysisTool } from './tools/EthicalAnalysisTool';
export { TechnicalSupportTool } from './tools/TechnicalSupportTool';

// Types and Interfaces
export * from './types';

// Re-export commonly used types for convenience
export type {
  MCPServer,
  MCPTool,
  MCPResource,
  MCPToolCall,
  MCPToolResult,
  MCPExecutionContext,
  MCPAgentContext,
  MCPServerConfig,
  ToolExecutor,
  ResourceProvider,
  MCPMetrics,
  MCPHealthCheck
} from './types';