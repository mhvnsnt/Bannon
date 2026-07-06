const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

// We will slice off everything from `let errorCount = 0;` down, and rewrite it cleanly.
const index = code.indexOf('let errorCount = 0;');
if (index !== -1) {
    code = code.substring(0, index);
}

const correctBottom = `let errorCount = 0;
async function loopWithBackoff() {
    try {
        await runLoop();
        errorCount = 0; // reset on success
        setTimeout(loopWithBackoff, 60000); // 1 minute between loops
    } catch (e) {
        errorCount++;
        const backoff = Math.min(60000 * Math.pow(2, errorCount), 3600000); // Exponential backoff up to 1 hour
        console.log(\`[Autonomous Daemon] Loop failed. Retrying in \${backoff / 1000}s...\`);
        setTimeout(loopWithBackoff, backoff);
    }
}
setTimeout(loopWithBackoff, 60000);

const queuePathWatch = path.resolve(process.cwd(), 'command_queue.json');
if (!fs.existsSync(queuePathWatch)) {
    fs.writeFileSync(queuePathWatch, JSON.stringify([]));
}
fs.watch(queuePathWatch, (eventType) => {
    if (eventType === 'change' && !isRunning) {
        try {
            const queue = JSON.parse(fs.readFileSync(queuePathWatch, 'utf8'));
            if (queue.length > 0) {
                console.log("[Autonomous Daemon] New command detected! Triggering immediate execution.");
                runLoop().catch(e => console.error(e));
            }
        } catch(e) {}
    }
});
`;

code += correctBottom;
fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched bottom syntax.");
