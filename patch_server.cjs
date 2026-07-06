const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

// Add import
serverTs = serverTs.replace(
  'import { GitHubService } from "./src/services/githubService";',
  'import { GitHubService } from "./src/services/githubService";\nimport { BannonSyncService } from "./src/services/bannonSyncService";'
);

// Start daemon near bottom
const startDaemonCode = `
// Start Bannon Sync Daemon
const bannonToken = process.env.GITHUB_TOKEN || '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';
const bannonSync = new BannonSyncService(bannonToken, 'mhvnsnt', 'BANNON', 'main');
bannonSync.startDaemon(60000); // Check every minute
`;

// Insert it right before the server listen
serverTs = serverTs.replace(
  "app.listen(PORT, \"0.0.0.0\", () => {",
  startDaemonCode + "\napp.listen(PORT, \"0.0.0.0\", () => {"
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts with BannonSyncService");
