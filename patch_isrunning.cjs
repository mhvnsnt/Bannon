const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

code = code.replace(
    'async function runLoop() {',
    'let isRunning = false;\nasync function runLoop() {\n    if (isRunning) return;\n    isRunning = true;\n    try {'
);

code = code.replace(
    '        if (history.length > 20) {\n            history = [history[0], ...history.slice(-10)];\n        }\n\n    } catch (e) {\n        console.error("[Autonomous Daemon] Error:", e);\n    }\n}',
    '        if (history.length > 20) {\n            history = [history[0], ...history.slice(-10)];\n        }\n\n    } catch (e) {\n        console.error("[Autonomous Daemon] Error:", e);\n    } finally {\n        isRunning = false;\n    }\n}'
);

// Remove the old wrapper
code = code.replace(/let isRunning = false;\nconst queuePathWatch[\s\S]*?\}\n\}/, `
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
`);

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched runLoop with inline isRunning guard");
