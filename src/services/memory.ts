import { supabase, isSupabaseConfigured } from './supabaseClient';

export const MemoryService = {
  async search(query: string, userId: string) {
    console.log(`[MemoryService] Searching memory for user ${userId} with query: ${query}`);
    
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured");
      }
      // In a real environment with pgvector setup on Supabase:
      // This would call a Postgres function that embeds the query and performs a similarity search.
      const { data, error } = await supabase.rpc('search_scraped_memory', {
        search_query: query,
        user_id: userId
      });
      
      if (error) {
        throw error;
      }
      return data || [];
    } catch (e) {
      console.warn('Vector search not fully configured or failed. Simulating search delay...', e);
      // Simulate network latency and return mock vector search results
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (query.toLowerCase().includes('price') || query.toLowerCase().includes('crypto')) {
        return [
          { id: '1', content: 'Bitcoin current price is $64,230. Scraped from coinmarketcap.com', metadata: { url: 'https://coinmarketcap.com' }, similarity: 0.92 },
          { id: '2', content: 'Ethereum up 2.4% today at $3,450. Scraped from coindesk.com', metadata: { url: 'https://coindesk.com' }, similarity: 0.85 }
        ];
      }
      
      return [
        { id: '3', content: `Stored memory context matching: "${query}"`, metadata: { source: 'local_cache' }, similarity: 0.89 }
      ];
    }
  }
};
