const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/tools: \[\{ functionDeclarations: \[workspaceTool, githubTool, railwayTool, supabaseTool\] \}\],\n                    \}\n                \/\/ \}\);/g, "tools: [{ functionDeclarations: [workspaceTool, githubTool, railwayTool, supabaseTool] }],\n                    }\n                });");

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
