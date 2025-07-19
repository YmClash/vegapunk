/**
 * Unit tests for MemorySystem
 */

import { MemorySystem } from '@memory/MemorySystem';
import type { MemoryCapabilities } from '@interfaces/capabilities.types';

describe('MemorySystem', () => {
  let memorySystem: MemorySystem;
  
  const mockCapabilities: MemoryCapabilities = {
    shortTermCapacity: 10,
    longTermCapacity: 100,
    canForget: true,
    supportedMemoryTypes: ['episodic', 'semantic', 'procedural'],
    retrievalMethods: ['exact', 'semantic', 'temporal'],
  };

  beforeEach(() => {
    memorySystem = new MemorySystem(mockCapabilities);
  });

  afterEach(() => {
    memorySystem.clear();
  });

  describe('store', () => {
    it('should store a memory and return an ID', async () => {
      const id = await memorySystem.store({
        type: 'episodic',
        content: { event: 'test event' },
        importance: 0.5,
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should store high importance memories in long-term', async () => {
      await memorySystem.store({
        type: 'semantic',
        content: { fact: 'important fact' },
        importance: 0.8,
      });

      const stats = memorySystem.getStats();
      expect(stats.longTermCount).toBe(1);
      expect(stats.shortTermCount).toBe(0);
    });

    it('should store low importance memories in short-term', async () => {
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'minor event' },
        importance: 0.3,
      });

      const stats = memorySystem.getStats();
      expect(stats.shortTermCount).toBe(1);
      expect(stats.longTermCount).toBe(0);
    });
  });

  describe('retrieve', () => {
    beforeEach(async () => {
      // Store test memories
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'event1' },
        importance: 0.5,
      });
      await memorySystem.store({
        type: 'semantic',
        content: { fact: 'fact1' },
        importance: 0.8,
      });
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'event2' },
        importance: 0.2,
      });
    });

    it('should retrieve memories by type', async () => {
      const episodicMemories = await memorySystem.retrieve({
        type: 'episodic',
      });

      expect(episodicMemories).toHaveLength(2);
      expect(episodicMemories.every(m => m.type === 'episodic')).toBe(true);
    });

    it('should retrieve memories with minimum importance', async () => {
      const importantMemories = await memorySystem.retrieve({
        minImportance: 0.4,
      });

      expect(importantMemories).toHaveLength(2);
      expect(importantMemories.every(m => m.importance >= 0.4)).toBe(true);
    });

    it('should limit retrieval results', async () => {
      const limitedMemories = await memorySystem.retrieve({
        limit: 1,
      });

      expect(limitedMemories).toHaveLength(1);
    });

    it('should update retrieval count', async () => {
      const memories = await memorySystem.retrieve({
        type: 'episodic',
        limit: 1,
      });

      expect(memories[0]?.retrievalCount).toBe(1);
    });
  });

  describe('consolidate', () => {
    it('should move frequently accessed memories to long-term', async () => {
      // Store a memory
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'frequent event' },
        importance: 0.4,
      });

      // Access it multiple times
      await memorySystem.retrieve({ type: 'episodic' });
      await memorySystem.retrieve({ type: 'episodic' });
      await memorySystem.retrieve({ type: 'episodic' });

      // Consolidate
      await memorySystem.consolidate();

      const stats = memorySystem.getStats();
      expect(stats.longTermCount).toBe(1);
      expect(stats.shortTermCount).toBe(0);
    });
  });

  describe('capacity management', () => {
    it('should respect short-term capacity limits', async () => {
      // Fill beyond capacity
      for (let i = 0; i < 15; i++) {
        await memorySystem.store({
          type: 'episodic',
          content: { event: `event${i}` },
          importance: 0.1,
        });
      }

      const stats = memorySystem.getStats();
      expect(stats.shortTermCount).toBeLessThanOrEqual(mockCapabilities.shortTermCapacity);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'test' },
        importance: 0.3,
      });
      await memorySystem.store({
        type: 'semantic',
        content: { fact: 'test' },
        importance: 0.8,
      });

      const stats = memorySystem.getStats();
      expect(stats.totalCount).toBe(2);
      expect(stats.shortTermCount).toBe(1);
      expect(stats.longTermCount).toBe(1);
      expect(stats.capacityUsage.shortTerm).toBe(1 / mockCapabilities.shortTermCapacity);
    });
  });

  describe('clear', () => {
    it('should clear all memories', async () => {
      await memorySystem.store({
        type: 'episodic',
        content: { event: 'test' },
        importance: 0.5,
      });

      memorySystem.clear();

      const stats = memorySystem.getStats();
      expect(stats.totalCount).toBe(0);
    });
  });
});