/**
 * Technical Support Tool - MCP Tool for Vegapunk technical capabilities
 * Exposes technical support functionality through standardized MCP interface
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

export class TechnicalSupportTool implements ToolExecutor {
  private toolDefinition: MCPTool;

  constructor() {
    this.toolDefinition = {
      name: 'technical_support',
      description: 'Provide technical support and analysis for software, hardware, and system-related queries',
      inputSchema: this.getSchema(),
      metadata: {
        category: VegapunkToolCategory.TECHNICAL_SUPPORT,
        tags: ['technical', 'support', 'troubleshooting', 'analysis', 'software', 'hardware'],
        cost: 20,
        latency: 3000, // 3 seconds average
        reliability: 0.92,
        requiredCapabilities: ['technical-support'],
        version: '1.0.0'
      }
    };
  }

  /**
   * Execute technical support analysis
   */
  async execute(context: MCPExecutionContext): Promise<MCPToolResult> {
    try {
      const { 
        query, 
        category = 'general',
        includeCodeExample = false,
        includeTroubleshooting = true,
        context: userContext 
      } = context.arguments;

      if (!query || typeof query !== 'string') {
        throw new MCPToolError(
          this.toolDefinition.name,
          'Query parameter is required and must be a string',
          context
        );
      }

      const startTime = Date.now();
      
      // Perform technical analysis
      const analysis = await this.performTechnicalAnalysis(
        query, 
        category, 
        includeCodeExample, 
        includeTroubleshooting,
        userContext
      );
      
      const executionTime = Date.now() - startTime;

      // Format results as MCP content
      const resultContent: MCPContent[] = [
        {
          type: 'text',
          text: this.formatTechnicalResponse(analysis),
          annotations: {
            audience: 'human',
            priority: analysis.urgency || 3,
            confidence: analysis.confidence || 0.85
          }
        }
      ];

      // Add code examples if requested and available
      if (includeCodeExample && analysis.code_examples) {
        resultContent.push({
          type: 'text',
          text: `\n\n**Code Examples:**\n${analysis.code_examples}`,
          annotations: {
            audience: 'human',
            priority: 2
          }
        });
      }

      // Add structured data for API consumption
      if (analysis.structured_data) {
        resultContent.push({
          type: 'text',
          text: `\n\n**Structured Technical Data:**\n\`\`\`json\n${JSON.stringify(analysis.structured_data, null, 2)}\n\`\`\``,
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
          tokensUsed: Math.ceil(query.length / 4),
          cost: this.calculateCost(query, category)
        }
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Technical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  validate(arguments: Record<string, any>): boolean {
    const { query, category } = arguments;

    // Query is required
    if (!query || typeof query !== 'string') {
      return false;
    }

    // Query must not be too short or too long
    if (query.length < 5 || query.length > 5000) {
      return false;
    }

    // Category must be valid if provided
    if (category && typeof category === 'string') {
      const validCategories = [
        'general', 'software', 'hardware', 'network', 'security', 
        'database', 'api', 'deployment', 'performance', 'debugging'
      ];
      if (!validCategories.includes(category)) {
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
        query: {
          type: 'string',
          description: 'The technical question or problem to analyze',
          minLength: 5,
          maxLength: 5000,
          examples: [
            'How do I fix a memory leak in my Node.js application?',
            'What\'s the best way to optimize database queries?',
            'My API is returning 500 errors, how can I debug this?'
          ]
        },
        category: {
          type: 'string',
          description: 'Category of technical support needed',
          enum: [
            'general', 'software', 'hardware', 'network', 'security', 
            'database', 'api', 'deployment', 'performance', 'debugging'
          ],
          default: 'general',
          examples: ['software', 'database', 'api']
        },
        includeCodeExample: {
          type: 'boolean',
          description: 'Whether to include code examples in the response',
          default: false
        },
        includeTroubleshooting: {
          type: 'boolean',
          description: 'Whether to include troubleshooting steps',
          default: true
        },
        context: {
          type: 'object',
          description: 'Additional context about the technical environment',
          properties: {
            technology_stack: {
              type: 'array',
              description: 'Technologies involved (e.g., Node.js, React, PostgreSQL)',
              items: { type: 'string' },
              examples: [['Node.js', 'React', 'PostgreSQL'], ['Python', 'Django', 'Redis']]
            },
            environment: {
              type: 'string',
              description: 'Environment where the issue occurs',
              enum: ['development', 'staging', 'production', 'testing'],
              examples: ['production', 'development']
            },
            error_messages: {
              type: 'array',
              description: 'Any error messages or logs',
              items: { type: 'string' },
              examples: [['TypeError: Cannot read property', 'Connection timeout']]
            },
            constraints: {
              type: 'array',
              description: 'Any constraints or limitations to consider',
              items: { type: 'string' },
              examples: [['limited memory', 'legacy system', 'no downtime allowed']]
            }
          },
          additionalProperties: true
        }
      },
      required: ['query'],
      additionalProperties: false
    };
  }

  /**
   * Perform comprehensive technical analysis
   */
  private async performTechnicalAnalysis(
    query: string,
    category: string,
    includeCodeExample: boolean,
    includeTroubleshooting: boolean,
    userContext?: any
  ): Promise<any> {
    const analysis = {
      query_analyzed: query,
      category: category,
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      urgency: this.assessUrgency(query),
      solution_type: this.determineSolutionType(query, category),
      main_response: '',
      troubleshooting_steps: [] as string[],
      code_examples: '',
      related_topics: [] as string[],
      structured_data: {} as any
    };

    // Generate main response based on category
    analysis.main_response = await this.generateMainResponse(query, category, userContext);

    // Add troubleshooting steps if requested
    if (includeTroubleshooting) {
      analysis.troubleshooting_steps = this.generateTroubleshootingSteps(query, category);
    }

    // Add code examples if requested
    if (includeCodeExample) {
      analysis.code_examples = this.generateCodeExamples(query, category, userContext);
    }

    // Identify related topics
    analysis.related_topics = this.identifyRelatedTopics(query, category);

    // Create structured data
    analysis.structured_data = {
      problem_type: this.classifyProblemType(query),
      complexity_level: this.assessComplexity(query),
      estimated_resolution_time: this.estimateResolutionTime(query, category),
      requires_expert: this.requiresExpert(query),
      technology_stack: userContext?.technology_stack || [],
      environment: userContext?.environment || 'unknown'
    };

    return analysis;
  }

  /**
   * Generate main technical response
   */
  private async generateMainResponse(query: string, category: string, context?: any): Promise<string> {
    const lowerQuery = query.toLowerCase();

    // Error-specific responses
    if (lowerQuery.includes('error') || lowerQuery.includes('exception')) {
      return this.generateErrorResponse(query, context);
    }

    // Performance-specific responses
    if (lowerQuery.includes('slow') || lowerQuery.includes('performance') || lowerQuery.includes('optimize')) {
      return this.generatePerformanceResponse(query, context);
    }

    // Security-specific responses
    if (lowerQuery.includes('security') || lowerQuery.includes('vulnerability') || lowerQuery.includes('secure')) {
      return this.generateSecurityResponse(query, context);
    }

    // Category-specific responses
    switch (category) {
      case 'database':
        return this.generateDatabaseResponse(query, context);
      case 'api':
        return this.generateAPIResponse(query, context);
      case 'network':
        return this.generateNetworkResponse(query, context);
      case 'deployment':
        return this.generateDeploymentResponse(query, context);
      default:
        return this.generateGeneralResponse(query, context);
    }
  }

  /**
   * Generate error-specific response
   */
  private generateErrorResponse(query: string, context?: any): string {
    let response = `🔧 **Error Analysis & Resolution**\n\n`;
    response += `Based on your error description, here's a systematic approach to resolve the issue:\n\n`;
    
    response += `**1. Error Classification:**\n`;
    response += `This appears to be a ${this.classifyErrorType(query)} error.\n\n`;
    
    response += `**2. Immediate Steps:**\n`;
    response += `• Check the exact error message and stack trace\n`;
    response += `• Identify when the error started occurring\n`;
    response += `• Verify if it's environment-specific\n\n`;
    
    response += `**3. Common Causes:**\n`;
    response += this.getCommonErrorCauses(query).map(cause => `• ${cause}`).join('\n');
    
    return response;
  }

  /**
   * Generate performance-specific response
   */
  private generatePerformanceResponse(query: string, context?: any): string {
    let response = `⚡ **Performance Optimization Analysis**\n\n`;
    response += `Let's identify and address the performance bottlenecks:\n\n`;
    
    response += `**1. Performance Assessment:**\n`;
    response += `• Measure current performance baselines\n`;
    response += `• Identify specific slow operations\n`;
    response += `• Profile resource usage (CPU, memory, I/O)\n\n`;
    
    response += `**2. Common Optimization Areas:**\n`;
    const optimizations = this.getPerformanceOptimizations(query, context);
    response += optimizations.map(opt => `• ${opt}`).join('\n');
    
    return response;
  }

  /**
   * Generate security-specific response
   */
  private generateSecurityResponse(query: string, context?: any): string {
    let response = `🔒 **Security Analysis & Recommendations**\n\n`;
    response += `Security is critical. Here's a comprehensive approach:\n\n`;
    
    response += `**1. Security Assessment:**\n`;
    response += `• Identify potential attack vectors\n`;
    response += `• Review current security measures\n`;
    response += `• Check for known vulnerabilities\n\n`;
    
    response += `**2. Security Best Practices:**\n`;
    const practices = this.getSecurityBestPractices(query, context);
    response += practices.map(practice => `• ${practice}`).join('\n');
    
    return response;
  }

  /**
   * Generate troubleshooting steps
   */
  private generateTroubleshootingSteps(query: string, category: string): string[] {
    const baseSteps = [
      'Reproduce the issue consistently',
      'Check logs for error messages or warnings',
      'Verify system requirements and dependencies',
      'Test in different environments if possible'
    ];

    const categorySteps: Record<string, string[]> = {
      'software': [
        'Update to latest version',
        'Clear cache and temporary files',
        'Check for conflicting software',
        'Run diagnostics or health checks'
      ],
      'hardware': [
        'Check physical connections',
        'Verify power supply',
        'Test with known good components',
        'Check for overheating issues'
      ],
      'network': [
        'Test network connectivity',
        'Check firewall settings',
        'Verify DNS resolution',
        'Test with different network interfaces'
      ],
      'database': [
        'Check database logs',
        'Verify connection parameters',
        'Test query performance',
        'Check disk space and memory'
      ]
    };

    return [...baseSteps, ...(categorySteps[category] || [])];
  }

  /**
   * Generate code examples
   */
  private generateCodeExamples(query: string, category: string, context?: any): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('node') || lowerQuery.includes('javascript')) {
      return this.generateJavaScriptExample(query);
    }

    if (lowerQuery.includes('python')) {
      return this.generatePythonExample(query);
    }

    if (lowerQuery.includes('sql') || lowerQuery.includes('database')) {
      return this.generateSQLExample(query);
    }

    if (lowerQuery.includes('api') || lowerQuery.includes('rest')) {
      return this.generateAPIExample(query);
    }

    return this.generateGenericExample(query, category);
  }

  /**
   * Helper methods for response generation
   */
  private generateDatabaseResponse(query: string, context?: any): string {
    return `📊 **Database Analysis**\n\nFor database-related issues, consider checking connection pooling, query optimization, and index usage. Ensure your database configuration matches your workload requirements.`;
  }

  private generateAPIResponse(query: string, context?: any): string {
    return `🌐 **API Analysis**\n\nFor API issues, verify endpoint configuration, authentication, rate limiting, and response formats. Check both client and server-side implementations.`;
  }

  private generateNetworkResponse(query: string, context?: any): string {
    return `🌍 **Network Analysis**\n\nFor network issues, check connectivity, DNS resolution, firewall rules, and network latency. Use network diagnostic tools to identify bottlenecks.`;
  }

  private generateDeploymentResponse(query: string, context?: any): string {
    return `🚀 **Deployment Analysis**\n\nFor deployment issues, verify environment configuration, dependencies, permissions, and service health. Check deployment logs and rollback procedures.`;
  }

  private generateGeneralResponse(query: string, context?: any): string {
    return `🔧 **Technical Analysis**\n\nBased on your query, I'll help you systematically approach this technical challenge. Let's break down the problem and identify the best solution path.`;
  }

  private classifyErrorType(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('syntax')) return 'syntax';
    if (lowerQuery.includes('runtime') || lowerQuery.includes('exception')) return 'runtime';
    if (lowerQuery.includes('connection') || lowerQuery.includes('network')) return 'connectivity';
    if (lowerQuery.includes('permission') || lowerQuery.includes('access')) return 'permission';
    if (lowerQuery.includes('memory') || lowerQuery.includes('resource')) return 'resource';
    return 'application';
  }

  private getCommonErrorCauses(query: string): string[] {
    return [
      'Invalid input parameters or data types',
      'Missing or corrupted dependencies',
      'Insufficient permissions or access rights',
      'Network connectivity issues',
      'Resource constraints (memory, disk space)',
      'Configuration mismatches'
    ];
  }

  private getPerformanceOptimizations(query: string, context?: any): string[] {
    return [
      'Database query optimization and indexing',
      'Caching implementation (Redis, memcached)',
      'Code-level optimizations and algorithm improvements',
      'Resource scaling (horizontal/vertical)',
      'Content delivery network (CDN) usage',
      'Load balancing and distributed processing'
    ];
  }

  private getSecurityBestPractices(query: string, context?: any): string[] {
    return [
      'Input validation and sanitization',
      'Strong authentication and authorization',
      'Encryption for data in transit and at rest',
      'Regular security updates and patches',
      'Access control and principle of least privilege',
      'Security monitoring and audit logging'
    ];
  }

  private generateJavaScriptExample(query: string): string {
    return `\`\`\`javascript
// Example JavaScript solution
try {
  // Your implementation here
  const result = await processData(inputData);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
\`\`\``;
  }

  private generatePythonExample(query: string): string {
    return `\`\`\`python
# Example Python solution
try:
    # Your implementation here
    result = process_data(input_data)
    print(f"Success: {result}")
except Exception as error:
    print(f"Error: {error}")
    # Handle error appropriately
\`\`\``;
  }

  private generateSQLExample(query: string): string {
    return `\`\`\`sql
-- Example SQL query
SELECT column1, column2
FROM table_name
WHERE condition = ?
ORDER BY column1
LIMIT 10;
\`\`\``;
  }

  private generateAPIExample(query: string): string {
    return `\`\`\`javascript
// Example API call
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(data)
});

if (!response.ok) {
  throw new Error('API request failed');
}

const result = await response.json();
\`\`\``;
  }

  private generateGenericExample(query: string, category: string): string {
    return `\`\`\`
// Example implementation
// Adapt this template to your specific technology stack
function solveProblem(input) {
  // 1. Validate input
  // 2. Process data
  // 3. Return result
  // 4. Handle errors appropriately
}
\`\`\``;
  }

  private assessUrgency(query: string): number {
    const urgentKeywords = ['critical', 'urgent', 'production', 'down', 'crash', 'fail'];
    const highKeywords = ['error', 'problem', 'issue', 'bug'];
    
    const lowerQuery = query.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerQuery.includes(keyword))) return 5;
    if (highKeywords.some(keyword => lowerQuery.includes(keyword))) return 4;
    return 3;
  }

  private determineSolutionType(query: string, category: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how to') || lowerQuery.includes('tutorial')) return 'tutorial';
    if (lowerQuery.includes('error') || lowerQuery.includes('fix')) return 'troubleshooting';
    if (lowerQuery.includes('optimize') || lowerQuery.includes('improve')) return 'optimization';
    if (lowerQuery.includes('setup') || lowerQuery.includes('install')) return 'configuration';
    
    return 'analysis';
  }

  private classifyProblemType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('error') || lowerQuery.includes('exception')) return 'error';
    if (lowerQuery.includes('slow') || lowerQuery.includes('performance')) return 'performance';
    if (lowerQuery.includes('security') || lowerQuery.includes('vulnerability')) return 'security';
    if (lowerQuery.includes('setup') || lowerQuery.includes('configuration')) return 'configuration';
    
    return 'general';
  }

  private assessComplexity(query: string): string {
    const complexKeywords = ['distributed', 'microservices', 'architecture', 'scalability'];
    const intermediateKeywords = ['integration', 'optimization', 'performance'];
    
    const lowerQuery = query.toLowerCase();
    
    if (complexKeywords.some(keyword => lowerQuery.includes(keyword))) return 'high';
    if (intermediateKeywords.some(keyword => lowerQuery.includes(keyword))) return 'medium';
    
    return 'low';
  }

  private estimateResolutionTime(query: string, category: string): string {
    const complexity = this.assessComplexity(query);
    const urgency = this.assessUrgency(query);
    
    if (complexity === 'high' || urgency === 5) return '2-4 hours';
    if (complexity === 'medium' || urgency === 4) return '30-60 minutes';
    
    return '15-30 minutes';
  }

  private requiresExpert(query: string): boolean {
    const expertKeywords = ['architecture', 'security audit', 'performance tuning', 'database optimization'];
    const lowerQuery = query.toLowerCase();
    
    return expertKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  private identifyRelatedTopics(query: string, category: string): string[] {
    const topics = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('performance')) topics.push('Caching', 'Load Balancing', 'Database Optimization');
    if (lowerQuery.includes('security')) topics.push('Authentication', 'Encryption', 'Input Validation');
    if (lowerQuery.includes('api')) topics.push('REST Design', 'Rate Limiting', 'Error Handling');
    if (lowerQuery.includes('database')) topics.push('Indexing', 'Query Optimization', 'Connection Pooling');
    
    return topics;
  }

  private calculateCost(query: string, category: string): number {
    const baseTokens = Math.ceil(query.length / 4);
    const categoryMultiplier = category === 'general' ? 1 : 1.2;
    return baseTokens * categoryMultiplier * 0.0005; // $0.0005 per token
  }

  private formatTechnicalResponse(analysis: any): string {
    let response = `🔧 **Technical Support Analysis**\n\n`;
    
    response += `**Problem Classification:**\n`;
    response += `• Type: ${analysis.structured_data.problem_type}\n`;
    response += `• Complexity: ${analysis.structured_data.complexity_level}\n`;
    response += `• Estimated Resolution: ${analysis.structured_data.estimated_resolution_time}\n\n`;
    
    response += `**Analysis:**\n`;
    response += `${analysis.main_response}\n\n`;
    
    if (analysis.troubleshooting_steps.length > 0) {
      response += `**Troubleshooting Steps:**\n`;
      analysis.troubleshooting_steps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`;
      });
      response += '\n';
    }
    
    if (analysis.related_topics.length > 0) {
      response += `**Related Topics:** ${analysis.related_topics.join(', ')}\n`;
    }
    
    return response;
  }

  /**
   * Get tool definition
   */
  getDefinition(): MCPTool {
    return this.toolDefinition;
  }
}