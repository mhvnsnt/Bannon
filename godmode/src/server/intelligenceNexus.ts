import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import { sendPushAlert } from './notifications/pushService';
import { logSecurityEvent } from './securityVaultManager';
import { persistentVault } from './memory/persistentVault';
import xml2js from 'xml2js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
let pc: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

// Broadest domains of information asymmetry
const strategicQueries = [
  'behavioral economics choice architecture',
  'neurochemistry of attraction',
  'evolutionary psychology mate selection',
  'dopamine baseline manipulation',
  'game theory human interaction',
  'quantum physics probability algorithms',
  'persuasion heuristics marketing advertising',
  'predictive analytics market crashes',
  'neuroplasticity habit formation',
  'advanced autonomous swarm architectures',
  'LLM multi-agent self correction framework',
  'reinforcement learning from verifiable execution'
];

export async function harvestAcademicAsymmetry() {
  console.log('[INTELLIGENCE NEXUS]: Sweeping global research APIs...');
  const usePinecone = !!pc;
  const index = usePinecone ? pc!.index(process.env.PINECONE_INDEX_NAME || 'default') : null;

  for (const query of strategicQueries) {
    try {
      const formattedQuery = query.replace(/\s+/g, '+');
      const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${formattedQuery}&max_results=2&sortBy=submittedDate&sortOrder=descending`;
      
      const response = await axios.get(arxivUrl);
      const parsedData = await xml2js.parseStringPromise(response.data);
      const entries = parsedData.feed.entry || [];

      for (const entry of entries) {
        const title = entry.title[0]?.replace(/\n/g, ' ').trim() || 'Untitled Paper';
        const abstract = entry.summary[0]?.replace(/\n/g, ' ').trim() || 'No abstract available.';
        
        const extractionPrompt = `
          Analyze this academic abstract: "${title} - ${abstract}"
          
          Translate this scientific data into a raw, practical tactical advantage. 
          How does this specific mechanism of human psychology, neurochemistry, economics, physics, AI architecture, or choice architecture allow someone to understand human behavior and reality better? 
          Provide 2 concrete, actionable ways to apply this knowledge mathematically, psychologically, or structurally in real-world systems, AI architectures, negotiations, marketing, sports betting, or personal influence. Keep it clinical, direct, and focused on power and leverage. Start the response with exactly this format:
          **LEVERAGE UNLOCKED**: [1 sentence summary of the power gained]
          
          Then list the tactics.
        `;

        const tacticalResponse = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: extractionPrompt
        });

        const tacticalInsight = tacticalResponse.text;
        if (!tacticalInsight) continue;

        // Extract "LEVERAGE UNLOCKED" line
        let leverageUnlocked = "Advanced behavioral leverage decoded.";
        const levIdx = tacticalInsight.indexOf('**LEVERAGE UNLOCKED**:');
        if (levIdx !== -1) {
          const sub = tacticalInsight.substring(levIdx + 22);
          const endLineIdx = sub.indexOf('\n');
          leverageUnlocked = endLineIdx !== -1 ? sub.substring(0, endLineIdx).trim() : sub.trim();
        }

        // 1. Save locally to SQLite database for dynamic UI mapping
        persistentVault.addArxivPaper(query, title, abstract, leverageUnlocked, tacticalInsight);

        // 2. Save to Pinecone if enabled
        if (usePinecone && index) {
          const vectorResponse = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: tacticalInsight
          });
          
          const vectorValues = Array.from(vectorResponse.embeddings?.[0]?.values || (vectorResponse as any).embedding?.values || (vectorResponse as any)?.values || []).slice(0, 768) as number[];
          
          if (vectorValues.length > 0) {
              await index.upsert([{
                 id: `intel_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                 values: vectorValues,
                 metadata: { topic: query, source: 'arXiv', abstract: abstract.slice(0, 1000), insight: tacticalInsight.slice(0, 1000) }
              }]);
          }
        }

        if (tacticalInsight.length > 50) {
           logSecurityEvent('COGNITIVE ASYMMETRY ACQUIRED', `Processed ${query}. Knowledge embedded.`, 'arXiv.org', 'SECURE');
           // Random chance to actually message the user via telegram to simulate a proactive thought
           if (Math.random() > 0.5) {
               try {
                 await sendPushAlert(`🧠 [PROACTIVE NEXUS INSIGHT]:\nTopic: ${query.toUpperCase()}\n\n${tacticalInsight.slice(0, 1500)}\n\n*This is an autonomous thought generated by your Intelligence Nexus.*`);
               } catch (err) {}
           }
        }
        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error: any) {
      console.error(`[NEXUS FAULT] Failed to parse ${query}:`, error?.message || error);
    }
  }
}

/**
 * Perform a live scrape of a single query provided from the user dashboard
 */
export async function harvestSingleQuery(query: string) {
  console.log(`[INTELLIGENCE NEXUS]: Performing direct targeted search for: ${query}`);
  try {
    const formattedQuery = query.replace(/\s+/g, '+');
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${formattedQuery}&max_results=3&sortBy=relevance`;
    
    const response = await axios.get(arxivUrl);
    const parsedData = await xml2js.parseStringPromise(response.data);
    const entries = parsedData.feed.entry || [];

    let count = 0;
    for (const entry of entries) {
      const title = entry.title[0]?.replace(/\n/g, ' ').trim() || 'Untitled Thesis';
      const abstract = entry.summary[0]?.replace(/\n/g, ' ').trim() || 'Abstract omitted by source.';

      const extractionPrompt = `
        Analyze this academic abstract: "${title} - ${abstract}"
        
        Translate this scientific data into a raw, practical tactical advantage. 
        How does this specific mechanism allow someone to predict or modify human behaviors and outcomes?
        Provide action-oriented tactical guidelines. Start the response with exactly:
        **LEVERAGE UNLOCKED**: [1-sentence core strategic value]
      `;

      const tacticalResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: extractionPrompt
      });

      const tacticalInsight = tacticalResponse.text || "Tactical extraction completed.";
      
      let leverageUnlocked = "Direct strategic leverage obtained.";
      const levIdx = tacticalInsight.indexOf('**LEVERAGE UNLOCKED**:');
      if (levIdx !== -1) {
        const sub = tacticalInsight.substring(levIdx + 22);
        const endLineIdx = sub.indexOf('\n');
        leverageUnlocked = endLineIdx !== -1 ? sub.substring(0, endLineIdx).trim() : sub.trim();
      }

      // Add directly to local SQLite
      persistentVault.addArxivPaper(query, title, abstract, leverageUnlocked, tacticalInsight);

      // Trigger SIEM log
      logSecurityEvent('MANUAL COGNITIVE ACQUISITION', `Targeted research captured for: ${query}`, 'arXiv.org Portal', 'SECURE');
      count++;
    }

    return { success: true, count };
  } catch (error: any) {
    console.error(`[NEXUS MANUAL FAULT] Failed for query "${query}":`, error.message);
    throw error;
  }
}
