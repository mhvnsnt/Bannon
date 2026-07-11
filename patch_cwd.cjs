const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/process\.cwd\(\)/g, "(__dirname || process.cwd())");
code = code.replace(/WORKSPACE_DIR/g, "(__dirname || process.cwd())"); // Wait, WORKSPACE_DIR is already used.

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
