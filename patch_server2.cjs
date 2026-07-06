const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(
  'import { BannonSyncService } from "./src/services/bannonSyncService";',
  'import { RepoSyncService } from "./src/services/repoSyncService";'
);

serverTs = serverTs.replace(
  /const bannonToken = process\.env\.GITHUB_TOKEN.*[\s\S]*bannonSync\.startDaemon\(60000\); \/\/ Check every minute/,
  `// Start Repo Sync Daemon for all connected repos
const githubToken = process.env.GITHUB_TOKEN || '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';
const repoSync = new RepoSyncService(githubToken, [
  { owner: 'mhvnsnt', repo: 'BANNON', branch: 'main' },
  { owner: 'mhvnsnt', repo: 'CODEDUMMY', branch: 'main' }
]);
repoSync.startDaemon(60000); // Check every minute`
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts with RepoSyncService");
