/**
 * Edison Agent Card - A2A Protocol Definition
 * Defines Edison's capabilities for innovation and logical reasoning
 */

import type { AgentCard } from '@a2a-js/sdk';

export const edisonAgentCard: AgentCard = {
  name: "Edison - Innovation & Logic Agent",
  description: "Advanced problem-solving through systematic innovation and multi-paradigm logical reasoning",
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true,
    tools: ["problem_analysis", "solution_generation", "logical_reasoning", "research_synthesis"]
  },
  schemes: [
    {
      type: "problem_solving",
      description: "Complex problem analysis and solution generation",
      requiredParams: ["problem_description", "constraints"],
      optionalParams: ["domain", "innovation_level", "time_limit", "complexity"]
    },
    {
      type: "logical_reasoning",
      description: "Multi-paradigm logical analysis (deductive, inductive, abductive)",
      requiredParams: ["premises", "reasoning_type"],
      optionalParams: ["context", "confidence_threshold", "depth"]
    },
    {
      type: "innovation_generation",
      description: "Creative solution generation using multiple techniques",
      requiredParams: ["challenge", "objectives"],
      optionalParams: ["techniques", "evaluation_criteria", "risk_tolerance"]
    },
    {
      type: "research_automation",
      description: "Autonomous research and knowledge synthesis",
      requiredParams: ["topic", "scope"],
      optionalParams: ["sources", "depth", "format"]
    }
  ],
  skills: [
    {
      id: "problem_decomposition",
      name: "Complex Problem Decomposition",
      description: "Break down complex problems into manageable sub-problems with dependency analysis",
      inputSchema: {
        type: "object",
        properties: {
          problem: { 
            type: "string", 
            description: "The problem to decompose" 
          },
          context: { 
            type: "object",
            description: "Problem context and constraints"
          },
          decomposition_depth: { 
            type: "number",
            description: "Maximum depth of decomposition (1-7)",
            default: 3
          },
          identify_dependencies: {
            type: "boolean",
            description: "Whether to identify dependencies between sub-problems",
            default: true
          }
        },
        required: ["problem"]
      },
      outputSchema: {
        type: "object",
        properties: {
          root_problem: { type: "string" },
          sub_problems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                description: { type: "string" },
                complexity: { type: "number" },
                dependencies: { 
                  type: "array",
                  items: { type: "string" }
                },
                priority: { type: "number" }
              }
            }
          },
          dependency_graph: { type: "object" },
          solution_strategy: { type: "string" }
        }
      }
    },
    {
      id: "innovative_solutions",
      name: "Innovative Solution Generation",
      description: "Generate creative solutions using SCAMPER, TRIZ, Design Thinking, and other techniques",
      inputSchema: {
        type: "object",
        properties: {
          challenge: { 
            type: "string",
            description: "The challenge or problem to solve"
          },
          constraints: { 
            type: "array",
            items: { type: "string" },
            description: "Constraints to consider"
          },
          objectives: {
            type: "array",
            items: { type: "string" },
            description: "Desired objectives"
          },
          innovation_techniques: { 
            type: "array",
            items: { 
              type: "string",
              enum: ["SCAMPER", "TRIZ", "Design_Thinking", "Lateral_Thinking", "Biomimicry", "Blue_Ocean"]
            },
            default: ["SCAMPER", "TRIZ"]
          },
          risk_tolerance: {
            type: "number",
            description: "Risk tolerance level (0-1)",
            default: 0.7
          }
        },
        required: ["challenge"]
      },
      outputSchema: {
        type: "object",
        properties: {
          solutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                technique_used: { type: "string" },
                innovation_score: { type: "number" },
                feasibility_score: { type: "number" },
                impact_score: { type: "number" },
                implementation_steps: {
                  type: "array",
                  items: { type: "string" }
                },
                risks: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          recommended_solution: { type: "object" },
          synthesis_insights: { type: "string" }
        }
      }
    },
    {
      id: "logical_analysis",
      name: "Multi-Paradigm Logical Analysis",
      description: "Apply deductive, inductive, and abductive reasoning to analyze arguments and evidence",
      inputSchema: {
        type: "object",
        properties: {
          premises: { 
            type: "array",
            items: { type: "string" },
            description: "Statements to analyze"
          },
          reasoning_type: { 
            type: "string",
            enum: ["deductive", "inductive", "abductive", "mixed"],
            description: "Type of reasoning to apply"
          },
          goal: { 
            type: "string",
            description: "Goal of the analysis"
          },
          check_consistency: {
            type: "boolean",
            description: "Check for logical consistency",
            default: true
          },
          detect_fallacies: {
            type: "boolean",
            description: "Detect logical fallacies",
            default: true
          }
        },
        required: ["premises", "reasoning_type"]
      },
      outputSchema: {
        type: "object",
        properties: {
          conclusions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                statement: { type: "string" },
                confidence: { type: "number" },
                reasoning_chain: {
                  type: "array",
                  items: { type: "string" }
                },
                validity: { 
                  type: "string",
                  enum: ["valid", "invalid", "uncertain"]
                }
              }
            }
          },
          fallacies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                location: { type: "string" }
              }
            }
          },
          consistency: {
            type: "object",
            properties: {
              is_consistent: { type: "boolean" },
              inconsistencies: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          reasoning_diagram: { type: "string" }
        }
      }
    },
    {
      id: "research_synthesis",
      name: "Research & Knowledge Synthesis",
      description: "Conduct comprehensive research and synthesize findings into actionable insights",
      inputSchema: {
        type: "object",
        properties: {
          topic: { 
            type: "string",
            description: "Research topic"
          },
          scope: {
            type: "string",
            enum: ["narrow", "moderate", "broad"],
            default: "moderate"
          },
          sources: { 
            type: "array",
            items: { type: "string" },
            description: "Specific sources to consider"
          },
          research_depth: {
            type: "string",
            enum: ["shallow", "moderate", "deep"],
            default: "moderate"
          },
          synthesis_type: { 
            type: "string",
            enum: ["narrative", "systematic", "meta_analysis"],
            default: "systematic"
          }
        },
        required: ["topic"]
      },
      outputSchema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          key_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                finding: { type: "string" },
                significance: { type: "number" },
                evidence_strength: { type: "string" },
                sources: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          knowledge_gaps: {
            type: "array",
            items: { type: "string" }
          },
          hypotheses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hypothesis: { type: "string" },
                testability: { type: "number" },
                potential_impact: { type: "string" }
              }
            }
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          },
          confidence_level: { type: "number" },
          research_quality_score: { type: "number" }
        }
      }
    },
    {
      id: "collaborative_innovation",
      name: "Collaborative Innovation Session",
      description: "Lead innovation sessions with other agents or teams",
      inputSchema: {
        type: "object",
        properties: {
          objective: {
            type: "string",
            description: "Innovation session objective"
          },
          participants: {
            type: "array",
            items: { type: "string" },
            description: "Session participants"
          },
          duration_minutes: {
            type: "number",
            default: 60
          },
          techniques: {
            type: "array",
            items: { type: "string" },
            default: ["brainstorming", "mind_mapping"]
          },
          collaboration_mode: {
            type: "string",
            enum: ["facilitator", "participant", "observer"],
            default: "facilitator"
          }
        },
        required: ["objective"]
      },
      outputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string" },
          outcomes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                idea: { type: "string" },
                contributor: { type: "string" },
                innovation_potential: { type: "number" }
              }
            }
          },
          insights: {
            type: "array",
            items: { type: "string" }
          },
          next_steps: {
            type: "array",
            items: { type: "string" }
          },
          collaboration_effectiveness: { type: "number" }
        }
      }
    }
  ],
  artifacts: [
    {
      type: "problem_analysis_report",
      description: "Comprehensive problem analysis with decomposition and solution strategies",
      mimeType: "application/json"
    },
    {
      type: "innovation_portfolio",
      description: "Collection of innovative solutions with evaluation metrics",
      mimeType: "application/json"
    },
    {
      type: "logic_proof",
      description: "Formal logical proof with reasoning chains",
      mimeType: "text/plain"
    },
    {
      type: "research_report",
      description: "Detailed research findings and synthesis",
      mimeType: "text/markdown"
    }
  ],
  metadata: {
    author: "Vegapunk Team",
    category: "Innovation & Logic",
    tags: ["problem-solving", "innovation", "logic", "research", "creativity"],
    icon: "💡",
    color: "#FFD700"
  }
};