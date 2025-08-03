/**
 * ShakaA2AServer - A2A Protocol Server Setup
 * Configures Atlas Agent as an A2A-compliant server
 * Part of Tri-Protocol Integration
 */


import { AgentCard } from '../types/AgentTypes';
// import { AgentCard} from

export const shakaAgentCard: AgentCard = {
  name: "Shaka - Ethics & Analysis Agent",
  description: "Ethical reasoning and conflict resolution specialist",
  version: "2.0.0", // Version 2 avec A2A
  capabilities: {
    streaming: true,
    pushNotifications: true,
    tools: ["ethical_analysis", "conflict_resolution", "monitoring", "consultation"]
  },
  schemes: [
    {
      type: "ethical_analysis",
      description: "Multi-framework ethical evaluation",
      requiredParams: ["content", "context"],
      optionalParams: ["frameworks", "depth", "cultural_context"]
    },
    {
      type: "conflict_resolution", 
      description: "Resolve ethical conflicts between principles",
      requiredParams: ["conflict_description", "parties"],
      optionalParams: ["resolution_strategy", "priority_framework"]
    },
    {
      type: "proactive_monitoring",
      description: "Monitor system activities for ethical concerns",
      requiredParams: ["activity_scope"],
      optionalParams: ["sensitivity_level", "alert_threshold"]
    },
    {
      type: "ethical_consultation",
      description: "Provide ethical guidance to other agents",
      requiredParams: ["agent_id", "action_proposal"],
      optionalParams: ["urgency", "impact_assessment"]
    }
  ],
  skills: [
    {
      id: "multi_framework_analysis",
      name: "Multi-Framework Ethical Analysis",
      description: "Analyze using utilitarian, deontological, virtue ethics, and care ethics",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Content to analyze" },
          frameworks: { type: "array", items: { type: "string" } },
          context: { type: "object" }
        },
        required: ["content"]
      }
    },
    {
      id: "ethical_conflict_resolution",
      name: "Ethical Conflict Resolution",
      description: "Resolve conflicts between ethical principles or stakeholders",
      inputSchema: {
        type: "object",
        properties: {
          conflict: { type: "object" },
          stakeholders: { type: "array" },
          resolution_strategy: { type: "string" }
        },
        required: ["conflict"]
      }
    },
    {
      id: "ethical_risk_assessment",
      name: "Ethical Risk Assessment",
      description: "Assess ethical risks of proposed actions or systems",
      inputSchema: {
        type: "object",
        properties: {
          proposal: { type: "object" },
          impact_scope: { type: "string" },
          risk_tolerance: { type: "number" }
        },
        required: ["proposal"]
      }
    },
    {
      id: "ethical_monitoring",
      name: "Continuous Ethical Monitoring",
      description: "Monitor system behavior for ethical compliance",
      inputSchema: {
        type: "object",
        properties: {
          monitoring_scope: { type: "array" },
          alert_conditions: { type: "array" },
          reporting_frequency: { type: "string" }
        }
      }
    },
    {
      id: "inter_agent_consultation",
      name: "Inter-Agent Ethical Consultation",
      description: "Provide ethical guidance to other agents",
      inputSchema: {
        type: "object",
        properties: {
          requesting_agent: { type: "string" },
          action_type: { type: "string" },
          ethical_concerns: { type: "array" }
        },
        required: ["requesting_agent", "action_type"]
      }
    }
  ]
};