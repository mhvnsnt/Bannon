const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', 'utf8');

const docHandler = `
        this.bot.on('document', async (msg: any) => {
            const chatId = msg.chat.id;
            const doc = msg.document;
            if (doc) {
                await this.bot.sendMessage(chatId, \`📥 *Receiving File:* \${doc.file_name} (\${doc.file_size} bytes)...\`, { parse_mode: 'Markdown' });
                try {
                    const fileLink = await this.bot.getFileLink(doc.file_id);
                    const downloadPath = path.join(process.cwd(), 'models', doc.file_name);
                    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
                    const response = await axios({ url: fileLink, method: 'GET', responseType: 'stream' });
                    const writer = fs.createWriteStream(downloadPath);
                    response.data.pipe(writer);
                    writer.on('finish', async () => {
                        await this.bot.sendMessage(chatId, \`✅ *File Saved:* \${doc.file_name} successfully ingested into the Living Nexus at \`models/\${doc.file_name}\`.\`, { parse_mode: 'Markdown' });
                    });
                    writer.on('error', async (err: any) => {
                        await this.bot.sendMessage(chatId, \`❌ *File Save Error:* \${err.message}\`, { parse_mode: 'Markdown' });
                    });
                } catch (e: any) {
                    await this.bot.sendMessage(chatId, \`❌ *Download Error:* \${e.message}\`, { parse_mode: 'Markdown' });
                }
            }
        });
`;

if (!code.includes("this.bot.on('document'")) {
    code = code.replace("this.bot.on('message', async (msg: any) => {", docHandler + "\n        this.bot.on('message', async (msg: any) => {");
}

const bashHandler = `
            if (incomingText.startsWith('/bash ') || incomingText.startsWith('bash ')) {
                const cmd = incomingText.replace(/^\\/?bash\\s+/i, '');
                await this.bot.sendMessage(senderChatId, \`💻 *Executing:* \\\`\${cmd}\\\`\`, { parse_mode: 'Markdown' });
                try {
                    const output = execSync(cmd, { encoding: 'utf8', timeout: 60000 });
                    await this.bot.sendMessage(senderChatId, \`✅ *BASH OUTPUT:*\\n\\\`\\\`\\\`\\n\${output.slice(0, 3900) || '(No output)'}\\n\\\`\\\`\\\`\`, { parse_mode: 'Markdown' });
                } catch(e: any) {
                    await this.bot.sendMessage(senderChatId, \`❌ *BASH ERROR:*\\n\\\`\\\`\\\`\\n\${(e.stdout || e.message).slice(0, 3900)}\\n\\\`\\\`\\\`\`, { parse_mode: 'Markdown' });
                }
                return;
            }
`;

if (!code.includes("incomingText.startsWith('/bash ')")) {
    code = code.replace("if (incomingText.includes('help') || incomingText === '/start') {", bashHandler + "\n            if (incomingText.includes('help') || incomingText === '/start') {");
}

const helpUpdateTarget = `• \\\`/scrape\\\` or \\\`scrape\\\`: Trigger the Obscura internet slang scraper stack to ingest fresh cultural references.\\n\\n\``;
const helpUpdateReplacement = `• \\\`/scrape\\\` or \\\`scrape\\\`: Trigger the Obscura internet slang scraper stack to ingest fresh cultural references.\\n` +
                    `• \\\`/bash <command>\\\` or \\\`bash <command>\\\`: Execute raw root terminal commands directly on the Living Nexus server.\\n\\n\``;
code = code.replace(helpUpdateTarget, helpUpdateReplacement);

fs.writeFileSync('/tmp/bannon2/src/services/TelegramBotService.ts', code);
console.log("Patched TelegramBotService.ts for Direct File Ingestion and BASH control.");
