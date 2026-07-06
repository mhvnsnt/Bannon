const fs = require('fs');

// AgentView.tsx
let agentView = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// The replacement above did not add Maximize2 to imports because it probably missed the line `import { Send,`
// Let's just find the very first import and inject it
agentView = agentView.replace(
  "import React",
  "import { Maximize2, Minimize2, X } from 'lucide-react';\nimport React"
);

fs.writeFileSync('src/components/AgentView.tsx', agentView);

// GitHubActions.tsx
let ghActions = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');
ghActions = ghActions.replace(
  "import React",
  "import { RefreshCw } from 'lucide-react';\nimport React"
);

fs.writeFileSync('src/components/GitHubActions.tsx', ghActions);
console.log("Fixed final 4!");
