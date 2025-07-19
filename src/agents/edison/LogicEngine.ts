/**
 * Logic Engine Component for Edison Agent
 * Advanced logical reasoning and inference engine
 * Specializing in deductive, inductive, abductive reasoning, and complex logical analysis
 */

import { createLogger } from '@utils/logger';
import { LLMProvider } from '@utils/llm/SimpleLLMProvider';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('LogicEngine');

export interface Premise {
  id: string;
  statement: string;
  truthValue: boolean | 'unknown';
  confidence: number; // 0-1
  source: string;
  type: 'axiom' | 'assumption' | 'fact' | 'hypothesis';
}

export interface Conclusion {
  id: string;
  statement: string;
  derivedFrom: string[]; // premise IDs
  inferenceMethod: 'deduction' | 'induction' | 'abduction';
  confidence: number; // 0-1
  logicalSteps: LogicalStep[];
  validity: 'valid' | 'invalid' | 'uncertain';
}

export interface LogicalStep {
  id: string;
  order: number;
  operation: string;
  input: string[];
  output: string;
  rule: string;
  justification: string;
}

export interface Observation {
  id: string;
  description: string;
  context: Record<string, any>;
  timestamp: Date;
  reliability: number; // 0-1
  category: string;
}

export interface GeneralRule {
  id: string;
  rule: string;
  domain: string;
  derivedFromObservations: string[];
  confidence: number; // 0-1
  exceptions: string[];
  applicabilityConditions: string[];
}

export interface Evidence {
  id: string;
  description: string;
  type: 'empirical' | 'theoretical' | 'anecdotal' | 'statistical';
  strength: number; // 0-1
  source: string;
  relevance: number; // 0-1
}

export interface Hypothesis {
  id: string;
  statement: string;
  explanation: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  plausibility: number; // 0-1
  testable: boolean;
  predictions: string[];
}

export interface Statement {
  id: string;
  content: string;
  logicalForm: string;
  domain: string;
  truthValue?: boolean;
  dependencies: string[];
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  inconsistencies: Inconsistency[];
  consistencyScore: number; // 0-1
  resolutionSuggestions: string[];
}

export interface Inconsistency {
  statements: string[];
  type: 'contradiction' | 'paradox' | 'circular' | 'ambiguity';
  severity: 'minor' | 'major' | 'critical';
  description: string;
}

export interface Argument {
  id: string;
  premises: Premise[];
  conclusion: string;
  structure: ArgumentStructure;
  strengthScore: number; // 0-1
}

export interface ArgumentStructure {
  type: 'deductive' | 'inductive' | 'analogical' | 'causal';
  pattern: string;
  steps: string[];
}

export interface Fallacy {
  id: string;
  type: string;
  name: string;
  description: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  correction: string;
}

export interface Contradiction {
  id: string;
  statements: Statement[];
  type: 'direct' | 'indirect' | 'semantic' | 'pragmatic';
  context: string;
  severity: number; // 1-10
}

export interface Resolution {
  contradictionId: string;
  method: 'disambiguation' | 'prioritization' | 'synthesis' | 'rejection';
  resolvedStatements: Statement[];
  explanation: string;
  confidence: number; // 0-1
}

export interface LogicEngineConfig {
  reasoningDepth: number; // 1-10
  strictnessLevel: 'lenient' | 'moderate' | 'strict';
  enableProbabilisticReasoning: boolean;
  enableModalLogic: boolean;
  enableTemporalLogic: boolean;
  fallacyDetectionSensitivity: number; // 0-1
}

export class LogicEngine {
  private readonly config: LogicEngineConfig;
  private readonly llmProvider: LLMProvider;
  private knowledgeBase: Map<string, Statement>;
  private inferenceCache: Map<string, Conclusion>;
  private hypothesisRegistry: Map<string, Hypothesis>;
  private ruleDatabase: Map<string, GeneralRule>;

  constructor(llmProvider: LLMProvider, config?: Partial<LogicEngineConfig>) {
    this.llmProvider = llmProvider;
    this.config = {
      reasoningDepth: 7,
      strictnessLevel: 'strict',
      enableProbabilisticReasoning: true,
      enableModalLogic: true,
      enableTemporalLogic: true,
      fallacyDetectionSensitivity: 0.8,
      ...config
    };
    
    this.knowledgeBase = new Map();
    this.inferenceCache = new Map();
    this.hypothesisRegistry = new Map();
    this.ruleDatabase = new Map();
    
    this.initializeLogicalRules();
  }

  /**
   * Perform deductive reasoning from premises
   */
  public async performDeductiveReasoning(premises: Premise[]): Promise<Conclusion[]> {
    logger.info(`Performing deductive reasoning with ${premises.length} premises`);
    
    const conclusions: Conclusion[] = [];
    
    try {
      // Apply syllogistic reasoning
      const syllogisticConclusions = await this.applySyllogisticReasoning(premises);
      conclusions.push(...syllogisticConclusions);
      
      // Apply propositional logic
      const propositionalConclusions = await this.applyPropositionalLogic(premises);
      conclusions.push(...propositionalConclusions);
      
      // Apply predicate logic if enabled
      if (this.config.reasoningDepth >= 5) {
        const predicateConclusions = await this.applyPredicateLogic(premises);
        conclusions.push(...predicateConclusions);
      }
      
      // Apply modal logic if enabled
      if (this.config.enableModalLogic) {
        const modalConclusions = await this.applyModalLogic(premises);
        conclusions.push(...modalConclusions);
      }
      
      // Cache valid conclusions
      conclusions.forEach(conclusion => {
        if (conclusion.validity === 'valid') {
          this.inferenceCache.set(conclusion.id, conclusion);
        }
      });
      
      logger.info(`Derived ${conclusions.length} conclusions`);
      return conclusions;
    } catch (error) {
      logger.error('Deductive reasoning failed:', error);
      throw new Error(`Failed to perform deductive reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform inductive reasoning from observations
   */
  public async performInductiveReasoning(observations: Observation[]): Promise<GeneralRule[]> {
    logger.info(`Performing inductive reasoning with ${observations.length} observations`);
    
    try {
      // Group observations by category
      const categorizedObservations = this.categorizeObservations(observations);
      const rules: GeneralRule[] = [];
      
      for (const [category, categoryObs] of categorizedObservations.entries()) {
        const prompt = `Perform inductive reasoning on these observations:
Category: ${category}
Observations: ${JSON.stringify(categoryObs.map(o => o.description), null, 2)}

Derive general rules that:
1. Explain the patterns in observations
2. Are as general as possible while remaining accurate
3. Include confidence levels (0-1)
4. Note any exceptions
5. Specify applicability conditions

Consider:
- Statistical significance
- Causal relationships
- Correlation vs causation
- Sample size and diversity

Format as JSON array of rules.`;

        const response = await this.llmProvider.generateResponse(prompt, {
          temperature: 0.6,
          maxTokens: 1200
        });

        const categoryRules = this.parseGeneralRules(response, categoryObs);
        rules.push(...categoryRules);
      }
      
      // Store high-confidence rules
      rules.forEach(rule => {
        if (rule.confidence > 0.7) {
          this.ruleDatabase.set(rule.id, rule);
        }
      });
      
      logger.info(`Induced ${rules.length} general rules`);
      return rules;
    } catch (error) {
      logger.error('Inductive reasoning failed:', error);
      throw new Error(`Failed to perform inductive reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform abductive reasoning from evidence
   */
  public async performAbductiveReasoning(evidence: Evidence[]): Promise<Hypothesis[]> {
    logger.info(`Performing abductive reasoning with ${evidence.length} pieces of evidence`);
    
    try {
      const prompt = `Perform abductive reasoning to generate explanatory hypotheses:
Evidence: ${JSON.stringify(evidence.map(e => ({
        description: e.description,
        type: e.type,
        strength: e.strength
      })), null, 2)}

Generate hypotheses that:
1. Best explain all the evidence
2. Are plausible and testable
3. Make specific predictions
4. Consider alternative explanations
5. Account for evidence strength and reliability

Use inference to the best explanation.
Assign plausibility scores (0-1).

Format as JSON array of hypotheses.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 1500
      });

      const hypotheses = this.parseHypotheses(response, evidence);
      
      // Rank by plausibility and explanatory power
      const rankedHypotheses = this.rankHypotheses(hypotheses, evidence);
      
      // Store plausible hypotheses
      rankedHypotheses.forEach(hypothesis => {
        if (hypothesis.plausibility > 0.6) {
          this.hypothesisRegistry.set(hypothesis.id, hypothesis);
        }
      });
      
      logger.info(`Generated ${rankedHypotheses.length} hypotheses`);
      return rankedHypotheses;
    } catch (error) {
      logger.error('Abductive reasoning failed:', error);
      throw new Error(`Failed to perform abductive reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate logical consistency of statements
   */
  public async validateLogicalConsistency(statements: Statement[]): Promise<ConsistencyCheck> {
    logger.info(`Validating consistency of ${statements.length} statements`);
    
    try {
      const inconsistencies: Inconsistency[] = [];
      
      // Check for direct contradictions
      const directContradictions = await this.findDirectContradictions(statements);
      inconsistencies.push(...directContradictions);
      
      // Check for indirect contradictions
      const indirectContradictions = await this.findIndirectContradictions(statements);
      inconsistencies.push(...indirectContradictions);
      
      // Check for circular reasoning
      const circularities = await this.detectCircularReasoning(statements);
      inconsistencies.push(...circularities);
      
      // Use LLM for semantic consistency check
      const semanticInconsistencies = await this.checkSemanticConsistency(statements);
      inconsistencies.push(...semanticInconsistencies);
      
      const consistencyScore = this.calculateConsistencyScore(statements.length, inconsistencies);
      const resolutionSuggestions = await this.generateResolutionSuggestions(inconsistencies);
      
      const result: ConsistencyCheck = {
        isConsistent: inconsistencies.length === 0,
        inconsistencies,
        consistencyScore,
        resolutionSuggestions
      };
      
      logger.info(`Consistency check complete. Score: ${consistencyScore}`);
      return result;
    } catch (error) {
      logger.error('Consistency validation failed:', error);
      throw new Error(`Failed to validate consistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect logical fallacies in an argument
   */
  public async detectLogicalFallacies(argument: Argument): Promise<Fallacy[]> {
    logger.info(`Detecting fallacies in argument: ${argument.id}`);
    
    try {
      const prompt = `Analyze this argument for logical fallacies:
Premises: ${JSON.stringify(argument.premises.map(p => p.statement), null, 2)}
Conclusion: ${argument.conclusion}
Structure: ${argument.structure.type} - ${argument.structure.pattern}

Detect:
1. Formal fallacies (invalid logical form)
2. Informal fallacies (content-based errors)
3. Cognitive biases affecting reasoning
4. Hidden assumptions
5. Equivocations or ambiguities

For each fallacy provide:
- Type and name
- Description
- Location in argument
- Severity (minor/moderate/severe)
- How to correct it

Sensitivity level: ${this.config.fallacyDetectionSensitivity}
Format as JSON array.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.5,
        maxTokens: 1200
      });

      const fallacies = this.parseFallacies(response);
      
      // Apply formal logic checks
      const formalFallacies = this.checkFormalFallacies(argument);
      fallacies.push(...formalFallacies);
      
      logger.info(`Detected ${fallacies.length} fallacies`);
      return fallacies;
    } catch (error) {
      logger.error('Fallacy detection failed:', error);
      throw new Error(`Failed to detect fallacies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve logical contradictions
   */
  public async resolveLogicalContradictions(contradictions: Contradiction[]): Promise<Resolution> {
    logger.info(`Resolving ${contradictions.length} contradictions`);
    
    if (contradictions.length === 0) {
      throw new Error('No contradictions to resolve');
    }
    
    try {
      // Prioritize by severity
      const prioritized = contradictions.sort((a, b) => b.severity - a.severity);
      const primary = prioritized[0];
      
      const prompt = `Resolve this logical contradiction:
Type: ${primary.type}
Context: ${primary.context}
Conflicting statements: ${JSON.stringify(primary.statements.map(s => s.content), null, 2)}

Resolution methods:
1. Disambiguation - clarify ambiguous terms
2. Prioritization - establish precedence
3. Synthesis - find higher-level reconciliation
4. Rejection - identify false premises

Provide:
- Best resolution method
- Resolved statements
- Detailed explanation
- Confidence level (0-1)

Consider context and maintain logical integrity.
Format as JSON.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.6,
        maxTokens: 1000
      });

      const resolution = this.parseResolution(response, primary.id);
      
      logger.info(`Contradiction resolved using ${resolution.method} method`);
      return resolution;
    } catch (error) {
      logger.error('Contradiction resolution failed:', error);
      throw new Error(`Failed to resolve contradictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper methods
   */
  
  private initializeLogicalRules(): void {
    // Initialize with fundamental logical rules
    const fundamentalRules = [
      'Modus Ponens: If P then Q, P, therefore Q',
      'Modus Tollens: If P then Q, not Q, therefore not P',
      'Hypothetical Syllogism: If P then Q, If Q then R, therefore If P then R',
      'Disjunctive Syllogism: P or Q, not P, therefore Q',
      'Law of Non-Contradiction: Not (P and not P)',
      'Law of Excluded Middle: P or not P',
      'De Morgan\'s Laws: not (P and Q) = (not P) or (not Q)',
      'Universal Instantiation: For all x P(x), therefore P(a)',
      'Existential Generalization: P(a), therefore exists x P(x)'
    ];
    
    // Store as reference rules
    fundamentalRules.forEach((rule, index) => {
      const generalRule: GeneralRule = {
        id: uuidv4(),
        rule,
        domain: 'logic',
        derivedFromObservations: [],
        confidence: 1.0,
        exceptions: [],
        applicabilityConditions: ['Valid in classical logic']
      };
      this.ruleDatabase.set(generalRule.id, generalRule);
    });
  }

  private async applySyllogisticReasoning(premises: Premise[]): Promise<Conclusion[]> {
    const conclusions: Conclusion[] = [];
    
    // Look for syllogistic patterns
    for (let i = 0; i < premises.length - 1; i++) {
      for (let j = i + 1; j < premises.length; j++) {
        const conclusion = await this.trySyllogism(premises[i], premises[j]);
        if (conclusion) {
          conclusions.push(conclusion);
        }
      }
    }
    
    return conclusions;
  }

  private async trySyllogism(premise1: Premise, premise2: Premise): Promise<Conclusion | null> {
    const prompt = `Check if these premises form a valid syllogism:
Premise 1: ${premise1.statement}
Premise 2: ${premise2.statement}

If valid, provide:
1. The conclusion
2. The syllogistic form (e.g., Barbara, Celarent, etc.)
3. Logical steps
4. Confidence level

If invalid, return null.
Format as JSON.`;

    try {
      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      return this.parseSyllogisticConclusion(response, [premise1.id, premise2.id]);
    } catch {
      return null;
    }
  }

  private async applyPropositionalLogic(premises: Premise[]): Promise<Conclusion[]> {
    const prompt = `Apply propositional logic to derive conclusions:
Premises: ${JSON.stringify(premises.map(p => p.statement), null, 2)}

Use:
- Truth tables
- Natural deduction
- Boolean algebra
- Logical equivalences

Derive all valid conclusions with steps.
Format as JSON array.`;

    try {
      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.4,
        maxTokens: 1000
      });

      return this.parsePropositionalConclusions(response, premises);
    } catch {
      return [];
    }
  }

  private async applyPredicateLogic(premises: Premise[]): Promise<Conclusion[]> {
    const prompt = `Apply first-order predicate logic:
Premises: ${JSON.stringify(premises.map(p => p.statement), null, 2)}

Use:
- Universal and existential quantifiers
- Predicate symbols and functions
- Inference rules for quantifiers
- Substitution and unification

Derive conclusions with formal proofs.
Format as JSON array.`;

    try {
      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.4,
        maxTokens: 1200
      });

      return this.parsePredicateConclusions(response, premises);
    } catch {
      return [];
    }
  }

  private async applyModalLogic(premises: Premise[]): Promise<Conclusion[]> {
    const prompt = `Apply modal logic reasoning:
Premises: ${JSON.stringify(premises.map(p => p.statement), null, 2)}

Consider:
- Necessity and possibility
- Temporal modalities (if enabled)
- Epistemic modalities
- Deontic modalities

Use appropriate modal axioms (K, T, S4, S5).
Format as JSON array.`;

    try {
      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.5,
        maxTokens: 1000
      });

      return this.parseModalConclusions(response, premises);
    } catch {
      return [];
    }
  }

  private categorizeObservations(observations: Observation[]): Map<string, Observation[]> {
    const categorized = new Map<string, Observation[]>();
    
    observations.forEach(obs => {
      const category = obs.category || 'general';
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(obs);
    });
    
    return categorized;
  }

  private rankHypotheses(hypotheses: Hypothesis[], evidence: Evidence[]): Hypothesis[] {
    return hypotheses.sort((a, b) => {
      const scoreA = this.calculateHypothesisScore(a, evidence);
      const scoreB = this.calculateHypothesisScore(b, evidence);
      return scoreB - scoreA;
    });
  }

  private calculateHypothesisScore(hypothesis: Hypothesis, evidence: Evidence[]): number {
    const explanatoryPower = hypothesis.supportingEvidence.length / evidence.length;
    const contradictionPenalty = hypothesis.contradictingEvidence.length * 0.2;
    const testabilityBonus = hypothesis.testable ? 0.1 : 0;
    
    return hypothesis.plausibility * 0.5 + 
           explanatoryPower * 0.3 + 
           testabilityBonus - 
           contradictionPenalty;
  }

  private async findDirectContradictions(statements: Statement[]): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = [];
    
    for (let i = 0; i < statements.length - 1; i++) {
      for (let j = i + 1; j < statements.length; j++) {
        if (this.areDirectlyContradictory(statements[i], statements[j])) {
          inconsistencies.push({
            statements: [statements[i].id, statements[j].id],
            type: 'contradiction',
            severity: 'critical',
            description: `Direct contradiction between statements`
          });
        }
      }
    }
    
    return inconsistencies;
  }

  private areDirectlyContradictory(s1: Statement, s2: Statement): boolean {
    // Simple check - would need more sophisticated logic in production
    return s1.logicalForm === `NOT(${s2.logicalForm})` || 
           s2.logicalForm === `NOT(${s1.logicalForm})`;
  }

  private async findIndirectContradictions(statements: Statement[]): Promise<Inconsistency[]> {
    // Use inference to find indirect contradictions
    const premises = statements.map(s => ({
      id: s.id,
      statement: s.content,
      truthValue: s.truthValue ?? 'unknown' as const,
      confidence: 0.9,
      source: 'given',
      type: 'assumption' as const
    }));
    
    const conclusions = await this.performDeductiveReasoning(premises);
    const inconsistencies: Inconsistency[] = [];
    
    // Check if any conclusions contradict original statements
    conclusions.forEach(conclusion => {
      statements.forEach(statement => {
        if (this.areDirectlyContradictory(
          { ...statement, content: conclusion.statement } as Statement,
          statement
        )) {
          inconsistencies.push({
            statements: [statement.id, ...conclusion.derivedFrom],
            type: 'contradiction',
            severity: 'major',
            description: 'Indirect contradiction through inference'
          });
        }
      });
    });
    
    return inconsistencies;
  }

  private async detectCircularReasoning(statements: Statement[]): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = [];
    
    // Build dependency graph
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (id: string): boolean => {
      visited.add(id);
      recursionStack.add(id);
      
      const statement = statements.find(s => s.id === id);
      if (statement) {
        for (const dep of statement.dependencies) {
          if (!visited.has(dep) && hasCycle(dep)) {
            return true;
          } else if (recursionStack.has(dep)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(id);
      return false;
    };
    
    statements.forEach(statement => {
      if (!visited.has(statement.id) && hasCycle(statement.id)) {
        inconsistencies.push({
          statements: [statement.id],
          type: 'circular',
          severity: 'major',
          description: 'Circular dependency detected'
        });
      }
    });
    
    return inconsistencies;
  }

  private async checkSemanticConsistency(statements: Statement[]): Promise<Inconsistency[]> {
    const prompt = `Check semantic consistency of these statements:
${statements.map((s, i) => `${i + 1}. ${s.content}`).join('\n')}

Identify:
1. Semantic contradictions
2. Pragmatic inconsistencies
3. Ambiguities leading to conflicts
4. Category errors

Format as JSON array of inconsistencies.`;

    try {
      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.5,
        maxTokens: 800
      });

      return this.parseSemanticInconsistencies(response);
    } catch {
      return [];
    }
  }

  private calculateConsistencyScore(totalStatements: number, inconsistencies: Inconsistency[]): number {
    if (totalStatements === 0) return 1;
    
    const severityWeights = {
      minor: 0.1,
      major: 0.3,
      critical: 0.5
    };
    
    const totalPenalty = inconsistencies.reduce((sum, inc) => 
      sum + severityWeights[inc.severity], 0
    );
    
    return Math.max(0, 1 - (totalPenalty / totalStatements));
  }

  private async generateResolutionSuggestions(inconsistencies: Inconsistency[]): Promise<string[]> {
    if (inconsistencies.length === 0) return [];
    
    const suggestions: string[] = [];
    
    inconsistencies.forEach(inc => {
      switch (inc.type) {
        case 'contradiction':
          suggestions.push(`Review and clarify conflicting statements: ${inc.description}`);
          break;
        case 'circular':
          suggestions.push(`Break circular dependency by introducing independent premises`);
          break;
        case 'paradox':
          suggestions.push(`Consider meta-level analysis or revised framework`);
          break;
        case 'ambiguity':
          suggestions.push(`Disambiguate terms and provide precise definitions`);
          break;
      }
    });
    
    return suggestions;
  }

  private checkFormalFallacies(argument: Argument): Fallacy[] {
    const fallacies: Fallacy[] = [];
    
    // Check for common formal fallacies
    const patterns = [
      {
        name: 'Affirming the Consequent',
        pattern: /if.*then.*therefore/i,
        check: (arg: Argument) => false // Simplified
      },
      {
        name: 'Denying the Antecedent',
        pattern: /if.*then.*not.*therefore.*not/i,
        check: (arg: Argument) => false // Simplified
      }
    ];
    
    // This is a simplified implementation
    // Real implementation would use proper logical analysis
    
    return fallacies;
  }

  private parseGeneralRules(response: string, observations: Observation[]): GeneralRule[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((rule: any) => ({
        id: uuidv4(),
        rule: rule.rule,
        domain: rule.domain || 'general',
        derivedFromObservations: observations.map(o => o.id),
        confidence: rule.confidence || 0.7,
        exceptions: rule.exceptions || [],
        applicabilityConditions: rule.applicabilityConditions || []
      }));
    } catch {
      return [];
    }
  }

  private parseHypotheses(response: string, evidence: Evidence[]): Hypothesis[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((hyp: any) => ({
        id: uuidv4(),
        statement: hyp.statement,
        explanation: hyp.explanation,
        supportingEvidence: hyp.supportingEvidence || evidence.map(e => e.id),
        contradictingEvidence: hyp.contradictingEvidence || [],
        plausibility: hyp.plausibility || 0.5,
        testable: hyp.testable !== false,
        predictions: hyp.predictions || []
      }));
    } catch {
      return [];
    }
  }

  private parseSyllogisticConclusion(response: string, premiseIds: string[]): Conclusion | null {
    try {
      const parsed = JSON.parse(response);
      if (!parsed || !parsed.conclusion) return null;
      
      return {
        id: uuidv4(),
        statement: parsed.conclusion,
        derivedFrom: premiseIds,
        inferenceMethod: 'deduction',
        confidence: parsed.confidence || 0.8,
        logicalSteps: parsed.steps?.map((step: any, i: number) => ({
          id: uuidv4(),
          order: i,
          operation: step.operation || 'syllogism',
          input: step.input || premiseIds,
          output: step.output || parsed.conclusion,
          rule: step.rule || parsed.form,
          justification: step.justification || 'Valid syllogistic form'
        })) || [],
        validity: 'valid'
      };
    } catch {
      return null;
    }
  }

  private parsePropositionalConclusions(response: string, premises: Premise[]): Conclusion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((conc: any) => ({
        id: uuidv4(),
        statement: conc.statement,
        derivedFrom: conc.derivedFrom || premises.map(p => p.id),
        inferenceMethod: 'deduction',
        confidence: conc.confidence || 0.85,
        logicalSteps: conc.steps || [],
        validity: conc.validity || 'valid'
      }));
    } catch {
      return [];
    }
  }

  private parsePredicateConclusions(response: string, premises: Premise[]): Conclusion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((conc: any) => ({
        id: uuidv4(),
        statement: conc.statement,
        derivedFrom: conc.derivedFrom || premises.map(p => p.id),
        inferenceMethod: 'deduction',
        confidence: conc.confidence || 0.8,
        logicalSteps: conc.steps || [],
        validity: conc.validity || 'valid'
      }));
    } catch {
      return [];
    }
  }

  private parseModalConclusions(response: string, premises: Premise[]): Conclusion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((conc: any) => ({
        id: uuidv4(),
        statement: conc.statement,
        derivedFrom: conc.derivedFrom || premises.map(p => p.id),
        inferenceMethod: 'deduction',
        confidence: conc.confidence || 0.75,
        logicalSteps: conc.steps || [],
        validity: conc.validity || 'valid'
      }));
    } catch {
      return [];
    }
  }

  private parseFallacies(response: string): Fallacy[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((fallacy: any) => ({
        id: uuidv4(),
        type: fallacy.type,
        name: fallacy.name,
        description: fallacy.description,
        location: fallacy.location,
        severity: fallacy.severity || 'moderate',
        correction: fallacy.correction || 'Review argument structure'
      }));
    } catch {
      return [];
    }
  }

  private parseSemanticInconsistencies(response: string): Inconsistency[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((inc: any) => ({
        statements: inc.statements || [],
        type: inc.type || 'ambiguity',
        severity: inc.severity || 'minor',
        description: inc.description
      }));
    } catch {
      return [];
    }
  }

  private parseResolution(response: string, contradictionId: string): Resolution {
    try {
      const parsed = JSON.parse(response);
      return {
        contradictionId,
        method: parsed.method || 'disambiguation',
        resolvedStatements: parsed.resolvedStatements || [],
        explanation: parsed.explanation || 'Resolution attempted',
        confidence: parsed.confidence || 0.6
      };
    } catch {
      return {
        contradictionId,
        method: 'rejection',
        resolvedStatements: [],
        explanation: 'Unable to parse resolution',
        confidence: 0.3
      };
    }
  }

  /**
   * Get logic engine metrics
   */
  public getMetrics() {
    return {
      totalInferences: this.inferenceCache.size,
      knowledgeStatements: this.knowledgeBase.size,
      activeHypotheses: this.hypothesisRegistry.size,
      discoveredRules: this.ruleDatabase.size,
      averageConfidence: this.calculateAverageInferenceConfidence()
    };
  }

  private calculateAverageInferenceConfidence(): number {
    const inferences = Array.from(this.inferenceCache.values());
    if (inferences.length === 0) return 0;
    
    const totalConfidence = inferences.reduce((sum, inf) => sum + inf.confidence, 0);
    return totalConfidence / inferences.length;
  }
}