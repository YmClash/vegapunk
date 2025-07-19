/**
 * Memory System for Vegapunk Agents
 * Implements short-term, long-term, and semantic memory
 * Following Anthropic's principle: Start simple, ensure transparency
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@utils/logger';
import type { Memory, MemoryType } from '@interfaces/base.types';
import type { MemoryCapabilities } from '@interfaces/capabilities.types';

export interface MemoryInput {
  type: MemoryType;
  content: unknown;
  importance: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  type?: MemoryType;
  limit?: number;
  minImportance?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export class MemorySystem {
  private readonly logger = createLogger('MemorySystem');
  private readonly capabilities: MemoryCapabilities;
  
  // Simple in-memory storage (can be replaced with Redis/DB later)
  private shortTermMemory: Map<string, Memory> = new Map();
  private longTermMemory: Map<string, Memory> = new Map();
  
  // Memory indices for faster retrieval
  private memoryByType: Map<MemoryType, Set<string>> = new Map();
  private memoryByImportance: Memory[] = []; // Sorted by importance
  
  constructor(capabilities: MemoryCapabilities) {
    this.capabilities = capabilities;
    
    // Initialize type indices
    for (const type of capabilities.supportedMemoryTypes) {
      this.memoryByType.set(type, new Set());
    }
    
    this.logger.info('Memory system initialized', {
      shortTermCapacity: capabilities.shortTermCapacity,
      longTermCapacity: capabilities.longTermCapacity,
    });
  }

  /**
   * Store a new memory
   */
  public async store(input: MemoryInput): Promise<string> {
    const memory: Memory = {
      id: uuidv4(),
      type: input.type,
      content: input.content,
      importance: Math.max(0, Math.min(1, input.importance)),
      timestamp: new Date(),
      retrievalCount: 0,
      metadata: input.metadata || {},
    };

    // Determine storage location based on importance
    if (memory.importance >= 0.7) {
      await this.storeLongTerm(memory);
    } else {
      await this.storeShortTerm(memory);
    }

    // Update indices
    this.updateIndices(memory);

    this.logger.debug('Memory stored', {
      id: memory.id,
      type: memory.type,
      importance: memory.importance,
    });

    return memory.id;
  }

  /**
   * Retrieve memories based on query
   */
  public async retrieve(query: MemoryQuery): Promise<Memory[]> {
    let memories: Memory[] = [];

    // Get all relevant memories
    if (query.type) {
      const typeMemoryIds = this.memoryByType.get(query.type) ?? new Set();
      for (const id of typeMemoryIds) {
        const memory = this.getMemoryById(id);
        if (memory) {
          memories.push(memory);
        }
      }
    } else {
      // Get all memories
      memories = [
        ...Array.from(this.shortTermMemory.values()),
        ...Array.from(this.longTermMemory.values()),
      ];
    }

    // Apply filters
    memories = this.applyFilters(memories, query);

    // Sort by relevance (importance + recency)
    memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreB - scoreA;
    });

    // Apply limit
    const limit = query.limit ?? 10;
    memories = memories.slice(0, limit);

    // Update retrieval counts
    for (const memory of memories) {
      memory.retrievalCount++;
    }

    return memories;
  }

  /**
   * Consolidate memories - move important short-term to long-term
   */
  public async consolidate(): Promise<void> {
    this.logger.info('Starting memory consolidation');
    
    const shortTermEntries = Array.from(this.shortTermMemory.entries());
    let consolidated = 0;

    for (const [id, memory] of shortTermEntries) {
      // Move to long-term if frequently accessed or important
      if (memory.retrievalCount >= 3 || memory.importance >= 0.6) {
        await this.moveToLongTerm(id, memory);
        consolidated++;
      }
    }

    // Manage capacity if needed
    if (this.capabilities.canForget) {
      await this.manageCapacity();
    }

    this.logger.info('Memory consolidation complete', { consolidated });
  }

  /**
   * Clear all memories (useful for testing)
   */
  public clear(): void {
    this.shortTermMemory.clear();
    this.longTermMemory.clear();
    this.memoryByType.forEach(set => set.clear());
    this.memoryByImportance = [];
    this.logger.info('All memories cleared');
  }

  /**
   * Get memory statistics
   */
  public getStats(): {
    shortTermCount: number;
    longTermCount: number;
    totalCount: number;
    capacityUsage: {
      shortTerm: number;
      longTerm: number;
    };
  } {
    const shortTermCount = this.shortTermMemory.size;
    const longTermCount = this.longTermMemory.size;

    return {
      shortTermCount,
      longTermCount,
      totalCount: shortTermCount + longTermCount,
      capacityUsage: {
        shortTerm: shortTermCount / this.capabilities.shortTermCapacity,
        longTerm: longTermCount / this.capabilities.longTermCapacity,
      },
    };
  }

  // Private helper methods
  
  private async storeShortTerm(memory: Memory): Promise<void> {
    // Check capacity
    if (this.shortTermMemory.size >= this.capabilities.shortTermCapacity) {
      await this.evictFromShortTerm();
    }
    
    this.shortTermMemory.set(memory.id, memory);
  }

  private async storeLongTerm(memory: Memory): Promise<void> {
    // Check capacity
    if (this.longTermMemory.size >= this.capabilities.longTermCapacity) {
      await this.evictFromLongTerm();
    }
    
    this.longTermMemory.set(memory.id, memory);
  }

  private async moveToLongTerm(id: string, memory: Memory): Promise<void> {
    this.shortTermMemory.delete(id);
    await this.storeLongTerm(memory);
  }

  private updateIndices(memory: Memory): void {
    // Update type index
    const typeSet = this.memoryByType.get(memory.type);
    if (typeSet) {
      typeSet.add(memory.id);
    }

    // Update importance index
    this.memoryByImportance.push(memory);
    this.memoryByImportance.sort((a, b) => b.importance - a.importance);
  }

  private getMemoryById(id: string): Memory | undefined {
    return this.shortTermMemory.get(id) ?? this.longTermMemory.get(id);
  }

  private applyFilters(memories: Memory[], query: MemoryQuery): Memory[] {
    let filtered = memories;

    // Filter by importance
    if (query.importance?.min !== undefined) {
      filtered = filtered.filter(m => m.importance >= query.importance!.min!);
    }

    // Filter by time range
    if (query.timeRange) {
      filtered = filtered.filter(m => {
        const timestamp = m.timestamp.getTime();
        return timestamp >= query.timeRange!.start.getTime() && 
               timestamp <= query.timeRange!.end.getTime();
      });
    }

    // Simple text search in content
    if (query.searchTerm) {
      filtered = filtered.filter(m => {
        const content = JSON.stringify(m.content).toLowerCase();
        return content.includes(query.searchTerm!.toLowerCase());
      });
    }

    return filtered;
  }

  private calculateRelevanceScore(memory: Memory): number {
    // Combine importance, recency, and retrieval count
    const recencyScore = 1 / (1 + (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60)); // Hours
    const retrievalScore = Math.min(1, memory.retrievalCount / 10);
    
    return (memory.importance * 0.5) + (recencyScore * 0.3) + (retrievalScore * 0.2);
  }

  private async evictFromShortTerm(): Promise<void> {
    // Evict least important and oldest memories
    const memories = Array.from(this.shortTermMemory.values());
    memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreA - scoreB;
    });

    // Remove bottom 20%
    const toRemove = Math.ceil(memories.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const memory = memories[i];
      if (memory) {
        this.shortTermMemory.delete(memory.id);
        this.removeFromIndices(memory);
      }
    }
  }

  private async evictFromLongTerm(): Promise<void> {
    if (!this.capabilities.canForget) {
      throw new Error('Long-term memory is full and forgetting is disabled');
    }

    // Only evict very old and unimportant memories
    const memories = Array.from(this.longTermMemory.values());
    memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreA - scoreB;
    });

    // Remove bottom 10%
    const toRemove = Math.ceil(memories.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      const memory = memories[i];
      if (memory && memory.importance < 0.5) { // Only remove if not important
        this.longTermMemory.delete(memory.id);
        this.removeFromIndices(memory);
      }
    }
  }

  private removeFromIndices(memory: Memory): void {
    // Remove from type index
    const typeSet = this.memoryByType.get(memory.type);
    if (typeSet) {
      typeSet.delete(memory.id);
    }

    // Remove from importance index
    this.memoryByImportance = this.memoryByImportance.filter(m => m.id !== memory.id);
  }

  private async manageCapacity(): Promise<void> {
    const stats = this.getStats();
    
    if (stats.capacityUsage.shortTerm > 0.9) {
      await this.evictFromShortTerm();
    }
    
    if (stats.capacityUsage.longTerm > 0.9) {
      await this.evictFromLongTerm();
    }
  }
}