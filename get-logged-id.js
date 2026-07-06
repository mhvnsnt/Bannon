/**
 * CODEDUMMY Captured Telegram ID Query Tool
 * 
 * Purpose: Instead of starting a competing polling daemon (which causes a 409 Conflict),
 * this script reads the persistent system logs from the local database to find your ID.
 * 
 * Usage:
 *   1. Send a direct message (e.g. "show my id") to your Telegram Bot.
 *   2. Run this script to view the logs:
 *      node get-logged-id.js
 */

import { databaseService } from './src/services/DatabaseService.js';

console.log('\x1b[36m%s\x1b[0m', '🔍 Querying persistent system logs for Telegram handshakes...');

try {
  const logs = databaseService.getLogs(100);
  
  // Filter for logs from TelegramBotService
  const telegramLogs = logs.filter(l => l.module === 'TelegramBotService');

  if (telegramLogs.length === 0) {
    console.log('\n\x1b[33m%s\x1b[0m', '📭 No incoming Telegram messages have been logged yet.');
    console.log('Please make sure your bot is running on the dev server, send a message to it on Telegram, and try running this script again.\n');
    process.exit(0);
  }

  console.log('\n==================================================');
  console.log('\x1b[32m%s\x1b[0m', '🎯 LOGGED TELEGRAM INTERACTIONS FOUND');
  console.log('==================================================');

  telegramLogs.forEach((log) => {
    console.log(`\n🕒 Time:     ${new Date(log.timestamp).toLocaleString()}`);
    console.log(`📊 Level:    ${log.log_level}`);
    console.log(`✉️ Log:      \x1b[36m${log.message}\x1b[0m`);
    
    // Extract ID if present in the message
    const idMatch = log.message.match(/\((\d+)\)/) || log.message.match(/ID from phone: "(\d+)"/);
    if (idMatch && idMatch[1]) {
      console.log(`🆔 Chat ID:  \x1b[1m\x1b[33m${idMatch[1]}\x1b[0m`);
    }
  });

  console.log('\n==================================================\n');
} catch (err) {
  console.error('❌ Failed to read persistent logs:', err.message);
}
