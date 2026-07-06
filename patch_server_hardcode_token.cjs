const fs = require('fs');
let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const userToken = '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';

// Patch /api/github/sync-workspace
content = content.replace(
    /const { githubToken, owner, repo, branch, message } = req.body;\n\s*if \(!githubToken\) return res.status\(401\).json\(\{ error: "No GitHub token provided" \}\);/,
    `const { owner, repo, branch, message } = req.body;\n        const githubToken = req.body.githubToken || '${userToken}';`
);

// Patch /api/github/pull-workspace
content = content.replace(
    /const { githubToken, owner, repo, branch } = req.body;\n\s*if \(!githubToken\) return res.status\(401\).json\(\{ error: "No GitHub token provided" \}\);/,
    `const { owner, repo, branch } = req.body;\n        const githubToken = req.body.githubToken || '${userToken}';`
);

fs.writeFileSync(file, content);
console.log("Patched server.ts to use provided GitHub token as fallback");
