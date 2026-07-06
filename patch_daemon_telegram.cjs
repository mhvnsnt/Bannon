const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

if (!code.includes("import axios from 'axios';")) {
    code = code.replace(
        'import dotenv from "dotenv";',
        'import dotenv from "dotenv";\nimport axios from "axios";'
    );
}

const telegramHelper = `
async function sendTelegramUpdate(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId || !text) return;
    
    // Chunk message if it's too long for Telegram (max 4096)
    const chunkSize = 4000;
    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.substring(i, i + chunkSize);
        try {
            await axios.post(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
                chat_id: chatId,
                text: \`\\uD83E\\uDD16 *Nexus Daemon:*\\n\\n\${chunk}\`,
                parse_mode: 'Markdown'
            });
        } catch (e: any) {
            console.error("[Telegram] Failed to send update:", e.message);
        }
    }
}
`;

if (!code.includes("sendTelegramUpdate")) {
    code = code.replace(
        'async function runLoop() {',
        telegramHelper + '\nasync function runLoop() {'
    );
}

const queueLogic = `
    const queuePath = path.resolve(process.cwd(), 'command_queue.json');
    let hasUserCommand = false;
    if (fs.existsSync(queuePath)) {
        try {
            const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
            if (queue.length > 0) {
                for (const cmd of queue) {
                    history.push({ role: 'user', parts: [{ text: "USER COMMAND: " + cmd.text }] });
                }
                fs.writeFileSync(queuePath, JSON.stringify([]));
                hasUserCommand = true;
                console.log("[Autonomous Daemon] Ingested user commands from Telegram queue.");
            }
        } catch (e) {
            console.error("Error reading queue:", e);
        }
    }
`;

// Insert queueLogic at start of runLoop
if (!code.includes("hasUserCommand = false")) {
    code = code.replace(
        'console.log("[Autonomous Daemon] Starting iteration...");',
        'console.log("[Autonomous Daemon] Starting iteration...");\n' + queueLogic
    );
}

// Modify the end of the loop to send updates
const updateLogic = `
        if (fullText) {
            await sendTelegramUpdate(fullText + (functionCall ? \`\\n\\n*Executing Tool:* \` + functionCall.name : ''));
        }

        if (functionCall) {
`;

if (!code.includes("await sendTelegramUpdate(fullText")) {
    code = code.replace(
        '        if (functionCall) {',
        updateLogic
    );
}

// Modify the default append text so if there was a user command, we don't spam the default prompt.
// Also change the default prompt logic.
const historyAppend = `
        } else {
            history.push({ role: 'model', parts: [{ text: fullText }] });
            if (!hasUserCommand) {
                history.push({ role: 'user', parts: [{ text: "Great. Now find another area to improve, expand, or refactor. Do not stop. Do not wait. Execute the next improvement." }] });
            }
        }
`;

code = code.replace(
    /\} else \{\s*history\.push\(\{ role: 'model', parts: \[\{ text: fullText \}\] \}\);\s*history\.push\(\{ role: 'user', parts: \[\{ text: "Great\. Now find another area to improve, expand, or refactor\. Do not stop\. Do not wait\. Execute the next improvement\." \}\] \}\);\s*\}/,
    historyAppend
);


fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts with Telegram notifications and queue reading.");
