const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const syncRoute = `
app.post("/api/github/sync-workspace", async (req, res) => {
    try {
        const { githubToken, owner, repo, branch, message } = req.body;
        if (!githubToken) return res.status(401).json({ error: "No GitHub token provided" });
        
        const { Octokit } = require('@octokit/rest');
        const octokit = new Octokit({ auth: githubToken });
        
        // Find all relevant files in the workspace
        const glob = require('glob');
        const path = require('path');
        const ignorePatterns = ['node_modules/**', 'dist/**', '.git/**', '.env', 'patch_*.cjs'];
        const files = glob.sync('**/*', { nodir: true, ignore: ignorePatterns });
        
        const targetBranch = branch || 'main';
        let latestCommitSha, baseTreeSha;
        
        try {
            const { data: refData } = await octokit.git.getRef({ owner, repo, ref: \`heads/\${targetBranch}\` });
            latestCommitSha = refData.object.sha;
            const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
            baseTreeSha = commitData.tree.sha;
        } catch (e) {
            return res.status(404).json({ error: "Branch not found on target repo. " + e.message });
        }
        
        const tree = await Promise.all(files.map(async (filePath) => {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: blobData } = await octokit.git.createBlob({
                owner, repo, content: fileContent, encoding: 'utf-8'
            });
            return {
                path: filePath,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha
            };
        }));
        
        const { data: treeData } = await octokit.git.createTree({
            owner, repo, base_tree: baseTreeSha, tree
        });
        
        const { data: newCommitData } = await octokit.git.createCommit({
            owner, repo, message: message || 'Workspace sync', tree: treeData.sha, parents: [latestCommitSha]
        });
        
        await octokit.git.updateRef({
            owner, repo, ref: \`heads/\${targetBranch}\`, sha: newCommitData.sha
        });
        
        res.json({ success: true, commitUrl: \`https://github.com/\${owner}/\${repo}/commit/\${newCommitData.sha}\` });
    } catch (error) {
        console.error("Workspace sync error:", error);
        res.status(500).json({ error: error.message });
    }
});
`;

content = content.replace('app.post("/api/chat",', syncRoute + '\napp.post("/api/chat",');
fs.writeFileSync(file, content);
console.log("Patched server.ts with /api/github/sync-workspace");
