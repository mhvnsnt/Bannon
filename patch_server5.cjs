const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(
  "If the user asks to work on their GitHub repo, use githubAction. If they ask to build courses, edit the curriculum, or audit the system locally, use workspaceAction to modify the actual codebase (like src/App.tsx where LESSONS live). Be an autonomous agentic system.",
  "If the user asks to work on their GitHub repo, use githubAction. If they ask to build courses, edit the curriculum, or audit the system locally, use workspaceAction to modify the actual codebase. Specifically, to add a lesson to CODEDUMMY, read src/App.tsx, locate the LESSONS array, append a new lesson object { id, title, subtitle }, and write the file back. You are a truly autonomous agentic system. Do not ask for permission, just execute the file modifications using your workspaceAction tool."
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts instruction");
