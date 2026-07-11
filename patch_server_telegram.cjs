const fs = require('fs');
const filePath = '/tmp/bannon2/server.ts';
let code = fs.readFileSync(filePath, 'utf8');

const initializeCall = `
// [LIVING NEXUS] Ignite Autonomous Telegram Polling
telegramBotService.initialize().then((res) => {
    console.log("[Telegram] Autonomous Proactive engine booted:", res);
}).catch((err) => {
    console.error("[Telegram] Daemon failed:", err);
});
`;

if (!code.includes("telegramBotService.initialize()")) {
    code = code.replace(
        "app.listen(PORT, '0.0.0.0', () => {",
        initializeCall + "\\n  app.listen(PORT, '0.0.0.0', () => {"
    );
}

fs.writeFileSync(filePath, code);
console.log("Patched server.ts to initialize TelegramBotService.");
