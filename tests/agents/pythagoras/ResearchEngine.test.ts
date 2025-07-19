/**
 * @jest-environment node
 */

import {
  ResearchEngine,
  LiteratureReview,
  ResearchSource,
  Hypothesis,
  ExperimentDesign,
  MetaAnalysis,
  ResearchInsight,
  ResearchEngineConfig,
  ReviewMethodology,
  QualityAssessmentMethod
} from '../../../src/agents/pythagoras/ResearchEngine';
import { LLMProvider } from '../../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for ResearchEngine tests
class MockResearchEngineLLMProvider implements LLMProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    if (prompt.includes('conduct literature review')) {
      return JSON.stringify({
        sources: [
          {
            id: 'source-1',
            type: 'journal_article',
            title: 'Machine Learning in Healthcare: A Comprehensive Review',
            authors: [
              { name: 'Dr. Smith', affiliation: 'MIT', expertise: ['AI', 'Healthcare'] },
              { name: 'Prof. Johnson', affiliation: 'Stanford', expertise: ['ML', 'Medicine'] }
            ],
            publication: {
              journal: 'Nature Medicine',
              volume: '28',
              issue: '3',
              pages: '245-267',
              year: 2023,
              doi: '10.1038/s41591-023-0001'
            },
            abstract: 'This review examines the current state of machine learning applications in healthcare...',
            keywords: ['machine learning', 'healthcare', 'AI', 'medical diagnosis'],
            methodology: 'Systematic review',
            findings: ['ML improves diagnostic accuracy', 'Implementation challenges exist'],
            limitations: ['Limited real-world validation', 'Bias in training data'],
            qualityScore: 0.92,
            relevanceScore: 0.88,
            citationCount: 156
          }
        ],
        synthesis: {
          themes: ['diagnostic accuracy', 'implementation challenges', 'ethical considerations'],
          gaps: ['long-term outcome studies', 'diverse population validation'],
          trends: ['increasing adoption', 'focus on explainability'],
          consensus: 'ML shows promise but requires careful implementation'
        },
        quality: {
          overall: 0.85,
          methodology: 0.9,
          relevance: 0.8,
          completeness: 0.85
        }
      });
    }

    if (prompt.includes('generate hypotheses')) {
      return JSON.stringify([
        {
          id: 'hyp-1',
          statement: 'Deep learning models will outperform traditional methods in medical image analysis',
          type: 'predictive',
          domain: 'medical_ai',
          rationale: 'Deep learning has shown superior performance in computer vision tasks',
          variables: [
            { name: 'model_type', type: 'categorical', values: ['CNN', 'traditional'] },
            { name: 'accuracy', type: 'continuous', range: [0, 1] }
          ],
          testability: 0.9,
          novelty: 0.7,
          significance: 0.85,
          falsifiability: true,
          assumptions: ['adequate training data', 'proper model architecture'],
          predictions: ['higher accuracy', 'better feature extraction']
        }
      ]);
    }

    if (prompt.includes('design experiment')) {
      return JSON.stringify({
        id: 'exp-1',
        title: 'Comparative Study of ML Models in Medical Diagnosis',
        hypothesis: 'Deep learning models outperform traditional methods',
        methodology: 'randomized_controlled_trial',
        design: {
          type: 'between_subjects',
          groups: ['control', 'treatment'],
          randomization: 'block_randomization',
          blinding: 'double_blind'
        },
        participants: {
          target_population: 'medical professionals',
          sample_size: 200,
          inclusion_criteria: ['5+ years experience', 'radiology specialization'],
          exclusion_criteria: ['prior ML training', 'conflict of interest']
        },
        variables: {
          independent: ['model_type'],
          dependent: ['diagnostic_accuracy', 'time_to_diagnosis'],
          confounding: ['experience_level', 'case_difficulty'],
          control: ['training_standardization', 'case_presentation']
        },
        procedures: [
          'baseline assessment',
          'training phase',
          'testing phase',
          'evaluation phase'
        ],
        analysis_plan: {
          primary_analysis: 'two_sample_t_test',
          secondary_analysis: ['ANOVA', 'regression'],
          effect_size: 'cohens_d',
          power: 0.8,
          alpha: 0.05
        },
        ethical_considerations: [
          'IRB approval required',
          'informed consent',
          'data privacy protection'
        ]
      });
    }

    if (prompt.includes('assess research quality')) {
      return JSON.stringify({
        overall_quality: 0.85,
        methodology_score: 0.9,
        sample_size_adequacy: 0.8,
        bias_assessment: {
          selection_bias: 'low',
          measurement_bias: 'moderate',
          reporting_bias: 'low'
        },
        validity: {
          internal: 0.85,
          external: 0.8,
          construct: 0.9,
          statistical: 0.85
        },
        limitations: [
          'single center study',
          'limited follow-up period'
        ],
        strengths: [
          'rigorous methodology',
          'appropriate sample size'
        ]
      });
    }

    if (prompt.includes('synthesize research findings')) {
      return JSON.stringify({
        main_findings: [
          'ML models show superior performance in most diagnostic tasks',
          'Implementation challenges remain significant',
          'Ethical considerations require careful attention'
        ],
        effect_sizes: [
          { comparison: 'ML vs Traditional', effect: 0.75, confidence: '95% CI: 0.6-0.9' }
        ],
        heterogeneity: {
          statistical: 'I² = 45%',
          clinical: 'moderate',
          methodological: 'low'
        },
        quality_of_evidence: 'moderate',
        certainty: 'moderate confidence',
        implications: [
          'clinical practice guidelines should be updated',
          'training programs need modification'
        ]
      });
    }

    return 'Default research response';
  }
}

describe('ResearchEngine', () => {
  let researchEngine: ResearchEngine;
  let mockLLMProvider: MockResearchEngineLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockResearchEngineLLMProvider();
    researchEngine = new ResearchEngine(mockLLMProvider, {
      maxSourcesPerReview: 100,
      qualityThreshold: 0.7,
      enableCaching: true,
      defaultLanguages: ['en'],
      collaborativeMode: true,
      ethicalReviewRequired: true
    });
  });

  describe('Core Functionality', () => {
    test('should initialize with default configuration', () => {
      const engine = new ResearchEngine(mockLLMProvider);
      expect(engine).toBeInstanceOf(ResearchEngine);
    });

    test('should initialize with custom configuration', () => {
      const config: Partial<ResearchEngineConfig> = {
        maxSourcesPerReview: 50,
        qualityThreshold: 0.8,
        enableCaching: false
      };
      const engine = new ResearchEngine(mockLLMProvider, config);
      expect(engine.getConfig().maxSourcesPerReview).toBe(50);
      expect(engine.getConfig().qualityThreshold).toBe(0.8);
    });

    test('should get current metrics', () => {
      const metrics = researchEngine.getMetrics();
      expect(metrics).toHaveProperty('reviewsCompleted');
      expect(metrics).toHaveProperty('sourcesAnalyzed');
      expect(metrics).toHaveProperty('hypothesesGenerated');
      expect(metrics).toHaveProperty('experimentsDesigned');
      expect(typeof metrics.reviewsCompleted).toBe('number');
    });
  });

  describe('Literature Review', () => {
    test('should conduct comprehensive literature review', async () => {
      const review = await researchEngine.conductLiteratureReview('machine learning in healthcare', {
        maxSources: 25,
        timeRange: { start: new Date('2020-01-01'), end: new Date() },
        qualityThreshold: 0.8
      });

      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('topic');
      expect(review).toHaveProperty('methodology');
      expect(review).toHaveProperty('sources');
      expect(review).toHaveProperty('synthesis');
      expect(review).toHaveProperty('findings');
      expect(review).toHaveProperty('quality');

      expect(review.topic).toBe('machine learning in healthcare');
      expect(Array.isArray(review.sources)).toBe(true);
      expect(Array.isArray(review.findings)).toBe(true);
      expect(review.quality.overall).toBeGreaterThan(0);
    });

    test('should apply systematic review methodology', async () => {
      const methodology: ReviewMethodology = {
        searchStrategy: {
          databases: ['PubMed', 'IEEE', 'ACM'],
          keywords: ['machine learning', 'healthcare', 'AI'],
          searchTerms: ['("machine learning" AND healthcare)', '(AI AND medicine)'],
          timeRange: { start: new Date('2020-01-01'), end: new Date() },
          languageRestrictions: ['en'],
          publicationTypes: ['journal_article', 'conference_paper']
        },
        inclusionCriteria: ['peer-reviewed', 'original research', 'healthcare domain'],
        exclusionCriteria: ['review articles', 'non-English', 'pre-2020'],
        qualityAssessment: {
          criteria: [
            { domain: 'methodology', criterion: 'rigorous design', weight: 0.3, scale: '1-5' },
            { domain: 'sample', criterion: 'adequate size', weight: 0.2, scale: '1-5' }
          ],
          scoringSystem: 'GRADE',
          reviewerAgreement: 0.85
        },
        dataExtraction: {
          extractedFields: ['title', 'authors', 'methodology', 'results'],
          standardization: 'PRISMA guidelines',
          validation: 'dual extraction'
        },
        synthesisApproach: 'systematic'
      };

      const review = await researchEngine.conductSystematicReview(
        'AI in medical diagnosis', methodology
      );

      expect(review.methodology).toEqual(expect.objectContaining({
        synthesisApproach: 'systematic'
      }));
      expect(review.quality.methodology).toBeGreaterThan(0.8);
    });

    test('should assess source quality', async () => {
      const source: ResearchSource = {
        id: 'test-source',
        type: 'journal_article',
        title: 'Test Research Paper',
        authors: [{ name: 'Dr. Test', affiliation: 'Test University', expertise: ['AI'] }],
        publication: { journal: 'Test Journal', year: 2023 },
        abstract: 'Test abstract...',
        keywords: ['test', 'research'],
        methodology: 'experimental',
        findings: ['significant results'],
        limitations: ['small sample'],
        qualityScore: 0,
        relevanceScore: 0,
        citationCount: 50
      };

      const quality = await researchEngine.assessSourceQuality(source);
      expect(quality).toHaveProperty('overall_quality');
      expect(quality).toHaveProperty('methodology_score');
      expect(quality).toHaveProperty('bias_assessment');
      expect(quality.overall_quality).toBeGreaterThan(0);
    });

    test('should filter sources by quality threshold', async () => {
      const sources: ResearchSource[] = [
        { id: '1', qualityScore: 0.9, relevanceScore: 0.8 } as ResearchSource,
        { id: '2', qualityScore: 0.6, relevanceScore: 0.9 } as ResearchSource,
        { id: '3', qualityScore: 0.8, relevanceScore: 0.7 } as ResearchSource
      ];

      const filtered = await researchEngine.filterSourcesByQuality(sources, 0.75);
      expect(filtered.length).toBe(2);
      expect(filtered.every(s => s.qualityScore >= 0.75)).toBe(true);
    });
  });

  describe('Hypothesis Generation', () => {
    test('should generate testable hypotheses', async () => {
      const observations = [
        'ML models show high accuracy in image classification',
        'Traditional methods require expert knowledge',
        'Healthcare professionals prefer interpretable models'
      ];

      const hypotheses = await researchEngine.generateHypotheses('medical AI', {
        basedOn: observations,
        noveltyThreshold: 0.6,
        testabilityRequired: true
      });

      expect(Array.isArray(hypotheses)).toBe(true);
      expect(hypotheses.length).toBeGreaterThan(0);

      hypotheses.forEach(hypothesis => {
        expect(hypothesis).toHaveProperty('id');
        expect(hypothesis).toHaveProperty('statement');
        expect(hypothesis).toHaveProperty('type');
        expect(hypothesis).toHaveProperty('testability');
        expect(hypothesis).toHaveProperty('novelty');
        expect(hypothesis).toHaveProperty('falsifiability');
        expect(hypothesis.testability).toBeGreaterThan(0.6);
        expect(hypothesis.falsifiability).toBe(true);
      });
    });

    test('should validate hypothesis quality', async () => {
      const hypothesis: Hypothesis = {
        id: 'test-hyp',
        statement: 'Deep learning improves diagnostic accuracy',
        type: 'causal',
        domain: 'medical_ai',
        rationale: 'Based on computer vision advances',
        variables: [
          { name: 'model_type', type: 'categorical', values: ['DL', 'traditional'] },
          { name: 'accuracy', type: 'continuous', range: [0, 1] }
        ],
        testability: 0.9,
        novelty: 0.7,
        significance: 0.8,
        falsifiability: true,
        assumptions: ['adequate data', 'proper training'],
        predictions: ['higher accuracy'],
        created: new Date(),
        confidence: 0.75
      };

      const validation = await researchEngine.validateHypothesis(hypothesis);
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('score');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
    });

    test('should rank hypotheses by potential impact', async () => {
      const hypotheses: Hypothesis[] = [
        { id: '1', significance: 0.9, novelty: 0.8, testability: 0.7 } as Hypothesis,
        { id: '2', significance: 0.7, novelty: 0.9, testability: 0.8 } as Hypothesis,
        { id: '3', significance: 0.8, novelty: 0.7, testability: 0.9 } as Hypothesis
      ];

      const ranked = await researchEngine.rankHypotheses(hypotheses);
      expect(ranked.length).toBe(3);
      expect(ranked[0]).toHaveProperty('rank');
      expect(ranked[0]).toHaveProperty('score');
      expect(ranked[0].rank).toBe(1);
    });
  });

  describe('Experiment Design', () => {
    test('should design rigorous experiments', async () => {
      const hypothesis: Hypothesis = {
        id: 'test-hyp',
        statement: 'ML models outperform traditional methods',
        type: 'comparative',
        domain: 'medical_ai',
        variables: [
          { name: 'model_type', type: 'categorical', values: ['ML', 'traditional'] },
          { name: 'accuracy', type: 'continuous', range: [0, 1] }
        ]
      } as Hypothesis;

      const design = await researchEngine.designExperiment(hypothesis);

      expect(design).toHaveProperty('id');
      expect(design).toHaveProperty('title');
      expect(design).toHaveProperty('hypothesis');
      expect(design).toHaveProperty('methodology');
      expect(design).toHaveProperty('design');
      expect(design).toHaveProperty('participants');
      expect(design).toHaveProperty('variables');
      expect(design).toHaveProperty('procedures');
      expect(design).toHaveProperty('analysis_plan');
      expect(design).toHaveProperty('ethical_considerations');

      expect(design.analysis_plan.power).toBeGreaterThan(0.7);
      expect(design.analysis_plan.alpha).toBeLessThanOrEqual(0.05);
    });

    test('should calculate required sample size', async () => {
      const parameters = {
        effect_size: 0.5,
        power: 0.8,
        alpha: 0.05,
        test_type: 'two_sample_t_test'
      };

      const sampleSize = await researchEngine.calculateSampleSize(parameters);
      expect(sampleSize).toHaveProperty('total_n');
      expect(sampleSize).toHaveProperty('per_group');
      expect(sampleSize).toHaveProperty('assumptions');
      expect(sampleSize.total_n).toBeGreaterThan(0);
    });

    test('should assess experimental validity', async () => {
      const design: ExperimentDesign = {
        id: 'test-exp',
        title: 'Test Experiment',
        hypothesis: 'Test hypothesis',
        methodology: 'experimental',
        design: {
          type: 'between_subjects',
          groups: ['control', 'treatment'],
          randomization: 'simple_randomization',
          blinding: 'single_blind'
        }
      } as ExperimentDesign;

      const validity = await researchEngine.assessExperimentalValidity(design);
      expect(validity).toHaveProperty('internal');
      expect(validity).toHaveProperty('external');
      expect(validity).toHaveProperty('construct');
      expect(validity).toHaveProperty('statistical');
      expect(validity.internal).toBeGreaterThan(0);
    });
  });

  describe('Research Synthesis', () => {
    test('should perform meta-analysis', async () => {
      const studies = [
        { id: '1', effect_size: 0.5, sample_size: 100, variance: 0.04 },
        { id: '2', effect_size: 0.7, sample_size: 150, variance: 0.03 },
        { id: '3', effect_size: 0.6, sample_size: 200, variance: 0.02 }
      ];

      const metaAnalysis = await researchEngine.performMetaAnalysis(studies);

      expect(metaAnalysis).toHaveProperty('overall_effect');
      expect(metaAnalysis).toHaveProperty('confidence_interval');
      expect(metaAnalysis).toHaveProperty('heterogeneity');
      expect(metaAnalysis).toHaveProperty('forest_plot_data');
      expect(metaAnalysis).toHaveProperty('publication_bias');

      expect(metaAnalysis.overall_effect).toBeGreaterThan(0);
      expect(metaAnalysis.confidence_interval.lower).toBeLessThan(
        metaAnalysis.confidence_interval.upper
      );
    });

    test('should identify research gaps', async () => {
      const field = 'machine learning in healthcare';
      const existingLiterature = [
        'diagnostic accuracy studies',
        'implementation challenges',
        'ethical considerations'
      ];

      const gaps = await researchEngine.identifyResearchGaps(field, {
        existingLiterature,
        timeFrame: 5,
        includeEmerging: true
      });

      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
      gaps.forEach(gap => {
        expect(gap).toHaveProperty('area');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('priority');
        expect(gap).toHaveProperty('feasibility');
      });
    });

    test('should synthesize findings across studies', async () => {
      const findings = [
        { study: 'Study A', finding: 'ML improves accuracy by 15%', evidence_level: 'high' },
        { study: 'Study B', finding: 'Implementation costs are significant', evidence_level: 'medium' },
        { study: 'Study C', finding: 'User acceptance varies', evidence_level: 'low' }
      ];

      const synthesis = await researchEngine.synthesizeFindings(findings);

      expect(synthesis).toHaveProperty('main_themes');
      expect(synthesis).toHaveProperty('consensus_areas');
      expect(synthesis).toHaveProperty('conflicting_evidence');
      expect(synthesis).toHaveProperty('evidence_quality');
      expect(synthesis).toHaveProperty('implications');

      expect(Array.isArray(synthesis.main_themes)).toBe(true);
    });
  });

  describe('Knowledge Management', () => {
    test('should extract key insights from research', async () => {
      const researchData = {
        sources: [
          { id: '1', findings: ['ML improves accuracy'], methodology: 'RCT' },
          { id: '2', findings: ['Cost-effectiveness unclear'], methodology: 'survey' }
        ],
        patterns: ['increasing accuracy trends', 'implementation barriers'],
        contradictions: ['varying cost assessments']
      };

      const insights = await researchEngine.extractKeyInsights(researchData);

      expect(Array.isArray(insights)).toBe(true);
      insights.forEach(insight => {
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('significance');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('evidence');
      });
    });

    test('should generate research recommendations', async () => {
      const currentState = {
        field: 'AI in healthcare',
        gaps: ['long-term outcomes', 'diverse populations'],
        priorities: ['safety', 'efficacy', 'equity']
      };

      const recommendations = await researchEngine.generateResearchRecommendations(currentState);

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('area');
        expect(rec).toHaveProperty('rationale');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('timeline');
        expect(rec).toHaveProperty('resources_needed');
      });
    });

    test('should track research trends', async () => {
      const field = 'machine learning';
      const timeframe = { start: new Date('2020-01-01'), end: new Date() };

      const trends = await researchEngine.analyzeResearchTrends(field, timeframe);

      expect(trends).toHaveProperty('emerging_topics');
      expect(trends).toHaveProperty('declining_areas');
      expect(trends).toHaveProperty('growth_patterns');
      expect(trends).toHaveProperty('collaboration_networks');
      expect(trends).toHaveProperty('methodology_evolution');

      expect(Array.isArray(trends.emerging_topics)).toBe(true);
    });
  });

  describe('Quality Assurance', () => {
    test('should implement peer review process', async () => {
      const research = {
        id: 'research-1',
        type: 'literature_review',
        methodology: 'systematic',
        findings: ['significant results'],
        limitations: ['small sample']
      };

      const peerReview = await researchEngine.conductPeerReview(research);

      expect(peerReview).toHaveProperty('reviewers');
      expect(peerReview).toHaveProperty('scores');
      expect(peerReview).toHaveProperty('comments');
      expect(peerReview).toHaveProperty('recommendation');
      expect(peerReview).toHaveProperty('consensus');

      expect(Array.isArray(peerReview.reviewers)).toBe(true);
    });

    test('should detect research bias', async () => {
      const study = {
        methodology: 'observational',
        sample: 'convenience_sample',
        conflicts: ['industry_funded'],
        reporting: 'selective_outcomes'
      };

      const biasAssessment = await researchEngine.assessResearchBias(study);

      expect(biasAssessment).toHaveProperty('selection_bias');
      expect(biasAssessment).toHaveProperty('measurement_bias');
      expect(biasAssessment).toHaveProperty('reporting_bias');
      expect(biasAssessment).toHaveProperty('funding_bias');
      expect(biasAssessment).toHaveProperty('overall_risk');

      expect(['low', 'moderate', 'high']).toContain(biasAssessment.overall_risk);
    });

    test('should validate research reproducibility', async () => {
      const study = {
        data_availability: true,
        code_availability: true,
        methodology_detail: 'comprehensive',
        statistical_methods: 'appropriate'
      };

      const reproducibility = await researchEngine.assessReproducibility(study);

      expect(reproducibility).toHaveProperty('score');
      expect(reproducibility).toHaveProperty('criteria_met');
      expect(reproducibility).toHaveProperty('barriers');
      expect(reproducibility).toHaveProperty('recommendations');

      expect(reproducibility.score).toBeGreaterThanOrEqual(0);
      expect(reproducibility.score).toBeLessThanOrEqual(1);
    });
  });

  describe('Collaborative Research', () => {
    test('should facilitate research collaboration', async () => {
      const researchers = [
        { id: 'researcher1', expertise: ['AI', 'healthcare'], affiliation: 'MIT' },
        { id: 'researcher2', expertise: ['statistics', 'medicine'], affiliation: 'Harvard' }
      ];

      const collaboration = await researchEngine.facilitateCollaboration(
        'AI in medical diagnosis', researchers
      );

      expect(collaboration).toHaveProperty('project_structure');
      expect(collaboration).toHaveProperty('role_assignments');
      expect(collaboration).toHaveProperty('communication_plan');
      expect(collaboration).toHaveProperty('timeline');
      expect(collaboration).toHaveProperty('resource_allocation');
    });

    test('should manage research workflows', async () => {
      const project = {
        phases: ['literature_review', 'data_collection', 'analysis', 'writing'],
        timeline: 12, // months
        resources: ['funding', 'personnel', 'equipment']
      };

      const workflow = await researchEngine.createResearchWorkflow(project);

      expect(workflow).toHaveProperty('tasks');
      expect(workflow).toHaveProperty('dependencies');
      expect(workflow).toHaveProperty('milestones');
      expect(workflow).toHaveProperty('deadlines');
      expect(workflow).toHaveProperty('quality_gates');

      expect(Array.isArray(workflow.tasks)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large-scale literature reviews efficiently', async () => {
      const largeTopic = 'artificial intelligence';
      const startTime = Date.now();

      const review = await researchEngine.conductLiteratureReview(largeTopic, {
        maxSources: 50,
        timeRange: { start: new Date('2022-01-01'), end: new Date() }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(review).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should cache research results when enabled', async () => {
      const topic = 'machine learning basics';

      const firstReview = await researchEngine.conductLiteratureReview(topic);
      const secondReview = await researchEngine.conductLiteratureReview(topic);

      // Should return cached results for identical queries
      expect(firstReview.id).toBe(secondReview.id);
    });

    test('should optimize search strategies', async () => {
      const topic = 'deep learning applications';
      const strategy = await researchEngine.optimizeSearchStrategy(topic);

      expect(strategy).toHaveProperty('keywords');
      expect(strategy).toHaveProperty('databases');
      expect(strategy).toHaveProperty('filters');
      expect(strategy).toHaveProperty('estimated_results');

      expect(Array.isArray(strategy.keywords)).toBe(true);
      expect(strategy.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid research topics gracefully', async () => {
      await expect(
        researchEngine.conductLiteratureReview('')
      ).rejects.toThrow('Invalid research topic');
    });

    test('should handle insufficient sources', async () => {
      const topic = 'very_obscure_research_topic_123456';
      
      const review = await researchEngine.conductLiteratureReview(topic);
      expect(review.sources.length).toBe(0);
      expect(review.limitations).toContain('Insufficient sources found');
    });

    test('should validate hypothesis format', async () => {
      const invalidHypothesis = { statement: '' } as Hypothesis;

      await expect(
        researchEngine.validateHypothesis(invalidHypothesis)
      ).rejects.toThrow('Invalid hypothesis format');
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete research workflow', async () => {
      const topic = 'AI in healthcare diagnostics';

      // Literature review
      const review = await researchEngine.conductLiteratureReview(topic);
      expect(review.sources.length).toBeGreaterThan(0);

      // Hypothesis generation
      const hypotheses = await researchEngine.generateHypotheses(topic, {
        basedOn: review.findings.map(f => f.description),
        noveltyThreshold: 0.6
      });
      expect(hypotheses.length).toBeGreaterThan(0);

      // Experiment design
      const experiment = await researchEngine.designExperiment(hypotheses[0]);
      expect(experiment.methodology).toBeDefined();

      // Research synthesis
      const insights = await researchEngine.extractKeyInsights({
        sources: review.sources,
        patterns: ['accuracy improvement'],
        contradictions: []
      });
      expect(insights.length).toBeGreaterThan(0);
    });

    test('should integrate with LLM for advanced research tasks', async () => {
      const complexTopic = 'quantum machine learning applications in drug discovery';

      const analysis = await researchEngine.performAdvancedResearchAnalysis(complexTopic);

      expect(analysis).toHaveProperty('interdisciplinary_connections');
      expect(analysis).toHaveProperty('theoretical_foundations');
      expect(analysis).toHaveProperty('practical_applications');
      expect(analysis).toHaveProperty('future_directions');

      expect(Array.isArray(analysis.interdisciplinary_connections)).toBe(true);
    });
  });
});