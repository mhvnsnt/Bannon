const fs = require('fs');

let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

const dupBlock = `
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
                
                history.push({ role: 'user', parts: [{ text: systemOverride }] });
                
                fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
            }
        } catch(e) {
            console.error("[DAEMON] Error reading command queue:", e.message);
        }
    }
`;

if (code.includes(dupBlock.trim().split('\n')[0])) {
    // Just replace the block with empty string by matching the lines roughly
    // Better to use regex or string replace
    code = code.replace(/\/\/ Process external Telegram[\s\S]*?console\.error\("\[DAEMON\] Error reading command queue:", e\.message\);\n        }\n    }/, '');
    fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
    console.log("Removed duplicate queue parsing block.");
} else {
    console.log("Could not find duplicate block.");
}
