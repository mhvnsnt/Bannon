const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

const daemonImport = `import { exec, spawn } from 'child_process';`;
if (!serverTs.includes(daemonImport)) {
  serverTs = serverTs.replace('import fs from "fs";', 'import fs from "fs";\n' + daemonImport);
}

const daemonSpawn = `
// Start Autonomous Daemon
console.log("Starting Autonomous Daemon...");
const daemonProcess = spawn('npx', ['tsx', 'start-autonomous-agent.ts'], {
    detached: true,
    stdio: 'ignore'
});
daemonProcess.unref();
`;

if (!serverTs.includes("Starting Autonomous Daemon...")) {
  serverTs = serverTs.replace(
    'app.listen(PORT, "0.0.0.0", () => {',
    daemonSpawn + '\n  app.listen(PORT, "0.0.0.0", () => {'
  );
}

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts with Autonomous Daemon");
