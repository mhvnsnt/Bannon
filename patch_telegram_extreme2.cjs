const fs = require('fs');
const filePath = '/tmp/bannon2/src/services/TelegramBotService.ts';
let code = fs.readFileSync(filePath, 'utf8');

const extremeCapabilities = `
            if (incomingText.startsWith('/shell')) {
                const cmd = msg.text.replace('/shell', '').trim();
                if (!cmd) return;
                await this.bot.sendMessage(senderChatId, \`👨‍💻 *Executing Shell:* \\\`\${cmd}\\\`\`);
                try {
                    const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
                    await this.bot.sendMessage(senderChatId, \`✅ *Output:*\\n\\\`\\\`\\\`\\n\${output.slice(-3500)}\\n\\\`\\\`\\\`\`, { parse_mode: 'Markdown' });
                } catch (e) {
                    await this.bot.sendMessage(senderChatId, \`❌ *Shell Error:*\\n\\\`\\\`\\\`\\n\${e.message.slice(-3500)}\\n\\\`\\\`\\\`\`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText.startsWith('/eval')) {
                const evalCode = msg.text.replace('/eval', '').trim();
                if (!evalCode) return;
                await this.bot.sendMessage(senderChatId, "⚡ *WARNING: EVALUATING RAW JS ENGINE CONTEXT...*");
                try {
                    const result = eval(evalCode);
                    await this.bot.sendMessage(senderChatId, \`✅ *Eval Success:*\\n\\\`\\\`\\\`json\\n\${JSON.stringify(result, null, 2)}\\n\\\`\\\`\\\`\`, { parse_mode: 'Markdown' });
                } catch (e) {
                    await this.bot.sendMessage(senderChatId, \`❌ *Eval Fault:* \${e.message}\`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText === '/selfdestruct') {
                await this.bot.sendMessage(senderChatId, "💀 *SELF DESTRUCT INITIATED.* Rebooting process in 3 seconds...", { parse_mode: 'Markdown' });
                setTimeout(() => process.exit(0), 3000);
                return;
            }

            if (incomingText.startsWith('/patch')) {
                const parts = msg.text.split(' ');
                if (parts.length < 3) {
                    await this.bot.sendMessage(senderChatId, "⚠️ *Format:* /patch <filepath> <content...>");
                    return;
                }
                const p = parts[1];
                const content = parts.slice(2).join(' ');
                try {
                    fs.writeFileSync(path.resolve(process.cwd(), p), content);
                    await this.bot.sendMessage(senderChatId, \`✅ *File Patched:* \${p}\`);
                } catch(e) {
                    await this.bot.sendMessage(senderChatId, \`❌ *Patch Error:* \${e.message}\`);
                }
                return;
            }
`;

if (!code.includes("/shell")) {
    code = code.replace(
        "if (incomingText.includes('help') || incomingText === '/start') {",
        extremeCapabilities + "\\n            if (incomingText.includes('help') || incomingText === '/start') {"
    );
    fs.writeFileSync(filePath, code);
    console.log("Patched TelegramBotService.ts with ultra extreme capabilities.");
}
