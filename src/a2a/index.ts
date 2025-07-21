/**
 * A2A Protocol - Agent-to-Agent Communication
 * Export all A2A components and types
 */

// Core Protocol
export { A2AProtocol } from './A2AProtocol';
export { AgentRegistry } from './AgentRegistry';
export { MessageRouter } from './MessageRouter';

// Types and Interfaces
export * from './types';

// Re-export commonly used types for convenience
export type {
  A2AMessage,
  A2AResponse,
  AgentProfile,
  AgentCapability,
  CapabilityQuery,
  CapabilityMatch,
  TaskDefinition,
  TaskResult,
  WorkflowDefinition,
  WorkflowExecution,
  NetworkTopology,
  A2AConfig
} from './types';