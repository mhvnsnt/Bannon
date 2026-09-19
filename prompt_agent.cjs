const fs = require('fs');
const path = require('path');

const prompt = process.argv.slice(2).join(' ');
if (!prompt) {
    console.error("Usage: node prompt_agent.cjs <your prompt here>");
    process.exit(1);
}

const queuePath = path.resolve(process.cwd(), 'command_queue.json');
let queue = [];
if (fs.existsSync(queuePath)) {
    try {
        queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    } catch(e) {}
}

queue.push({ role: 'user', text: prompt, timestamp: new Date().toISOString() });
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
console.log(`✅ [God Mode] Prompt successfully injected into the Autonomous Agent's command queue:\n"${prompt}"\n\nThe daemon will pick this up on the next tick.`);
