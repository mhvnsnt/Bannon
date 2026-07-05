import { memoryVault as db } from "../server/db.js";

export class AP2Controller {
  static async updateMandate(dailyLimit: number, txLimit: number, alertThreshold: number) {
    db.prepare(`
      UPDATE ap2_intent_mandates 
      SET daily_limit = ?, tx_limit = ?, alert_threshold = ?
      WHERE id = 'MASTER_MANDATE'
    `).run(dailyLimit, txLimit, alertThreshold);
    return "AP2 Mandate updated successfully";
  }
}
