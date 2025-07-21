/**
 * Protocol Integration - Export all integration components
 * A2A + LangGraph + MCP coordination and orchestration
 */

// Main Orchestrator
export { TriProtocolOrchestrator } from './TriProtocolOrchestrator';

// Protocol Bridges
export { A2ALangGraphBridge } from './A2ALangGraphBridge';
export { LangGraphMCPBridge } from './LangGraphMCPBridge';

// Re-export commonly used types for convenience
export type {
  TriProtocolConfig,
  WorkflowExecutionResult,
  SystemHealthStatus
} from './TriProtocolOrchestrator';

export type {
  A2ALangGraphBridgeConfig
} from './A2ALangGraphBridge';

export type {
  LangGraphMCPBridgeConfig,
  MCPToolExecutionResult,
  MCPResourceAccessResult
} from './LangGraphMCPBridge';