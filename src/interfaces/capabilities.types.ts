/**
 * Detailed capability types for autonomous agents
 * These define what each agent can and cannot do
 */

/**
 * Planning Capabilities
 */
export interface PlanningCapabilities {
  canCreatePlans: boolean;
  canAdaptPlans: boolean;
  canPrioritizeTasks: boolean;
  maxPlanningHorizon: number; // steps ahead
  supportedPlanTypes: ('sequential' | 'parallel' | 'hierarchical')[];
}

/**
 * Decision Making Capabilities
 */
export interface DecisionCapabilities {
  canMakeAutonomousDecisions: boolean;
  requiresApproval: boolean;
  decisionTypes: ('tactical' | 'strategic' | 'operational')[];
  maxDecisionComplexity: number; // 1-10
  canEvaluateRisk: boolean;
}

/**
 * Memory Capabilities
 */
export interface MemoryCapabilities {
  shortTermCapacity: number; // items
  longTermCapacity: number; // items
  canForget: boolean; // memory management
  supportedMemoryTypes: ('episodic' | 'semantic' | 'procedural')[];
  retrievalMethods: ('exact' | 'semantic' | 'temporal')[];
}

/**
 * Communication Capabilities
 */
export interface CommunicationCapabilities {
  canInitiateConversation: boolean;
  canBroadcast: boolean;
  canNegotiate: boolean;
  supportedProtocols: ('direct' | 'broadcast' | 'request-response')[];
  maxConcurrentConversations: number;
}

/**
 * Learning Capabilities
 */
export interface LearningCapabilities {
  canLearnFromExperience: boolean;
  canAdaptBehavior: boolean;
  canTransferKnowledge: boolean;
  learningRate: number; // 0-1, how fast the agent learns
  supportedLearningTypes: ('reinforcement' | 'supervised' | 'unsupervised')[];
}

/**
 * Complete Agent Capabilities
 */
export interface AgenticCapabilities {
  planning: PlanningCapabilities;
  decisionMaking: DecisionCapabilities;
  memory: MemoryCapabilities;
  communication: CommunicationCapabilities;
  learning: LearningCapabilities;
  
  // Resource constraints
  maxConcurrentTasks: number;
  maxExecutionTime: number; // milliseconds per cycle
  maxMemoryUsage: number; // MB
  
  // Supported tools and actions
  supportedTools: string[];
  allowedActions: string[];
  
  // Autonomy level (0-10)
  autonomyLevel: number;
}

/**
 * Capability Requirements for specific tasks
 */
export interface CapabilityRequirements {
  requiredAutonomyLevel: number;
  requiredCapabilities: {
    planning?: Partial<PlanningCapabilities>;
    decisionMaking?: Partial<DecisionCapabilities>;
    memory?: Partial<MemoryCapabilities>;
    communication?: Partial<CommunicationCapabilities>;
    learning?: Partial<LearningCapabilities>;
  };
  requiredTools?: string[];
}

/**
 * Capability Profile - Predefined capability sets
 */
export interface CapabilityProfile {
  name: string;
  description: string;
  capabilities: AgenticCapabilities;
  suitableFor: string[]; // task types this profile is good for
}

/**
 * Default capability profiles for different agent types
 */
export const DEFAULT_CAPABILITY_PROFILES: Record<string, Partial<AgenticCapabilities>> = {
  basic: {
    autonomyLevel: 3,
    maxConcurrentTasks: 1,
    planning: {
      canCreatePlans: true,
      canAdaptPlans: false,
      canPrioritizeTasks: false,
      maxPlanningHorizon: 5,
      supportedPlanTypes: ['sequential'],
    },
  },
  advanced: {
    autonomyLevel: 7,
    maxConcurrentTasks: 5,
    planning: {
      canCreatePlans: true,
      canAdaptPlans: true,
      canPrioritizeTasks: true,
      maxPlanningHorizon: 20,
      supportedPlanTypes: ['sequential', 'parallel', 'hierarchical'],
    },
  },
  autonomous: {
    autonomyLevel: 10,
    maxConcurrentTasks: 10,
    planning: {
      canCreatePlans: true,
      canAdaptPlans: true,
      canPrioritizeTasks: true,
      maxPlanningHorizon: 50,
      supportedPlanTypes: ['sequential', 'parallel', 'hierarchical'],
    },
  },
};