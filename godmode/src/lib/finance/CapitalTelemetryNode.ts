import { memoryVault as db } from "../../server/db.js"
import { NotificationRouter } from "../NotificationRouter.js"

export class CapitalTelemetryNode {
  static async processPayout(source: string, amount: number, asset: string, eventId: string) {
    const formattedAmount = amount + " " + asset
    const eventTitle = "CAPITAL CAPTURED " + source
    const details = "Swarm secured " + formattedAmount + " via " + source + " payout"

    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS capital_ledger (
                event_id TEXT PRIMARY KEY,
                source TEXT,
                amount REAL,
                asset TEXT,
                logged_at DATETIME
            )
        `);

        db.prepare(`
            INSERT INTO capital_ledger (event_id, source, amount, asset, logged_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(eventId, source, amount, asset)

        await NotificationRouter.dispatchApprovalRequest({
            txHash: eventId,
            
            sourceAgent: "CAPITAL_ENG",
            actionType: "CAPITAL_DEPLOYMENT",
            description: details,
            payload: { amount, asset, source }
        })
    } catch (e) {
        console.error("Failed to process payout:", e);
    }
  }
}
