import { memoryVault as db } from "../server/db.js"; 

interface ApprovalPayload {
  txHash: string;
  sourceAgent: string;
  actionType: "CAPITAL_DEPLOYMENT" | "CODE_INJECTION" | "DOM_OVERRIDE";
  description: string;
  payload: any;
}

export class NotificationRouter {
  /**
   * Dispatches a critical approval request to both Telegram and the UI state engine.
   */
  static async dispatchApprovalRequest(request: ApprovalPayload): Promise<void> {
    console.log(`[NOTIFICATION ROUTER] Trapped high-risk action: ${request.txHash}`);

    // 1. Stage the event inside the persistent SQLite system database for the front-end to ingest
    db.prepare(`
      INSERT INTO system_notifications (id, agent, type, text, payload, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', datetime('now'))
    `).run(
      request.txHash,
      request.sourceAgent,
      request.actionType,
      request.description,
      JSON.stringify(request.payload)
    );

    // 2. Format and ship the encrypted callback alert to your private Telegram thread
    const messageText = `⚠️ *[GOD-MODE OS] APPROVAL REQUIRED*\n\n` +
                        `*Agent:* ${request.sourceAgent}\n` +
                        `*Action:* ${request.actionType}\n` +
                        `*Details:* ${request.description}\n\n` +
                        `Reply with \`approve ${request.txHash}\` or \`deny ${request.txHash}\` to execute.`;

    try {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_ADMIN_ID, // Strictly locked to your unique ID
            text: messageText,
            parse_mode: "Markdown"
          })
        });
      }
    } catch (err: any) {
      console.error("[TELEGRAM FAULT] Notification dispatch failed:", err.message);
    }
  }
}
