import { tool } from "@langchain/core/tools";
import { z } from "zod";
import xml2js from "xml2js";

export class ArXivIngestionEngine {
  static async fetchPhysicsPapers(topic: string = "quant-ph"): Promise<any[]> {
    console.log(`[arXiv INGESTION] Dispatched field query to open archive database: ${topic}`);
    const targetUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(topic)}&max_results=5`;
    
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`ArXiv responded with status ${response.status}`);
      }
      const data = await response.text();
      
      // Parse XML to JS object
      const parsed: any = await new Promise((resolve, reject) => {
        xml2js.parseString(data, { explicitArray: false }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const entries = parsed?.feed?.entry || [];
      const entryList = Array.isArray(entries) ? entries : [entries];
      
      return entryList.map((entry: any) => ({
        title: (entry.title || "").toString().replace(/\n/g, " ").trim(),
        summary: (entry.summary || "").toString().replace(/\n/g, " ").trim(),
        url: (entry.id || "").toString().trim()
      }));
    } catch (error: any) {
      console.error("[arXiv INGESTION CRASH]", error.message);
      return [];
    }
  }
}

export const arxivIngestionTool = tool(
  async ({ query }) => {
    const papers = await ArXivIngestionEngine.fetchPhysicsPapers(query);
    return JSON.stringify(papers);
  },
  {
    name: "fetch_arxiv_papers",
    description: "Fetches peer-reviewed physics papers from ArXiv based on search queries like 'quantum entanglement' or 'brane theory'. Returns clean array structure.",
    schema: z.object({
      query: z.string().describe("Search query for ArXiv"),
    }),
  }
);
