const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

const watchLogic = `
setTimeout(loopWithBackoff, 60000);

let isRunning = false;
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
                isRunning = true;
                runLoop().then(() => { isRunning = false; }).catch(e => { console.error(e); isRunning = false; });
            }
        } catch(e) {}
    }
});

// Wrapper to track running state
const originalRunLoop = runLoop;
runLoop = async function() {
    isRunning = true;
    try {
        await originalRunLoop();
    } finally {
        isRunning = false;
    }
}
`;

if (!code.includes("fs.watch(queuePathWatch")) {
    code = code.replace(
        'setTimeout(loopWithBackoff, 60000);',
        watchLogic
    );
}

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched daemon to trigger instantly on Telegram command");
