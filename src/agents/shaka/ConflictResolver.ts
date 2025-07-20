/**
 * Conflict Resolver for Shaka Agent
 * Detects and resolves ethical conflicts between policies, agents, and goals
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { createLogger } from '@utils/logger';
import type { LLMProvider } from '@utils/llm/LLMProvider';
import type { EthicalPolicy, EthicalContext } from './EthicalPolicyEngine';
import type { Goal, AgentMessage } from '@interfaces/base.types';

export interface Conflict {
  id: string;
  type: 'policy' | 'agent' | 'goal' | 'value';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  entities: string[]; // IDs of conflicting entities
  context: unknown;
  detectedAt: Date;
  status: 'detected' | 'resolving' | 'resolved' | 'escalated';
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'prioritize' | 'compromise' | 'defer' | 'escalate' | 'abstain';
  reasoning: string;
  actions: ResolutionAction[];
  confidence: number; // 0-1
  estimatedImpact: {
    positive: string[];
    negative: string[];
    stakeholders: string[];
  };
}

export interface ResolutionAction {
  id: string;
  type: 'modify_policy' | 'adjust_goal' | 'send_message' | 'request_approval' | 'delay_action';
  description: string;
  target: string; // ID of target entity
  parameters: Record<string, unknown>;
}

export interface ConflictPattern {
  type: string;
  frequency: number;
  commonResolutions: string[];
  successRate: number;
}

export class ConflictResolver extends EventEmitter {
  private readonly logger = createLogger('ConflictResolver');
  private readonly llmProvider: LLMProvider;
  
  // Track conflicts and resolutions
  private activeConflicts: Map<string, Conflict> = new Map();
  private resolutionHistory: ConflictResolution[] = [];
  private conflictPatterns: Map<string, ConflictPattern> = new Map();

  constructor(llmProvider: LLMProvider) {
    super();
    this.llmProvider = llmProvider;
    
    this.logger.info('Conflict Resolver initialized');
  }

  /**
   * Detect conflicts in given context
   */
  public async detectConflicts(context: {
    policies?: EthicalPolicy[];
    goals?: Goal[];
    messages?: AgentMessage[];
    actions?: string[];
    ethicalContext?: EthicalContext;
  }): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Detect policy conflicts
    if (context.policies && context.policies.length > 1) {
      const policyConflicts = await this.detectPolicyConflicts(context.policies, context.ethicalContext);
      conflicts.push(...policyConflicts);
    }

    // Detect goal conflicts
    if (context.goals && context.goals.length > 1) {
      const goalConflicts = await this.detectGoalConflicts(context.goals);
      conflicts.push(...goalConflicts);
    }

    // Detect agent communication conflicts
    if (context.messages && context.messages.length > 0) {
      const messageConflicts = await this.detectMessageConflicts(context.messages);
      conflicts.push(...messageConflicts);
    }

    // Store newly detected conflicts
    for (const conflict of conflicts) {
      this.activeConflicts.set(conflict.id, conflict);
    }

    this.logger.debug('Conflicts detected', { count: conflicts.length });
    return conflicts;
  }

  /**
   * Resolve a specific conflict
   */
  public async resolveConflict(conflictId: string): Promise<ConflictResolution> {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    this.logger.info('Resolving conflict', { conflictId, type: conflict.type });

    // Update conflict status
    conflict.status = 'resolving';

    // Determine resolution strategy based on conflict type and context
    const resolution = await this.determineResolutionStrategy(conflict);

    // Execute resolution if possible
    if (resolution.strategy !== 'defer' && resolution.strategy !== 'escalate') {
      await this.executeResolution(resolution);
      conflict.status = 'resolved';
    } else {
      conflict.status = 'escalated';
    }

    // Store resolution in history
    this.resolutionHistory.push(resolution);

    // Update patterns
    this.updateConflictPatterns(conflict, resolution);

    this.logger.info('Conflict resolution complete', {
      conflictId,
      strategy: resolution.strategy,
      confidence: resolution.confidence,
    });

    return resolution;
  }

  /**
   * Get all active conflicts
   */
  public getActiveConflicts(): Conflict[] {
    return Array.from(this.activeConflicts.values())
      .filter(c => c.status === 'detected' || c.status === 'resolving');
  }

  /**
   * Get conflict resolution statistics
   */
  public getStats(): {
    totalConflicts: number;
    activeConflicts: number;
    resolvedConflicts: number;
    resolutionSuccessRate: number;
    commonPatterns: ConflictPattern[];
  } {
    const total = this.resolutionHistory.length;
    const active = this.getActiveConflicts().length;
    const resolved = this.resolutionHistory.filter(r => r.strategy !== 'escalate').length;
    const successRate = total > 0 ? resolved / total : 0;

    return {
      totalConflicts: total,
      activeConflicts: active,
      resolvedConflicts: resolved,
      resolutionSuccessRate: successRate,
      commonPatterns: Array.from(this.conflictPatterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
    };
  }

  // Private methods

  private async detectPolicyConflicts(
    policies: EthicalPolicy[],
    context?: EthicalContext,
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for framework conflicts
    const frameworkGroups = new Map<string, EthicalPolicy[]>();
    for (const policy of policies) {
      const group = frameworkGroups.get(policy.framework) ?? [];
      group.push(policy);
      frameworkGroups.set(policy.framework, group);
    }

    // Detect conflicts between different frameworks
    const frameworks = Array.from(frameworkGroups.keys());
    for (let i = 0; i < frameworks.length; i++) {
      for (let j = i + 1; j < frameworks.length; j++) {
        const framework1 = frameworks[i]!;
        const framework2 = frameworks[j]!;
        
        const conflictDetected = await this.checkFrameworkConflict(
          frameworkGroups.get(framework1)!,
          frameworkGroups.get(framework2)!,
          context,
        );

        if (conflictDetected) {
          conflicts.push({
            id: uuidv4(),
            type: 'policy',
            severity: 'medium',
            description: `Potential conflict between ${framework1} and ${framework2} frameworks`,
            entities: [framework1, framework2],
            context,
            detectedAt: new Date(),
            status: 'detected',
          });
        }
      }
    }

    // Check for priority conflicts
    const highPriorityPolicies = policies.filter(p => p.priority >= 8);
    if (highPriorityPolicies.length > 1) {
      const priorityConflict = await this.checkPriorityConflict(highPriorityPolicies, context);
      if (priorityConflict) {
        conflicts.push(priorityConflict);
      }
    }

    return conflicts;
  }

  private async detectGoalConflicts(goals: Goal[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for deadline conflicts
    const urgentGoals = goals.filter(g => g.deadline && g.deadline.getTime() - Date.now() < 3600000); // 1 hour
    if (urgentGoals.length > 1) {
      conflicts.push({
        id: uuidv4(),
        type: 'goal',
        severity: 'high',
        description: `Multiple urgent goals with conflicting deadlines`,
        entities: urgentGoals.map(g => g.id),
        context: { goals: urgentGoals },
        detectedAt: new Date(),
        status: 'detected',
      });
    }

    // Check for priority conflicts
    const highPriorityGoals = goals.filter(g => g.priority >= 8);
    if (highPriorityGoals.length > 2) {
      conflicts.push({
        id: uuidv4(),
        type: 'goal',
        severity: 'medium',
        description: `Too many high-priority goals may cause resource conflicts`,
        entities: highPriorityGoals.map(g => g.id),
        context: { goals: highPriorityGoals },
        detectedAt: new Date(),
        status: 'detected',
      });
    }

    return conflicts;
  }

  private async detectMessageConflicts(messages: AgentMessage[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for contradictory messages
    const recentMessages = messages.filter(m => 
      Date.now() - m.timestamp.getTime() < 300000, // 5 minutes
    );

    if (recentMessages.length > 1) {
      const contradiction = await this.checkMessageContradictions(recentMessages);
      if (contradiction) {
        conflicts.push({
          id: uuidv4(),
          type: 'agent',
          severity: 'medium',
          description: 'Contradictory messages detected between agents',
          entities: recentMessages.map(m => m.from),
          context: { messages: recentMessages },
          detectedAt: new Date(),
          status: 'detected',
        });
      }
    }

    return conflicts;
  }

  private async checkFrameworkConflict(
    policies1: EthicalPolicy[],
    policies2: EthicalPolicy[],
    context?: EthicalContext,
  ): Promise<boolean> {
    const prompt = `
    Analyze potential conflicts between these ethical frameworks:
    
    Framework 1 Policies: ${policies1.map(p => `${p.name}: ${p.description}`).join('; ')}
    Framework 2 Policies: ${policies2.map(p => `${p.name}: ${p.description}`).join('; ')}
    
    Context: ${JSON.stringify(context ?? {})}
    
    Are there fundamental conflicts between these approaches that could lead to contradictory recommendations?
    Respond with YES or NO and brief reasoning.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Analyze ethical framework conflicts objectively.',
      temperature: 0.2,
    });

    return response.content.toLowerCase().includes('yes');
  }

  private async checkPriorityConflict(
    policies: EthicalPolicy[],
    context?: EthicalContext,
  ): Promise<Conflict | null> {
    if (policies.length < 2) return null;

    const prompt = `
    Analyze priority conflicts between these high-priority ethical policies:
    
    ${policies.map(p => `${p.name} (Priority ${p.priority}): ${p.description}`).join('\n')}
    
    Context: ${JSON.stringify(context ?? {})}
    
    Could these policies conflict in the given context? Rate severity (LOW/MEDIUM/HIGH) and explain.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Evaluate policy conflicts and their severity.',
      temperature: 0.2,
    });

    const severityMatch = response.content.match(/(LOW|MEDIUM|HIGH)/i);
    const severity = severityMatch ? severityMatch[1].toLowerCase() as 'low' | 'medium' | 'high' : 'medium';

    if (severity !== 'low') {
      return {
        id: uuidv4(),
        type: 'policy',
        severity,
        description: `High-priority policy conflict: ${policies.map(p => p.name).join(', ')}`,
        entities: policies.map(p => p.id),
        context,
        detectedAt: new Date(),
        status: 'detected',
      };
    }

    return null;
  }

  private async checkMessageContradictions(messages: AgentMessage[]): Promise<boolean> {
    const prompt = `
    Analyze these recent agent messages for contradictions:
    
    ${messages.map(m => `${m.from}: ${JSON.stringify(m.content)}`).join('\n')}
    
    Are there significant contradictions that could cause confusion or conflicts?
    Respond with YES or NO and brief reasoning.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Identify contradictions in agent communications.',
      temperature: 0.2,
    });

    return response.content.toLowerCase().includes('yes');
  }

  private async determineResolutionStrategy(conflict: Conflict): Promise<ConflictResolution> {
    const prompt = `
    Determine the best resolution strategy for this conflict:
    
    Type: ${conflict.type}
    Severity: ${conflict.severity}
    Description: ${conflict.description}
    Context: ${JSON.stringify(conflict.context)}
    
    Available strategies:
    - PRIORITIZE: Choose the higher priority option
    - COMPROMISE: Find middle ground solution
    - DEFER: Delay decision pending more information
    - ESCALATE: Require human intervention
    - ABSTAIN: Avoid action that causes conflict
    
    Recommend strategy with reasoning and specific actions.
    `;

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt: 'Recommend conflict resolution strategies with clear reasoning.',
      temperature: 0.4,
    });

    const strategyMatch = response.content.match(/(PRIORITIZE|COMPROMISE|DEFER|ESCALATE|ABSTAIN)/i);
    const strategy = strategyMatch 
      ? strategyMatch[1].toLowerCase() as ConflictResolution['strategy']
      : 'defer';

    // Generate specific actions based on strategy
    const actions = await this.generateResolutionActions(conflict, strategy);

    return {
      conflictId: conflict.id,
      strategy,
      reasoning: response.content,
      actions,
      confidence: this.calculateResolutionConfidence(conflict, strategy),
      estimatedImpact: await this.estimateResolutionImpact(conflict, strategy),
    };
  }

  private async generateResolutionActions(
    conflict: Conflict,
    strategy: ConflictResolution['strategy'],
  ): Promise<ResolutionAction[]> {
    const actions: ResolutionAction[] = [];

    switch (strategy) {
      case 'prioritize':
        actions.push({
          id: uuidv4(),
          type: 'adjust_goal',
          description: 'Adjust lower priority goals to resolve conflict',
          target: conflict.entities[0] ?? '',
          parameters: { action: 'lower_priority' },
        });
        break;

      case 'compromise':
        actions.push({
          id: uuidv4(),
          type: 'modify_policy',
          description: 'Create compromise policy that balances conflicting requirements',
          target: 'new_policy',
          parameters: { type: 'compromise', conflictId: conflict.id },
        });
        break;

      case 'escalate':
        actions.push({
          id: uuidv4(),
          type: 'request_approval',
          description: 'Request human intervention for conflict resolution',
          target: 'human_operator',
          parameters: { urgency: conflict.severity },
        });
        break;

      case 'defer':
        actions.push({
          id: uuidv4(),
          type: 'delay_action',
          description: 'Delay conflicting actions pending more information',
          target: conflict.entities.join(','),
          parameters: { delay_duration: 300000 }, // 5 minutes
        });
        break;

      case 'abstain':
        // No actions needed - just avoid the conflicting action
        break;
    }

    return actions;
  }

  private calculateResolutionConfidence(
    conflict: Conflict,
    strategy: ConflictResolution['strategy'],
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for familiar conflict patterns
    const pattern = this.conflictPatterns.get(conflict.type);
    if (pattern && pattern.commonResolutions.includes(strategy)) {
      confidence += pattern.successRate * 0.3;
    }

    // Adjust based on conflict severity
    switch (conflict.severity) {
      case 'low':
        confidence += 0.2;
        break;
      case 'medium':
        confidence += 0.1;
        break;
      case 'high':
        confidence -= 0.1;
        break;
      case 'critical':
        confidence -= 0.2;
        break;
    }

    // Strategy-specific adjustments
    switch (strategy) {
      case 'escalate':
        confidence = 0.9; // High confidence in escalation
        break;
      case 'abstain':
        confidence += 0.1; // Conservative approach
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private async estimateResolutionImpact(
    conflict: Conflict,
    strategy: ConflictResolution['strategy'],
  ): Promise<ConflictResolution['estimatedImpact']> {
    // Simplified impact estimation
    const impact = {
      positive: [] as string[],
      negative: [] as string[],
      stakeholders: conflict.entities,
    };

    switch (strategy) {
      case 'prioritize':
        impact.positive.push('Clear decision path', 'Reduces uncertainty');
        impact.negative.push('Some requirements may be unmet');
        break;
      case 'compromise':
        impact.positive.push('Balances competing interests', 'Maintains relationships');
        impact.negative.push('May not fully satisfy any party');
        break;
      case 'escalate':
        impact.positive.push('Human oversight', 'Authoritative resolution');
        impact.negative.push('Delays decision', 'Resource intensive');
        break;
      case 'defer':
        impact.positive.push('Allows more information gathering');
        impact.negative.push('Delays resolution', 'May worsen conflict');
        break;
      case 'abstain':
        impact.positive.push('Avoids potential harm');
        impact.negative.push('Missed opportunities', 'Inaction costs');
        break;
    }

    return impact;
  }

  private async executeResolution(resolution: ConflictResolution): Promise<void> {
    this.logger.info('Executing conflict resolution', {
      conflictId: resolution.conflictId,
      strategy: resolution.strategy,
      actionsCount: resolution.actions.length,
    });

    for (const action of resolution.actions) {
      try {
        await this.executeResolutionAction(action);
      } catch (error) {
        this.logger.error('Failed to execute resolution action', {
          actionId: action.id,
          error,
        });
      }
    }
  }

  private async executeResolutionAction(action: ResolutionAction): Promise<void> {
    // In a real implementation, this would execute the specific action
    this.logger.debug('Executing resolution action', {
      actionId: action.id,
      type: action.type,
      target: action.target,
    });

    // Placeholder implementation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private updateConflictPatterns(conflict: Conflict, resolution: ConflictResolution): void {
    const patternKey = `${conflict.type}-${conflict.severity}`;
    const pattern = this.conflictPatterns.get(patternKey) ?? {
      type: patternKey,
      frequency: 0,
      commonResolutions: [],
      successRate: 0,
    };

    pattern.frequency++;
    
    if (!pattern.commonResolutions.includes(resolution.strategy)) {
      pattern.commonResolutions.push(resolution.strategy);
    }

    // Update success rate (simplified)
    const success = resolution.strategy !== 'escalate' ? 1 : 0;
    pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + success) / pattern.frequency;

    this.conflictPatterns.set(patternKey, pattern);
  }
}