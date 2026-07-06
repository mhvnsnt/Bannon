const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// The extra </div> is just before Decentralized P2P Compute Swarm Section
content = content.replace(
  "            </div>\n            </div>\n            {/* Decentralized P2P Compute Swarm Section */}",
  "            </div>\n            {/* Decentralized P2P Compute Swarm Section */}"
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Fixed extra div");
