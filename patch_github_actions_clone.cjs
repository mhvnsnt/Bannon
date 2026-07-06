const fs = require('fs');
let file = 'src/components/GitHubActions.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldClone = `  const handleClone = async () => {
    if (!githubToken) return alert("Please provide a GitHub token first.");
    const repo = prompt("Enter owner/repo to clone (e.g., torvalds/linux):");
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) return alert("Invalid format. Use owner/repo.");
    
    setIsCloning(true);
    try {
      const res = await cloneRepo(githubToken, owner, name, protocol);
      alert(\`Successfully cloned \${repo} via \${protocol.toUpperCase()}\\nURL: \${res.url}\`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCloning(false);
    }
  };`;

const newClone = `  const handleClone = async (targetRepo?: string) => {
    if (!githubToken) return alert("Please provide a GitHub token first.");
    const repo = targetRepo || prompt("Enter owner/repo to clone (e.g., torvalds/linux):");
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) return alert("Invalid format. Use owner/repo.");
    
    setIsCloning(true);
    try {
      const res = await cloneRepo(githubToken, owner, name, protocol);
      alert(\`Successfully cloned \${repo} via \${protocol.toUpperCase()}\\nURL: \${res.url}\`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCloning(false);
    }
  };`;

content = content.replace(oldClone, newClone);

// add the mhvnsnt/CODEDUMMY button
const oldButtons = `          <button
            onClick={handleClone}
            disabled={isCloning || !githubToken}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
            title="Clone Repository"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Clone
          </button>`;

const newButtons = `          <button
            onClick={() => handleClone('mhvnsnt/CODEDUMMY')}
            disabled={isCloning || !githubToken}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-blue-200 disabled:opacity-50 transition-all border border-blue-200"
            title="Clone mhvnsnt/CODEDUMMY"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Clone CODEDUMMY
          </button>
          <button
            onClick={() => handleClone()}
            disabled={isCloning || !githubToken}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
            title="Clone Repository"
          >
            {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Clone Custom
          </button>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync(file, content);
console.log("Patched!");
