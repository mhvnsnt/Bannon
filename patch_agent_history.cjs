const fs = require('fs');

let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

// Fix messages.push to history.push
code = code.replace(/messages\.push\(\{ role: 'user', text: systemOverride \}\);/g, "history.push({ role: 'user', parts: [{ text: systemOverride }] });");

// Also, the block I added is before `if (isRunning) return;`.
// It's better to put it AFTER `isRunning = true;` or `console.log("[Autonomous Daemon] Starting iteration...");` so it doesn't double-fire if it's already running.
// Wait, actually there's already a block starting at `let hasUserCommand = false;` that reads the queue!
// I'll just remove the faulty block I added entirely, and let the existing block handle it, OR I'll enhance the existing block.

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
console.log("Patched agent history push.");
