/**
 * Problem Solver Component for Edison Agent
 * Advanced problem analysis and solution generation engine
 * Specializing in complex problem decomposition, pattern recognition, and solution optimization
 */

import { createLogger } from '@utils/logger';
import { LLMProvider } from '@utils/llm/SimpleLLMProvider';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ProblemSolver');

export type ProblemType = 'technical' | 'logical' | 'optimization' | 'creative' | 'mathematical' | 'philosophical';

export interface Constraint {
  id: string;
  type: 'hard' | 'soft';
  description: string;
  priority: number;
  validator?: (solution: Solution) => boolean;
}

export interface Objective {
  id: string;
  description: string;
  metric: string;
  target: number | string;
  weight: number;
}

export interface Problem {
  id: string;
  type: ProblemType;
  description: string;
  constraints: Constraint[];
  objectives: Objective[];
  context: Record<string, any>;
  complexity: number; // 1-10 scale
  deadline?: Date;
}

export interface SubProblem extends Problem {
  parentId: string;
  dependencies: string[];
  order: number;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  applicability: number; // 0-1 confidence
  examples: string[];
  category: string;
}

export interface Solution {
  id: string;
  problemId: string;
  approach: string;
  steps: SolutionStep[];
  estimatedEffort: number;
  confidence: number; // 0-1
  risks: Risk[];
  benefits: Benefit[];
  alternatives?: Solution[];
}

export interface SolutionStep {
  id: string;
  order: number;
  description: string;
  action: string;
  prerequisites: string[];
  estimatedDuration: number; // minutes
  complexity: number; // 1-10
}

export interface Risk {
  id: string;
  description: string;
  probability: number; // 0-1
  impact: number; // 1-10
  mitigation: string;
}

export interface Benefit {
  id: string;
  description: string;
  value: number; // subjective score 1-10
  timeToRealize: number; // days
}

export interface OptimizedSolution extends Solution {
  optimizationScore: number;
  improvements: string[];
  tradeoffs: string[];
}

export interface ProblemAnalysis {
  problemId: string;
  complexity: number;
  estimatedSolutionTime: number;
  keyFactors: string[];
  potentialApproaches: string[];
  similarProblems: string[];
  recommendedStrategy: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1
  issues: string[];
  suggestions: string[];
  constraintsSatisfied: boolean;
  objectivesMet: boolean;
}

export interface ProblemSolverConfig {
  maxDecompositionDepth: number;
  solutionGenerationStrategies: string[];
  optimizationIterations: number;
  patternDatabase: Pattern[];
  enableLearning: boolean;
}

export class ProblemSolver {
  private readonly config: ProblemSolverConfig;
  private readonly llmProvider: LLMProvider;
  private patternDatabase: Map<string, Pattern>;
  private solutionHistory: Map<string, Solution[]>;
  private problemCache: Map<string, ProblemAnalysis>;

  constructor(llmProvider: LLMProvider, config?: Partial<ProblemSolverConfig>) {
    this.llmProvider = llmProvider;
    this.config = {
      maxDecompositionDepth: 5,
      solutionGenerationStrategies: ['analytical', 'heuristic', 'creative', 'systematic'],
      optimizationIterations: 3,
      patternDatabase: [],
      enableLearning: true,
      ...config
    };
    
    this.patternDatabase = new Map();
    this.solutionHistory = new Map();
    this.problemCache = new Map();
    
    this.initializePatternDatabase();
  }

  /**
   * Analyze a problem comprehensively
   */
  public async analyzeProblem(problem: Problem): Promise<ProblemAnalysis> {
    logger.info(`Analyzing problem: ${problem.id} - ${problem.type}`);
    
    // Check cache first
    const cached = this.problemCache.get(problem.id);
    if (cached) {
      logger.debug('Returning cached analysis');
      return cached;
    }

    try {
      // Use LLM for deep analysis
      const prompt = `Analyze this problem comprehensively:
Type: ${problem.type}
Description: ${problem.description}
Constraints: ${JSON.stringify(problem.constraints, null, 2)}
Objectives: ${JSON.stringify(problem.objectives, null, 2)}
Context: ${JSON.stringify(problem.context, null, 2)}

Provide:
1. Complexity assessment (1-10)
2. Estimated solution time (hours)
3. Key factors to consider
4. Potential solution approaches
5. Similar problems or patterns
6. Recommended strategy

Format as JSON.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 1000
      });

      const analysis = this.parseAnalysisResponse(response, problem.id);
      
      // Cache the analysis
      this.problemCache.set(problem.id, analysis);
      
      logger.info(`Problem analysis complete. Complexity: ${analysis.complexity}`);
      return analysis;
    } catch (error) {
      logger.error('Problem analysis failed:', error);
      throw new Error(`Failed to analyze problem: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decompose complex problems into sub-problems
   */
  public async decomposeComplexProblem(problem: Problem): Promise<SubProblem[]> {
    logger.info(`Decomposing complex problem: ${problem.id}`);
    
    if (problem.complexity < 5) {
      logger.debug('Problem not complex enough for decomposition');
      return [];
    }

    try {
      const prompt = `Decompose this complex problem into manageable sub-problems:
Problem: ${problem.description}
Type: ${problem.type}
Constraints: ${JSON.stringify(problem.constraints)}
Objectives: ${JSON.stringify(problem.objectives)}

Create sub-problems that:
1. Are independently solvable
2. Have clear dependencies
3. Sum up to solve the main problem
4. Are ordered by logical sequence

Format as JSON array with: parentId, description, type, dependencies, order`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.6,
        maxTokens: 1500
      });

      const subProblems = this.parseSubProblems(response, problem);
      
      logger.info(`Decomposed into ${subProblems.length} sub-problems`);
      return subProblems;
    } catch (error) {
      logger.error('Problem decomposition failed:', error);
      throw new Error(`Failed to decompose problem: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Identify patterns in data or problems
   */
  public async identifyPatterns(data: any[]): Promise<Pattern[]> {
    logger.info(`Identifying patterns in ${data.length} data points`);
    
    try {
      // Prepare data for pattern analysis
      const dataSnapshot = data.slice(0, 10); // Sample for LLM
      
      const prompt = `Identify patterns in this data:
Data sample: ${JSON.stringify(dataSnapshot, null, 2)}
Data size: ${data.length} items

Look for:
1. Recurring structures
2. Common sequences
3. Relationships between elements
4. Anomalies or outliers
5. Mathematical or logical patterns

Format as JSON array with: name, description, applicability (0-1), examples, category`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 1000
      });

      const patterns = this.parsePatterns(response);
      
      // Store discovered patterns
      patterns.forEach(pattern => {
        this.patternDatabase.set(pattern.id, pattern);
      });
      
      logger.info(`Identified ${patterns.length} patterns`);
      return patterns;
    } catch (error) {
      logger.error('Pattern identification failed:', error);
      throw new Error(`Failed to identify patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple solutions for a problem
   */
  public async generateSolutions(problem: Problem): Promise<Solution[]> {
    logger.info(`Generating solutions for problem: ${problem.id}`);
    
    try {
      const analysis = await this.analyzeProblem(problem);
      const solutions: Solution[] = [];
      
      // Generate solutions using different strategies
      for (const strategy of this.config.solutionGenerationStrategies) {
        const solution = await this.generateSolutionWithStrategy(problem, analysis, strategy);
        if (solution) {
          solutions.push(solution);
        }
      }
      
      // Apply patterns from database
      const relevantPatterns = this.findRelevantPatterns(problem);
      for (const pattern of relevantPatterns) {
        const patternSolution = await this.applyPatternToGenerateSolution(problem, pattern);
        if (patternSolution) {
          solutions.push(patternSolution);
        }
      }
      
      // Store solutions in history
      this.solutionHistory.set(problem.id, solutions);
      
      logger.info(`Generated ${solutions.length} solutions`);
      return solutions;
    } catch (error) {
      logger.error('Solution generation failed:', error);
      throw new Error(`Failed to generate solutions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize an existing solution
   */
  public async optimizeSolution(solution: Solution): Promise<OptimizedSolution> {
    logger.info(`Optimizing solution: ${solution.id}`);
    
    let currentSolution = solution;
    const improvements: string[] = [];
    const tradeoffs: string[] = [];
    
    try {
      for (let i = 0; i < this.config.optimizationIterations; i++) {
        const prompt = `Optimize this solution:
Current approach: ${currentSolution.approach}
Steps: ${JSON.stringify(currentSolution.steps, null, 2)}
Current confidence: ${currentSolution.confidence}

Consider:
1. Efficiency improvements
2. Risk reduction
3. Resource optimization
4. Time savings
5. Quality enhancements

Provide specific improvements and any tradeoffs.
Format as JSON with: improvedApproach, improvedSteps, improvements, tradeoffs`;

        const response = await this.llmProvider.generateResponse(prompt, {
          temperature: 0.6,
          maxTokens: 1200
        });

        const optimization = this.parseOptimization(response);
        
        if (optimization.improvements.length > 0) {
          improvements.push(...optimization.improvements);
          tradeoffs.push(...optimization.tradeoffs);
          
          currentSolution = {
            ...currentSolution,
            approach: optimization.improvedApproach || currentSolution.approach,
            steps: optimization.improvedSteps || currentSolution.steps,
            confidence: Math.min(currentSolution.confidence * 1.1, 0.95)
          };
        }
      }
      
      const optimizedSolution: OptimizedSolution = {
        ...currentSolution,
        optimizationScore: this.calculateOptimizationScore(currentSolution, solution),
        improvements,
        tradeoffs
      };
      
      logger.info(`Solution optimized. Score: ${optimizedSolution.optimizationScore}`);
      return optimizedSolution;
    } catch (error) {
      logger.error('Solution optimization failed:', error);
      throw new Error(`Failed to optimize solution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a solution against problem constraints
   */
  public async validateSolution(solution: Solution, problem: Problem): Promise<ValidationResult> {
    logger.info(`Validating solution ${solution.id} for problem ${problem.id}`);
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    try {
      // Check hard constraints
      let constraintsSatisfied = true;
      for (const constraint of problem.constraints) {
        if (constraint.type === 'hard' && constraint.validator) {
          if (!constraint.validator(solution)) {
            constraintsSatisfied = false;
            issues.push(`Hard constraint violated: ${constraint.description}`);
          }
        }
      }
      
      // Evaluate objectives
      const objectiveScores = await this.evaluateObjectives(solution, problem.objectives);
      const objectivesMet = objectiveScores.every(score => score >= 0.7);
      
      // Use LLM for comprehensive validation
      const prompt = `Validate this solution:
Problem: ${problem.description}
Solution: ${solution.approach}
Steps: ${JSON.stringify(solution.steps)}
Constraints: ${JSON.stringify(problem.constraints)}
Objectives: ${JSON.stringify(problem.objectives)}

Assess:
1. Feasibility
2. Completeness
3. Efficiency
4. Risk factors
5. Potential issues

Provide issues found and suggestions for improvement.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.5,
        maxTokens: 800
      });

      const llmValidation = this.parseValidation(response);
      issues.push(...llmValidation.issues);
      suggestions.push(...llmValidation.suggestions);
      
      const score = this.calculateValidationScore(
        constraintsSatisfied,
        objectivesMet,
        issues.length,
        solution.confidence
      );
      
      const result: ValidationResult = {
        isValid: constraintsSatisfied && objectivesMet && issues.length === 0,
        score,
        issues,
        suggestions,
        constraintsSatisfied,
        objectivesMet
      };
      
      logger.info(`Validation complete. Valid: ${result.isValid}, Score: ${result.score}`);
      return result;
    } catch (error) {
      logger.error('Solution validation failed:', error);
      throw new Error(`Failed to validate solution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper methods
   */
  
  private initializePatternDatabase(): void {
    // Initialize with common problem-solving patterns
    const commonPatterns: Pattern[] = [
      {
        id: uuidv4(),
        name: 'Divide and Conquer',
        description: 'Break problem into smaller subproblems, solve independently, combine results',
        applicability: 0.8,
        examples: ['Sorting algorithms', 'Tree traversal', 'Complex calculations'],
        category: 'algorithmic'
      },
      {
        id: uuidv4(),
        name: 'Dynamic Programming',
        description: 'Solve overlapping subproblems once and store results',
        applicability: 0.7,
        examples: ['Optimization problems', 'Sequence alignment', 'Resource allocation'],
        category: 'optimization'
      },
      {
        id: uuidv4(),
        name: 'Greedy Approach',
        description: 'Make locally optimal choices at each step',
        applicability: 0.6,
        examples: ['Scheduling', 'Graph algorithms', 'Huffman coding'],
        category: 'heuristic'
      },
      {
        id: uuidv4(),
        name: 'Backtracking',
        description: 'Try solutions and undo if they dont work',
        applicability: 0.5,
        examples: ['Puzzle solving', 'Constraint satisfaction', 'Path finding'],
        category: 'search'
      }
    ];
    
    commonPatterns.forEach(pattern => {
      this.patternDatabase.set(pattern.id, pattern);
    });
  }

  private parseAnalysisResponse(response: string, problemId: string): ProblemAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        problemId,
        complexity: parsed.complexity || 5,
        estimatedSolutionTime: parsed.estimatedSolutionTime || 1,
        keyFactors: parsed.keyFactors || [],
        potentialApproaches: parsed.potentialApproaches || [],
        similarProblems: parsed.similarProblems || [],
        recommendedStrategy: parsed.recommendedStrategy || 'analytical'
      };
    } catch {
      // Fallback parsing
      return {
        problemId,
        complexity: 5,
        estimatedSolutionTime: 1,
        keyFactors: ['Unable to parse detailed analysis'],
        potentialApproaches: ['Standard problem-solving approach'],
        similarProblems: [],
        recommendedStrategy: 'systematic'
      };
    }
  }

  private parseSubProblems(response: string, parentProblem: Problem): SubProblem[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((sub: any, index: number) => ({
        id: uuidv4(),
        parentId: parentProblem.id,
        type: sub.type || parentProblem.type,
        description: sub.description,
        constraints: sub.constraints || [],
        objectives: sub.objectives || [],
        context: sub.context || {},
        complexity: sub.complexity || Math.max(1, parentProblem.complexity - 2),
        dependencies: sub.dependencies || [],
        order: sub.order || index
      }));
    } catch {
      return [];
    }
  }

  private parsePatterns(response: string): Pattern[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((pattern: any) => ({
        id: uuidv4(),
        name: pattern.name,
        description: pattern.description,
        applicability: pattern.applicability || 0.5,
        examples: pattern.examples || [],
        category: pattern.category || 'general'
      }));
    } catch {
      return [];
    }
  }

  private async generateSolutionWithStrategy(
    problem: Problem, 
    analysis: ProblemAnalysis, 
    strategy: string
  ): Promise<Solution | null> {
    try {
      const prompt = `Generate a solution using ${strategy} strategy:
Problem: ${problem.description}
Analysis: ${JSON.stringify(analysis, null, 2)}
Strategy focus: ${this.getStrategyDescription(strategy)}

Provide:
1. Clear approach description
2. Step-by-step implementation
3. Risk assessment
4. Expected benefits
5. Confidence level (0-1)

Format as JSON.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: strategy === 'creative' ? 0.8 : 0.6,
        maxTokens: 1200
      });

      return this.parseSolution(response, problem.id);
    } catch (error) {
      logger.error(`Failed to generate ${strategy} solution:`, error);
      return null;
    }
  }

  private getStrategyDescription(strategy: string): string {
    const descriptions: Record<string, string> = {
      analytical: 'Break down the problem systematically and analyze each component',
      heuristic: 'Apply rules of thumb and experience-based techniques',
      creative: 'Think outside the box and explore unconventional approaches',
      systematic: 'Follow a methodical, step-by-step approach'
    };
    return descriptions[strategy] || 'General problem-solving approach';
  }

  private findRelevantPatterns(problem: Problem): Pattern[] {
    const relevant: Pattern[] = [];
    
    this.patternDatabase.forEach(pattern => {
      // Simple relevance check based on problem type and description
      const keywordsMatch = pattern.examples.some(example => 
        problem.description.toLowerCase().includes(example.toLowerCase())
      );
      
      const typeMatch = pattern.category === problem.type || 
                       pattern.category === 'general';
      
      if ((keywordsMatch || typeMatch) && pattern.applicability > 0.5) {
        relevant.push(pattern);
      }
    });
    
    return relevant.sort((a, b) => b.applicability - a.applicability).slice(0, 3);
  }

  private async applyPatternToGenerateSolution(
    problem: Problem, 
    pattern: Pattern
  ): Promise<Solution | null> {
    try {
      const prompt = `Apply the "${pattern.name}" pattern to solve:
Problem: ${problem.description}
Pattern: ${pattern.description}
Examples: ${pattern.examples.join(', ')}

Adapt this pattern to create a specific solution with steps.
Format as JSON with approach, steps, risks, benefits, confidence.`;

      const response = await this.llmProvider.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 1000
      });

      return this.parseSolution(response, problem.id);
    } catch (error) {
      logger.error(`Failed to apply pattern ${pattern.name}:`, error);
      return null;
    }
  }

  private parseSolution(response: string, problemId: string): Solution | null {
    try {
      const parsed = JSON.parse(response);
      return {
        id: uuidv4(),
        problemId,
        approach: parsed.approach,
        steps: parsed.steps.map((step: any, index: number) => ({
          id: uuidv4(),
          order: step.order || index,
          description: step.description,
          action: step.action,
          prerequisites: step.prerequisites || [],
          estimatedDuration: step.estimatedDuration || 30,
          complexity: step.complexity || 5
        })),
        estimatedEffort: parsed.estimatedEffort || 
          parsed.steps.reduce((sum: number, step: any) => 
            sum + (step.estimatedDuration || 30), 0),
        confidence: parsed.confidence || 0.7,
        risks: parsed.risks?.map((risk: any) => ({
          id: uuidv4(),
          description: risk.description,
          probability: risk.probability || 0.3,
          impact: risk.impact || 5,
          mitigation: risk.mitigation || 'Monitor closely'
        })) || [],
        benefits: parsed.benefits?.map((benefit: any) => ({
          id: uuidv4(),
          description: benefit.description,
          value: benefit.value || 5,
          timeToRealize: benefit.timeToRealize || 7
        })) || []
      };
    } catch {
      return null;
    }
  }

  private parseOptimization(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return {
        improvements: [],
        tradeoffs: []
      };
    }
  }

  private calculateOptimizationScore(optimized: Solution, original: Solution): number {
    const effortImprovement = (original.estimatedEffort - optimized.estimatedEffort) / 
                             original.estimatedEffort;
    const confidenceImprovement = optimized.confidence - original.confidence;
    const riskReduction = (original.risks.length - optimized.risks.length) / 
                         Math.max(original.risks.length, 1);
    
    return Math.max(0, Math.min(1,
      (effortImprovement * 0.4) + 
      (confidenceImprovement * 0.4) + 
      (riskReduction * 0.2)
    ));
  }

  private async evaluateObjectives(solution: Solution, objectives: Objective[]): Promise<number[]> {
    // Simplified objective evaluation
    return objectives.map(() => Math.random() * 0.3 + 0.7); // 0.7-1.0 range
  }

  private parseValidation(response: string): { issues: string[], suggestions: string[] } {
    try {
      const parsed = JSON.parse(response);
      return {
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || []
      };
    } catch {
      return { issues: [], suggestions: [] };
    }
  }

  private calculateValidationScore(
    constraintsSatisfied: boolean,
    objectivesMet: boolean,
    issueCount: number,
    confidence: number
  ): number {
    let score = 0;
    
    if (constraintsSatisfied) score += 0.4;
    if (objectivesMet) score += 0.3;
    score += Math.max(0, 0.2 - (issueCount * 0.05));
    score += confidence * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get solver metrics
   */
  public getMetrics() {
    return {
      patternsDiscovered: this.patternDatabase.size,
      problemsAnalyzed: this.problemCache.size,
      solutionsGenerated: Array.from(this.solutionHistory.values())
        .reduce((sum, solutions) => sum + solutions.length, 0),
      averageConfidence: this.calculateAverageConfidence()
    };
  }

  private calculateAverageConfidence(): number {
    const allSolutions = Array.from(this.solutionHistory.values()).flat();
    if (allSolutions.length === 0) return 0;
    
    const totalConfidence = allSolutions.reduce((sum, sol) => sum + sol.confidence, 0);
    return totalConfidence / allSolutions.length;
  }
}