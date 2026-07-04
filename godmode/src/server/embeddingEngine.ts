import crypto from 'crypto';

export class EmbeddingEngine {
  private static cache = new Map<string, number[]>(); // in-memory cache of embeddings
  private static cacheKeys: string[] = []; // to manage LRU size of 500
  private static totalRequests = 0;
  private static cacheHits = 0;
  private static totalLatencyMs = 0;
  private static fallbackActive = false;
  private static lastFallbackResetTime = 0;

  static getEngineStats() {
    return {
      totalRequests: this.totalRequests,
      cacheHitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      avgLatencyMs: this.totalRequests - this.cacheHits > 0 ? this.totalLatencyMs / (this.totalRequests - this.cacheHits) : 0,
      fallbackModeActive: this.fallbackActive
    };
  }

  // Helper hash for cache lookup
  private static getContentHash(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  // Generate 768-dimension embedding
  static async embed(text: string): Promise<number[]> {
    this.totalRequests++;
    const key = this.getContentHash(text);
    
    if (this.cache.has(key)) {
      this.cacheHits++;
      // Move to end for LRU freshness
      const idx = this.cacheKeys.indexOf(key);
      if (idx !== -1) {
        this.cacheKeys.splice(idx, 1);
        this.cacheKeys.push(key);
      }
      return this.cache.get(key)!;
    }

    const start = Date.now();
    let embedding: number[] = [];

    // Auto-retry Ollama if 2 minutes have passed since last fallback
    if (this.fallbackActive && Date.now() - this.lastFallbackResetTime > 120000) {
      this.fallbackActive = false;
      console.log('[EmbeddingEngine] Attempting to recover from TF-IDF fallback to Ollama nomic-embed-text...');
    }

    if (!this.fallbackActive) {
      try {
        const response = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: text
          }),
          // short timeout so we fallback quickly instead of hanging server
          signal: AbortSignal.timeout(1500)
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data.embedding && Array.isArray(data.embedding)) {
            embedding = data.embedding;
          }
        } else {
          // If 404 or other issues, check if Ollama is running or if model is missing
          console.warn('[EmbeddingEngine] Ollama endpoint returned error. Using local TF-IDF fallback.');
        }
      } catch (e) {
        // Fallback silently but flag so we don't spam attempts rapidly
        this.fallbackActive = true;
        this.lastFallbackResetTime = Date.now();
        console.warn('[EmbeddingEngine] Could not reach Ollama nomic-embed-text. Activating TF-IDF fallback.');
      }
    }

    // Fallback if not populated
    if (embedding.length === 0) {
      embedding = this.fallbackEmbed(text);
    }

    this.totalLatencyMs += (Date.now() - start);

    // Save in LRU cache
    this.cache.set(key, embedding);
    this.cacheKeys.push(key);
    if (this.cacheKeys.length > 500) {
      const oldest = this.cacheKeys.shift();
      if (oldest) this.cache.delete(oldest);
    }

    return embedding;
  }

  // Batch process up to 32 texts in parallel
  static async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = 32;

    for (let i = 0; i < texts.length; i += batchSize) {
      const chunk = texts.slice(i, i + batchSize);
      const promises = chunk.map(text => this.embed(text));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }

  // Compute Cosine Similarity between vector A and B
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Find top K candidates
  static findTopK<T>(queryEmbedding: number[], candidates: { item: T; embedding: number[] }[], k: number): { item: T; score: number }[] {
    const scored = candidates.map(cand => ({
      item: cand.item,
      score: this.cosineSimilarity(queryEmbedding, cand.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  // Simple TF-IDF pseudo-embedding (768 dimensions)
  private static fallbackEmbed(text: string): number[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s@:-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const vec = new Array(768).fill(0);
    if (words.length === 0) {
      // Seed slightly to prevent zero norm vector
      vec[0] = 1.0;
      return vec;
    }

    for (const word of words) {
      // Simple string hashing function
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (word.charCodeAt(i) + (hash << 5) - hash) & 0xffffffff;
      }
      const idx = Math.abs(hash) % 768;
      vec[idx] += 1;
    }

    // Normalize embedding vector
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (mag > 0) {
      for (let i = 0; i < 768; i++) vec[i] /= mag;
    }
    return vec;
  }

  // Allow resetting fallback mode (e.g. if we want to retry connection)
  static resetFallback() {
    this.fallbackActive = false;
  }
}
