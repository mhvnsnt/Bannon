const fs = require('fs');
let content = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');

const adminCheck = `
  const isGodMode = 
    localStorage.getItem('codedummy-user-email') === 'marquiswhitacre@gmail.com' ||
    localStorage.getItem('codedummy-telegram-username') === 'cierrasquirts';

  const enforceGodMode = (owner) => {
    if (owner === 'mhvnsnt' && !isGodMode) {
      alert("Access denied: Only the God Mode Admin can push/pull to the mhvnsnt account.");
      return false;
    }
    return true;
  };
`;

content = content.replace("const handlePullSync = async () => {", adminCheck + "\n  const handlePullSync = async () => {");

content = content.replace(
  "const owner = 'mhvnsnt';\n      const repo = 'CODEDUMMY';",
  "const owner = 'mhvnsnt';\n      const repo = 'CODEDUMMY';\n      if (!enforceGodMode(owner)) { setIsCloning(false); return; }"
);

content = content.replace(
  /const handleAutoSync = async \(\) => \{\s*\/\/ Token injected in backend\s*setIsPushing\(true\);\s*try \{\s*const owner = 'mhvnsnt';\s*const repo = 'CODEDUMMY';/,
  `const handleAutoSync = async () => {
    // Token injected in backend
    setIsPushing(true);
    try {
      const owner = 'mhvnsnt';
      const repo = 'CODEDUMMY';
      if (!enforceGodMode(owner)) { setIsPushing(false); return; }`
);

content = content.replace(
  /const repo = targetRepo \|\| prompt\("Enter owner\/repo to clone \(e\.g\., torvalds\/linux\):"\);\s*if \(\!repo\) return;\s*const \[owner, name\] = repo\.split\('\/'\);\s*if \(\!owner \|\| \!name\) return alert\("Invalid format. Use owner\/repo."\);/,
  `const repo = targetRepo || prompt("Enter owner/repo to clone (e.g., torvalds/linux):");
    if (!repo) return;
    const [owner, name] = repo.split('/');
    if (!owner || !name) return alert("Invalid format. Use owner/repo.");
    if (!enforceGodMode(owner)) return;`
);


fs.writeFileSync('src/components/GitHubActions.tsx', content);
console.log("Patched GitHubActions.tsx with God Mode access check");
