/**
 * Memory Manager
 * Handles short-term and long-term memory for agents
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export class MemoryManager {
  constructor(config = {}) {
    this.config = config;
    this.memoryPath = config.memoryPath || './.agent-memory';
    this.shortTermMemory = new Map(); // In-memory cache
    this.maxShortTermSize = config.maxShortTermSize || 100;

    this._ensureMemoryDir();
  }

  /**
   * Recall relevant information from memory
   */
  async recall(query) {
    const { task, context } = query;

    // Check short-term memory first
    const shortTermKey = this._generateKey(task);
    if (this.shortTermMemory.has(shortTermKey)) {
      return this.shortTermMemory.get(shortTermKey);
    }

    // Load from long-term memory
    const longTermData = await this._loadFromDisk(shortTermKey);

    if (longTermData) {
      // Cache in short-term memory
      this._cacheShortTerm(shortTermKey, longTermData);
      return longTermData;
    }

    // No memory found
    return {
      found: false,
      context: context || {},
      relatedMemories: []
    };
  }

  /**
   * Store information in memory
   */
  async store(data) {
    const { task, plan, results, timestamp } = data;
    const key = this._generateKey(task);

    const memoryEntry = {
      task,
      plan,
      results,
      timestamp: timestamp || Date.now(),
      metadata: {
        resultCount: results?.length || 0,
        success: results?.every(r => r.result?.success !== false) || false
      }
    };

    // Store in short-term
    this._cacheShortTerm(key, memoryEntry);

    // Persist to disk
    await this._saveToDisk(key, memoryEntry);

    return { stored: true, key };
  }

  /**
   * Search memory for patterns
   */
  async search(query) {
    const results = [];

    // Search short-term memory
    for (const [key, value] of this.shortTermMemory) {
      if (this._matchesQuery(value, query)) {
        results.push({ key, ...value, source: 'short-term' });
      }
    }

    // TODO: Search long-term memory with indexing

    return results;
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      shortTermSize: this.shortTermMemory.size,
      maxShortTermSize: this.maxShortTermSize,
      memoryPath: this.memoryPath
    };
  }

  /**
   * Flush short-term memory to disk
   */
  async flush() {
    const promises = [];

    for (const [key, value] of this.shortTermMemory) {
      promises.push(this._saveToDisk(key, value));
    }

    await Promise.all(promises);
    return { flushed: promises.length };
  }

  /**
   * Clear all memory (use with caution)
   */
  async clear() {
    this.shortTermMemory.clear();
    // Note: Long-term memory persists on disk
    return { cleared: true };
  }

  /**
   * Cache data in short-term memory with LRU eviction
   */
  _cacheShortTerm(key, data) {
    // If at capacity, remove oldest entry
    if (this.shortTermMemory.size >= this.maxShortTermSize) {
      const firstKey = this.shortTermMemory.keys().next().value;
      this.shortTermMemory.delete(firstKey);
    }

    this.shortTermMemory.set(key, data);
  }

  /**
   * Generate a unique key for a task
   */
  _generateKey(task) {
    // Simple hash function - could be improved
    const str = typeof task === 'string' ? task : JSON.stringify(task);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `memory_${Math.abs(hash)}`;
  }

  /**
   * Load memory from disk
   */
  async _loadFromDisk(key) {
    try {
      const filePath = join(this.memoryPath, `${key}.json`);

      if (!existsSync(filePath)) {
        return null;
      }

      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading memory from disk:', error);
      return null;
    }
  }

  /**
   * Save memory to disk
   */
  async _saveToDisk(key, data) {
    try {
      const filePath = join(this.memoryPath, `${key}.json`);
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error saving memory to disk:', error);
      return false;
    }
  }

  /**
   * Ensure memory directory exists
   */
  async _ensureMemoryDir() {
    try {
      if (!existsSync(this.memoryPath)) {
        await mkdir(this.memoryPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating memory directory:', error);
    }
  }

  /**
   * Check if memory entry matches query
   */
  _matchesQuery(entry, query) {
    // Simple string matching - could be improved with embeddings
    const entryStr = JSON.stringify(entry).toLowerCase();
    const queryStr = JSON.stringify(query).toLowerCase();
    return entryStr.includes(queryStr);
  }
}

export default MemoryManager;
