/**
 * Analytics Engine
 * Advanced analytics system for multi-agent performance and insights
 */

import { EventEmitter } from 'events';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';

export interface MetricPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  taskCount: number;
  successRate: number;
  averageResponseTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    tokens: number;
  };
  performance: {
    accuracy: number;
    efficiency: number;
    innovation: number;
    collaboration: number;
  };
  timeSeries: {
    responseTime: MetricPoint[];
    taskCompletion: MetricPoint[];
    resourceUsage: MetricPoint[];
  };
}

export interface SystemMetrics {
  timestamp: Date;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  systemLoad: number;
  errorRate: number;
  throughput: number;
  latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface CollaborationMetrics {
  collaborationId: string;
  participants: string[];
  duration: number;
  messageCount: number;
  consensusReached: boolean;
  conflictResolutions: number;
  synergyScore: number;
  outcomeQuality: number;
}

export interface InsightReport {
  id: string;
  type: 'performance' | 'anomaly' | 'optimization' | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  impactScore: number;
  confidence: number;
  timestamp: Date;
}

export interface AnalyticsQuery {
  metrics?: string[];
  agents?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  groupBy?: 'agent' | 'task' | 'time';
  filters?: Record<string, any>;
}

export class AnalyticsEngine extends EventEmitter {
  private llmProvider: LLMProvider;
  private metricsStore: Map<string, any[]> = new Map();
  private insights: InsightReport[] = [];
  private aggregationInterval: NodeJS.Timeout | null = null;
  private anomalyDetectionEnabled: boolean = true;
  private insightGenerationEnabled: boolean = true;

  constructor(llmProvider: LLMProvider) {
    super();
    this.llmProvider = llmProvider;
    this.startAggregation();
  }

  /**
   * Record agent metrics
   */
  async recordAgentMetrics(metrics: Partial<AgentMetrics>): Promise<void> {
    try {
      const key = `agent:${metrics.agentId}`;
      const existing = this.metricsStore.get(key) || [];
      existing.push({
        ...metrics,
        timestamp: new Date(),
      });
      
      // Keep only last 1000 entries per agent
      if (existing.length > 1000) {
        existing.shift();
      }
      
      this.metricsStore.set(key, existing);
      
      // Check for anomalies
      if (this.anomalyDetectionEnabled) {
        await this.detectAnomalies(metrics);
      }
      
      this.emit('metrics:recorded', { type: 'agent', metrics });
    } catch (error) {
      logger.error('Failed to record agent metrics:', error);
    }
  }

  /**
   * Record system-wide metrics
   */
  async recordSystemMetrics(metrics: Partial<SystemMetrics>): Promise<void> {
    try {
      const key = 'system:global';
      const existing = this.metricsStore.get(key) || [];
      existing.push({
        ...metrics,
        timestamp: new Date(),
      });
      
      // Keep only last 10000 system metrics
      if (existing.length > 10000) {
        existing.shift();
      }
      
      this.metricsStore.set(key, existing);
      
      // Generate insights periodically
      if (this.insightGenerationEnabled && existing.length % 100 === 0) {
        await this.generateSystemInsights();
      }
      
      this.emit('metrics:recorded', { type: 'system', metrics });
    } catch (error) {
      logger.error('Failed to record system metrics:', error);
    }
  }

  /**
   * Record collaboration metrics
   */
  async recordCollaborationMetrics(metrics: CollaborationMetrics): Promise<void> {
    try {
      const key = `collaboration:${metrics.collaborationId}`;
      this.metricsStore.set(key, metrics);
      
      // Analyze collaboration effectiveness
      await this.analyzeCollaborationEffectiveness(metrics);
      
      this.emit('metrics:recorded', { type: 'collaboration', metrics });
    } catch (error) {
      logger.error('Failed to record collaboration metrics:', error);
    }
  }

  /**
   * Query analytics data
   */
  async query(query: AnalyticsQuery): Promise<any> {
    try {
      let results: any[] = [];
      
      // Collect relevant metrics
      for (const [key, data] of this.metricsStore.entries()) {
        if (query.agents && !query.agents.some(agent => key.includes(agent))) {
          continue;
        }
        
        let filtered = data;
        
        // Apply time range filter
        if (query.timeRange) {
          filtered = data.filter((item: any) => {
            const timestamp = new Date(item.timestamp);
            return timestamp >= query.timeRange!.start && timestamp <= query.timeRange!.end;
          });
        }
        
        // Apply custom filters
        if (query.filters) {
          filtered = filtered.filter((item: any) => {
            return Object.entries(query.filters!).every(([field, value]) => {
              return item[field] === value;
            });
          });
        }
        
        results.push(...filtered);
      }
      
      // Apply aggregation
      if (query.aggregation) {
        results = this.aggregate(results, query.aggregation, query.groupBy);
      }
      
      return results;
    } catch (error) {
      logger.error('Analytics query failed:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(agentId?: string): Promise<string> {
    try {
      const prompt = `Generate a comprehensive performance report based on these analytics metrics:

Agent Metrics:
${JSON.stringify(this.getAgentMetrics(agentId), null, 2)}

System Metrics:
${JSON.stringify(this.getLatestSystemMetrics(), null, 2)}

Recent Insights:
${JSON.stringify(this.insights.slice(-10), null, 2)}

Provide:
1. Executive summary
2. Key performance indicators
3. Trends and patterns
4. Areas of concern
5. Optimization recommendations
6. Predicted future performance`;

      const response = await this.llmProvider.generateResponse([
        { role: 'system', content: 'You are an expert analytics system generating detailed performance reports.' },
        { role: 'user', content: prompt }
      ]);

      return response;
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in metrics
   */
  private async detectAnomalies(metrics: Partial<AgentMetrics>): Promise<void> {
    try {
      // Simple anomaly detection based on statistical thresholds
      const historicalData = this.getAgentMetrics(metrics.agentId);
      
      if (historicalData.length < 10) return; // Need sufficient data
      
      // Calculate statistics
      const responseTime = metrics.averageResponseTime || 0;
      const historicalResponseTimes = historicalData.map(d => d.averageResponseTime);
      const mean = historicalResponseTimes.reduce((a, b) => a + b, 0) / historicalResponseTimes.length;
      const stdDev = Math.sqrt(
        historicalResponseTimes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalResponseTimes.length
      );
      
      // Check if current value is anomalous (3 standard deviations)
      if (Math.abs(responseTime - mean) > 3 * stdDev) {
        const insight: InsightReport = {
          id: `anomaly-${Date.now()}`,
          type: 'anomaly',
          severity: 'warning',
          title: `Anomalous Response Time Detected for ${metrics.agentName}`,
          description: `Response time of ${responseTime}ms is significantly different from the average of ${mean.toFixed(2)}ms`,
          recommendations: [
            'Check agent resource allocation',
            'Review recent task complexity',
            'Verify network connectivity',
            'Consider scaling resources'
          ],
          impactScore: 0.7,
          confidence: 0.85,
          timestamp: new Date()
        };
        
        this.insights.push(insight);
        this.emit('insight:generated', insight);
      }
      
      // Check error rate
      if (metrics.performance && metrics.performance.accuracy < 0.8) {
        const insight: InsightReport = {
          id: `performance-${Date.now()}`,
          type: 'performance',
          severity: 'critical',
          title: `Low Accuracy Detected for ${metrics.agentName}`,
          description: `Accuracy has dropped to ${(metrics.performance.accuracy * 100).toFixed(1)}%`,
          recommendations: [
            'Review agent training data',
            'Check for model drift',
            'Validate input data quality',
            'Consider retraining or fine-tuning'
          ],
          impactScore: 0.9,
          confidence: 0.9,
          timestamp: new Date()
        };
        
        this.insights.push(insight);
        this.emit('insight:generated', insight);
      }
    } catch (error) {
      logger.error('Anomaly detection failed:', error);
    }
  }

  /**
   * Generate system-wide insights
   */
  private async generateSystemInsights(): Promise<void> {
    try {
      const systemMetrics = this.getLatestSystemMetrics();
      const recentMetrics = systemMetrics.slice(-100);
      
      // Analyze trends
      const loadTrend = this.calculateTrend(recentMetrics.map(m => m.systemLoad));
      const errorTrend = this.calculateTrend(recentMetrics.map(m => m.errorRate));
      
      // Generate insights using LLM
      const prompt = `Analyze these system metrics and generate actionable insights:

Recent Metrics Summary:
- Average System Load: ${(recentMetrics.reduce((a, m) => a + m.systemLoad, 0) / recentMetrics.length).toFixed(2)}%
- Error Rate Trend: ${errorTrend > 0 ? 'Increasing' : 'Decreasing'} (${(errorTrend * 100).toFixed(2)}%)
- Active Agents: ${recentMetrics[recentMetrics.length - 1]?.activeAgents || 0}
- Throughput: ${(recentMetrics.reduce((a, m) => a + m.throughput, 0) / recentMetrics.length).toFixed(2)} tasks/min

Generate 3-5 specific, actionable insights about system performance and optimization opportunities.`;

      const response = await this.llmProvider.generateResponse([
        { role: 'system', content: 'You are an expert system analyst. Generate concise, actionable insights.' },
        { role: 'user', content: prompt }
      ]);

      // Parse and store insights
      const lines = response.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.match(/^\d+\.|^-|^\*/)) {
          const insight: InsightReport = {
            id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'optimization',
            severity: 'info',
            title: 'System Optimization Opportunity',
            description: line.replace(/^\d+\.|^-|^\*/, '').trim(),
            recommendations: [],
            impactScore: 0.6,
            confidence: 0.75,
            timestamp: new Date()
          };
          
          this.insights.push(insight);
          this.emit('insight:generated', insight);
        }
      }
      
      // Keep only recent insights
      if (this.insights.length > 1000) {
        this.insights = this.insights.slice(-1000);
      }
    } catch (error) {
      logger.error('System insight generation failed:', error);
    }
  }

  /**
   * Analyze collaboration effectiveness
   */
  private async analyzeCollaborationEffectiveness(metrics: CollaborationMetrics): Promise<void> {
    try {
      // Calculate effectiveness score
      const effectivenessFactors = {
        consensusSpeed: metrics.consensusReached ? 1 / (metrics.duration / 60000) : 0, // Higher is better
        conflictResolution: 1 - (metrics.conflictResolutions / metrics.messageCount), // Fewer conflicts is better
        participation: metrics.messageCount / (metrics.participants.length * 10), // Active participation
        synergy: metrics.synergyScore,
        outcome: metrics.outcomeQuality
      };
      
      const effectivenessScore = Object.values(effectivenessFactors).reduce((a, b) => a + b, 0) / Object.keys(effectivenessFactors).length;
      
      if (effectivenessScore < 0.6) {
        const insight: InsightReport = {
          id: `collab-${Date.now()}`,
          type: 'optimization',
          severity: 'warning',
          title: 'Low Collaboration Effectiveness Detected',
          description: `Collaboration between ${metrics.participants.join(', ')} showed suboptimal effectiveness (${(effectivenessScore * 100).toFixed(1)}%)`,
          recommendations: [
            'Review agent communication protocols',
            'Optimize conflict resolution strategies',
            'Consider task decomposition for better parallelization',
            'Implement better consensus mechanisms'
          ],
          impactScore: 0.7,
          confidence: 0.8,
          timestamp: new Date()
        };
        
        this.insights.push(insight);
        this.emit('insight:generated', insight);
      }
    } catch (error) {
      logger.error('Collaboration analysis failed:', error);
    }
  }

  /**
   * Calculate trend from time series data
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Aggregate data based on specified method
   */
  private aggregate(data: any[], method: string, groupBy?: string): any[] {
    if (!groupBy) {
      // Simple aggregation
      const values = data.map(d => d.value || 0);
      switch (method) {
        case 'avg':
          return [{ value: values.reduce((a, b) => a + b, 0) / values.length }];
        case 'sum':
          return [{ value: values.reduce((a, b) => a + b, 0) }];
        case 'min':
          return [{ value: Math.min(...values) }];
        case 'max':
          return [{ value: Math.max(...values) }];
        case 'count':
          return [{ value: values.length }];
        default:
          return data;
      }
    }
    
    // Group by aggregation
    const groups = new Map<string, any[]>();
    for (const item of data) {
      const key = item[groupBy];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    const results: any[] = [];
    for (const [key, items] of groups.entries()) {
      results.push({
        [groupBy]: key,
        ...this.aggregate(items, method)[0]
      });
    }
    
    return results;
  }

  /**
   * Get agent metrics
   */
  private getAgentMetrics(agentId?: string): any[] {
    if (agentId) {
      return this.metricsStore.get(`agent:${agentId}`) || [];
    }
    
    const allAgentMetrics: any[] = [];
    for (const [key, data] of this.metricsStore.entries()) {
      if (key.startsWith('agent:')) {
        allAgentMetrics.push(...data);
      }
    }
    return allAgentMetrics;
  }

  /**
   * Get latest system metrics
   */
  private getLatestSystemMetrics(): any[] {
    return this.metricsStore.get('system:global') || [];
  }

  /**
   * Start periodic aggregation
   */
  private startAggregation(): void {
    this.aggregationInterval = setInterval(async () => {
      try {
        // Emit aggregated metrics
        const systemMetrics = this.getLatestSystemMetrics();
        if (systemMetrics.length > 0) {
          const latest = systemMetrics[systemMetrics.length - 1];
          this.emit('metrics:aggregated', {
            type: 'system',
            data: latest
          });
        }
        
        // Clean old data
        for (const [key, data] of this.metricsStore.entries()) {
          if (Array.isArray(data) && data.length > 10000) {
            this.metricsStore.set(key, data.slice(-5000));
          }
        }
      } catch (error) {
        logger.error('Aggregation cycle failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Get insights
   */
  getInsights(filters?: { type?: string; severity?: string; limit?: number }): InsightReport[] {
    let filtered = this.insights;
    
    if (filters?.type) {
      filtered = filtered.filter(i => i.type === filters.type);
    }
    
    if (filters?.severity) {
      filtered = filtered.filter(i => i.severity === filters.severity);
    }
    
    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }
    
    return filtered;
  }

  /**
   * Export analytics data
   */
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        systemMetrics: this.getLatestSystemMetrics(),
        agentMetrics: this.getAgentMetrics(),
        insights: this.insights,
        summary: {
          totalAgents: new Set(Array.from(this.metricsStore.keys()).filter(k => k.startsWith('agent:')).map(k => k.split(':')[1])).size,
          totalMetricPoints: Array.from(this.metricsStore.values()).reduce((sum, arr) => sum + arr.length, 0),
          totalInsights: this.insights.length
        }
      };
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }
      
      // CSV format (simplified)
      const csv: string[] = ['Timestamp,Type,Metric,Value'];
      for (const metric of data.systemMetrics) {
        csv.push(`${metric.timestamp},system,systemLoad,${metric.systemLoad}`);
        csv.push(`${metric.timestamp},system,errorRate,${metric.errorRate}`);
        csv.push(`${metric.timestamp},system,throughput,${metric.throughput}`);
      }
      
      return csv.join('\n');
    } catch (error) {
      logger.error('Failed to export analytics data:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    this.removeAllListeners();
    this.metricsStore.clear();
    this.insights = [];
  }
}