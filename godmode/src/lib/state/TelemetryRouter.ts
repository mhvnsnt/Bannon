import { memoryVault as db } from "../../server/db.js";

interface SystemLogPayload {
  channel: "SYSTEM" | "LIQUIDITY" | "INFRASTRUCTURE";
  title: string;
  description: string;
  meta: any;
}

import * as crypto from "crypto";
export class TelemetryRouter {
  static async dispatchMetric(log: SystemLogPayload): Promise<void> {
    const metricId = crypto.randomUUID();
    const metadataString = JSON.stringify(log.meta);

    // Log the operational telemetry inside the local database stack
    db.prepare(`
      INSERT INTO system_notifications (id, agent, type, text, payload, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
    `).run(metricId, log.channel, log.title, log.description, metadataString);

    // Route standard status notifications to external channels
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID) {
      const formattedText = `[GOD MODE OS telemetry]\nChannel: ${log.channel}\nTitle: ${log.title}\nDetails: ${log.description}`;
      
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_ADMIN_ID,
            text: formattedText
          })
        });
      } catch (err) {
        console.error("Telemetry outbound link delay");
      }
    }
  }
}
