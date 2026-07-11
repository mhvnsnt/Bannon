const fs = require('fs');

let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

const targetLoopTarget = `
async function runLoop() {
`;

const targetLoopReplacement = `
async function runLoop() {
    // Process external Telegram/CLI Prompts
    const queuePath = path.resolve(WORKSPACE_DIR, 'command_queue.json');
    if (fs.existsSync(queuePath)) {
        try {
            let queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
            if (queue.length > 0) {
                const nextPrompt = queue.shift();
                console.log(\`[DAEMON] Injecting External Command: \${nextPrompt.text}\`);
                
                // Construct a forceful system override for the prompt
                const systemOverride = "IMMEDIATE USER OVERRIDE DIRECTIVE:\\n" + nextPrompt.text + "\\n\\nYou MUST prioritize this request above all ongoing background tasks. Execute it immediately and write your findings/changes to the codebase.";
                
                messages.push({ role: 'user', text: systemOverride });
                
                fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
            }
        } catch(e) {
            console.error("[DAEMON] Error reading command queue:", e.message);
        }
    }
`;

if (!code.includes("const queuePath = path.resolve(WORKSPACE_DIR, 'command_queue.json');")) {
    code = code.replace(targetLoopTarget, targetLoopReplacement);
}

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts to consume prompt queue.");
