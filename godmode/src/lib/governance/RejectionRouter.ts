import { memoryVault as db } from "../../server/db.js";

export async function routeRejectionSignal(txHash: string, originalPrompt: string, rejectedCode: string) {
  console.log(`[DPO PIPELINE] Tracking rejected branch for txHash: ${txHash}`);
  
  // Storing the negative preference data for the weekly LoRA merge
  db.prepare(`
    INSERT INTO rejection_signals (txHash, prompt, rejectedOutput, timestamp)
    VALUES (?, ?, ?, datetime('now'))
  `).run(txHash, originalPrompt, rejectedCode);
}
