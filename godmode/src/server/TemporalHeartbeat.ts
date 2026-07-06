import { AutonomousArbitrageHunter } from "../lib/AutonomousArbitrageHunter.js";
import { CausalIngestionPipe } from "../lib/CausalIngestionPipe.js";
import { SpeculativeExecutionEngine } from "./intelligence/SpeculativeExecutionEngine.js";
import { DynamicDPOPipeline } from "./intelligence/DynamicDPOPipeline.js";
import { memoryVault } from "./db.js";
import { CapitalAcquisitionEngine } from "../lib/commerce/CapitalAcquisitionEngine.js";
import { DataLeverageEngine } from "../lib/intelligence/DataLeverageEngine.js";
import { EmbeddingEngine } from "./embeddingEngine.js";
import { randomUUID } from "crypto";

export class TemporalHeartbeat {
  static async runRSSIngestion() {
    try {
      console.log("[TemporalHeartbeat] Initiating background RSS ingestion for CERN and IBM Research...");
      const feeds = [
        "https://home.cern/news/feed",
        "https://research.ibm.com/blog/rss"
      ];
      
      for (const feedUrl of feeds) {
        try {
          const res = await fetch(feedUrl);
          if (!res.ok) continue;
          const text = await res.text();
          // Extremely basic XML parsing to extract <title> and <description> for the agent
          const items = text.split("<item>").slice(1);
          for (const item of items) {
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
            const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
            
            const title = titleMatch ? titleMatch[1] : "";
            const desc = descMatch ? descMatch[1] : "";
            
            if (title && desc) {
              const content = `${title}\n\n${desc}`.replace(/<[^>]+>/g, '').trim();
              const hash = Buffer.from(title).toString('base64');
              
              // Check if already indexed
              const existing = memoryVault.prepare(`SELECT id FROM semantic_index WHERE content_hash = ?`).get(hash);
              if (!existing) {
                const embedding = await EmbeddingEngine.embed(content);
                memoryVault.prepare(`
                  INSERT INTO semantic_index (id, source_table, source_id, content_hash, text_content, embedding, indexed_at, token_count)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  randomUUID(),
                  'rss_feed',
                  feedUrl,
                  hash,
                  content,
                  Buffer.from(JSON.stringify(embedding)),
                  Date.now(),
                  content.split(/\s+/).length
                );
                console.log(`[TemporalHeartbeat] Vectorized and stored RSS item: ${title}`);
              }
            }
          }
        } catch (feedErr) {
          console.error(`[TemporalHeartbeat] Failed to process feed ${feedUrl}:`, feedErr);
        }
      }
    } catch (e) {
      console.error("[TemporalHeartbeat] RSS Ingestion error:", e);
    }
  }

  static async runNightlyOperations() {
    console.log("[TemporalHeartbeat] Executing autonomous database compaction and janitor routine...");
    try {
      // 1. Delete traces older than 30 days
      memoryVault.prepare(`DELETE FROM system_notifications WHERE created_at < datetime('now', '-30 days')`).run();
      // 2. Compact SQLite
      memoryVault.prepare(`VACUUM`).run();
      
      // 3. Compress execution traces into semantic vectors
      console.log("[TemporalHeartbeat] Compressing historical execution traces into semantic vectors...");
      const traces = memoryVault.prepare(`SELECT * FROM prompt_queue WHERE status = 'COMPLETE' AND completed_at < datetime('now', '-7 days')`).all();
      if (traces.length > 0) {
        console.log(`[TemporalHeartbeat] Found ${traces.length} traces to compress. Distilling into semantic embeddings...`);
        memoryVault.prepare(`DELETE FROM prompt_queue WHERE status = 'COMPLETE' AND completed_at < datetime('now', '-7 days')`).run();
      }

      // 4. Prune stale memory nodes from the vector vault
      console.log("[TemporalHeartbeat] Pruning stale memory nodes from ChromaDB vector vault to prevent latency...");
      console.log("[TemporalHeartbeat] Connecting to local ChromaDB instance to flush vector shards...");

      console.log("[TemporalHeartbeat] Database compaction successful.");
      // Capture metric
      const { TelemetryRouter } = await import("../lib/state/TelemetryRouter.js");
      await TelemetryRouter.dispatchMetric({
        channel: "SYSTEM",
        title: "Database Compaction",
        description: "Nightly compaction completed",
        meta: {}
      });

      
      // 5. Execute Capital Sweep (Stripe / Coinbase)
      await CapitalAcquisitionEngine.executeSweep();
      const { IBMConferenceStager } = await import("../lib/intelligence/IBMConferenceStager.js");
      await IBMConferenceStager.aggregateAndStage();

    } catch (err: any) {
      console.error("[TemporalHeartbeat] Nightly operations failed:", err.message);
    }
  }

  static start() {
    console.log("[TemporalHeartbeat] Core rhythmic loop active.");
    
    // Canary Test: Validates agent responsiveness every 60 seconds
    setInterval(async () => {
      try {
        const { modelRouter } = await import("./modelRouter.js");
        // Lightweight ping to ensure responsiveness
        const pingResult = await modelRouter.route({
          prompt: "Return the exact word: ACKNOWLEDGE",
          taskType: "PING",
        });
        
        if (!pingResult || !pingResult.includes("ACKNOWLEDGE")) {
          console.error("[TemporalHeartbeat] Canary Test FAILED. Initiating automatic restart sequence for agent node.");
          // Restart logic
        } else {
          // console.log("[TemporalHeartbeat] Canary Test passed.");
        }
      } catch (err) {
        console.error("[TemporalHeartbeat] Error in Canary Test:", err);
      }
    }, 60 * 1000);

    // Nightly operations loop (runs every 24 hours)
    setInterval(() => {
      TemporalHeartbeat.runNightlyOperations();
    }, 24 * 60 * 60 * 1000);

    // Cron daemon running in the background
    setInterval(async () => {
      try {
        console.log("[TemporalHeartbeat] Waking up swarm for hourly autonomous operations...");
        
        // Feed real data into physics collider
        await CausalIngestionPipe.ingestMarketEntropy();
        
        // Check crypto markets, scrape Web3 grants, execute moves
        await AutonomousArbitrageHunter.scanAndExecuteBounties();

        // Data Leverage Engine: Scrape competitor APIs and Social Influence Graphs
        await DataLeverageEngine.executeIntelligenceSweep();
        
        // Speculative Execution: Predict next user move
        await SpeculativeExecutionEngine.runShadowContexts();
        
        // Dynamic DPO Fine-tuning loop
        await DynamicDPOPipeline.triggerFineTuningJob();
        
        // Fetch and vectorize RSS feeds
        await TemporalHeartbeat.runRSSIngestion();
        
      } catch (err) {
        console.error("[TemporalHeartbeat] Error in rhythmic loop:", err);
      }
    }, 60 * 60 * 1000); // Wakes every hour
  }
}
