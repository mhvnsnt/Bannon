import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone Client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "dummy-api-key", // The actual key needs to be set in environment variables
});

const indexName = "god-mode-os-vector-vault";

export class VectorStoreManager {
  static async storeKnowledge(id: string, vector: number[], metadata: any) {
    console.log(`[VECTOR RECORDING] Storing coordinate maps inside cloud node: ${id}`);
    try {
      const index = pc.Index(indexName);
      await index.upsert([
        {
          id,
          values: vector,
          metadata
        }
      ]);
      console.log(`[VECTOR VAULT] Successfully stored vector ${id}`);
    } catch (error: any) {
      console.error(`[VECTOR VAULT] Error storing embedding:`, error.message);
    }
  }

  static async queryCausalPlane(vector: number[], limit: number = 3) {
    console.log("[VECTOR QUERY] Cross-referencing field vector with historical database nodes");
    try {
      const index = pc.Index(indexName);
      const queryResponse = await index.query({
        vector,
        topK: limit,
        includeMetadata: true
      });
      return queryResponse.matches || [];
    } catch (error: any) {
      console.error(`[VECTOR VAULT] Error querying embeddings:`, error.message);
      return [];
    }
  }
}

// Retain performSemanticSearch for other parts of the social engine
export async function performSemanticSearch(query: string): Promise<string> {
  const mockVector = new Array(1536).fill(0.1);
  const matches = await VectorStoreManager.queryCausalPlane(mockVector, 3);
  return (
    matches.map((m) => JSON.stringify(m.metadata)).join(" | ") ||
    "No relevant data found in Vector Vault."
  );
}
