import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import { sendPushAlert } from './notifications/pushService';
import { queryPineconeWithCache } from './memory/pineconeNexus';

let pc: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
   pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
   ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function runPredictModeEngine() {
  if (!pc || !ai) {
    console.log('[PREDICT MODE]: API keys missing, mocking prediction engine logic.');
    return;
  }
  
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'default';
    
    // 1. Query Pinecone for the latest scraped market asymmetry matrices
    const queryResponse = await queryPineconeWithCache(indexName, {
      topK: 15,
      includeMetadata: true,
      vector: new Array(768).fill(0.1) // Sample vector signature array
    });

    const rawContextData = queryResponse.matches.map(m => m.metadata?.text).join('\n');

    if (!rawContextData) return;

    // 2. Compute predictive models using reasoning AI loops
    const predictionResult = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `[WORLD MODEL CONTEXT LOGS]:
      ${rawContextData}
      
      CRITICAL INSTRUCTION: Analyze the data stream for physical or digital asset price discrepancies (arbitrage spreads). 
      Calculate linear progression vectors mapping market momentum +10 minutes into the future. 
      If a margin inefficiency is verified, output exactly: 'ASU_FOUND' followed by target execution vectors, vendor coordinates, and calculated profit margins.`
    });

    const insightPayload = predictionResult.text || '';

    // 3. Proactively trigger out-of-band notification if an asymmetry is found
    if (insightPayload.includes('ASU_FOUND')) {
      await sendPushAlert(`📈 [PREDICT MODE — HIGH VALUE TARGET VALIDATED]:\n${insightPayload}`);
    }
  } catch (err) {
      console.error('[PREDICT MODE FAULT]:', err);
  }
}
