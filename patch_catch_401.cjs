const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/if \(error\?\.status === 429 \|\| error\?\.message\?\.includes\('RESOURCE_EXHAUSTED'\)\) \{/, "if (error?.status === 429 || error?.status === 401 || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('Authentication')) {");

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
