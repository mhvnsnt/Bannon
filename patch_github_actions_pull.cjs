const fs = require('fs');
let file = 'src/components/GitHubActions.tsx';
let content = fs.readFileSync(file, 'utf8');

const pullHandler = `  const handlePullSync = async () => {
    if (!githubToken) return alert("Please provide a GitHub token first.");
    setIsCloning(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      
      const response = await fetch('/api/github/pull-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          owner,
          repo,
          branch: 'main'
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to pull workspace');
      
      alert(\`Successfully pulled from \${owner}/\${repo}!\\n\${result.message}\`);
    } catch (e: any) {
      console.error(e);
      alert('Pull failed: ' + e.message);
    } finally {
      setIsCloning(false);
    }
  };`;

content = content.replace("const handleAutoSync = async () => {", pullHandler + "\\n\\n  const handleAutoSync = async () => {");

const newButtons = `          <button
            onClick={handlePullSync}
            disabled={isCloning || !githubToken}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            title="Pull Latest from GitHub"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Pull
          </button>
          <button
            onClick={handleAutoSync}
            disabled={isPushing || !githubToken}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            title="Push Auto-Sync mhvnsnt/CODEDUMMY"
          >
            {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            Sync Up
          </button>`;

content = content.replace(/<button\s*onClick={handleAutoSync}[\s\S]*?Auto-Sync\s*<\/button>/, newButtons);

fs.writeFileSync(file, content);
console.log("Patched pull sync into GitHubActions.tsx");
