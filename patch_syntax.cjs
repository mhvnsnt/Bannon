const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

code = code.replace(/history\.push\(\{\s*history\.push\(\{/g, 'history.push({');

fs.writeFileSync('start-autonomous-agent.ts', code);
