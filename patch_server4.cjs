const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(
  "history.push({\n                        role: \"user\",\n                        parts: [{ functionResponse: { name: \"workspaceAction\", response: result } }]\n                    });",
  "contentsContext.push({\n                        role: \"user\",\n                        parts: [{ functionResponse: { name: \"workspaceAction\", response: result } }]\n                    });"
);

serverTs = serverTs.replace(
  "while (!isDone && turnCount < 3)",
  "while (!isDone && turnCount < 15)"
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts fixes");
