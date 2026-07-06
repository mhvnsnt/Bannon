const fs = require('fs');
let file = 'src/components/GitHubActions.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldAutoSync = `  const handleAutoSync = async () => {
    if (!githubToken) return alert("Please provide a GitHub token first.");
    setIsPushing(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      
      // 1. Ensure repo exists
      await createRepositoryIfMissing(githubToken, owner, repo, false);
      
      // 2. We will just push a dummy file or you could fetch real files from your VFS
      const files = [
        { path: 'README.md', content: '# CODEDUMMY\\nAutonomous AI Engine.' },
        { path: 'ping.txt', content: 'Ping: ' + Date.now() }
      ];
      
      await autoCommitAndPush(githubToken, owner, repo, files, 'Auto-sync from CODEDUMMY Agent', 'main');
      alert(\`Successfully synced CODEDUMMY repo to \${owner}/\${repo}!\`);
    } catch (e: any) {
      console.error(e);
      alert('Sync failed: ' + e.message);
    } finally {
      setIsPushing(false);
    }
  };`;

const newAutoSync = `  const handleAutoSync = async () => {
    if (!githubToken) return alert("Please provide a GitHub token first.");
    setIsPushing(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      
      await createRepositoryIfMissing(githubToken, owner, repo, false);
      
      const response = await fetch('/api/github/sync-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          owner,
          repo,
          branch: 'main',
          message: 'Auto-sync workspace to GitHub from CODEDUMMY'
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to sync workspace');
      
      alert(\`Successfully synced entire workspace to \${owner}/\${repo}!\\nCommit: \${result.commitUrl}\`);
    } catch (e: any) {
      console.error(e);
      alert('Sync failed: ' + e.message);
    } finally {
      setIsPushing(false);
    }
  };`;

content = content.replace(oldAutoSync, newAutoSync);
fs.writeFileSync(file, content);
console.log("Patched handleAutoSync!");
