const fs = require('fs');
let file = 'src/components/GitHubActions.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCloneCode = `  const handleClone = async () => {
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
      alert('Failed to clone repository. Check token or permissions.');
    } finally {
      setIsCloning(false);
    }
  };`;

const newCloneCode = `  const handleClone = async (prefilledRepo?: string) => {
    const repo = prefilledRepo || prompt("Enter owner/repo to clone (e.g., torvalds/linux):");
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) return alert("Invalid format. Use owner/repo.");
    
    setIsCloning(true);
    try {
      const res = await cloneRepo(githubToken, owner, name, protocol);
      alert(\`Successfully cloned \${repo} via \${protocol.toUpperCase()}\\nURL: \${res.url}\`);
    } catch (e) {
      console.error(e);
      alert('Failed to clone repository. Check token or permissions.');
    } finally {
      setIsCloning(false);
    }
  };`;

content = content.replace(oldCloneCode, newCloneCode);

const buttonsCode = `          <button onClick={() => handleClone()} disabled={isCloning} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 disabled:opacity-50">
            <span className="flex items-center gap-2"><Download className="w-4 h-4 text-emerald-600" /> Clone Repository</span>
            {isCloning ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <span className="text-xs text-slate-400">gh repo clone</span>}
          </button>`;

const newButtonsCode = `          <button onClick={() => handleClone('mhvnsnt/CODEDUMMY')} disabled={isCloning} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-blue-700 disabled:opacity-50">
            <span className="flex items-center gap-2"><Download className="w-4 h-4 text-blue-600" /> Clone mhvnsnt/CODEDUMMY</span>
            {isCloning ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <span className="text-xs text-blue-400">gh repo clone</span>}
          </button>
          <button onClick={() => handleClone()} disabled={isCloning} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 disabled:opacity-50">
            <span className="flex items-center gap-2"><Download className="w-4 h-4 text-emerald-600" /> Clone Custom Repository</span>
            {isCloning ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <span className="text-xs text-slate-400">gh repo clone</span>}
          </button>`;

content = content.replace(buttonsCode, newButtonsCode);

fs.writeFileSync(file, content);
console.log("Patched GitHubActions.tsx with clone mhvnsnt/CODEDUMMY!");
