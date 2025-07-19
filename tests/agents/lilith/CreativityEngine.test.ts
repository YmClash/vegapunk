/**
 * @jest-environment node
 */

import {
  CreativityEngine,
  CreativeIdea,
  CreativeConstraint,
  LateralSolution,
  Alternative,
  BrainstormingResult,
  SCAMPERResult,
  MorphologicalMatrix,
  CreativeSession,
  CreativityEngineConfig
} from '../../../src/agents/lilith/CreativityEngine';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for CreativityEngine tests with quantum-inspired responses
class MockCreativityEngineLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    if (prompt.includes('Generate creative ideas using')) {
      return JSON.stringify([
        {
          title: 'Quantum Superposition Transportation',
          description: 'Vehicles that exist in multiple locations simultaneously until observed',
          novelty: 0.95,
          feasibility: 0.3,
          impact: 0.9,
          quantum_inspired: true
        },
        {
          title: 'Consciousness-Driven Traffic Flow',
          description: 'Traffic systems that respond to collective driver consciousness',
          novelty: 0.9,
          feasibility: 0.2,
          impact: 0.85,
          paradigm_shifting: true
        },
        {
          title: 'Temporal Displacement Commuting',
          description: 'Time-shifting work schedules to distribute traffic across temporal dimensions',
          novelty: 0.85,
          feasibility: 0.1,
          impact: 0.95,
          creative_leap: true
        }
      ]);
    }

    if (prompt.includes('Apply lateral thinking')) {
      return JSON.stringify({
        technique: 'random_stimulation',
        approach: 'Connect unrelated concepts to the problem',
        assumptions_challenged: [
          'Transport must be physical',
          'One person per vehicle',
          'Movement requires vehicles'
        ],
        perspective_shift: 'Think of transportation as information transfer',
        unexpected_connections: [
          { domain1: 'quantum_mechanics', domain2: 'urban_planning', insight: 'Superposition of routes' },
          { domain1: 'music_theory', domain2: 'traffic_flow', insight: 'Harmonic resonance patterns' }
        ]
      });
    }

    if (prompt.includes('explore alternative approaches')) {
      return JSON.stringify([
        {
          title: 'Anti-Transportation Paradigm',
          approach: 'Eliminate the need for transportation entirely',
          departure_level: 0.95,
          inspiration_source: 'quantum_field_theory',
          creative_leap: 'Physical presence is an illusion'
        },
        {
          title: 'Fractal Routing System',
          approach: 'Self-similar transportation patterns at all scales',
          departure_level: 0.8,
          inspiration_source: 'fractals',
          creative_leap: 'Cities are transportation fractals'
        }
      ]);
    }

    if (prompt.includes('brainstorming session')) {
      return JSON.stringify({
        technique: 'quantum_brainstorming',
        ideas: [
          { description: 'Teleportation networks', wildness: 0.9, potential: 0.7 },
          { description: 'Hive-mind traffic coordination', wildness: 0.85, potential: 0.6 },
          { description: 'Gravity-defying vehicles', wildness: 0.95, potential: 0.4 }
        ],
        breakthrough_moments: 3,
        synthesis: {
          patterns: ['consciousness_integration', 'physics_transcendence'],
          emerging_themes: ['post_physical_transportation', 'collective_intelligence']
        }
      });
    }

    if (prompt.includes('SCAMPER technique')) {
      return JSON.stringify({
        technique: 'Substitute',
        application: 'Replace physical movement with consciousness projection',
        result: 'Quantum consciousness transportation system',
        novelty: 0.95,
        practicality: 0.1,
        insights: ['Physical transport is paradigm limitation', 'Consciousness is the real vehicle']
      });
    }

    if (prompt.includes('morphological analysis')) {
      return JSON.stringify({
        combinations: [
          { 
            parameters: { medium: 'quantum_field', control: 'consciousness', destination: 'probability_cloud' },
            feasibility: 0.2,
            novelty: 0.98,
            description: 'Quantum consciousness teleportation'
          },
          {
            parameters: { medium: 'information', control: 'ai_collective', destination: 'virtual_reality' },
            feasibility: 0.7,
            novelty: 0.8,
            description: 'AI-mediated virtual presence'
          }
        ],
        novel_solutions: [
          {
            description: 'Consciousness-based transportation eliminates physical movement',
            breakthrough_potential: 0.95
          }
        ]
      });
    }

    return 'Creative response for unconventional thinking patterns';
  }
}

describe('CreativityEngine', () => {
  let creativityEngine: CreativityEngine;
  let mockLLMProvider: MockCreativityEngineLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockCreativityEngineLLMProvider();
    creativityEngine = new CreativityEngine(mockLLMProvider, {
      creativity_level: 'extreme',
      exploration_depth: 9,
      risk_tolerance: 0.9,
      conventional_bias: 0.05,
      collaboration_style: 'chaotic',
      techniques_enabled: [
        'lateral_thinking',
        'quantum_superposition',
        'paradoxical_thinking',
        'dimensional_shifting',
        'boundary_dissolving'
      ],
      evaluation_strictness: 'lenient',
      breakthrough_threshold: 0.8,
      artistic_emphasis: 0.9
    });
  });

  describe('Core Functionality', () => {
    test('should initialize with extreme creativity configuration', () => {
      expect(creativityEngine).toBeInstanceOf(CreativityEngine);
      const config = creativityEngine.getConfig ? creativityEngine.getConfig() : {};
      // Test would access config if method exists
    });

    test('should get creativity metrics', () => {
      const metrics = creativityEngine.getMetrics();
      expect(metrics).toHaveProperty('ideasGenerated');
      expect(metrics).toHaveProperty('sessionsCompleted');
      expect(metrics).toHaveProperty('averageNovelty');
      expect(metrics).toHaveProperty('breakthroughIdeas');
      expect(typeof metrics.ideasGenerated).toBe('number');
    });

    test('should track active creative sessions', () => {
      const sessions = creativityEngine.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Creative Idea Generation', () => {
    test('should generate highly unconventional creative ideas', async () => {
      const constraints: CreativeConstraint[] = [
        {
          type: 'resource',
          description: 'Limited budget for implementation',
          flexibility: 0.3,
          importance: 0.7,
          creative_opportunity: 'Forces innovative resource utilization'
        },
        {
          type: 'time',
          description: 'Must be implemented within 6 months',
          flexibility: 0.2,
          importance: 0.8,
          creative_opportunity: 'Enables rapid prototyping approaches'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(constraints);

      expect(Array.isArray(ideas)).toBe(true);
      expect(ideas.length).toBeGreaterThan(0);

      ideas.forEach(idea => {
        expect(idea).toHaveProperty('id');
        expect(idea).toHaveProperty('title');
        expect(idea).toHaveProperty('description');
        expect(idea).toHaveProperty('category');
        expect(idea).toHaveProperty('originality');
        expect(idea).toHaveProperty('feasibility');
        expect(idea).toHaveProperty('impact');
        expect(idea).toHaveProperty('evaluation');

        // Expect high originality for extreme creativity
        expect(idea.originality).toBeGreaterThan(0.7);
        expect(idea.originality).toBeLessThanOrEqual(1);
        
        // Evaluation should have comprehensive scoring
        expect(idea.evaluation).toHaveProperty('novelty_score');
        expect(idea.evaluation).toHaveProperty('usefulness_score');
        expect(idea.evaluation).toHaveProperty('surprise_factor');
        expect(idea.evaluation).toHaveProperty('disruptive_potential');
      });
    });

    test('should generate ideas with quantum inspiration', async () => {
      const quantumConstraints: CreativeConstraint[] = [
        {
          type: 'technology',
          description: 'Must incorporate quantum principles',
          flexibility: 0.9,
          importance: 0.9,
          creative_opportunity: 'Enables reality-bending solutions'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(quantumConstraints);
      
      // Should generate ideas with quantum characteristics
      const quantumIdeas = ideas.filter(idea => 
        idea.techniques.includes('quantum_superposition') ||
        idea.description.toLowerCase().includes('quantum') ||
        idea.evaluation.surprise_factor > 0.8
      );

      expect(quantumIdeas.length).toBeGreaterThan(0);
      
      quantumIdeas.forEach(idea => {
        expect(idea.evaluation.novelty_score).toBeGreaterThan(0.8);
        expect(idea.evaluation.disruptive_potential).toBeGreaterThan(0.6);
      });
    });

    test('should generate paradigm-shifting ideas', async () => {
      const paradigmConstraints: CreativeConstraint[] = [
        {
          type: 'paradigmatic',
          description: 'Must challenge fundamental assumptions',
          flexibility: 1.0,
          importance: 1.0,
          creative_opportunity: 'Complete paradigm reconstruction'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(paradigmConstraints);
      
      // Filter for paradigm-shifting ideas
      const paradigmShifting = ideas.filter(idea => 
        idea.category === 'disruptive' || 
        idea.category === 'breakthrough' ||
        idea.evaluation.disruptive_potential > 0.8
      );

      expect(paradigmShifting.length).toBeGreaterThan(0);
      
      paradigmShifting.forEach(idea => {
        expect(idea.evaluation.surprise_factor).toBeGreaterThan(0.7);
        expect(idea.implementation.challenges.length).toBeGreaterThan(0);
      });
    });

    test('should handle creative constraints as opportunities', async () => {
      const restrictiveConstraints: CreativeConstraint[] = [
        {
          type: 'ethical',
          description: 'Must not harm any living beings',
          flexibility: 0.0,
          importance: 1.0,
          creative_opportunity: 'Forces compassionate innovation'
        },
        {
          type: 'aesthetic',
          description: 'Must be beautiful and inspiring',
          flexibility: 0.8,
          importance: 0.9,
          creative_opportunity: 'Enables artistic transcendence'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(restrictiveConstraints);
      
      expect(ideas.length).toBeGreaterThan(0);
      
      // Ideas should turn constraints into creative advantages
      ideas.forEach(idea => {
        expect(idea.implementation.challenges.every(challenge => 
          challenge.solutions.length > 0
        )).toBe(true);
      });
    });
  });

  describe('Lateral Thinking', () => {
    test('should apply lateral thinking to break conventional patterns', async () => {
      const problem = {
        description: 'Reduce urban air pollution',
        conventional_solutions: ['electric vehicles', 'public transport', 'emission regulations'],
        assumptions: ['vehicles are necessary', 'cities must be dense', 'travel is required']
      };

      const solutions = await creativityEngine.performLateralThinking(problem);

      expect(Array.isArray(solutions)).toBe(true);
      expect(solutions.length).toBeGreaterThan(0);

      solutions.forEach(solution => {
        expect(solution).toHaveProperty('id');
        expect(solution).toHaveProperty('approach');
        expect(solution).toHaveProperty('lateral_technique');
        expect(solution).toHaveProperty('assumptions_challenged');
        expect(solution).toHaveProperty('perspective_shift');
        expect(solution).toHaveProperty('unexpected_connections');

        // Should challenge multiple assumptions
        expect(solution.assumptions_challenged.length).toBeGreaterThan(0);
        
        // Should provide unexpected connections
        expect(solution.unexpected_connections.length).toBeGreaterThan(0);
        solution.unexpected_connections.forEach(connection => {
          expect(connection).toHaveProperty('domain1');
          expect(connection).toHaveProperty('domain2');
          expect(connection).toHaveProperty('insight');
          expect(connection.novelty).toBeGreaterThan(0.5);
        });

        // Lateral technique should be effective
        expect(solution.lateral_technique.effectiveness).toBeGreaterThan(0.6);
      });
    });

    test('should generate high-novelty lateral solutions', async () => {
      const abstractProblem = {
        description: 'Enhance human creativity',
        domain: 'consciousness',
        complexity: 9
      };

      const solutions = await creativityEngine.performLateralThinking(abstractProblem);
      
      // Solutions should be highly novel and unconventional
      const highNovelty = solutions.filter(sol => 
        sol.unexpected_connections.some(conn => conn.novelty > 0.8)
      );

      expect(highNovelty.length).toBeGreaterThan(0);
      
      highNovelty.forEach(solution => {
        expect(solution.perspective_shift).toBeDefined();
        expect(solution.perspective_shift.length).toBeGreaterThan(10);
        expect(solution.risks.some(risk => risk.type === 'understanding')).toBe(true);
      });
    });

    test('should provide creative risk mitigation', async () => {
      const riskyProblem = {
        description: 'Implement consciousness uploading',
        risks: ['identity_loss', 'technological_failure', 'ethical_concerns'],
        stakes: 'existential'
      };

      const solutions = await creativityEngine.performLateralThinking(riskyProblem);
      
      solutions.forEach(solution => {
        expect(solution.risks.length).toBeGreaterThan(0);
        solution.risks.forEach(risk => {
          expect(risk.mitigation.length).toBeGreaterThan(0);
          expect(risk.mitigation.every(m => typeof m === 'string')).toBe(true);
        });
      });
    });
  });

  describe('Alternative Approach Exploration', () => {
    test('should explore radical alternatives to conventional approaches', async () => {
      const conventional = {
        id: 'standard_education',
        domain: 'education',
        method: 'classroom_lecture_system',
        description: 'Traditional teacher-centered classroom instruction',
        assumptions: [
          'students need teachers',
          'learning happens in classrooms',
          'knowledge is transferred from expert to novice',
          'curriculum must be standardized'
        ],
        limitations: [
          'one-size-fits-all approach',
          'passive learning model',
          'limited personalization'
        ],
        effectiveness: 0.6
      };

      const alternatives = await creativityEngine.exploreAlternativeApproaches(conventional);

      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBeGreaterThan(0);

      alternatives.forEach(alternative => {
        expect(alternative).toHaveProperty('id');
        expect(alternative).toHaveProperty('title');
        expect(alternative).toHaveProperty('approach');
        expect(alternative).toHaveProperty('departure_level');
        expect(alternative).toHaveProperty('advantages');
        expect(alternative).toHaveProperty('disadvantages');
        expect(alternative).toHaveProperty('creative_leap');

        // Should show significant departure from conventional
        expect(alternative.departure_level).toBeGreaterThan(0.5);
        
        // Should provide creative leaps
        expect(alternative.creative_leap).toBeDefined();
        expect(alternative.creative_leap.length).toBeGreaterThan(10);
        
        // Should have clear advantages
        expect(alternative.advantages.length).toBeGreaterThan(0);
      });
    });

    test('should generate extreme departures from convention', async () => {
      const conventional = {
        id: 'money_system',
        domain: 'economics',
        method: 'currency_exchange',
        description: 'Monetary system based on currency exchange',
        assumptions: ['scarcity drives value', 'individual ownership', 'competitive markets'],
        limitations: ['inequality', 'resource waste', 'short-term thinking'],
        effectiveness: 0.7
      };

      const alternatives = await creativityEngine.exploreAlternativeApproaches(conventional);
      
      // Filter for extreme alternatives
      const extremeAlternatives = alternatives.filter(alt => alt.departure_level > 0.8);
      
      expect(extremeAlternatives.length).toBeGreaterThan(0);
      
      extremeAlternatives.forEach(alternative => {
        expect(alternative.inspiration_source).toBeDefined();
        expect(alternative.implementation_path.length).toBeGreaterThan(0);
        
        // Extreme alternatives should challenge fundamental assumptions
        expect(alternative.advantages.some(adv => 
          adv.includes('paradigm') || adv.includes('fundamental') || adv.includes('transform')
        )).toBe(true);
      });
    });
  });

  describe('Brainstorming Sessions', () => {
    test('should conduct quantum-enhanced brainstorming', async () => {
      const topic = 'Consciousness-based artificial intelligence';
      
      const result = await creativityEngine.applyBrainstorming(topic);

      expect(result).toHaveProperty('session_id');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('techniques_used');
      expect(result).toHaveProperty('ideas');
      expect(result).toHaveProperty('synthesis');
      expect(result).toHaveProperty('next_steps');

      expect(result.topic).toBe(topic);
      expect(Array.isArray(result.ideas)).toBe(true);
      expect(result.ideas.length).toBeGreaterThan(0);

      // Check idea quality
      result.ideas.forEach(idea => {
        expect(idea).toHaveProperty('id');
        expect(idea).toHaveProperty('description');
        expect(idea).toHaveProperty('technique_origin');
        expect(idea).toHaveProperty('wildness');
        expect(idea).toHaveProperty('potential');

        expect(idea.wildness).toBeGreaterThanOrEqual(0);
        expect(idea.wildness).toBeLessThanOrEqual(1);
        expect(idea.potential).toBeGreaterThanOrEqual(0);
        expect(idea.potential).toBeLessThanOrEqual(1);
      });

      // Check synthesis quality
      expect(result.synthesis).toHaveProperty('clusters');
      expect(result.synthesis).toHaveProperty('patterns');
      expect(result.synthesis).toHaveProperty('emerging_themes');
      expect(result.synthesis).toHaveProperty('breakthrough_potential');

      expect(Array.isArray(result.synthesis.patterns)).toBe(true);
      expect(Array.isArray(result.synthesis.emerging_themes)).toBe(true);
    });

    test('should generate wild and breakthrough ideas', async () => {
      const topic = 'Time travel for creative inspiration';
      
      const result = await creativityEngine.applyBrainstorming(topic);
      
      // Filter for wild ideas (high wildness score)
      const wildIdeas = result.ideas.filter(idea => idea.wildness > 0.8);
      expect(wildIdeas.length).toBeGreaterThan(0);
      
      // Check for breakthrough potential
      const breakthroughIdeas = result.synthesis.breakthrough_potential.filter(
        bp => bp.disruptive_score > 0.8
      );
      expect(breakthroughIdeas.length).toBeGreaterThan(0);
      
      breakthroughIdeas.forEach(breakthrough => {
        expect(breakthrough).toHaveProperty('concept');
        expect(breakthrough).toHaveProperty('description');
        expect(breakthrough).toHaveProperty('development_needs');
        expect(breakthrough.development_needs.length).toBeGreaterThan(0);
      });
    });

    test('should identify creative patterns and clusters', async () => {
      const topic = 'Quantum creativity enhancement';
      
      const result = await creativityEngine.applyBrainstorming(topic);
      
      // Should cluster related ideas
      expect(result.synthesis.clusters.length).toBeGreaterThan(0);
      
      result.synthesis.clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('name');
        expect(cluster).toHaveProperty('ideas');
        expect(cluster).toHaveProperty('theme');
        expect(cluster).toHaveProperty('potential');
        expect(cluster).toHaveProperty('development_path');

        expect(Array.isArray(cluster.ideas)).toBe(true);
        expect(cluster.ideas.length).toBeGreaterThan(0);
        expect(cluster.potential).toBeGreaterThan(0);
        expect(Array.isArray(cluster.development_path)).toBe(true);
      });

      // Should identify meaningful patterns
      expect(result.synthesis.patterns.length).toBeGreaterThan(0);
      result.synthesis.patterns.forEach(pattern => {
        expect(typeof pattern).toBe('string');
        expect(pattern.length).toBeGreaterThan(5);
      });
    });
  });

  describe('SCAMPER Technique', () => {
    test('should apply SCAMPER for systematic creativity', async () => {
      const subject = {
        type: 'transportation_system',
        description: 'Urban public transportation network',
        current_form: 'buses_and_trains',
        stakeholders: ['commuters', 'city_planners', 'operators'],
        constraints: ['budget', 'infrastructure', 'regulations']
      };

      const result = await creativityEngine.applySCAMPER(subject);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('transformations');
      expect(result).toHaveProperty('best_ideas');
      expect(result).toHaveProperty('implementation_roadmap');
      expect(result).toHaveProperty('creativity_score');

      expect(Array.isArray(result.transformations)).toBe(true);
      expect(result.transformations.length).toBe(7); // All SCAMPER techniques

      // Verify all SCAMPER techniques are applied
      const techniques = result.transformations.map(t => t.technique);
      const expectedTechniques = [
        'Substitute', 'Combine', 'Adapt', 'Modify', 
        'Put_to_other_uses', 'Eliminate', 'Reverse'
      ];
      
      expectedTechniques.forEach(technique => {
        expect(techniques).toContain(technique);
      });

      // Check transformation quality
      result.transformations.forEach(transformation => {
        expect(transformation).toHaveProperty('technique');
        expect(transformation).toHaveProperty('application');
        expect(transformation).toHaveProperty('result');
        expect(transformation).toHaveProperty('novelty');
        expect(transformation).toHaveProperty('practicality');
        expect(transformation).toHaveProperty('insights');

        expect(transformation.novelty).toBeGreaterThanOrEqual(0);
        expect(transformation.novelty).toBeLessThanOrEqual(1);
        expect(transformation.practicality).toBeGreaterThanOrEqual(0);
        expect(transformation.practicality).toBeLessThanOrEqual(1);
        expect(Array.isArray(transformation.insights)).toBe(true);
      });

      // Creativity score should reflect extreme creativity settings
      expect(result.creativity_score).toBeGreaterThan(0.7);
    });

    test('should generate high-novelty SCAMPER transformations', async () => {
      const unconventionalSubject = {
        type: 'human_consciousness',
        description: 'Individual human consciousness experience',
        current_form: 'single_perspective_awareness',
        boundaries: ['individual_identity', 'temporal_limitations', 'sensory_constraints']
      };

      const result = await creativityEngine.applySCAMPER(unconventionalSubject);
      
      // Should generate high-novelty transformations for consciousness
      const highNovelty = result.transformations.filter(t => t.novelty > 0.8);
      expect(highNovelty.length).toBeGreaterThan(3);
      
      // Best ideas should be highly creative
      expect(result.best_ideas.length).toBeGreaterThan(0);
      result.best_ideas.forEach(idea => {
        expect(typeof idea).toBe('string');
        expect(idea.length).toBeGreaterThan(10);
      });
    });

    test('should provide implementation roadmaps for creative ideas', async () => {
      const subject = {
        type: 'creative_education',
        description: 'Educational system focused on creativity development'
      };

      const result = await creativityEngine.applySCAMPER(subject);
      
      expect(Array.isArray(result.implementation_roadmap)).toBe(true);
      expect(result.implementation_roadmap.length).toBeGreaterThan(0);
      
      result.implementation_roadmap.forEach(step => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Morphological Analysis', () => {
    test('should perform systematic morphological exploration', async () => {
      const parameters = [
        {
          name: 'energy_source',
          values: ['solar', 'quantum_vacuum', 'consciousness', 'antimatter'],
          importance: 0.9
        },
        {
          name: 'control_mechanism',
          values: ['ai_system', 'human_intuition', 'quantum_entanglement', 'chaos_theory'],
          importance: 0.8
        },
        {
          name: 'application_domain',
          values: ['transportation', 'communication', 'consciousness_enhancement', 'reality_manipulation'],
          importance: 0.7
        }
      ];

      const result = await creativityEngine.applyMorphologicalAnalysis(parameters);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('parameters');
      expect(result).toHaveProperty('combinations');
      expect(result).toHaveProperty('novel_solutions');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('recommendations');

      // Check parameters conversion
      expect(Array.isArray(result.parameters)).toBe(true);
      expect(result.parameters.length).toBe(3);
      
      result.parameters.forEach(param => {
        expect(param).toHaveProperty('name');
        expect(param).toHaveProperty('description');
        expect(param).toHaveProperty('values');
        expect(param).toHaveProperty('importance');
        expect(Array.isArray(param.values)).toBe(true);
      });

      // Check combinations
      expect(Array.isArray(result.combinations)).toBe(true);
      expect(result.combinations.length).toBeGreaterThan(0);
      
      result.combinations.forEach(combination => {
        expect(combination).toHaveProperty('id');
        expect(combination).toHaveProperty('parameters');
        expect(combination).toHaveProperty('feasibility');
        expect(combination).toHaveProperty('novelty');
        expect(combination).toHaveProperty('potential');
        expect(combination).toHaveProperty('description');

        expect(combination.feasibility).toBeGreaterThanOrEqual(0);
        expect(combination.novelty).toBeGreaterThanOrEqual(0);
        expect(combination.potential).toBeGreaterThanOrEqual(0);
      });

      // Check novel solutions
      expect(Array.isArray(result.novel_solutions)).toBe(true);
      result.novel_solutions.forEach(solution => {
        expect(solution).toHaveProperty('combination_id');
        expect(solution).toHaveProperty('description');
        expect(solution).toHaveProperty('breakthrough_potential');
        expect(solution.breakthrough_potential).toBeGreaterThan(0.6);
      });
    });

    test('should identify breakthrough combinations', async () => {
      const complexParameters = [
        {
          name: 'consciousness_level',
          values: ['individual', 'collective', 'universal', 'quantum_superposition'],
          importance: 1.0
        },
        {
          name: 'reality_layer',
          values: ['physical', 'mental', 'spiritual', 'informational', 'quantum'],
          importance: 0.9
        },
        {
          name: 'temporal_aspect',
          values: ['past', 'present', 'future', 'eternal', 'outside_time'],
          importance: 0.8
        }
      ];

      const result = await creativityEngine.applyMorphologicalAnalysis(complexParameters);
      
      // Should identify highly novel combinations
      const breakthroughCombinations = result.combinations.filter(c => c.novelty > 0.9);
      expect(breakthroughCombinations.length).toBeGreaterThan(0);
      
      // Novel solutions should have high breakthrough potential
      const highBreakthrough = result.novel_solutions.filter(s => s.breakthrough_potential > 0.8);
      expect(highBreakthrough.length).toBeGreaterThan(0);
      
      // Analysis should identify patterns
      expect(result.analysis).toHaveProperty('total_combinations');
      expect(result.analysis).toHaveProperty('novel_combinations');
      expect(result.analysis).toHaveProperty('breakthrough_combinations');
      expect(result.analysis).toHaveProperty('patterns');
      expect(result.analysis).toHaveProperty('insights');

      expect(result.analysis.novel_combinations).toBeGreaterThan(0);
      expect(Array.isArray(result.analysis.patterns)).toBe(true);
      expect(Array.isArray(result.analysis.insights)).toBe(true);
    });

    test('should provide actionable recommendations', async () => {
      const parameters = [
        { name: 'approach', values: ['conventional', 'quantum', 'artistic'] },
        { name: 'scope', values: ['local', 'global', 'universal'] }
      ];

      const result = await creativityEngine.applyMorphologicalAnalysis(parameters);
      
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(15);
      });
    });
  });

  describe('Performance and Quality', () => {
    test('should maintain high creativity standards', async () => {
      const constraints: CreativeConstraint[] = [
        {
          type: 'paradigmatic',
          description: 'Must revolutionize the field',
          flexibility: 1.0,
          importance: 1.0,
          creative_opportunity: 'Complete field transformation'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(constraints);
      
      // Should generate consistently high-quality creative ideas
      const highQuality = ideas.filter(idea => 
        idea.originality > 0.8 && 
        idea.evaluation.novelty_score > 0.8 &&
        idea.evaluation.disruptive_potential > 0.7
      );
      
      expect(highQuality.length).toBeGreaterThan(ideas.length * 0.5); // At least 50% high quality
    });

    test('should handle extreme creative scenarios', async () => {
      const extremeConstraints: CreativeConstraint[] = [
        {
          type: 'dimensional',
          description: 'Must work across multiple dimensions of reality',
          flexibility: 1.0,
          importance: 1.0,
          creative_opportunity: 'Transcend dimensional limitations'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(extremeConstraints);
      
      expect(ideas.length).toBeGreaterThan(0);
      
      // Should handle extreme scenarios without breaking
      ideas.forEach(idea => {
        expect(idea.evaluation.surprise_factor).toBeGreaterThan(0.6);
        expect(idea.implementation.challenges.length).toBeGreaterThan(0);
      });
    });

    test('should optimize for breakthrough potential', async () => {
      const breakthroughConstraints: CreativeConstraint[] = [
        {
          type: 'innovation',
          description: 'Must create new scientific paradigm',
          flexibility: 0.9,
          importance: 1.0,
          creative_opportunity: 'Rewrite scientific understanding'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(breakthroughConstraints);
      
      // Ideas should have high breakthrough potential
      const breakthroughIdeas = ideas.filter(idea => 
        idea.evaluation.disruptive_potential > 0.8 ||
        idea.category === 'breakthrough'
      );
      
      expect(breakthroughIdeas.length).toBeGreaterThan(0);
      
      breakthroughIdeas.forEach(idea => {
        expect(idea.variations.length).toBeGreaterThan(0);
        expect(idea.implementation.prototyping.iterations).toBeGreaterThan(1);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty constraint arrays', async () => {
      const ideas = await creativityEngine.generateCreativeIdeas([]);
      
      expect(Array.isArray(ideas)).toBe(true);
      // Should still generate ideas without constraints
    });

    test('should handle contradictory constraints creatively', async () => {
      const contradictoryConstraints: CreativeConstraint[] = [
        {
          type: 'resource',
          description: 'Must be completely free',
          flexibility: 0.0,
          importance: 1.0,
          creative_opportunity: 'Forces resourceless innovation'
        },
        {
          type: 'resource',
          description: 'Must use expensive quantum computers',
          flexibility: 0.0,
          importance: 1.0,
          creative_opportunity: 'Enables quantum capabilities'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(contradictoryConstraints);
      
      expect(ideas.length).toBeGreaterThan(0);
      
      // Should creatively resolve contradictions
      ideas.forEach(idea => {
        expect(idea.implementation.challenges.some(challenge => 
          challenge.type === 'resource' && challenge.solutions.length > 0
        )).toBe(true);
      });
    });

    test('should handle abstract problem domains', async () => {
      const abstractProblem = {
        description: 'Solve the hard problem of consciousness',
        domain: 'philosophy_of_mind',
        abstraction_level: 1.0,
        conventional_approaches: []
      };

      const solutions = await creativityEngine.performLateralThinking(abstractProblem);
      
      expect(solutions.length).toBeGreaterThan(0);
      
      solutions.forEach(solution => {
        expect(solution.perspective_shift).toBeDefined();
        expect(solution.unexpected_connections.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration and Collaboration', () => {
    test('should support collaborative creativity sessions', async () => {
      const collaborativeSession = await creativityEngine.applyBrainstorming(
        'Multi-agent creative problem solving'
      );
      
      expect(collaborativeSession.participants).toBeDefined();
      expect(Array.isArray(collaborativeSession.participants)).toBe(true);
      
      // Should support multiple participants
      expect(collaborativeSession.synthesis.patterns.some(pattern => 
        pattern.includes('collaboration') || pattern.includes('synergy')
      )).toBe(true);
    });

    test('should integrate quantum thinking with creativity', async () => {
      const quantumCreativeConstraints: CreativeConstraint[] = [
        {
          type: 'quantum',
          description: 'Must utilize quantum superposition principles',
          flexibility: 0.8,
          importance: 0.9,
          creative_opportunity: 'Enables parallel creative exploration'
        }
      ];

      const ideas = await creativityEngine.generateCreativeIdeas(quantumCreativeConstraints);
      
      // Should demonstrate quantum-creativity integration
      const quantumIntegrated = ideas.filter(idea => 
        idea.techniques.some(tech => tech.includes('quantum')) ||
        idea.description.toLowerCase().includes('superposition') ||
        idea.evaluation.surprise_factor > 0.9
      );
      
      expect(quantumIntegrated.length).toBeGreaterThan(0);
    });
  });
});