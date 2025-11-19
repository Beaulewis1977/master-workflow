/**
 * Performance Cache Manager - Advanced Multi-Tier Caching System
 * 
 * Implements intelligent caching strategies for the Queen Controller's 10-agent architecture
 * with adaptive cache sizing, intelligent eviction, and performance monitoring.
 * 
 * @module performance-cache-manager
 * @version 1.0.0
 */

const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * Multi-tier cache implementation with LRU, LFU, and TTL strategies
 */
class PerformanceCacheManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Cache configuration with performance optimizations
        this.config = {
            // Tier 1: Hot cache (fastest access)
            hotCache: {
                maxSize: options.hotCacheSize || 100,
                ttl: options.hotCacheTTL || 300000, // 5 minutes
                maxMemory: options.hotCacheMemory || 10 * 1024 * 1024 // 10MB
            },
            
            // Tier 2: Warm cache (balanced performance)
            warmCache: {
                maxSize: options.warmCacheSize || 500,
                ttl: options.warmCacheTTL || 1800000, // 30 minutes
                maxMemory: options.warmCacheMemory || 50 * 1024 * 1024 // 50MB
            },
            
            // Tier 3: Cold cache (long-term storage)
            coldCache: {
                maxSize: options.coldCacheSize || 2000,
                ttl: options.coldCacheTTL || 3600000, // 1 hour
                maxMemory: options.coldCacheMemory || 100 * 1024 * 1024 // 100MB
            },
            
            // Performance tuning
            compressionThreshold: options.compressionThreshold || 1024, // 1KB
            enableCompression: options.enableCompression !== false,
            enablePrefetching: options.enablePrefetching !== false,
            prefetchThreshold: options.prefetchThreshold || 0.8, // 80% hit rate
            adaptiveResize: options.adaptiveResize !== false,
            
            // Eviction strategies
            defaultEviction: options.defaultEviction || 'lru-lfu-hybrid',
            aggressiveCleanup: options.aggressiveCleanup || false
        };
        
        // Initialize cache tiers
        this.hotCache = new Map();
        this.warmCache = new Map();
        this.coldCache = new Map();
        
        // Cache metadata for intelligent management
        this.cacheMetadata = {
            hot: new Map(),
            warm: new Map(),
            cold: new Map()
        };
        
        // Access patterns and statistics
        this.stats = {
            requests: 0,
            hits: 0,
            misses: 0,
            hotHits: 0,
            warmHits: 0,
            coldHits: 0,
            evictions: 0,
            compressions: 0,
            decompressions: 0,
            memoryUsage: 0,
            avgAccessTime: 0,
            lastCleanup: Date.now()
        };
        
        // Performance tracking
        this.accessHistory = [];
        this.hitRateHistory = [];
        this.maxHistorySize = 1000;
        
        // Prefetch queue and patterns
        this.prefetchQueue = new Set();
        this.accessPatterns = new Map(); // Track access sequences for prefetching
        
        // Compression utilities
        this.compressionEnabled = this.config.enableCompression && this.isCompressionAvailable();
        
        // Start background processes
        this.startCacheManagement();
        this.startPerformanceMonitoring();
        
        console.log('PERFORMANCE CACHE: Multi-tier cache manager initialized');
    }
    
    /**
     * Check if compression is available
     */
    isCompressionAvailable() {
        try {
            require('zlib');
            return true;
        } catch (error) {
            console.warn('PERFORMANCE CACHE: zlib not available, compression disabled');
            return false;
        }
    }
    
    /**
     * Get cached value with intelligent tier management
     */
    async get(key, options = {}) {
        const startTime = performance.now();
        
        try {
            this.stats.requests++;
            
            // Check hot cache first (fastest)
            let result = await this.getFromTier('hot', key);
            if (result !== null) {
                this.stats.hits++;
                this.stats.hotHits++;
                this.promoteToHotCache(key, result);
                return this.finalizeGet(result, startTime, 'hot');
            }
            
            // Check warm cache
            result = await this.getFromTier('warm', key);
            if (result !== null) {
                this.stats.hits++;
                this.stats.warmHits++;
                this.promoteToHotCache(key, result);
                return this.finalizeGet(result, startTime, 'warm');
            }
            
            // Check cold cache
            result = await this.getFromTier('cold', key);
            if (result !== null) {
                this.stats.hits++;
                this.stats.coldHits++;
                this.promoteToWarmCache(key, result);
                return this.finalizeGet(result, startTime, 'cold');
            }
            
            // Cache miss
            this.stats.misses++;
            this.recordAccessPattern(key, null);
            
            const accessTime = performance.now() - startTime;
            this.updateAccessTime(accessTime);
            
            this.emit('cache-miss', { key, accessTime });
            
            return null;
            
        } catch (error) {
            console.error('PERFORMANCE CACHE: Get error:', error.message);
            this.stats.misses++;
            return null;
        }
    }
    
    /**
     * Set cached value with intelligent tier placement
     */
    async set(key, value, options = {}) {
        const startTime = performance.now();
        
        try {
            // Determine optimal cache tier based on usage patterns and value characteristics
            const tier = this.determineOptimalTier(key, value, options);
            
            // Create cache entry with comprehensive metadata
            const entry = await this.createCacheEntry(key, value, options, tier);
            
            // Store in appropriate tier
            await this.setInTier(tier, key, entry);
            
            // Update access patterns for future optimization
            this.recordAccessPattern(key, tier);
            
            // Trigger prefetching if enabled
            if (this.config.enablePrefetching) {
                this.triggerPrefetch(key);
            }
            
            const accessTime = performance.now() - startTime;
            this.updateAccessTime(accessTime);
            
            this.emit('cache-set', { 
                key, 
                tier, 
                size: entry.size,
                compressed: entry.compressed,
                accessTime 
            });
            
            return true;
            
        } catch (error) {
            console.error('PERFORMANCE CACHE: Set error:', error.message);
            return false;
        }
    }
    
    /**
     * Get value from specific cache tier
     */
    async getFromTier(tier, key) {
        const cache = this.getCacheMap(tier);
        const metadata = this.cacheMetadata[tier];
        
        if (!cache.has(key)) {
            return null;
        }
        
        const entry = cache.get(key);
        const meta = metadata.get(key);
        
        // Check TTL
        if (meta.expiresAt && Date.now() > meta.expiresAt) {
            this.evictFromTier(tier, key);
            return null;
        }
        
        // Update access metadata
        meta.lastAccessed = Date.now();
        meta.accessCount++;
        meta.accessFrequency = this.calculateAccessFrequency(meta);
        
        // Decompress if needed
        let value = entry.data;
        if (entry.compressed && this.compressionEnabled) {
            value = await this.decompress(entry.data);
            this.stats.decompressions++;
        }
        
        return { value, metadata: meta };
    }
    
    /**
     * Set value in specific cache tier
     */
    async setInTier(tier, key, entry) {
        const cache = this.getCacheMap(tier);
        const metadata = this.cacheMetadata[tier];
        const config = this.config[`${tier}Cache`];
        
        // Check if eviction is needed
        if (cache.size >= config.maxSize || this.getTierMemoryUsage(tier) + entry.size > config.maxMemory) {
            await this.evictFromTier(tier);
        }
        
        // Store entry and metadata
        cache.set(key, entry);
        metadata.set(key, {
            key,
            tier,
            size: entry.size,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            expiresAt: entry.ttl ? Date.now() + entry.ttl : null,
            accessCount: 1,
            accessFrequency: 1,
            compressed: entry.compressed,
            priority: entry.priority || 1
        });
        
        this.updateMemoryUsage();
    }
    
    /**
     * Determine optimal cache tier for a key-value pair
     */
    determineOptimalTier(key, value, options) {
        // Priority override
        if (options.tier) {
            return options.tier;
        }
        
        // Size-based placement
        const size = this.estimateSize(value);
        if (size > this.config.compressionThreshold * 10) {
            return 'cold'; // Large values go to cold cache
        }
        
        // Check access patterns
        const accessPattern = this.accessPatterns.get(key);
        if (accessPattern) {
            if (accessPattern.frequency > 10 && accessPattern.recency < 300000) { // 5 minutes
                return 'hot';
            } else if (accessPattern.frequency > 3) {
                return 'warm';
            }
        }
        
        // Priority-based placement
        const priority = options.priority || 1;
        if (priority >= 3) return 'hot';
        if (priority >= 2) return 'warm';
        
        return 'cold'; // Default to cold cache
    }
    
    /**
     * Create cache entry with compression and metadata
     */
    async createCacheEntry(key, value, options, tier) {
        let data = value;
        let size = this.estimateSize(value);
        let compressed = false;
        
        // Apply compression if beneficial
        if (this.compressionEnabled && size > this.config.compressionThreshold) {
            try {
                const compressedData = await this.compress(value);
                if (compressedData.length < size * 0.8) { // Only use if 20%+ reduction
                    data = compressedData;
                    size = compressedData.length;
                    compressed = true;
                    this.stats.compressions++;
                }
            } catch (error) {
                console.warn('PERFORMANCE CACHE: Compression failed:', error.message);
            }
        }
        
        return {
            data,
            size,
            compressed,
            ttl: options.ttl || this.config[`${tier}Cache`].ttl,
            priority: options.priority || 1,
            createdAt: Date.now()
        };
    }
    
    /**
     * Promote entry to hot cache
     */
    promoteToHotCache(key, result) {
        if (this.hotCache.has(key)) return; // Already in hot cache
        
        const hotConfig = this.config.hotCache;
        if (this.hotCache.size < hotConfig.maxSize && 
            this.getTierMemoryUsage('hot') + result.metadata.size < hotConfig.maxMemory) {
            
            // Copy to hot cache
            this.hotCache.set(key, this.warmCache.get(key) || this.coldCache.get(key));
            this.cacheMetadata.hot.set(key, {
                ...result.metadata,
                tier: 'hot',
                promotedAt: Date.now()
            });
        }
    }
    
    /**
     * Promote entry to warm cache
     */
    promoteToWarmCache(key, result) {
        if (this.warmCache.has(key)) return; // Already in warm cache
        
        const warmConfig = this.config.warmCache;
        if (this.warmCache.size < warmConfig.maxSize &&
            this.getTierMemoryUsage('warm') + result.metadata.size < warmConfig.maxMemory) {
            
            // Copy to warm cache
            this.warmCache.set(key, this.coldCache.get(key));
            this.cacheMetadata.warm.set(key, {
                ...result.metadata,
                tier: 'warm',
                promotedAt: Date.now()
            });
        }
    }
    
    /**
     * Evict entries from cache tier using hybrid LRU/LFU strategy
     */
    async evictFromTier(tier, specificKey = null) {
        const cache = this.getCacheMap(tier);
        const metadata = this.cacheMetadata[tier];
        
        if (specificKey) {
            // Evict specific key
            cache.delete(specificKey);
            metadata.delete(specificKey);
            this.stats.evictions++;
            return;
        }
        
        // Find candidate for eviction using hybrid strategy
        const candidates = Array.from(metadata.entries()).map(([key, meta]) => ({
            key,
            score: this.calculateEvictionScore(meta)
        })).sort((a, b) => a.score - b.score); // Lower score = more likely to evict
        
        // Evict bottom 10% or at least 1 entry
        const evictCount = Math.max(1, Math.floor(candidates.length * 0.1));
        
        for (let i = 0; i < evictCount && candidates.length > 0; i++) {
            const key = candidates[i].key;
            cache.delete(key);
            metadata.delete(key);
            this.stats.evictions++;
            
            this.emit('cache-evicted', { key, tier, reason: 'capacity' });
        }
        
        this.updateMemoryUsage();
    }
    
    /**
     * Calculate eviction score (lower = more likely to be evicted)
     */
    calculateEvictionScore(metadata) {
        const now = Date.now();
        const age = now - metadata.createdAt;
        const timeSinceAccess = now - metadata.lastAccessed;
        
        // Hybrid LRU/LFU scoring
        const recencyScore = 1 / (timeSinceAccess + 1); // More recent = higher score
        const frequencyScore = Math.log(metadata.accessCount + 1); // More frequent = higher score
        const priorityScore = metadata.priority || 1;
        
        // Weighted combination (lower is worse)
        return (recencyScore * 0.4 + frequencyScore * 0.4 + priorityScore * 0.2) / (age / 1000 + 1);
    }
    
    /**
     * Calculate access frequency with decay
     */
    calculateAccessFrequency(metadata) {
        const now = Date.now();
        const timeSinceCreated = now - metadata.createdAt;
        const decayFactor = Math.exp(-timeSinceCreated / (24 * 60 * 60 * 1000)); // Daily decay
        
        return metadata.accessCount * decayFactor;
    }
    
    /**
     * Record access pattern for prefetching
     */
    recordAccessPattern(key, tier) {
        const pattern = this.accessPatterns.get(key) || {
            frequency: 0,
            lastAccess: 0,
            recency: Infinity,
            tier: null
        };
        
        const now = Date.now();
        pattern.frequency++;
        pattern.recency = now - pattern.lastAccess;
        pattern.lastAccess = now;
        pattern.tier = tier;
        
        this.accessPatterns.set(key, pattern);
        
        // Trim access patterns to prevent memory bloat
        if (this.accessPatterns.size > 5000) {
            const entries = Array.from(this.accessPatterns.entries())
                .sort((a, b) => b[1].lastAccess - a[1].lastAccess)
                .slice(0, 3000);
            
            this.accessPatterns.clear();
            entries.forEach(([k, v]) => this.accessPatterns.set(k, v));
        }
    }
    
    /**
     * Trigger prefetching based on access patterns
     */
    triggerPrefetch(key) {
        if (!this.config.enablePrefetching) return;
        
        // Simple prefetch strategy: related keys
        const relatedKeys = this.findRelatedKeys(key);
        relatedKeys.forEach(relatedKey => {
            if (!this.isKeyCached(relatedKey)) {
                this.prefetchQueue.add(relatedKey);
            }
        });
        
        // Process prefetch queue asynchronously
        if (this.prefetchQueue.size > 0 && !this.prefetchInProgress) {
            this.processPrefetchQueue();
        }
    }
    
    /**
     * Find related keys for prefetching
     */
    findRelatedKeys(key) {
        // Simple strategy: keys with common prefixes or patterns
        const related = [];
        const keyParts = key.split(':');
        
        if (keyParts.length > 1) {
            const prefix = keyParts[0];
            for (const [cachedKey] of this.accessPatterns) {
                if (cachedKey.startsWith(prefix + ':') && cachedKey !== key) {
                    related.push(cachedKey);
                }
            }
        }
        
        return related.slice(0, 5); // Limit to 5 related keys
    }
    
    /**
     * Process prefetch queue
     */
    async processPrefetchQueue() {
        if (this.prefetchInProgress) return;
        this.prefetchInProgress = true;
        
        try {
            const keysToProcess = Array.from(this.prefetchQueue).slice(0, 10);
            this.prefetchQueue.clear();
            
            for (const key of keysToProcess) {
                // This would trigger the actual data loading in the application
                this.emit('prefetch-request', { key });
            }
        } catch (error) {
            console.error('PERFORMANCE CACHE: Prefetch error:', error.message);
        } finally {
            this.prefetchInProgress = false;
        }
    }
    
    /**
     * Check if key is cached in any tier
     */
    isKeyCached(key) {
        return this.hotCache.has(key) || this.warmCache.has(key) || this.coldCache.has(key);
    }
    
    /**
     * Compress data using gzip
     */
    async compress(data) {
        if (!this.compressionEnabled) return data;
        
        const zlib = require('zlib');
        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        
        return new Promise((resolve, reject) => {
            zlib.gzip(Buffer.from(serialized), (error, compressed) => {
                if (error) reject(error);
                else resolve(compressed);
            });
        });
    }
    
    /**
     * Decompress data
     */
    async decompress(compressedData) {
        if (!this.compressionEnabled) return compressedData;
        
        const zlib = require('zlib');
        
        return new Promise((resolve, reject) => {
            zlib.gunzip(compressedData, (error, decompressed) => {
                if (error) reject(error);
                else {
                    try {
                        const str = decompressed.toString();
                        const parsed = JSON.parse(str);
                        resolve(parsed);
                    } catch (parseError) {
                        resolve(str); // Return as string if not JSON
                    }
                }
            });
        });
    }
    
    /**
     * Estimate memory size of value
     */
    estimateSize(value) {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'string') return value.length * 2; // UTF-16
        if (typeof value === 'number') return 8;
        if (typeof value === 'boolean') return 1;
        if (Buffer.isBuffer(value)) return value.length;
        
        // For objects, serialize and estimate
        try {
            return JSON.stringify(value).length * 2;
        } catch (error) {
            return 1024; // Fallback estimate
        }
    }
    
    /**
     * Get cache map for tier
     */
    getCacheMap(tier) {
        switch (tier) {
            case 'hot': return this.hotCache;
            case 'warm': return this.warmCache;
            case 'cold': return this.coldCache;
            default: throw new Error(`Invalid cache tier: ${tier}`);
        }
    }
    
    /**
     * Get memory usage for specific tier
     */
    getTierMemoryUsage(tier) {
        const metadata = this.cacheMetadata[tier];
        let totalSize = 0;
        
        for (const meta of metadata.values()) {
            totalSize += meta.size;
        }
        
        return totalSize;
    }
    
    /**
     * Update overall memory usage statistics
     */
    updateMemoryUsage() {
        this.stats.memoryUsage = 
            this.getTierMemoryUsage('hot') + 
            this.getTierMemoryUsage('warm') + 
            this.getTierMemoryUsage('cold');
    }
    
    /**
     * Update average access time
     */
    updateAccessTime(accessTime) {
        const alpha = 0.1; // Exponential moving average factor
        this.stats.avgAccessTime = alpha * accessTime + (1 - alpha) * this.stats.avgAccessTime;
        
        // Track access time history
        this.accessHistory.push({ time: Date.now(), accessTime });
        if (this.accessHistory.length > this.maxHistorySize) {
            this.accessHistory.shift();
        }
    }
    
    /**
     * Finalize get operation with metrics and promotion
     */
    finalizeGet(result, startTime, tier) {
        const accessTime = performance.now() - startTime;
        this.updateAccessTime(accessTime);
        
        this.emit('cache-hit', { 
            tier, 
            accessTime,
            size: result.metadata.size,
            compressed: result.metadata.compressed 
        });
        
        return result.value;
    }
    
    /**
     * Start cache management background processes
     */
    startCacheManagement() {
        // Periodic cleanup
        setInterval(() => {
            this.performCleanup();
        }, 60000); // Every minute
        
        // Adaptive resizing
        if (this.config.adaptiveResize) {
            setInterval(() => {
                this.adaptiveCacheResize();
            }, 300000); // Every 5 minutes
        }
        
        // TTL expiration cleanup
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 30000); // Every 30 seconds
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 10000); // Every 10 seconds
    }
    
    /**
     * Perform cache cleanup
     */
    async performCleanup() {
        try {
            const memoryUsage = this.stats.memoryUsage;
            const totalCapacity = 
                this.config.hotCache.maxMemory + 
                this.config.warmCache.maxMemory + 
                this.config.coldCache.maxMemory;
            
            const memoryPressure = memoryUsage / totalCapacity;
            
            if (memoryPressure > 0.9 || this.config.aggressiveCleanup) {
                console.log(`PERFORMANCE CACHE: High memory pressure (${(memoryPressure * 100).toFixed(1)}%) - performing cleanup`);
                
                // Aggressive cleanup
                await this.evictFromTier('cold');
                await this.evictFromTier('warm');
                
                if (memoryPressure > 0.95) {
                    await this.evictFromTier('hot');
                }
                
                this.stats.lastCleanup = Date.now();
            }
            
        } catch (error) {
            console.error('PERFORMANCE CACHE: Cleanup error:', error.message);
        }
    }
    
    /**
     * Adaptive cache resizing based on usage patterns
     */
    adaptiveCacheResize() {
        try {
            const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
            
            // Adjust hot cache size based on hit rate
            if (hitRate > 0.9 && this.stats.hotHits > this.stats.warmHits) {
                this.config.hotCache.maxSize = Math.min(
                    this.config.hotCache.maxSize * 1.1,
                    200
                );
            } else if (hitRate < 0.7) {
                this.config.hotCache.maxSize = Math.max(
                    this.config.hotCache.maxSize * 0.9,
                    50
                );
            }
            
            console.log(`PERFORMANCE CACHE: Adaptive resize - hot cache size: ${this.config.hotCache.maxSize}`);
            
        } catch (error) {
            console.error('PERFORMANCE CACHE: Adaptive resize error:', error.message);
        }
    }
    
    /**
     * Clean up expired entries
     */
    cleanupExpiredEntries() {
        const now = Date.now();
        let expiredCount = 0;
        
        ['hot', 'warm', 'cold'].forEach(tier => {
            const cache = this.getCacheMap(tier);
            const metadata = this.cacheMetadata[tier];
            
            for (const [key, meta] of metadata) {
                if (meta.expiresAt && now > meta.expiresAt) {
                    cache.delete(key);
                    metadata.delete(key);
                    expiredCount++;
                    
                    this.emit('cache-expired', { key, tier });
                }
            }
        });
        
        if (expiredCount > 0) {
            console.log(`PERFORMANCE CACHE: Cleaned up ${expiredCount} expired entries`);
            this.updateMemoryUsage();
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        const hitRate = this.stats.requests > 0 ? 
            (this.stats.hits / this.stats.requests) * 100 : 0;
        
        this.hitRateHistory.push({ time: Date.now(), hitRate });
        if (this.hitRateHistory.length > this.maxHistorySize) {
            this.hitRateHistory.shift();
        }
        
        this.emit('performance-update', {
            hitRate,
            memoryUsage: this.stats.memoryUsage,
            avgAccessTime: this.stats.avgAccessTime,
            totalRequests: this.stats.requests
        });
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.requests > 0 ? 
            (this.stats.hits / this.stats.requests) * 100 : 0;
        
        return {
            ...this.stats,
            hitRate,
            tierSizes: {
                hot: this.hotCache.size,
                warm: this.warmCache.size,
                cold: this.coldCache.size
            },
            tierMemoryUsage: {
                hot: this.getTierMemoryUsage('hot'),
                warm: this.getTierMemoryUsage('warm'),
                cold: this.getTierMemoryUsage('cold')
            },
            prefetchQueueSize: this.prefetchQueue.size,
            accessPatternCount: this.accessPatterns.size
        };
    }
    
    /**
     * Clear specific cache tier
     */
    clearTier(tier) {
        const cache = this.getCacheMap(tier);
        const metadata = this.cacheMetadata[tier];
        
        const entriesCleared = cache.size;
        cache.clear();
        metadata.clear();
        
        this.updateMemoryUsage();
        
        console.log(`PERFORMANCE CACHE: Cleared ${tier} cache (${entriesCleared} entries)`);
    }
    
    /**
     * Clear all caches
     */
    clearAll() {
        this.clearTier('hot');
        this.clearTier('warm');
        this.clearTier('cold');
        
        this.accessPatterns.clear();
        this.prefetchQueue.clear();
        
        // Reset stats
        this.stats = {
            ...this.stats,
            requests: 0,
            hits: 0,
            misses: 0,
            hotHits: 0,
            warmHits: 0,
            coldHits: 0
        };
        
        console.log('PERFORMANCE CACHE: All caches cleared');
    }
    
    /**
     * Shutdown cache manager
     */
    shutdown() {
        // Clear all intervals
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        if (this.resizeInterval) clearInterval(this.resizeInterval);
        if (this.expiredInterval) clearInterval(this.expiredInterval);
        
        // Clear all caches
        this.clearAll();
        
        console.log('PERFORMANCE CACHE: Cache manager shutdown complete');
    }
}

module.exports = PerformanceCacheManager;