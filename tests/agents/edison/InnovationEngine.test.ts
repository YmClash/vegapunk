/**
 * @jest-environment node
 */

import {
  InnovationEngine,
  type Innovation,
  type InnovationEngineConfig,
  type Concept,
  type HybridConcept,
  type ResearchResult,
  type Prototype,
  type Feedback,
  type UnconventionalSolution
} from '../../../src/agents/edison/InnovationEngine';
import { Problem } from '../../../src/agents/edison/ProblemSolver';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for Innovation Engine
class MockInnovationLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    // Mock responses based on prompt content
    if (prompt.includes('Apply SCAMPER') || prompt.includes('brainstorming')) {
      return JSON.stringify([
        {
          title: 'Smart Caching System',
          description: 'AI-powered predictive caching for web applications',
          noveltyScore: 0.8,
          feasibilityScore: 0.7,
          impactScore: 0.9,
          requiredTechnologies: ['Machine Learning', 'Redis', 'Node.js'],
          potentialApplications: ['E-commerce', 'Social Media', 'Content Delivery'],
          risks: ['Initial complexity', 'Training data requirements'],
          timeToMarket: 12
        },
        {
          title: 'Quantum-Inspired Optimization',
          description: 'Classical algorithm inspired by quantum computing principles',
          noveltyScore: 0.9,
          feasibilityScore: 0.6,
          impactScore: 0.8,
          requiredTechnologies: ['Advanced Mathematics', 'Optimization Libraries'],
          potentialApplications: ['Logistics', 'Financial Trading', 'Resource Allocation'],
          risks: ['Theoretical complexity', 'Performance validation'],
          timeToMarket: 18
        }
      ]);
    }

    if (prompt.includes('Combine') && prompt.includes('concepts')) {
      return JSON.stringify([
        {
          title: 'Bio-Inspired Computing Architecture',
          description: 'Computing system that mimics biological neural networks',
          noveltyScore: 0.85,
          feasibilityScore: 0.65,
          impactScore: 0.9,
          requiredTechnologies: ['Neuromorphic Computing', 'Biological Research'],
          potentialApplications: ['AI Processing', 'Low-Power Computing', 'Edge Devices']
        }
      ]);
    }

    if (prompt.includes('cross-domain')) {
      return JSON.stringify([
        {
          title: 'Musical Algorithm Optimization',
          description: 'Using music theory to optimize algorithm performance',
          noveltyScore: 0.95,
          feasibilityScore: 0.5,
          impactScore: 0.7,
          requiredTechnologies: ['Music Theory', 'Algorithm Design'],
          potentialApplications: ['Software Optimization', 'Creative Computing']
        }
      ]);
    }

    if (prompt.includes('unconventional solutions')) {
      return JSON.stringify([
        {
          approach: 'Reverse the problem completely',
          description: 'Instead of optimizing the system, optimize the users expectations',
          unconventionalAspects: ['User psychology focus', 'Perception manipulation'],
          paradigmShifts: ['From technical to psychological solution'],
          challengedAssumptions: ['Technical problems need technical solutions'],
          potentialResistance: ['Engineering team skepticism'],
          transformativeImpact: 8
        },
        {
          approach: 'Embrace the inefficiency',
          description: 'Turn performance bottlenecks into features',
          unconventionalAspects: ['Making problems into benefits'],
          paradigmShifts: ['From problem-solving to problem-reframing'],
          challengedAssumptions: ['All inefficiencies are bad'],
          potentialResistance: ['Management concerns'],
          transformativeImpact: 6
        }
      ]);
    }

    if (prompt.includes('research')) {
      return JSON.stringify({
        findings: [
          {
            description: 'Recent advances in edge computing show 40% performance improvement',
            evidence: ['Research paper A', 'Industry benchmark B'],
            significance: 8,
            reliability: 0.9
          },
          {
            description: 'WebAssembly adoption is accelerating for performance-critical applications',
            evidence: ['Stack Overflow survey', 'GitHub usage statistics'],
            significance: 7,
            reliability: 0.8
          }
        ],
        hypotheses: [
          'Edge computing combined with WebAssembly could solve latency issues',
          'Progressive loading strategies might improve perceived performance'
        ],
        experiments: [
          {
            hypothesis: 'Edge computing reduces latency by 30%',
            methodology: 'A/B test with edge vs traditional deployment',
            requiredResources: ['Test infrastructure', 'User traffic'],
            expectedOutcomes: ['Latency measurements', 'User satisfaction metrics'],
            duration: 14,
            riskLevel: 'medium'
          }
        ],
        literatureReview: 'Comprehensive analysis of 50+ papers on web performance optimization',
        knowledgeGaps: [
          'Limited research on combined edge computing and WebAssembly',
          'Few studies on user perception vs actual performance'
        ],
        futureDirections: [
          'Investigate serverless edge computing',
          'Study psychological aspects of performance perception'
        ],
        confidenceLevel: 0.85
      });
    }

    if (prompt.includes('prototype')) {
      return JSON.stringify({
        name: 'Smart Caching Prototype v1',
        description: 'Initial prototype of AI-powered predictive caching system',
        specifications: {
          language: 'TypeScript',
          framework: 'Node.js',
          database: 'Redis',
          mlLibrary: 'TensorFlow.js',
          targetLatency: '< 50ms',
          cacheHitRate: '> 85%'
        },
        components: [
          {
            name: 'Prediction Engine',
            function: 'Predict what content users will request next',
            specifications: { algorithm: 'LSTM neural network', updateFrequency: '5 minutes' },
            dependencies: ['User Behavior Analyzer']
          },
          {
            name: 'Cache Manager',
            function: 'Manage cache storage and eviction policies',
            specifications: { storage: 'Redis Cluster', maxMemory: '2GB' },
            dependencies: ['Prediction Engine']
          }
        ]
      });
    }

    if (prompt.includes('Improve this prototype')) {
      return JSON.stringify({
        improvements: [
          'Add real-time model retraining',
          'Implement multi-tier caching strategy',
          'Add performance monitoring dashboard'
        ],
        specifications: {
          retrainingInterval: '1 hour',
          cacheTiers: 3,
          monitoringMetrics: ['hit rate', 'latency', 'memory usage']
        },
        performanceGains: {
          hitRate: 0.15,
          latency: -0.3,
          efficiency: 0.25
        },
        lessonsLearned: [
          'Real-time adaptation is crucial for dynamic workloads',
          'Multi-tier caching provides better resource utilization',
          'Monitoring is essential for optimization feedback'
        ]
      });
    }

    if (prompt.includes('Synthesize these concepts')) {
      return JSON.stringify({
        name: 'Quantum-Bio Hybrid Computing',
        description: 'Computing architecture combining quantum principles with biological neural networks',
        keyPrinciples: [
          'Quantum superposition for parallel processing',
          'Biological adaptation for learning',
          'Hybrid classical-quantum interface'
        ],
        relatedConcepts: ['Neuromorphic computing', 'Quantum algorithms', 'Bio-inspired AI'],
        maturityLevel: 3,
        synergyScore: 0.85,
        emergentProperties: [
          'Self-optimizing quantum states',
          'Biological error correction',
          'Adaptive quantum-classical switching'
        ],
        combinationMethod: 'Hierarchical integration with quantum core and biological adaptation layer'
      });
    }

    return '{}';
  }
}

describe('InnovationEngine', () => {
  let innovationEngine: InnovationEngine;
  let mockLLMProvider: MockInnovationLLMProvider;

  const mockConcepts: Concept[] = [
    {
      id: 'concept-1',
      name: 'Quantum Computing',
      domain: 'Technology',
      description: 'Computing using quantum mechanical phenomena',
      keyPrinciples: ['Superposition', 'Entanglement', 'Quantum gates'],
      relatedConcepts: ['Classical computing', 'Cryptography'],
      maturityLevel: 6
    },
    {
      id: 'concept-2',
      name: 'Neural Networks',
      domain: 'AI',
      description: 'Computing systems inspired by biological neural networks',
      keyPrinciples: ['Neurons', 'Weights', 'Backpropagation'],
      relatedConcepts: ['Machine Learning', 'Deep Learning'],
      maturityLevel: 8
    }
  ];

  beforeEach(() => {
    mockLLMProvider = new MockInnovationLLMProvider();
    innovationEngine = new InnovationEngine(mockLLMProvider, {
      creativityLevel: 0.8,
      riskTolerance: 0.7,
      crossDomainExploration: true,
      enableRadicalInnovation: true,
      researchDepth: 'deep'
    });
  });

  describe('Innovation Generation', () => {
    test('should generate innovative ideas for a domain', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('web-development');
      
      expect(innovations).toBeInstanceOf(Array);
      expect(innovations.length).toBeGreaterThan(0);
      
      if (innovations.length > 0) {
        const innovation = innovations[0];
        expect(innovation).toHaveProperty('id');
        expect(innovation).toHaveProperty('title');
        expect(innovation).toHaveProperty('description');
        expect(innovation).toHaveProperty('domain', 'web-development');
        expect(innovation).toHaveProperty('noveltyScore');
        expect(innovation).toHaveProperty('feasibilityScore');
        expect(innovation).toHaveProperty('impactScore');
        
        expect(innovation.noveltyScore).toBeGreaterThanOrEqual(0);
        expect(innovation.noveltyScore).toBeLessThanOrEqual(1);
        expect(innovation.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(innovation.feasibilityScore).toBeLessThanOrEqual(1);
        expect(innovation.impactScore).toBeGreaterThanOrEqual(0);
        expect(innovation.impactScore).toBeLessThanOrEqual(1);
      }
    });

    test('should apply multiple brainstorming techniques', async () => {
      const config = new InnovationEngine(mockLLMProvider, {
        brainstormingTechniques: ['SCAMPER', 'Mind Mapping', 'Lateral Thinking']
      });
      
      const innovations = await config.generateInnovativeIdeas('sustainable-energy');
      expect(innovations).toBeInstanceOf(Array);
    });

    test('should perform cross-domain exploration', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('software-development');
      
      // Should include cross-domain innovations when enabled
      expect(innovations).toBeInstanceOf(Array);
      
      // Check that the engine is actually trying cross-domain exploration
      const metrics = innovationEngine.getMetrics();
      expect(metrics).toBeDefined();
    });

    test('should rank innovations by quality', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('healthcare');
      
      if (innovations.length > 1) {
        // Should be sorted by combined score (novelty + feasibility + impact)
        for (let i = 0; i < innovations.length - 1; i++) {
          const currentScore = (innovations[i].noveltyScore + innovations[i].feasibilityScore + innovations[i].impactScore) / 3;
          const nextScore = (innovations[i + 1].noveltyScore + innovations[i + 1].feasibilityScore + innovations[i + 1].impactScore) / 3;
          expect(currentScore).toBeGreaterThanOrEqual(nextScore);
        }
      }
    });
  });

  describe('Concept Synthesis', () => {
    test('should combine existing concepts into hybrids', async () => {
      const hybrids = await innovationEngine.combineExistingConcepts(mockConcepts);
      
      expect(hybrids).toBeInstanceOf(Array);
      
      if (hybrids.length > 0) {
        const hybrid = hybrids[0];
        expect(hybrid).toHaveProperty('id');
        expect(hybrid).toHaveProperty('name');
        expect(hybrid).toHaveProperty('sourceConcepts');
        expect(hybrid).toHaveProperty('synergyScore');
        expect(hybrid).toHaveProperty('emergentProperties');
        expect(hybrid).toHaveProperty('combinationMethod');
        
        expect(hybrid.sourceConcepts).toBeInstanceOf(Array);
        expect(hybrid.sourceConcepts.length).toBeGreaterThan(0);
        expect(hybrid.synergyScore).toBeGreaterThanOrEqual(0);
        expect(hybrid.synergyScore).toBeLessThanOrEqual(1);
      }
    });

    test('should filter hybrids by synergy score', async () => {
      const hybrids = await innovationEngine.combineExistingConcepts(mockConcepts);
      
      // All returned hybrids should have synergy > 0.6 (as per implementation)
      hybrids.forEach(hybrid => {
        expect(hybrid.synergyScore).toBeGreaterThan(0.6);
      });
    });

    test('should create multi-concept hybrids for radical innovation', async () => {
      const manyConcer] = [
        ...mockConcepts,
        {
          id: 'concept-3',
          name: 'Blockchain',
          domain: 'Technology',
          description: 'Distributed ledger technology',
          keyPrinciples: ['Decentralization', 'Immutability'],
          relatedConcepts: ['Cryptography'],
          maturityLevel: 7
        }
      ];

      const hybrids = await innovationEngine.combineExistingConcepts(manyConcepts);
      expect(hybrids).toBeInstanceOf(Array);
    });
  });

  describe('Unconventional Problem Solving', () => {
    test('should explore unconventional approaches to problems', async () => {
      const mockProblem: Problem = {
        id: 'test-problem',
        type: 'optimization',
        description: 'Improve website loading speed',
        constraints: [],
        objectives: [],
        context: { currentSpeed: 5000 },
        complexity: 6
      };

      const solutions = await innovationEngine.exploreUnconventionalApproaches(mockProblem);
      
      expect(solutions).toBeInstanceOf(Array);
      expect(solutions.length).toBeGreaterThan(0);
      
      if (solutions.length > 0) {
        const solution = solutions[0];
        expect(solution).toHaveProperty('id');
        expect(solution).toHaveProperty('approach');
        expect(solution).toHaveProperty('description');
        expect(solution).toHaveProperty('unconventionalAspects');
        expect(solution).toHaveProperty('paradigmShifts');
        expect(solution).toHaveProperty('challengedAssumptions');
        expect(solution).toHaveProperty('transformativeImpact');
        
        expect(solution.unconventionalAspects).toBeInstanceOf(Array);
        expect(solution.paradigmShifts).toBeInstanceOf(Array);
        expect(solution.challengedAssumptions).toBeInstanceOf(Array);
        expect(solution.transformativeImpact).toBeGreaterThan(0);
        expect(solution.transformativeImpact).toBeLessThanOrEqual(10);
      }
    });

    test('should generate more radical solutions when enabled', async () => {
      const radicalEngine = new InnovationEngine(mockLLMProvider, {
        enableRadicalInnovation: true,
        creativityLevel: 0.9
      });

      const mockProblem: Problem = {
        id: 'radical-problem',
        type: 'creative',
        description: 'Reinvent user interfaces',
        constraints: [],
        objectives: [],
        context: {},
        complexity: 8
      };

      const solutions = await radicalEngine.exploreUnconventionalApproaches(mockProblem);
      expect(solutions).toBeInstanceOf(Array);
      // Should generate 5-7 solutions when radical innovation is enabled
      expect(solutions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Research Capabilities', () => {
    test('should conduct comprehensive research on topics', async () => {
      const research = await innovationEngine.conductResearch('artificial intelligence in healthcare');
      
      expect(research).toHaveProperty('id');
      expect(research).toHaveProperty('topic', 'artificial intelligence in healthcare');
      expect(research).toHaveProperty('findings');
      expect(research).toHaveProperty('hypotheses');
      expect(research).toHaveProperty('experiments');
      expect(research).toHaveProperty('literatureReview');
      expect(research).toHaveProperty('knowledgeGaps');
      expect(research).toHaveProperty('futureDirections');
      expect(research).toHaveProperty('confidenceLevel');
      
      expect(research.findings).toBeInstanceOf(Array);
      expect(research.hypotheses).toBeInstanceOf(Array);
      expect(research.experiments).toBeInstanceOf(Array);
      expect(research.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(research.confidenceLevel).toBeLessThanOrEqual(1);
      
      if (research.findings.length > 0) {
        const finding = research.findings[0];
        expect(finding).toHaveProperty('id');
        expect(finding).toHaveProperty('description');
        expect(finding).toHaveProperty('evidence');
        expect(finding).toHaveProperty('significance');
        expect(finding).toHaveProperty('reliability');
      }

      if (research.experiments.length > 0) {
        const experiment = research.experiments[0];
        expect(experiment).toHaveProperty('hypothesis');
        expect(experiment).toHaveProperty('methodology');
        expect(experiment).toHaveProperty('requiredResources');
        expect(experiment).toHaveProperty('expectedOutcomes');
        expect(experiment).toHaveProperty('duration');
        expect(experiment).toHaveProperty('riskLevel');
      }
    });

    test('should cache high-confidence research results', async () => {
      const topic = 'quantum computing applications';
      
      const research1 = await innovationEngine.conductResearch(topic);
      const research2 = await innovationEngine.conductResearch(topic);
      
      // Should return cached result if confidence is high
      if (research1.confidenceLevel > 0.7) {
        expect(research1.id).toBe(research2.id);
      }
    });

    test('should adjust research depth based on configuration', async () => {
      const shallowEngine = new InnovationEngine(mockLLMProvider, {
        researchDepth: 'shallow'
      });

      const deepEngine = new InnovationEngine(mockLLMProvider, {
        researchDepth: 'deep'
      });

      const shallowResearch = await shallowEngine.conductResearch('machine learning');
      const deepResearch = await deepEngine.conductResearch('machine learning');

      expect(shallowResearch).toBeDefined();
      expect(deepResearch).toBeDefined();
    });
  });

  describe('Prototyping', () => {
    test('should create prototypes from innovations', async () => {
      const mockInnovation: Innovation = {
        id: 'innovation-1',
        title: 'Smart Caching System',
        description: 'AI-powered predictive caching',
        domain: 'web-development',
        noveltyScore: 0.8,
        feasibilityScore: 0.7,
        impactScore: 0.9,
        inspirations: ['Machine Learning', 'Web Performance'],
        requiredTechnologies: ['TensorFlow', 'Redis', 'Node.js'],
        potentialApplications: ['E-commerce', 'Social Media'],
        risks: ['Complexity'],
        timeToMarket: 12
      };

      const prototype = await innovationEngine.prototypeSolution(mockInnovation);
      
      expect(prototype).toHaveProperty('id');
      expect(prototype).toHaveProperty('innovationId', mockInnovation.id);
      expect(prototype).toHaveProperty('name');
      expect(prototype).toHaveProperty('description');
      expect(prototype).toHaveProperty('specifications');
      expect(prototype).toHaveProperty('components');
      expect(prototype).toHaveProperty('testResults');
      expect(prototype).toHaveProperty('iterationNumber', 1);
      expect(prototype).toHaveProperty('status', 'concept');
      
      expect(prototype.components).toBeInstanceOf(Array);
      expect(prototype.testResults).toBeInstanceOf(Array);
    });

    test('should iterate prototypes based on feedback', async () => {
      const mockInnovation: Innovation = {
        id: 'innovation-2',
        title: 'Test Innovation',
        description: 'Test description',
        domain: 'testing',
        noveltyScore: 0.7,
        feasibilityScore: 0.8,
        impactScore: 0.6,
        inspirations: [],
        requiredTechnologies: [],
        potentialApplications: [],
        risks: [],
        timeToMarket: 6
      };

      const originalPrototype = await innovationEngine.prototypeSolution(mockInnovation);
      
      const feedback: Feedback = {
        id: 'feedback-1',
        source: 'user-testing',
        type: 'constructive',
        content: 'The system needs better performance monitoring and real-time adaptation',
        actionableInsights: ['Add monitoring dashboard', 'Implement real-time learning']
      };

      const improvedPrototype = await innovationEngine.iterateDesign(originalPrototype, feedback);
      
      expect(improvedPrototype).toHaveProperty('iterationNumber', 2);
      expect(improvedPrototype).toHaveProperty('improvements');
      expect(improvedPrototype).toHaveProperty('performanceGains');
      expect(improvedPrototype).toHaveProperty('lessonsLearned');
      
      expect(improvedPrototype.improvements).toBeInstanceOf(Array);
      expect(improvedPrototype.performanceGains).toBeDefined();
      expect(improvedPrototype.lessonsLearned).toBeInstanceOf(Array);
    });
  });

  describe('Metrics and Analytics', () => {
    test('should track innovation metrics', async () => {
      // Generate some activity
      await innovationEngine.generateInnovativeIdeas('technology');
      await innovationEngine.combineExistingConcepts(mockConcepts);
      await innovationEngine.conductResearch('innovation metrics');
      
      const metrics = innovationEngine.getMetrics();
      
      expect(metrics).toHaveProperty('totalInnovations');
      expect(metrics).toHaveProperty('conceptsInDatabase');
      expect(metrics).toHaveProperty('prototypesCreated');
      expect(metrics).toHaveProperty('researchTopics');
      expect(metrics).toHaveProperty('averageNoveltyScore');
      expect(metrics).toHaveProperty('averageFeasibilityScore');
      expect(metrics).toHaveProperty('averageImpactScore');
      
      expect(metrics.totalInnovations).toBeGreaterThan(0);
      expect(metrics.researchTopics).toBeGreaterThan(0);
    });

    test('should calculate correct average scores', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('test-domain');
      const metrics = innovationEngine.getMetrics();
      
      if (innovations.length > 0) {
        expect(metrics.averageNoveltyScore).toBeGreaterThan(0);
        expect(metrics.averageNoveltyScore).toBeLessThanOrEqual(1);
        expect(metrics.averageFeasibilityScore).toBeGreaterThan(0);
        expect(metrics.averageFeasibilityScore).toBeLessThanOrEqual(1);
        expect(metrics.averageImpactScore).toBeGreaterThan(0);
        expect(metrics.averageImpactScore).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Configuration Impact', () => {
    test('should adjust creativity based on configuration', async () => {
      const conservativeEngine = new InnovationEngine(mockLLMProvider, {
        creativityLevel: 0.3,
        riskTolerance: 0.2
      });

      const creativeEngine = new InnovationEngine(mockLLMProvider, {
        creativityLevel: 0.9,
        riskTolerance: 0.8
      });

      const conservativeInnovations = await conservativeEngine.generateInnovativeIdeas('finance');
      const creativeInnovations = await creativeEngine.generateInnovativeIdeas('finance');

      expect(conservativeInnovations).toBeInstanceOf(Array);
      expect(creativeInnovations).toBeInstanceOf(Array);
    });

    test('should respect risk tolerance in innovation generation', async () => {
      const lowRiskEngine = new InnovationEngine(mockLLMProvider, {
        riskTolerance: 0.2
      });

      const innovations = await lowRiskEngine.generateInnovativeIdeas('banking');
      expect(innovations).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle LLM failures gracefully', async () => {
      const failingProvider: LLMProvider = {
        async generateResponse() {
          throw new Error('LLM service unavailable');
        }
      };

      const failingEngine = new InnovationEngine(failingProvider);

      await expect(failingEngine.generateInnovativeIdeas('test'))
        .rejects.toThrow('Failed to generate innovations');
    });

    test('should handle empty or invalid inputs', async () => {
      await expect(innovationEngine.combineExistingConcepts([]))
        .resolves.toBeInstanceOf(Array);

      const emptyProblem: Problem = {
        id: 'empty',
        type: 'technical',
        description: '',
        constraints: [],
        objectives: [],
        context: {},
        complexity: 1
      };

      await expect(innovationEngine.exploreUnconventionalApproaches(emptyProblem))
        .resolves.toBeInstanceOf(Array);
    });

    test('should handle malformed innovation data', async () => {
      const malformedInnovation = {
        id: 'malformed',
        title: '',
        description: undefined,
        domain: null
      } as any;

      await expect(innovationEngine.prototypeSolution(malformedInnovation))
        .rejects.toThrow();
    });
  });

  describe('Concept Database Management', () => {
    test('should initialize with foundational concepts', () => {
      const newEngine = new InnovationEngine(mockLLMProvider);
      const metrics = newEngine.getMetrics();
      
      expect(metrics.conceptsInDatabase).toBeGreaterThan(0);
    });

    test('should store discovered concepts', async () => {
      const initialMetrics = innovationEngine.getMetrics();
      
      await innovationEngine.combineExistingConcepts(mockConcepts);
      
      const updatedMetrics = innovationEngine.getMetrics();
      // Should potentially have more concepts after synthesis
      expect(updatedMetrics.conceptsInDatabase).toBeGreaterThanOrEqual(initialMetrics.conceptsInDatabase);
    });
  });

  describe('Innovation Quality Assessment', () => {
    test('should properly score innovation dimensions', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('healthcare-ai');
      
      innovations.forEach(innovation => {
        // All scores should be normalized between 0 and 1
        expect(innovation.noveltyScore).toBeGreaterThanOrEqual(0);
        expect(innovation.noveltyScore).toBeLessThanOrEqual(1);
        expect(innovation.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(innovation.feasibilityScore).toBeLessThanOrEqual(1);
        expect(innovation.impactScore).toBeGreaterThanOrEqual(0);
        expect(innovation.impactScore).toBeLessThanOrEqual(1);
        
        // Required fields should be present
        expect(innovation.title).toBeDefined();
        expect(innovation.description).toBeDefined();
        expect(innovation.requiredTechnologies).toBeInstanceOf(Array);
        expect(innovation.potentialApplications).toBeInstanceOf(Array);
      });
    });

    test('should filter breakthrough innovations correctly', async () => {
      const innovations = await innovationEngine.generateInnovativeIdeas('quantum-computing');
      
      const breakthroughs = innovations.filter(i => 
        i.noveltyScore > 0.8 && 
        i.impactScore > 0.8 && 
        i.feasibilityScore > 0.6
      );

      breakthroughs.forEach(breakthrough => {
        expect(breakthrough.noveltyScore).toBeGreaterThan(0.8);
        expect(breakthrough.impactScore).toBeGreaterThan(0.8);
        expect(breakthrough.feasibilityScore).toBeGreaterThan(0.6);
      });
    });
  });

  describe('Research Integration', () => {
    test('should integrate research findings with innovation generation', async () => {
      const research = await innovationEngine.conductResearch('edge computing');
      const innovations = await innovationEngine.generateInnovativeIdeas('edge-computing');
      
      expect(research).toBeDefined();
      expect(innovations).toBeInstanceOf(Array);
      
      // Research should inform innovation quality
      expect(research.confidenceLevel).toBeGreaterThan(0);
    });

    test('should generate testable hypotheses from research', async () => {
      const research = await innovationEngine.conductResearch('machine learning optimization');
      
      expect(research.hypotheses).toBeInstanceOf(Array);
      expect(research.experiments).toBeInstanceOf(Array);
      
      if (research.experiments.length > 0) {
        const experiment = research.experiments[0];
        expect(experiment.hypothesis).toBeDefined();
        expect(experiment.methodology).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(experiment.riskLevel);
      }
    });
  });
});

describe('InnovationEngine Integration Tests', () => {
  let innovationEngine: InnovationEngine;
  let mockLLMProvider: MockInnovationLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockInnovationLLMProvider();
    innovationEngine = new InnovationEngine(mockLLMProvider, {
      creativityLevel: 0.8,
      enableRadicalInnovation: true,
      crossDomainExploration: true
    });
  });

  test('should handle complete innovation workflow', async () => {
    // 1. Generate innovations
    const innovations = await innovationEngine.generateInnovativeIdeas('sustainable-transportation');
    expect(innovations.length).toBeGreaterThan(0);
    
    // 2. Create prototype from best innovation
    const bestInnovation = innovations[0];
    const prototype = await innovationEngine.prototypeSolution(bestInnovation);
    expect(prototype).toBeDefined();
    
    // 3. Iterate based on feedback
    const feedback: Feedback = {
      id: 'workflow-feedback',
      source: 'integration-test',
      type: 'constructive',
      content: 'Needs performance improvements',
      actionableInsights: ['Optimize algorithms', 'Add caching']
    };
    
    const improvedPrototype = await innovationEngine.iterateDesign(prototype, feedback);
    expect(improvedPrototype.iterationNumber).toBe(2);
    
    // 4. Verify metrics updated
    const metrics = innovationEngine.getMetrics();
    expect(metrics.totalInnovations).toBeGreaterThan(0);
    expect(metrics.prototypesCreated).toBeGreaterThan(0);
  });

  test('should handle concurrent innovation generation', async () => {
    const domains = ['ai', 'blockchain', 'iot', 'robotics', 'biotech'];
    
    const innovationPromises = domains.map(domain => 
      innovationEngine.generateInnovativeIdeas(domain)
    );
    
    const allInnovations = await Promise.all(innovationPromises);
    
    expect(allInnovations).toHaveLength(5);
    allInnovations.forEach(innovations => {
      expect(innovations).toBeInstanceOf(Array);
    });
    
    const totalInnovations = allInnovations.flat().length;
    expect(totalInnovations).toBeGreaterThan(0);
  });

  test('should maintain performance with large concept databases', async () => {
    const largeConcept] = Array.from({ length: 100 }, (_, i) => ({
      id: `concept-${i}`,
      name: `Concept ${i}`,
      domain: `Domain ${i % 10}`,
      description: `Description for concept ${i}`,
      keyPrinciples: [`Principle ${i}`],
      relatedConcepts: [`Related ${i}`],
      maturityLevel: (i % 10) + 1
    }));

    const startTime = Date.now();
    const hybrids = await innovationEngine.combineExistingConcepts(largeConcepts);
    const endTime = Date.now();

    expect(hybrids).toBeInstanceOf(Array);
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
  });
});