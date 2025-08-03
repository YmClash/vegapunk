/**
 * AtlasAgentCard - A2A Protocol Agent Card Definition
 * Security and Automation Specialist Agent Card
 * Tri-Protocol Integration: A2A + LangGraph + MCP
 */

// A2A Protocol Agent Card Definition
// Using local type definition until official SDK is available
// export interface AgentCard {
//   name: string;
//   description: string;
//   url: string;
//   provider: {
//     organization: string;
//     url: string;
//   };
//   version: string;
//   capabilities: {
//     streaming: boolean;
//     pushNotifications: boolean;
//     stateTransitionHistory: boolean;
//   };
//   securitySchemes: Record<string, any>;
//   security: Array<Record<string, any>>;
//   defaultInputModes: string[];
//   defaultOutputModes: string[];
//   skills: Array<{
//     id: string;
//     name: string;
//     description: string;
//     tags: string[];
//     examples: string[];
//     inputModes: string[];
//     outputModes: string[];
//   }>;
//   supportsAuthenticatedExtendedCard: boolean;
// }

import type { AgentCard} from "@a2a-js/sdk";

export const atlasAgentCard: AgentCard = {
  name: "Atlas Security Agent",
  description: "Advanced security and automation agent specializing in threat detection, incident response, and proactive system protection with ethical oversight",
  url: "http://localhost:8082",
  provider: {
    organization: "Vegapunk Agentic Systems",
    url: "https://vegapunk.ai/agents/atlas",
    // url: "https://localhost:8080/a2a-agents/atlas" // Local development URL
  },
  version: "2.0.0", // Version tri-protocol
  capabilities: {
    streaming: true,
    pushNotifications: true, // Security alerts en temps réel
    stateTransitionHistory: true,
    // tools: ["threat_detection", "incident_response", "security_automation", "security_collaboration"]
  },
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer"
    }
  },
  security: [{ bearerAuth: [] }],
  defaultInputModes: ["text/plain", "application/json"],
  defaultOutputModes: ["text/plain", "application/json"],
  skills: [
    {
      id: "threat_detection",
      name: "Advanced Threat Detection",
      description: "Real-time monitoring and detection of security threats using ML-powered analysis",
      tags: ["security", "monitoring", "ml", "detection"],
      examples: [
        "Scan system for potential vulnerabilities",
        "Analyze network traffic for anomalies",
        "Detect suspicious user behavior patterns",
        "Monitor system integrity and file changes"
      ],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["text/plain", "application/json"],
    },
    {
      id: "incident_response",
      name: "Automated Incident Response",
      description: "Intelligent incident response with ethical consultation and automated mitigation",
      tags: ["security", "incident", "response", "automation"],
      examples: [
        "Respond to security breach attempt",
        "Isolate compromised system components",
        "Execute security containment protocols",
        "Generate incident response reports"
      ],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["text/plain", "application/json"],
    },
    {
      id: "security_automation",
      name: "Proactive Security Automation",
      description: "Automated security tasks with ethical oversight and compliance monitoring",
      tags: ["security", "automation", "compliance", "ethics"],
      examples: [
        "Automate security policy enforcement",
        "Execute scheduled security audits",
        "Maintain security baselines",
        "Coordinate with ethical review processes"
      ],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["text/plain", "application/json"],
    },
    {
      id: "security_collaboration",
      name: "Multi-Agent Security Collaboration",
      description: "Collaborate with ShakaAgent for ethical security decisions and other agents for comprehensive protection",
      tags: ["collaboration", "ethics", "multi-agent", "coordination"],
      examples: [
        "Consult with ShakaAgent on security ethics",
        "Coordinate security workflows with other agents",
        "Share threat intelligence across agent network",
        "Execute collaborative incident response"
      ],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["text/plain", "application/json"],
    }
  ],
  supportsAuthenticatedExtendedCard: false,
};