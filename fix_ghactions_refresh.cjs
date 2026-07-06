const fs = require('fs');
let content = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');

if (!content.includes('RefreshCw')) {
    content = content.replace("import { Play, Download", "import { Play, Download, RefreshCw");
    content = content.replace("import { Download", "import { Download, RefreshCw");
}
fs.writeFileSync('src/components/GitHubActions.tsx', content);
