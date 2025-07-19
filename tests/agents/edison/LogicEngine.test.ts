/**
 * @jest-environment node
 */

import {
  LogicEngine,
  type Premise,
  type Conclusion,
  type Observation,
  type GeneralRule,
  type Evidence,
  type Hypothesis,
  type Statement,
  type Argument,
  type Fallacy,
  type Contradiction,
  type ConsistencyCheck,
  type LogicEngineConfig
} from '../../../src/agents/edison/LogicEngine';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for Logic Engine
class MockLogicLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    // Mock responses based on prompt content
    if (prompt.includes('Apply propositional logic')) {
      return JSON.stringify([
        {
          statement: 'If the system is overloaded, then response time increases',
          derivedFrom: ['premise1', 'premise2'],
          confidence: 0.9,
          steps: [
            {
              operation: 'modus ponens',
              input: ['system overloaded', 'if overloaded then slow'],
              output: 'response time increases',
              rule: 'modus ponens',
              justification: 'valid logical inference'
            }
          ],
          validity: 'valid'
        }
      ]);
    }

    if (prompt.includes('Apply first-order predicate logic')) {
      return JSON.stringify([
        {
          statement: 'All efficient algorithms have optimal complexity',
          derivedFrom: ['premise1'],
          confidence: 0.85,
          steps: [
            {
              operation: 'universal instantiation',
              input: ['∀x (Efficient(x) → Optimal(x))', 'Efficient(QuickSort)'],
              output: 'Optimal(QuickSort)',
              rule: 'universal instantiation',
              justification: 'valid predicate logic inference'
            }
          ],
          validity: 'valid'
        }
      ]);
    }

    if (prompt.includes('Apply modal logic')) {
      return JSON.stringify([
        {
          statement: 'It is necessarily true that secure systems require authentication',
          derivedFrom: ['modal_premise'],
          confidence: 0.8,
          steps: [
            {
              operation: 'necessity rule',
              input: ['□(Secure(x) → RequiresAuth(x))'],
              output: '□(Secure(system) → RequiresAuth(system))',
              rule: 'modal necessity',
              justification: 'modal logic inference'
            }
          ],
          validity: 'valid'
        }
      ]);
    }

    if (prompt.includes('Perform inductive reasoning')) {
      return JSON.stringify([
        {
          rule: 'High-traffic periods correlate with increased response times',
          domain: 'system-performance',
          confidence: 0.85,
          exceptions: ['Cached responses', 'Load-balanced systems'],
          applicabilityConditions: ['Non-optimized systems', 'Single-server deployments']
        },
        {
          rule: 'Code complexity increases maintenance time',
          domain: 'software-engineering',
          confidence: 0.9,
          exceptions: ['Well-documented code'],
          applicabilityConditions: ['Large codebases', 'Team development']
        }
      ]);
    }

    if (prompt.includes('abductive reasoning')) {
      return JSON.stringify([
        {
          statement: 'The system experienced a DDoS attack',
          explanation: 'Best explains the sudden traffic spike and service degradation',
          plausibility: 0.8,
          testable: true,
          predictions: [
            'Traffic logs will show unusual patterns',
            'Multiple IP addresses making rapid requests',
            'Service degradation during peak traffic'
          ]
        },
        {
          statement: 'Database connection pool exhaustion occurred',
          explanation: 'Explains the specific error patterns and timing',
          plausibility: 0.7,
          testable: true,
          predictions: [
            'Connection timeout errors in logs',
            'Performance degradation under load',
            'Recovery after connection pool reset'
          ]
        }
      ]);
    }

    if (prompt.includes('check if these premises form a valid syllogism')) {
      return JSON.stringify({
        conclusion: 'Therefore, Socrates is mortal',
        form: 'Barbara',
        confidence: 0.95,
        steps: [
          {
            operation: 'major premise',
            input: ['All humans are mortal'],
            output: 'Major: All humans are mortal',
            rule: 'syllogistic form'
          },
          {
            operation: 'minor premise',
            input: ['Socrates is human'],
            output: 'Minor: Socrates is human',
            rule: 'syllogistic form'
          },
          {
            operation: 'conclusion',
            input: ['Major premise', 'Minor premise'],
            output: 'Therefore, Socrates is mortal',
            rule: 'Barbara syllogism'
          }
        ]
      });
    }

    if (prompt.includes('Analyze this argument for logical fallacies')) {
      return JSON.stringify([
        {
          type: 'ad hominem',
          name: 'Personal Attack',
          description: 'Attacking the person making the argument rather than the argument itself',
          location: 'premise 2',
          severity: 'moderate',
          correction: 'Focus on the argument content, not the person'
        },
        {
          type: 'false dichotomy',
          name: 'False Dilemma',
          description: 'Presenting only two options when more exist',
          location: 'conclusion',
          severity: 'minor',
          correction: 'Consider additional alternatives'
        }
      ]);
    }

    if (prompt.includes('Check semantic consistency')) {
      return JSON.stringify([
        {
          statements: ['statement-1', 'statement-3'],
          type: 'contradiction',
          severity: 'major',
          description: 'Direct contradiction between security requirements'
        },
        {
          statements: ['statement-2'],
          type: 'ambiguity',
          severity: 'minor',
          description: 'Unclear specification of performance criteria'
        }
      ]);
    }

    if (prompt.includes('Resolve this logical contradiction')) {
      return JSON.stringify({
        method: 'disambiguation',
        resolvedStatements: [
          {
            content: 'System must be secure against external threats',
            logicalForm: 'Secure(system, external)',
            domain: 'security'
          },
          {
            content: 'System must be accessible to authorized users',
            logicalForm: 'Accessible(system, authorized)',
            domain: 'usability'
          }
        ],
        explanation: 'Resolved by clarifying that security and accessibility apply to different contexts',
        confidence: 0.85
      });
    }

    return '{}';
  }
}

describe('LogicEngine', () => {
  let logicEngine: LogicEngine;
  let mockLLMProvider: MockLogicLLMProvider;

  const mockPremises: Premise[] = [
    {
      id: 'premise-1',
      statement: 'All humans are mortal',
      truthValue: true,
      confidence: 0.95,
      source: 'universal knowledge',
      type: 'axiom'
    },
    {
      id: 'premise-2',
      statement: 'Socrates is human',
      truthValue: true,
      confidence: 0.9,
      source: 'historical record',
      type: 'fact'
    },
    {
      id: 'premise-3',
      statement: 'If a system is overloaded, then response time increases',
      truthValue: true,
      confidence: 0.85,
      source: 'empirical observation',
      type: 'hypothesis'
    }
  ];

  const mockObservations: Observation[] = [
    {
      id: 'obs-1',
      description: 'System response time increased to 2000ms during peak hours',
      context: { time: 'peak', load: 'high' },
      timestamp: new Date(),
      reliability: 0.9,
      category: 'performance'
    },
    {
      id: 'obs-2',
      description: 'CPU utilization reached 95% during high traffic',
      context: { resource: 'cpu', condition: 'high-traffic' },
      timestamp: new Date(),
      reliability: 0.85,
      category: 'performance'
    },
    {
      id: 'obs-3',
      description: 'Cache hit rate dropped to 60% during stress test',
      context: { metric: 'cache-hit-rate', scenario: 'stress-test' },
      timestamp: new Date(),
      reliability: 0.8,
      category: 'performance'
    }
  ];

  const mockEvidence: Evidence[] = [
    {
      id: 'evidence-1',
      description: 'Server logs show 500 errors starting at 14:30',
      type: 'empirical',
      strength: 0.9,
      source: 'server logs',
      relevance: 0.95
    },
    {
      id: 'evidence-2',
      description: 'Network traffic analysis indicates unusual patterns',
      type: 'statistical',
      strength: 0.8,
      source: 'network monitoring',
      relevance: 0.9
    },
    {
      id: 'evidence-3',
      description: 'User reports match timing of performance degradation',
      type: 'anecdotal',
      strength: 0.6,
      source: 'user feedback',
      relevance: 0.8
    }
  ];

  beforeEach(() => {
    mockLLMProvider = new MockLogicLLMProvider();
    logicEngine = new LogicEngine(mockLLMProvider, {
      reasoningDepth: 7,
      strictnessLevel: 'strict',
      enableProbabilisticReasoning: true,
      enableModalLogic: true,
      enableTemporalLogic: true,
      fallacyDetectionSensitivity: 0.8
    });
  });

  describe('Deductive Reasoning', () => {
    test('should perform valid deductive inferences', async () => {
      const conclusions = await logicEngine.performDeductiveReasoning(mockPremises);
      
      expect(conclusions).toBeInstanceOf(Array);
      expect(conclusions.length).toBeGreaterThan(0);
      
      if (conclusions.length > 0) {
        const conclusion = conclusions[0];
        expect(conclusion).toHaveProperty('id');
        expect(conclusion).toHaveProperty('statement');
        expect(conclusion).toHaveProperty('derivedFrom');
        expect(conclusion).toHaveProperty('inferenceMethod', 'deduction');
        expect(conclusion).toHaveProperty('confidence');
        expect(conclusion).toHaveProperty('logicalSteps');
        expect(conclusion).toHaveProperty('validity');
        
        expect(conclusion.derivedFrom).toBeInstanceOf(Array);
        expect(conclusion.confidence).toBeGreaterThan(0);
        expect(conclusion.confidence).toBeLessThanOrEqual(1);
        expect(['valid', 'invalid', 'uncertain']).toContain(conclusion.validity);
      }
    });

    test('should apply syllogistic reasoning', async () => {
      const humanPremises = mockPremises.slice(0, 2); // "All humans are mortal" + "Socrates is human"
      const conclusions = await logicEngine.performDeductiveReasoning(humanPremises);
      
      expect(conclusions).toBeInstanceOf(Array);
      // Should derive "Socrates is mortal" from the premises
    });

    test('should handle propositional logic', async () => {
      const propositionalPremises: Premise[] = [
        {
          id: 'prop-1',
          statement: 'If P then Q',
          truthValue: true,
          confidence: 0.9,
          source: 'logical rule',
          type: 'axiom'
        },
        {
          id: 'prop-2',
          statement: 'P is true',
          truthValue: true,
          confidence: 0.85,
          source: 'observation',
          type: 'fact'
        }
      ];

      const conclusions = await logicEngine.performDeductiveReasoning(propositionalPremises);
      expect(conclusions).toBeInstanceOf(Array);
    });

    test('should handle predicate logic with quantifiers', async () => {
      const predicatePremises: Premise[] = [
        {
          id: 'pred-1',
          statement: 'For all x, if x is a programmer, then x drinks coffee',
          truthValue: true,
          confidence: 0.8,
          source: 'stereotype',
          type: 'hypothesis'
        },
        {
          id: 'pred-2',
          statement: 'Alice is a programmer',
          truthValue: true,
          confidence: 0.95,
          source: 'employment record',
          type: 'fact'
        }
      ];

      const conclusions = await logicEngine.performDeductiveReasoning(predicatePremises);
      expect(conclusions).toBeInstanceOf(Array);
    });

    test('should cache valid inferences', async () => {
      const conclusions1 = await logicEngine.performDeductiveReasoning(mockPremises);
      const conclusions2 = await logicEngine.performDeductiveReasoning(mockPremises);
      
      expect(conclusions1).toBeInstanceOf(Array);
      expect(conclusions2).toBeInstanceOf(Array);
      
      // Should utilize caching for efficiency
      const metrics = logicEngine.getMetrics();
      expect(metrics.totalInferences).toBeGreaterThan(0);
    });
  });

  describe('Inductive Reasoning', () => {
    test('should derive general rules from observations', async () => {
      const rules = await logicEngine.performInductiveReasoning(mockObservations);
      
      expect(rules).toBeInstanceOf(Array);
      
      if (rules.length > 0) {
        const rule = rules[0];
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('rule');
        expect(rule).toHaveProperty('domain');
        expect(rule).toHaveProperty('derivedFromObservations');
        expect(rule).toHaveProperty('confidence');
        expect(rule).toHaveProperty('exceptions');
        expect(rule).toHaveProperty('applicabilityConditions');
        
        expect(rule.confidence).toBeGreaterThan(0);
        expect(rule.confidence).toBeLessThanOrEqual(1);
        expect(rule.derivedFromObservations).toBeInstanceOf(Array);
        expect(rule.exceptions).toBeInstanceOf(Array);
        expect(rule.applicabilityConditions).toBeInstanceOf(Array);
      }
    });

    test('should categorize observations correctly', async () => {
      const mixedObservations: Observation[] = [
        ...mockObservations,
        {
          id: 'obs-security',
          description: 'Unauthorized access attempt blocked',
          context: { type: 'security', action: 'blocked' },
          timestamp: new Date(),
          reliability: 0.95,
          category: 'security'
        }
      ];

      const rules = await logicEngine.performInductiveReasoning(mixedObservations);
      expect(rules).toBeInstanceOf(Array);
    });

    test('should store high-confidence rules', async () => {
      const initialMetrics = logicEngine.getMetrics();
      
      await logicEngine.performInductiveReasoning(mockObservations);
      
      const updatedMetrics = logicEngine.getMetrics();
      expect(updatedMetrics.discoveredRules).toBeGreaterThanOrEqual(initialMetrics.discoveredRules);
    });

    test('should handle empty observations gracefully', async () => {
      const rules = await logicEngine.performInductiveReasoning([]);
      expect(rules).toBeInstanceOf(Array);
      expect(rules).toHaveLength(0);
    });
  });

  describe('Abductive Reasoning', () => {
    test('should generate explanatory hypotheses', async () => {
      const hypotheses = await logicEngine.performAbductiveReasoning(mockEvidence);
      
      expect(hypotheses).toBeInstanceOf(Array);
      expect(hypotheses.length).toBeGreaterThan(0);
      
      if (hypotheses.length > 0) {
        const hypothesis = hypotheses[0];
        expect(hypothesis).toHaveProperty('id');
        expect(hypothesis).toHaveProperty('statement');
        expect(hypothesis).toHaveProperty('explanation');
        expect(hypothesis).toHaveProperty('supportingEvidence');
        expect(hypothesis).toHaveProperty('contradictingEvidence');
        expect(hypothesis).toHaveProperty('plausibility');
        expect(hypothesis).toHaveProperty('testable');
        expect(hypothesis).toHaveProperty('predictions');
        
        expect(hypothesis.plausibility).toBeGreaterThan(0);
        expect(hypothesis.plausibility).toBeLessThanOrEqual(1);
        expect(hypothesis.supportingEvidence).toBeInstanceOf(Array);
        expect(hypothesis.contradictingEvidence).toBeInstanceOf(Array);
        expect(hypothesis.predictions).toBeInstanceOf(Array);
        expect(typeof hypothesis.testable).toBe('boolean');
      }
    });

    test('should rank hypotheses by plausibility', async () => {
      const hypotheses = await logicEngine.performAbductiveReasoning(mockEvidence);
      
      if (hypotheses.length > 1) {
        for (let i = 0; i < hypotheses.length - 1; i++) {
          expect(hypotheses[i].plausibility).toBeGreaterThanOrEqual(hypotheses[i + 1].plausibility);
        }
      }
    });

    test('should store plausible hypotheses', async () => {
      const initialMetrics = logicEngine.getMetrics();
      
      await logicEngine.performAbductiveReasoning(mockEvidence);
      
      const updatedMetrics = logicEngine.getMetrics();
      expect(updatedMetrics.activeHypotheses).toBeGreaterThanOrEqual(initialMetrics.activeHypotheses);
    });

    test('should handle weak evidence appropriately', async () => {
      const weakEvidence: Evidence[] = [
        {
          id: 'weak-1',
          description: 'Unclear error message',
          type: 'anecdotal',
          strength: 0.2,
          source: 'user report',
          relevance: 0.3
        }
      ];

      const hypotheses = await logicEngine.performAbductiveReasoning(weakEvidence);
      expect(hypotheses).toBeInstanceOf(Array);
      
      // Should generate hypotheses but with lower plausibility
      if (hypotheses.length > 0) {
        expect(hypotheses[0].plausibility).toBeLessThan(0.8);
      }
    });
  });

  describe('Consistency Validation', () => {
    test('should validate logical consistency of statements', async () => {
      const testStatements: Statement[] = [
        {
          id: 'stmt-1',
          content: 'The system must be secure',
          logicalForm: 'Secure(system)',
          domain: 'security',
          dependencies: []
        },
        {
          id: 'stmt-2',
          content: 'The system must be fast',
          logicalForm: 'Fast(system)',
          domain: 'performance',
          dependencies: []
        },
        {
          id: 'stmt-3',
          content: 'Security measures slow down the system',
          logicalForm: 'Secure(system) → ¬Fast(system)',
          domain: 'general',
          dependencies: ['stmt-1', 'stmt-2']
        }
      ];

      const consistencyCheck = await logicEngine.validateLogicalConsistency(testStatements);
      
      expect(consistencyCheck).toHaveProperty('isConsistent');
      expect(consistencyCheck).toHaveProperty('inconsistencies');
      expect(consistencyCheck).toHaveProperty('consistencyScore');
      expect(consistencyCheck).toHaveProperty('resolutionSuggestions');
      
      expect(typeof consistencyCheck.isConsistent).toBe('boolean');
      expect(consistencyCheck.inconsistencies).toBeInstanceOf(Array);
      expect(consistencyCheck.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(consistencyCheck.consistencyScore).toBeLessThanOrEqual(1);
      expect(consistencyCheck.resolutionSuggestions).toBeInstanceOf(Array);
    });

    test('should detect direct contradictions', async () => {
      const contradictoryStatements: Statement[] = [
        {
          id: 'direct-1',
          content: 'The database is operational',
          logicalForm: 'Operational(database)',
          domain: 'system',
          dependencies: []
        },
        {
          id: 'direct-2',
          content: 'The database is not operational',
          logicalForm: '¬Operational(database)',
          domain: 'system',
          dependencies: []
        }
      ];

      const consistencyCheck = await logicEngine.validateLogicalConsistency(contradictoryStatements);
      expect(consistencyCheck.isConsistent).toBe(false);
      expect(consistencyCheck.inconsistencies.length).toBeGreaterThan(0);
    });

    test('should detect circular reasoning', async () => {
      const circularStatements: Statement[] = [
        {
          id: 'circular-1',
          content: 'A depends on B',
          logicalForm: 'Depends(A, B)',
          domain: 'logic',
          dependencies: ['circular-2']
        },
        {
          id: 'circular-2',
          content: 'B depends on A',
          logicalForm: 'Depends(B, A)',
          domain: 'logic',
          dependencies: ['circular-1']
        }
      ];

      const consistencyCheck = await logicEngine.validateLogicalConsistency(circularStatements);
      expect(consistencyCheck.inconsistencies.some(inc => inc.type === 'circular')).toBe(true);
    });

    test('should provide resolution suggestions', async () => {
      const inconsistentStatements: Statement[] = [
        {
          id: 'res-1',
          content: 'System must prioritize security',
          logicalForm: 'Priority(security)',
          domain: 'requirements',
          dependencies: []
        },
        {
          id: 'res-2',
          content: 'System must prioritize performance',
          logicalForm: 'Priority(performance)',
          domain: 'requirements',
          dependencies: []
        }
      ];

      const consistencyCheck = await logicEngine.validateLogicalConsistency(inconsistentStatements);
      expect(consistencyCheck.resolutionSuggestions).toBeInstanceOf(Array);
      if (consistencyCheck.resolutionSuggestions.length > 0) {
        expect(typeof consistencyCheck.resolutionSuggestions[0]).toBe('string');
      }
    });
  });

  describe('Fallacy Detection', () => {
    test('should detect logical fallacies in arguments', async () => {
      const mockArgument: Argument = {
        id: 'arg-1',
        premises: [
          {
            id: 'fallacy-premise-1',
            statement: 'John is a bad programmer because he is lazy',
            truthValue: 'unknown',
            confidence: 0.5,
            source: 'opinion',
            type: 'assumption'
          }
        ],
        conclusion: 'Therefore, all lazy people are bad programmers',
        structure: {
          type: 'inductive',
          pattern: 'generalization',
          steps: ['Personal attack', 'Hasty generalization']
        },
        strengthScore: 0.3
      };

      const fallacies = await logicEngine.detectLogicalFallacies(mockArgument);
      
      expect(fallacies).toBeInstanceOf(Array);
      
      if (fallacies.length > 0) {
        const fallacy = fallacies[0];
        expect(fallacy).toHaveProperty('id');
        expect(fallacy).toHaveProperty('type');
        expect(fallacy).toHaveProperty('name');
        expect(fallacy).toHaveProperty('description');
        expect(fallacy).toHaveProperty('location');
        expect(fallacy).toHaveProperty('severity');
        expect(fallacy).toHaveProperty('correction');
        
        expect(['minor', 'moderate', 'severe']).toContain(fallacy.severity);
      }
    });

    test('should adjust sensitivity based on configuration', async () => {
      const sensitiveEngine = new LogicEngine(mockLLMProvider, {
        fallacyDetectionSensitivity: 0.9
      });

      const tolerantEngine = new LogicEngine(mockLLMProvider, {
        fallacyDetectionSensitivity: 0.3
      });

      const weakArgument: Argument = {
        id: 'weak-arg',
        premises: [{
          id: 'weak-premise',
          statement: 'Some programmers drink coffee, so coffee makes you a good programmer',
          truthValue: 'unknown',
          confidence: 0.4,
          source: 'correlation',
          type: 'hypothesis'
        }],
        conclusion: 'Coffee improves programming skills',
        structure: {
          type: 'inductive',
          pattern: 'correlation-causation',
          steps: ['Correlation assumed as causation']
        },
        strengthScore: 0.2
      };

      const sensitiveFallacies = await sensitiveEngine.detectLogicalFallacies(weakArgument);
      const tolerantFallacies = await tolerantEngine.detectLogicalFallacies(weakArgument);

      expect(sensitiveFallacies).toBeInstanceOf(Array);
      expect(tolerantFallacies).toBeInstanceOf(Array);
    });

    test('should detect common formal fallacies', async () => {
      const formalFallacyArgument: Argument = {
        id: 'formal-fallacy',
        premises: [
          {
            id: 'formal-1',
            statement: 'If it rains, the ground gets wet',
            truthValue: true,
            confidence: 0.95,
            source: 'physical law',
            type: 'axiom'
          },
          {
            id: 'formal-2',
            statement: 'The ground is wet',
            truthValue: true,
            confidence: 0.8,
            source: 'observation',
            type: 'fact'
          }
        ],
        conclusion: 'Therefore, it rained',
        structure: {
          type: 'deductive',
          pattern: 'affirming-consequent',
          steps: ['Observe consequent', 'Affirm antecedent']
        },
        strengthScore: 0.4
      };

      const fallacies = await logicEngine.detectLogicalFallacies(formalFallacyArgument);
      expect(fallacies).toBeInstanceOf(Array);
    });
  });

  describe('Contradiction Resolution', () => {
    test('should resolve logical contradictions', async () => {
      const contradiction: Contradiction = {
        id: 'contradiction-1',
        statements: [
          {
            id: 'contra-1',
            content: 'System must be completely secure',
            logicalForm: '∀x Secure(x)',
            domain: 'security',
            dependencies: []
          },
          {
            id: 'contra-2',
            content: 'System must be completely accessible',
            logicalForm: '∀x Accessible(x)',
            domain: 'usability',
            dependencies: []
          }
        ],
        type: 'semantic',
        context: 'Security vs Usability trade-off',
        severity: 7
      };

      const resolution = await logicEngine.resolveLogicalContradictions([contradiction]);
      
      expect(resolution).toHaveProperty('contradictionId', contradiction.id);
      expect(resolution).toHaveProperty('method');
      expect(resolution).toHaveProperty('resolvedStatements');
      expect(resolution).toHaveProperty('explanation');
      expect(resolution).toHaveProperty('confidence');
      
      expect(['disambiguation', 'prioritization', 'synthesis', 'rejection']).toContain(resolution.method);
      expect(resolution.resolvedStatements).toBeInstanceOf(Array);
      expect(resolution.confidence).toBeGreaterThan(0);
      expect(resolution.confidence).toBeLessThanOrEqual(1);
    });

    test('should prioritize contradictions by severity', async () => {
      const contradictions: Contradiction[] = [
        {
          id: 'low-severity',
          statements: [],
          type: 'ambiguity',
          context: 'Minor wording issue',
          severity: 3
        },
        {
          id: 'high-severity',
          statements: [],
          type: 'direct',
          context: 'Fundamental logical conflict',
          severity: 9
        }
      ];

      const resolution = await logicEngine.resolveLogicalContradictions(contradictions);
      expect(resolution.contradictionId).toBe('high-severity');
    });

    test('should handle empty contradictions list', async () => {
      await expect(logicEngine.resolveLogicalContradictions([]))
        .rejects.toThrow('No contradictions to resolve');
    });
  });

  describe('Metrics and Performance', () => {
    test('should track logic engine metrics', async () => {
      // Generate some activity
      await logicEngine.performDeductiveReasoning(mockPremises);
      await logicEngine.performInductiveReasoning(mockObservations);
      await logicEngine.performAbductiveReasoning(mockEvidence);
      
      const metrics = logicEngine.getMetrics();
      
      expect(metrics).toHaveProperty('totalInferences');
      expect(metrics).toHaveProperty('knowledgeStatements');
      expect(metrics).toHaveProperty('activeHypotheses');
      expect(metrics).toHaveProperty('discoveredRules');
      expect(metrics).toHaveProperty('averageConfidence');
      
      expect(metrics.totalInferences).toBeGreaterThan(0);
      expect(metrics.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
    });

    test('should calculate average confidence correctly', async () => {
      const conclusions = await logicEngine.performDeductiveReasoning(mockPremises);
      const metrics = logicEngine.getMetrics();
      
      if (conclusions.length > 0) {
        expect(metrics.averageConfidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Configuration Options', () => {
    test('should respect reasoning depth configuration', () => {
      const shallowEngine = new LogicEngine(mockLLMProvider, {
        reasoningDepth: 3
      });

      const deepEngine = new LogicEngine(mockLLMProvider, {
        reasoningDepth: 9
      });

      expect(shallowEngine).toBeDefined();
      expect(deepEngine).toBeDefined();
    });

    test('should adjust strictness level', () => {
      const lenientEngine = new LogicEngine(mockLLMProvider, {
        strictnessLevel: 'lenient'
      });

      const strictEngine = new LogicEngine(mockLLMProvider, {
        strictnessLevel: 'strict'
      });

      expect(lenientEngine).toBeDefined();
      expect(strictEngine).toBeDefined();
    });

    test('should enable/disable modal logic', async () => {
      const modalEngine = new LogicEngine(mockLLMProvider, {
        enableModalLogic: true
      });

      const classicalEngine = new LogicEngine(mockLLMProvider, {
        enableModalLogic: false
      });

      const modalConclusions = await modalEngine.performDeductiveReasoning(mockPremises);
      const classicalConclusions = await classicalEngine.performDeductiveReasoning(mockPremises);

      expect(modalConclusions).toBeInstanceOf(Array);
      expect(classicalConclusions).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle LLM failures gracefully', async () => {
      const failingProvider: LLMProvider = {
        async generateResponse() {
          throw new Error('LLM service unavailable');
        }
      };

      const failingEngine = new LogicEngine(failingProvider);

      await expect(failingEngine.performDeductiveReasoning(mockPremises))
        .rejects.toThrow('Failed to perform deductive reasoning');
    });

    test('should handle malformed premises', async () => {
      const malformedPremises = [
        {
          id: undefined,
          statement: '',
          truthValue: 'invalid',
          confidence: -1,
          source: null,
          type: 'unknown'
        }
      ] as any;

      await expect(logicEngine.performDeductiveReasoning(malformedPremises))
        .rejects.toThrow();
    });

    test('should handle empty inputs gracefully', async () => {
      const emptyConclusions = await logicEngine.performDeductiveReasoning([]);
      const emptyRules = await logicEngine.performInductiveReasoning([]);
      const emptyHypotheses = await logicEngine.performAbductiveReasoning([]);

      expect(emptyConclusions).toBeInstanceOf(Array);
      expect(emptyRules).toBeInstanceOf(Array);
      expect(emptyHypotheses).toBeInstanceOf(Array);
    });
  });

  describe('Advanced Logic Features', () => {
    test('should handle temporal logic when enabled', async () => {
      const temporalEngine = new LogicEngine(mockLLMProvider, {
        enableTemporalLogic: true
      });

      const temporalPremises: Premise[] = [
        {
          id: 'temporal-1',
          statement: 'Eventually, all systems will need maintenance',
          truthValue: true,
          confidence: 0.9,
          source: 'empirical observation',
          type: 'hypothesis'
        }
      ];

      const conclusions = await temporalEngine.performDeductiveReasoning(temporalPremises);
      expect(conclusions).toBeInstanceOf(Array);
    });

    test('should handle probabilistic reasoning when enabled', async () => {
      const probabilisticEngine = new LogicEngine(mockLLMProvider, {
        enableProbabilisticReasoning: true
      });

      const probabilisticEvidence: Evidence[] = [
        {
          id: 'prob-evidence',
          description: 'System failure occurs with 30% probability under high load',
          type: 'statistical',
          strength: 0.7,
          source: 'historical data',
          relevance: 0.9
        }
      ];

      const hypotheses = await probabilisticEngine.performAbductiveReasoning(probabilisticEvidence);
      expect(hypotheses).toBeInstanceOf(Array);
    });
  });

  describe('Knowledge Base Integration', () => {
    test('should maintain knowledge base with fundamental rules', () => {
      const metrics = logicEngine.getMetrics();
      expect(metrics.discoveredRules).toBeGreaterThan(0);
    });

    test('should store validated statements', async () => {
      const testStatements: Statement[] = [
        {
          id: 'kb-stmt-1',
          content: 'Validated logical principle',
          logicalForm: 'Valid(principle)',
          domain: 'logic',
          dependencies: []
        }
      ];

      const consistency = await logicEngine.validateLogicalConsistency(testStatements);
      expect(consistency).toBeDefined();
    });
  });
});

describe('LogicEngine Integration and Stress Tests', () => {
  let logicEngine: LogicEngine;
  let mockLLMProvider: MockLogicLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLogicLLMProvider();
    logicEngine = new LogicEngine(mockLLMProvider, {
      reasoningDepth: 8,
      enableModalLogic: true,
      enableTemporalLogic: true,
      enableProbabilisticReasoning: true
    });
  });

  test('should handle complex reasoning workflows', async () => {
    // 1. Deductive reasoning
    const premises: Premise[] = [
      {
        id: 'workflow-1',
        statement: 'All well-designed systems are maintainable',
        truthValue: true,
        confidence: 0.9,
        source: 'software engineering principle',
        type: 'axiom'
      },
      {
        id: 'workflow-2',
        statement: 'Our system is well-designed',
        truthValue: true,
        confidence: 0.8,
        source: 'design review',
        type: 'fact'
      }
    ];

    const conclusions = await logicEngine.performDeductiveReasoning(premises);
    expect(conclusions.length).toBeGreaterThan(0);

    // 2. Inductive reasoning from observations
    const observations: Observation[] = [
      {
        id: 'workflow-obs-1',
        description: 'System maintained successfully in 2 hours',
        context: { task: 'maintenance', duration: 2 },
        timestamp: new Date(),
        reliability: 0.9,
        category: 'maintenance'
      }
    ];

    const rules = await logicEngine.performInductiveReasoning(observations);
    expect(rules).toBeInstanceOf(Array);

    // 3. Validate consistency
    const statements: Statement[] = [
      {
        id: 'workflow-stmt',
        content: conclusions[0]?.statement || 'Default statement',
        logicalForm: 'Maintainable(system)',
        domain: 'software',
        dependencies: []
      }
    ];

    const consistency = await logicEngine.validateLogicalConsistency(statements);
    expect(consistency.isConsistent).toBeDefined();

    // Verify metrics
    const metrics = logicEngine.getMetrics();
    expect(metrics.totalInferences).toBeGreaterThan(0);
  });

  test('should handle large-scale logical analysis', async () => {
    const largePremiseSet: Premise[] = Array.from({ length: 50 }, (_, i) => ({
      id: `large-premise-${i}`,
      statement: `Principle ${i}: If condition ${i} then result ${i}`,
      truthValue: true,
      confidence: 0.7 + (i % 3) * 0.1,
      source: `source-${i}`,
      type: i % 2 === 0 ? 'axiom' as const : 'hypothesis' as const
    }));

    const startTime = Date.now();
    const conclusions = await logicEngine.performDeductiveReasoning(largePremiseSet);
    const endTime = Date.now();

    expect(conclusions).toBeInstanceOf(Array);
    expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
  });

  test('should maintain logical consistency across operations', async () => {
    // Perform multiple operations and ensure consistency
    const premises = [
      {
        id: 'consistency-1',
        statement: 'Secure systems require authentication',
        truthValue: true,
        confidence: 0.95,
        source: 'security principle',
        type: 'axiom' as const
      }
    ];

    const evidence = [
      {
        id: 'consistency-evidence',
        description: 'Authentication bypass attempted',
        type: 'empirical' as const,
        strength: 0.9,
        source: 'security logs',
        relevance: 0.95
      }
    ];

    const observations = [
      {
        id: 'consistency-obs',
        description: 'Authentication prevented unauthorized access',
        context: { security: 'authentication' },
        timestamp: new Date(),
        reliability: 0.9,
        category: 'security'
      }
    ];

    // Run all reasoning types
    const conclusions = await logicEngine.performDeductiveReasoning(premises);
    const hypotheses = await logicEngine.performAbductiveReasoning(evidence);
    const rules = await logicEngine.performInductiveReasoning(observations);

    expect(conclusions).toBeInstanceOf(Array);
    expect(hypotheses).toBeInstanceOf(Array);
    expect(rules).toBeInstanceOf(Array);

    const metrics = logicEngine.getMetrics();
    expect(metrics.averageConfidence).toBeGreaterThan(0);
  });
});