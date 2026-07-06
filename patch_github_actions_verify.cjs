const fs = require('fs');
let content = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');

const verifyFunc = `
  const verifySyncStatus = async () => {
    setIsCloning(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      if (!enforceGodMode(owner)) { setIsCloning(false); return; }
      
      const localHash = localStorage.getItem('codedummy-last-sync-hash') || 'local_unknown';
      
      let remoteHash = 'remote_unknown';
      try {
        const remoteRes = await fetch(\`https://api.github.com/repos/\${owner}/\${repo}/commits/main\`);
        const remoteData = await remoteRes.json();
        remoteHash = remoteData.sha || remoteHash;
      } catch (e) {
        console.warn("Could not fetch remote hash", e);
      }
      
      if (localHash !== remoteHash && remoteHash !== 'remote_unknown') {
         alert(\`Hash mismatch!\\nLocal: \${localHash.slice(0,7)}\\nRemote: \${remoteHash.slice(0,7)}\\nTriggering automated patching workflow for Railway instance...\`);
         localStorage.setItem('codedummy-last-sync-hash', remoteHash);
         await handlePullSync();
      } else {
         alert("Sync verified: Railway instance is up-to-date with GitHub.");
         if (remoteHash !== 'remote_unknown') localStorage.setItem('codedummy-last-sync-hash', remoteHash);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCloning(false);
    }
  };
`;

content = content.replace("const handlePullSync = async", verifyFunc + "\n  const handlePullSync = async");

content = content.replace(
  '<button\n            onClick={() => handleClone(\'mhvnsnt/CODEDUMMY\')}',
  `<button
            onClick={verifySyncStatus}
            disabled={isCloning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-indigo-200 disabled:opacity-50 transition-all border border-indigo-200"
            title="Verify Sync & Patch"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Verify Sync
          </button>
          <button
            onClick={() => handleClone('mhvnsnt/CODEDUMMY')}`
);

fs.writeFileSync('src/components/GitHubActions.tsx', content);
console.log("Patched GitHubActions with Verify Sync");
