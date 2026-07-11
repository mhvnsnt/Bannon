const fs = require('fs');

let code = fs.readFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', 'utf8');

const agentPromptTarget = `
            if (incomingText.includes('help') || incomingText === '/start') {
`;

const agentPromptReplacement = `
            if (incomingText.startsWith('/agent ') || incomingText.startsWith('agent ')) {
                const prompt = msg.text.replace(/^\\/?agent\\s+/i, '');
                await this.bot.sendMessage(senderChatId, \`🧠 *Injecting Prompt into Nexus Queue:*\\n_"\${prompt}"_\`, { parse_mode: 'Markdown' });
                
                try {
                    const queuePath = path.resolve(process.cwd(), 'command_queue.json');
                    let queue = [];
                    if (fs.existsSync(queuePath)) {
                        try { queue = JSON.parse(fs.readFileSync(queuePath, 'utf8')); } catch(e) {}
                    }
                    queue.push({ role: 'user', text: prompt, timestamp: new Date().toISOString() });
                    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
                    await this.bot.sendMessage(senderChatId, \`✅ *Prompt queued successfully.* The autonomous daemon will process it on the next cycle.\`, { parse_mode: 'Markdown' });
                } catch(e) {
                    await this.bot.sendMessage(senderChatId, \`❌ *Failed to queue prompt:* \${e.message}\`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText.includes('help') || incomingText === '/start') {
`;

if (!code.includes("incomingText.startsWith('/agent ')")) {
    code = code.replace(agentPromptTarget, agentPromptReplacement);
}

const helpUpdateTarget = `• \\\`/bash <command>\\\` or \\\`bash <command>\\\`: Execute raw root terminal commands directly on the Living Nexus server.\\n\\n\``;
const helpUpdateReplacement = `• \\\`/bash <command>\\\` or \\\`bash <command>\\\`: Execute raw root terminal commands directly on the Living Nexus server.\\n` +
                    `• \\\`/agent <prompt>\\\` or \\\`agent <prompt>\\\`: Send natural language commands directly to the autonomous Qwable/Gemini agent to edit the codebase.\\n\\n\``;

if (code.includes(helpUpdateTarget)) {
    code = code.replace(helpUpdateTarget, helpUpdateReplacement);
}

fs.writeFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', code);
console.log("Patched TelegramBotService.ts for Agent prompting.");
