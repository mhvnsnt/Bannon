const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

code = code.replace(
    /            \}\n            \} else if \(functionCall\.name === "railway_command"\) \{/,
    '            } else if (functionCall.name === "railway_command") {'
);

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched extra brace.");
