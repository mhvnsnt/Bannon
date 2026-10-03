const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/console\.log\(\`\[Autonomous Daemon\] Calling tool: \$\{functionCall\.name\}\`\);/, "console.log(`[Autonomous Daemon] Calling tool: ${functionCall.name} with args:`, JSON.stringify(functionCall.args));");

code = code.replace(/history\.push\(\{\n\s*role: 'user',\n\s*parts: \[\{ functionResponse: \{ name: functionCall\.name, response: result \} \}\]\n\s*\}\);\n\s*\}/, `history.push({
                role: 'user',
                parts: [{ functionResponse: { name: functionCall.name, response: result } }]
            });
            console.log("[Autonomous Daemon] Tool execution complete, immediately proceeding to next thought...");
            setImmediate(() => runLoop());
        }`);

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
