const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import { startImmortalHeartbeat } from "./src/services/agent-heartbeat.js";`;

if (!code.includes("startImmortalHeartbeat")) {
  code = code.replace(
      'import http from "http";',
      'import http from "http";\n' + importStatement
  );
  
  code = code.replace(
      'const app = express();',
      'startImmortalHeartbeat();\nconst app = express();'
  );
}

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with Immortal Heartbeat");
