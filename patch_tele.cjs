const fs = require('fs');
let code = fs.readFileSync('src/services/TelegramBotService.ts', 'utf8');

const targetStr = `            } else {
                await this.bot.sendMessage(senderChatId, \`❓ *Unknown command: "\${msg.text}"*\\n\\nTry sending \\\`status\\\` or \\\`run scrape\\\`.\`, { parse_mode: 'Markdown' });
            }`;

const newStr = `            } else {
                // Not 'status' or 'scrape', so it's a direct command/message for the Autonomous Agent
                try {
                    const queuePath = path.join(process.cwd(), 'command_queue.json');
                    let queue = [];
                    if (fs.existsSync(queuePath)) {
                        try {
                            queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
                        } catch (e) { queue = []; }
                    }
                    queue.push({ role: 'user', text: msg.text, timestamp: new Date().toISOString() });
                    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
                    await this.bot.sendMessage(senderChatId, \`⏳ *Command acknowledged.* Passing to Autonomous Nexus Daemon for execution...\\n\\n_Note: Executing complex tasks may take time._\`, { parse_mode: 'Markdown' });
                } catch (err) {
                    await this.bot.sendMessage(senderChatId, \`❌ *Failed to queue command:* \${err.message}\`, { parse_mode: 'Markdown' });
                }
            }`;

if (code.includes('❓ *Unknown command')) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('src/services/TelegramBotService.ts', code);
    console.log("Patched TelegramBotService successfully.");
} else {
    console.log("Target string not found!");
}
