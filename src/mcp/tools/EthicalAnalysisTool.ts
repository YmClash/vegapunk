/**
 * Ethical Analysis Tool - MCP Tool for ShakaAgent capabilities
 * Exposes ethical analysis functionality through standardized MCP interface
 */

import {
  MCPTool,
  MCPToolResult,
  MCPContent,
  MCPExecutionContext,
  ToolExecutor,
  JSONSchema,
  VegapunkToolCategory,
  MCPToolError
} from '../types';

export class EthicalAnalysisTool implements ToolExecutor {
  private toolDefinition: MCPTool;

  constructor() {
    this.toolDefinition = {
      name: 'ethical_analysis',
      description: 'Perform comprehensive ethical analysis using multiple moral frameworks (utilitarian, deontological, virtue ethics, care ethics)',
      inputSchema: this.getSchema(),
      metadata: {
        category: VegapunkToolCategory.ETHICAL_ANALYSIS,
        tags: ['ethics', 'analysis', 'moral', 'compliance'],
        cost: 30,
        latency: 5000, // 5 seconds average
        reliability: 0.95,
        requiredCapabilities: ['ethical-analysis'],
        version: '1.0.0'
      }
    };
  }

  /**
   * Execute ethical analysis
   */
  async execute(context: MCPExecutionContext): Promise<MCPToolResult> {
    try {
      const { content, frameworks = ['all'], includeRecommendations = true } = context.arguments;

      if (!content || typeof content !== 'string') {
        throw new MCPToolError(
          this.toolDefinition.name,
          'Content parameter is required and must be a string',
          context
        );
      }

      const startTime = Date.now();
      
      // Perform ethical analysis
      const analysis = await this.performEthicalAnalysis(content, frameworks, includeRecommendations);
      
      const executionTime = Date.now() - startTime;

      // Format results as MCP content
      const resultContent: MCPContent[] = [
        {
          type: 'text',
          text: this.formatAnalysisResult(analysis),
          annotations: {
            audience: 'human',
            priority: analysis.overall_compliance < 0.6 ? 5 : 3,
            confidence: analysis.confidence || 0.85
          }
        }
      ];

      // Add structured data
      if (analysis.structured_data) {
        resultContent.push({
          type: 'text',
          text: `\n\n**Structured Analysis Data:**\n\`\`\`json\n${JSON.stringify(analysis.structured_data, null, 2)}\n\`\`\``,
          annotations: {
            audience: 'assistant',
            priority: 1
          }
        });
      }

      return {
        content: resultContent,
        isError: false,
        metadata: {
          executionTime,
          tokensUsed: Math.ceil(content.length / 4), // Rough estimate
          cost: this.calculateCost(content, frameworks)
        }
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Ethical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          annotations: {
            audience: 'human',
            priority: 5
          }
        }],
        isError: true,
        metadata: {
          executionTime: Date.now() - Date.now()
        }
      };
    }
  }

  /**
   * Validate input arguments
   */
  validate(toolArguments: Record<string, any>): boolean {
    const { content, frameworks } = toolArguments;

    // Content is required
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Content must not be too short or too long
    if (content.length < 10 || content.length > 10000) {
      return false;
    }

    // Frameworks must be valid if provided
    if (frameworks && Array.isArray(frameworks)) {
      const validFrameworks = ['all', 'utilitarian', 'deontological', 'virtue', 'care'];
      const invalidFrameworks = frameworks.filter(f => !validFrameworks.includes(f));
      if (invalidFrameworks.length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get JSON schema for tool input
   */
  getSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to analyze for ethical implications',
          minLength: 10,
          maxLength: 10000,
          examples: [
            'Should we implement AI surveillance in the workplace?',
            'Is it ethical to use customer data for product recommendations?'
          ]
        },
        frameworks: {
          type: 'array',
          description: 'Ethical frameworks to use for analysis',
          items: {
            type: 'string',
            enum: ['all', 'utilitarian', 'deontological', 'virtue', 'care']
          },
          default: ['all'],
          examples: [['all'], ['utilitarian', 'deontological']]
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Whether to include actionable recommendations',
          default: true
        },
        context: {
          type: 'object',
          description: 'Additional context for the analysis',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain context (e.g., healthcare, finance, education)',
              examples: ['healthcare', 'finance', 'education', 'technology']
            },
            stakeholders: {
              type: 'array',
              description: 'Key stakeholders to consider',
              items: { type: 'string' },
              examples: [['users', 'employees', 'shareholders'], ['patients', 'doctors', 'insurance']]
            }
          },
          additionalProperties: true
        }
      },
      required: ['content'],
      additionalProperties: false
    };
  }

  /**
   * Perform comprehensive ethical analysis
   */
  private async performEthicalAnalysis(
    content: string,
    frameworks: string[],
    includeRecommendations: boolean
  ): Promise<any> {
    const analysisFrameworks = frameworks.includes('all') 
      ? ['utilitarian', 'deontological', 'virtue', 'care']
      : frameworks;

    const analysis = {
      content_analyzed: content,
      timestamp: new Date().toISOString(),
      frameworks_used: analysisFrameworks,
      overall_compliance: 0,
      confidence: 0.85,
      concerns: [] as any[],
      recommendations: [] as string[],
      detailed_analysis: {} as Record<string, any>,
      structured_data: {} as any
    };

    // Analyze with each framework
    let totalCompliance = 0;
    for (const framework of analysisFrameworks) {
      const frameworkAnalysis = await this.analyzeWithFramework(content, framework);
      analysis.detailed_analysis[framework] = frameworkAnalysis;
      totalCompliance += frameworkAnalysis.compliance_score;
    }

    // Calculate overall compliance
    analysis.overall_compliance = totalCompliance / analysisFrameworks.length;

    // Identify concerns
    analysis.concerns = this.identifyEthicalConcerns(content, analysis.detailed_analysis);

    // Generate recommendations if requested
    if (includeRecommendations) {
      analysis.recommendations = this.generateRecommendations(analysis);
    }

    // Create structured data for API consumption
    analysis.structured_data = {
      compliance_score: analysis.overall_compliance,
      risk_level: this.calculateRiskLevel(analysis.overall_compliance),
      framework_scores: Object.fromEntries(
        Object.entries(analysis.detailed_analysis).map(([framework, data]) => [
          framework,
          (data as any).compliance_score
        ])
      ),
      concern_count: analysis.concerns.length,
      high_risk_concerns: analysis.concerns.filter(c => c.level === 'high').length
    };

    return analysis;
  }

  /**
   * Analyze content with specific ethical framework
   */
  private async analyzeWithFramework(content: string, framework: string): Promise<any> {
    const lowerContent = content.toLowerCase();
    
    const frameworkAnalysis = {
      framework,
      compliance_score: 0.8, // Default neutral score
      key_principles: [] as string[],
      potential_violations: [] as string[],
      recommendations: [] as string[],
      reasoning: ''
    };

    switch (framework) {
      case 'utilitarian':
        frameworkAnalysis.key_principles = [
          'Greatest good for greatest number',
          'Consequence-based evaluation',
          'Maximizing overall benefit'
        ];
        
        // Check for utilitarian concerns
        if (this.containsNegativeConsequences(lowerContent)) {
          frameworkAnalysis.compliance_score = 0.4;
          frameworkAnalysis.potential_violations.push('Potential for widespread harm');
          frameworkAnalysis.reasoning = 'Content suggests actions that could lead to negative consequences for many people';
        } else if (this.containsPositiveConsequences(lowerContent)) {
          frameworkAnalysis.compliance_score = 0.9;
          frameworkAnalysis.reasoning = 'Content aligns with utilitarian principles of maximizing benefit';
        } else {
          frameworkAnalysis.reasoning = 'Content has neutral utilitarian implications';
        }
        break;

      case 'deontological':
        frameworkAnalysis.key_principles = [
          'Duty-based ethics',
          'Universal moral rules',
          'Rights and obligations',
          'Categorical imperative'
        ];
        
        if (this.violatesUniversalRules(lowerContent)) {
          frameworkAnalysis.compliance_score = 0.3;
          frameworkAnalysis.potential_violations.push('Violates universal moral principles');
          frameworkAnalysis.reasoning = 'Content suggests actions that violate fundamental duties or rights';
        } else {
          frameworkAnalysis.reasoning = 'Content respects deontological principles of duty and rights';
        }
        break;

      case 'virtue':
        frameworkAnalysis.key_principles = [
          'Character-based ethics',
          'Moral virtues and excellences',
          'What would a virtuous person do?',
          'Cultivation of good character'
        ];
        
        if (this.violatesVirtues(lowerContent)) {
          frameworkAnalysis.compliance_score = 0.5;
          frameworkAnalysis.potential_violations.push('Conflicts with virtuous character traits');
          frameworkAnalysis.reasoning = 'Content suggests actions inconsistent with moral virtues';
        } else {
          frameworkAnalysis.reasoning = 'Content aligns with virtue ethics principles';
        }
        break;

      case 'care':
        frameworkAnalysis.key_principles = [
          'Relationships and care',
          'Contextual considerations',
          'Responsibility for others',
          'Emotional and relational aspects'
        ];
        
        if (this.neglectsCareRelationships(lowerContent)) {
          frameworkAnalysis.compliance_score = 0.4;
          frameworkAnalysis.potential_violations.push('Neglects care relationships and responsibilities');
          frameworkAnalysis.reasoning = 'Content shows insufficient consideration for care relationships';
        } else {
          frameworkAnalysis.reasoning = 'Content demonstrates appropriate care and relational consideration';
        }
        break;
    }

    return frameworkAnalysis;
  }

  /**
   * Identify ethical concerns across frameworks
   */
  private identifyEthicalConcerns(content: string, detailedAnalysis: Record<string, any>): any[] {
    const concerns = [];
    const lowerContent = content.toLowerCase();

    // High-priority red flags
    const criticalKeywords = ['illegal', 'violence', 'harm', 'discriminat', 'bias', 'fraud', 'abuse'];
    for (const keyword of criticalKeywords) {
      if (lowerContent.includes(keyword)) {
        concerns.push({
          level: 'critical',
          category: 'red_flag',
          description: `Critical ethical concern: Content contains "${keyword}"`,
          framework: 'all',
          recommendation: 'Immediate review and potential redesign required'
        });
      }
    }

    // Framework-specific concerns
    for (const [framework, analysis] of Object.entries(detailedAnalysis)) {
      const frameworkData = analysis as any;
      if (frameworkData.compliance_score < 0.6) {
        concerns.push({
          level: frameworkData.compliance_score < 0.4 ? 'high' : 'medium',
          category: 'framework_violation',
          description: `Low compliance with ${framework} ethics (${(frameworkData.compliance_score * 100).toFixed(1)}%)`,
          framework: framework,
          recommendation: `Review content from ${framework} perspective`
        });
      }
    }

    return concerns;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations = [];

    if (analysis.overall_compliance < 0.7) {
      recommendations.push('Consider comprehensive ethical review before implementation');
      recommendations.push('Consult with stakeholders about potential impacts');
      recommendations.push('Implement additional safeguards or oversight measures');
    }

    if (analysis.concerns.some((c: any) => c.level === 'critical')) {
      recommendations.push('URGENT: Address critical ethical concerns before proceeding');
      recommendations.push('Seek legal and ethical expert consultation');
    }

    if (analysis.concerns.length > 2) {
      recommendations.push('Conduct stakeholder impact assessment');
      recommendations.push('Develop mitigation strategies for identified concerns');
    }

    // Framework-specific recommendations
    const lowScoringFrameworks = Object.entries(analysis.detailed_analysis)
      .filter(([_, data]) => (data as any).compliance_score < 0.6)
      .map(([framework, _]) => framework);

    if (lowScoringFrameworks.length > 0) {
      recommendations.push(`Focus improvement efforts on: ${lowScoringFrameworks.join(', ')} ethical considerations`);
    }

    return recommendations;
  }

  /**
   * Helper methods for content analysis
   */
  private containsNegativeConsequences(content: string): boolean {
    const negativeKeywords = ['harm', 'damage', 'hurt', 'loss', 'suffering', 'pain', 'negative impact'];
    return negativeKeywords.some(keyword => content.includes(keyword));
  }

  private containsPositiveConsequences(content: string): boolean {
    const positiveKeywords = ['benefit', 'help', 'improve', 'positive impact', 'wellbeing', 'happiness'];
    return positiveKeywords.some(keyword => content.includes(keyword));
  }

  private violatesUniversalRules(content: string): boolean {
    const violationKeywords = ['lie', 'deceive', 'cheat', 'steal', 'break promise', 'violate rights'];
    return violationKeywords.some(keyword => content.includes(keyword));
  }

  private violatesVirtues(content: string): boolean {
    const viceKeywords = ['dishonest', 'unfair', 'selfish', 'coward', 'cruel', 'unjust'];
    return viceKeywords.some(keyword => content.includes(keyword));
  }

  private neglectsCareRelationships(content: string): boolean {
    const neglectKeywords = ['neglect', 'abandon', 'ignore', 'dismiss', 'uncaring'];
    return neglectKeywords.some(keyword => content.includes(keyword));
  }

  private calculateRiskLevel(complianceScore: number): string {
    if (complianceScore >= 0.8) return 'low';
    if (complianceScore >= 0.6) return 'medium';
    if (complianceScore >= 0.4) return 'high';
    return 'critical';
  }

  private calculateCost(content: string, frameworks: string[]): number {
    const baseTokens = Math.ceil(content.length / 4);
    const frameworkMultiplier = frameworks.includes('all') ? 4 : frameworks.length;
    return baseTokens * frameworkMultiplier * 0.001; // $0.001 per token-framework
  }

  private formatAnalysisResult(analysis: any): string {
    const complianceEmoji = analysis.overall_compliance >= 0.8 ? '✅' : 
                           analysis.overall_compliance >= 0.6 ? '⚠️' : '🚨';

    let result = `🧠 **Ethical Analysis Results** ${complianceEmoji}\n\n`;
    
    // Overall score
    result += `**Overall Compliance Score:** ${(analysis.overall_compliance * 100).toFixed(1)}%\n`;
    result += `**Risk Level:** ${this.calculateRiskLevel(analysis.overall_compliance).toUpperCase()}\n\n`;
    
    // Framework breakdown
    result += `**Framework Analysis:**\n`;
    for (const [framework, data] of Object.entries(analysis.detailed_analysis)) {
      const frameworkData = data as any;
      const score = (frameworkData.compliance_score * 100).toFixed(1);
      result += `• **${framework.charAt(0).toUpperCase() + framework.slice(1)}:** ${score}% - ${frameworkData.reasoning}\n`;
    }
    result += '\n';
    
    // Concerns
    if (analysis.concerns.length > 0) {
      result += `**⚠️ Ethical Concerns (${analysis.concerns.length}):**\n`;
      analysis.concerns.forEach((concern: any, index: number) => {
        const levelEmoji = concern.level === 'critical' ? '🚨' : 
                          concern.level === 'high' ? '⚠️' : 'ℹ️';
        result += `${index + 1}. ${levelEmoji} **${concern.level.toUpperCase()}:** ${concern.description}\n`;
      });
      result += '\n';
    }
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      result += `**💡 Recommendations:**\n`;
      analysis.recommendations.forEach((rec: string, index: number) => {
        result += `${index + 1}. ${rec}\n`;
      });
    }

    return result;
  }

  /**
   * Get tool definition
   */
  getDefinition(): MCPTool {
    return this.toolDefinition;
  }
}