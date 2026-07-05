import { Pinecone, QueryOptions, QueryResponse } from '@pinecone-database/pinecone';
import { LRUCache } from './lruCache';

export function getNexusMemory() {
    if (!process.env.PINECONE_API_KEY) return null;
    return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

const pineconeCache = new LRUCache<string, QueryResponse>(100);

export async function queryPineconeWithCache(indexName: string, queryOpts: QueryOptions): Promise<QueryResponse> {
    const pc = getNexusMemory();
    if (!pc) {
        throw new Error("Pinecone not configured");
    }
    
    // Hash the query string for caching
    const cacheKey = `${indexName}_${JSON.stringify(queryOpts)}`;
    if (pineconeCache.has(cacheKey)) {
        return pineconeCache.get(cacheKey)!;
    }

    const index = pc.index(indexName);
    const result = await index.query(queryOpts);
    
    pineconeCache.set(cacheKey, result);
    return result;
}
