/**
 * ShakaA2AServer - A2A Protocol Server Setup
 * Configures Atlas Agent as an A2A-compliant server
 * Part of Tri-Protocol Integration
 */


// import { AgentCard } from '../types/AgentTypes';
import type { AgentCard} from '@a2a-js/sdk';


export const shakaAgentCard: AgentCard = {
  name: "Shaka - Ethics & Analysis Agent",
  description: "Ethical reasoning and conflict resolution specialist",
  url :"http://localhost:8081",
  provider: {
    organization: "Vegapunk Agentic Systems",
    url: "https://vegapunk.ai/agents/shaka",
    // url: "https://localhost:8080/a2a-agents/shaka" // Local development URL
  },
  version: "2.0.0", // Version 2 avec A2A
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true,
    // tools: ["ethical_analysis", "conflict_resolution", "monitoring", "consultation"]
  },
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer"
    }
  },
  security: [{ bearerAuth: [] }], // Security scheme for authentication
  //
  defaultInputModes: ["text/plain", "application/json"], // explicitly defined for agent card
  defaultOutputModes: ["text/plain", "application/json"], // explicitly defined for agent card
  skills: [
    {
      id: "multi_framework_analysis",
      name: "Multi-Framework Ethical Analysis",
      description: "Analyze using utilitarian, deontological, virtue ethics, and care ethics",
      tags: ["analysis", "ethical"],
      examples: [
          "Analyze the ethical implications of AI surveillance systems using multiple frameworks",
          "Evaluate the ethical considerations of autonomous vehicles in urban environments",
          "Assess the ethical impact of social media algorithms on user behavior",
          "Examine the ethical dilemmas in genetic engineering and biotechnology",
          "Evaluate the ethical implications of data privacy in healthcare systems"
      ],
      inputModes: ["text/plain" , "application/json"],   // explicitly defined for skills
      outputModes: ["text/plain", "application/json"]  // explicitly difinini for skills

    },
    {
      id: "ethical_conflict_resolution",
      name: "Ethical Conflict Resolution",
      description: "Resolve conflicts between ethical principles or stakeholders",
      tags : ["conflict", "resolution"],
      examples: [
          "Resolve a conflict between privacy and security in data collection",
          "Mediate an ethical dispute between two AI agents over resource allocation",
          "Facilitate a resolution between conflicting ethical frameworks in a corporate decision",
          "Negotiate an ethical compromise in a multi-stakeholder project",
          "Address ethical disagreements in cross-cultural team dynamics"
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"]


    },
    {
      id: "ethical_risk_assessment",
      name: "Ethical Risk Assessment",
      description: "Assess ethical risks of proposed actions or systems",
      tags: ["risk", "assessment"],
      examples: [
            "Evaluate the ethical risks of deploying facial recognition technology in public spaces",
            "Assess the ethical implications of using AI in hiring processes",
            "Analyze the potential ethical risks of autonomous drones in surveillance",
            "Examine the ethical concerns of algorithmic bias in financial services",
            "Evaluate the ethical risks of using predictive policing algorithms"
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"]
    },
    {
      id: "ethical_monitoring",
      name: "Continuous Ethical Monitoring",
      description: "Monitor system behavior for ethical compliance",
      tags: ["monitoring", "compliance"],
      examples: [
            "Monitor AI systems for adherence to ethical guidelines",
            "Track ethical compliance in data usage across platforms",
            "Evaluate the ethical implications of user interactions in social media",
            "Assess the ethical behavior of autonomous systems in real-time",
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"]
    },
    {
      id: "inter_agent_consultation",
      name: "Inter-Agent Ethical Consultation",
      description: "Provide ethical guidance to other agents",
      tags: ["consultation", "guidance"],
      examples: [
                "Advise an AI agent on ethical decision-making in resource allocation",
                "Provide ethical insights to a security agent on threat mitigation strategies",
                "Consult with a data analysis agent on ethical data handling practices",
                "Guide a creative agent on ethical content generation",
                "Assist a monitoring agent in identifying ethical concerns in system behavior"
      ],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"]
    }
  ],
  supportsAuthenticatedExtendedCard: false,

};