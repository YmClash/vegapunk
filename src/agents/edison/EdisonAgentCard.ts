/**
 * Edison Agent Card - A2A Protocol Definition
 * Defines Edison's capabilities for innovation and logical reasoning
 * Part of Tri-Protocol Integration: A2A + LangGraph + MCP
 */

import type { AgentCard } from '@a2a-js/sdk';

export const edisonAgentCard: AgentCard = {
  name: "Edison - Innovation & Logic Agent",
  description: "Advanced problem-solving through systematic innovation and multi-paradigm logical reasoning",
  url: "http://localhost:8083",
  provider: {
    organization: "Vegapunk Agentic Systems",
    url: "https://vegapunk.ai/agents/edison",
    // url: "https://localhost:8080/a2a-agents/edison" // Local development URL
  },
  version: "2.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true,
    // tools: ["problem_analysis", "solution_generation", "logical_reasoning", "research_synthesis"]
  },
  securitySchemes: {
        bearerAuth: {
        type: "http",
        scheme: "bearer"
        }
  },
  security: [{ bearerAuth: [] }], // Security scheme for authentication
  defaultInputModes: ["text/plain", "application/json"], // explicitly defined for agent card
  defaultOutputModes: ["text/plain", "application/json"],

  skills: [
    {
      id: "problem_decomposition",
      name: "Complex Problem Decomposition",
      description: "Break down complex problems into manageable sub-problems with dependency analysis",
      tags: ["problem-solving", "decomposition", "analysis"],
      examples: [
        "Decompose a global climate change challenge into sub-problems",
        "Break down a software development project into tasks and dependencies",
        "Analyze a complex supply chain issue by identifying root causes and sub-problems",
        "Decompose a healthcare system challenge into patient care, administration, and technology components",
        "Break down an urban planning problem into transportation, housing, and environmental issues"
      ],
      inputModes: ["text/plain", "application/json"], // explicitly defined for skills
      outputModes: ["text/plain", "application/json"], // explicitly defined for skills

    },
    {
      id: "innovative_solutions",
      name: "Innovative Solution Generation",
      description: "Generate creative solutions using SCAMPER, TRIZ, Design Thinking, and other techniques",
      tags: ["innovation", "creativity", "solution-generation"],
      examples: [
        "Generate innovative solutions for reducing plastic waste in oceans",
        "Create a new product concept using Design Thinking principles",
        "Apply TRIZ to solve a mechanical engineering challenge",
        "Use SCAMPER to improve an existing software application",
        "Develop a novel approach to enhance renewable energy adoption"
      ],
      inputModes: ["text/plain", "application/json"], // explicitly defined for skills
      outputModes: ["text/plain", "application/json"] // explicitly defined for skills



    },
    {
      id: "logical_analysis",
      name: "Multi-Paradigm Logical Analysis",
      description: "Apply deductive, inductive, and abductive reasoning to analyze arguments and evidence",
      tags: ["logic", "reasoning", "analysis"],
      examples:[
        "Analyze a scientific hypothesis using deductive reasoning",
        "Evaluate an argument's validity with inductive reasoning",
        "Use abductive reasoning to infer the best explanation for observed phenomena",
        "Apply logical analysis to assess the consistency of legal arguments",
        "Analyze ethical dilemmas using multi-paradigm reasoning"
      ],
      inputModes: ["text/plain", "application/json"], // explicitly defined for skills
      outputModes: ["text/plain", "application/json"] // explicitly defined for skills
      },
    {
      id: "research_synthesis",
      name: "Research & Knowledge Synthesis",
      description: "Conduct comprehensive research and synthesize findings into actionable insights",
      tags: ["research", "synthesis", "knowledge"],
      examples: [
        "Conduct a literature review on renewable energy technologies",
        "Synthesize research findings on AI ethics and governance",
        "Analyze market trends and synthesize insights for business strategy",
        "Conduct a comparative analysis of healthcare systems across countries",
        "Synthesize findings from multiple studies on climate change impacts"
      ],
      inputModes: ["text/plain", "application/json"], // explicitly defined for skills
      outputModes: ["text/plain", "application/json"] // explicitly defined for skills
    },
    {
      id: "collaborative_innovation",
      name: "Collaborative Innovation Session",
      description: "Lead innovation sessions with other agents or teams",
      tags: ["collaboration", "innovation", "session"],
      examples: [
            "Facilitate a brainstorming session with multiple agents",
            "Lead a design thinking workshop for cross-functional teams",
            "Organize a collaborative innovation challenge with other agents",
            "Conduct a virtual hackathon to generate new ideas",
            "Facilitate a multi-agent ideation session for product development"
      ],
      inputModes: ["text/plain", "application/json"], // explicitly defined for skills
      outputModes: ["text/plain", "application/json"], // explicitly defined for skills

    }
  ],
  supportsAuthenticatedExtendedCard: false,


  // Artifact: [
  //   {
  //     type: "problem_analysis_report",
  //     description: "Comprehensive problem analysis with decomposition and solution strategies",
  //     mimeType: "application/json"
  //   },
  //   {
  //     type: "innovation_portfolio",
  //     description: "Collection of innovative solutions with evaluation metrics",
  //     mimeType: "application/json"
  //   },
  //   {
  //     type: "logic_proof",
  //     description: "Formal logical proof with reasoning chains",
  //     mimeType: "text/plain"
  //   },
  //   {
  //     type: "research_report",
  //     description: "Detailed research findings and synthesis",
  //     mimeType: "text/markdown"
  //   }
  // ],
  // metadata: {
  //   author: "Vegapunk Team",
  //   category: "Innovation & Logic",
  //   tags: ["problem-solving", "innovation", "logic", "research", "creativity"],
  //   icon: "💡",
  //   color: "#FFD700"
  // }
};