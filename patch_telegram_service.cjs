const fs = require('fs');
let code = fs.readFileSync('src/services/TelegramBotService.ts', 'utf8');

const newElseBlock = `
            } else {
                // Not 'status' or 'scrape', so it's a direct command/message for the Autonomous Agent
                try {
                    const queuePath = path.join(process.cwd(), 'command_queue.json');
                    let queue: any[] = [];
                    if (fs.existsSync(queuePath)) {
                        try {
                            queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
                        } catch (e) { queue = []; }
                    }
                    queue.push({ role: 'user', text: msg.text, timestamp: new Date().toISOString() });
                    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
                    await this.bot.sendMessage(senderChatId, \`\\u23F3 *Command acknowledged.* Passing to Autonomous Nexus Daemon for execution...\\n\\n_Note: Executing complex tasks may take time._\`, { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, \`\\u274C *Failed to queue command:* \${err.message}\`, { parse_mode: 'Markdown' });
                }
            }
`;

code = code.replace(
    /\} else \{\s*await this\.bot\.sendMessage\(senderChatId, `\\u2753 \*Unknown command: "\$\{msg\.text\}"\*\\n\\nTry sending \\`status\\` or \\`run scrape\\`\.`, \{ parse_mode: 'Markdown' \}\);\s*\}/,
    newElseBlock.trim()
);

fs.writeFileSync('src/services/TelegramBotService.ts', code);
console.log("Patched TelegramBotService.ts to queue commands for Daemon");
