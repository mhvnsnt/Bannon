const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*\{\/\*\s*Decentralized P2P Compute Swarm Section\s*\*\/\}/g;
content = content.replace(regex, "</div>\n            {/* Decentralized P2P Compute Swarm Section */}");

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Fixed extra div v2");
