const fs = require('fs');
let file = 'src/components/GitHubActions.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace checks for !githubToken in handles
content = content.replace(/if \(!githubToken\) return alert\("Please provide a GitHub token first."\);/g, '// Token injected in backend');

// Replace disabled={!githubToken} in buttons
// Actually we can just leave githubToken as an optional override, and disable only on loading states
content = content.replace(/disabled=\{isPushing \|\| !githubToken\}/g, 'disabled={isPushing}');
content = content.replace(/disabled=\{isCloning \|\| !githubToken\}/g, 'disabled={isCloning}');
content = content.replace(/disabled=\{isPRing \|\| !githubToken\}/g, 'disabled={isPRing}');

fs.writeFileSync(file, content);
console.log("Patched GitHubActions.tsx UI disables");
