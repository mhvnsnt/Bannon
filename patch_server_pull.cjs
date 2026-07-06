const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const pullRoute = `
app.post("/api/github/pull-workspace", async (req, res) => {
    try {
        const { githubToken, owner, repo, branch } = req.body;
        if (!githubToken) return res.status(401).json({ error: "No GitHub token provided" });
        
        const { Octokit } = require('@octokit/rest');
        const octokit = new Octokit({ auth: githubToken });
        const targetBranch = branch || 'main';
        
        // Get the latest commit sha
        let latestCommitSha;
        try {
            const { data: refData } = await octokit.git.getRef({ owner, repo, ref: \`heads/\${targetBranch}\` });
            latestCommitSha = refData.object.sha;
        } catch (e) {
            return res.status(404).json({ error: "Branch not found on remote repo. " + e.message });
        }
        
        // Get the tree for the commit
        const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
        const { data: treeData } = await octokit.git.getTree({ owner, repo, tree_sha: commitData.tree.sha, recursive: 'true' });
        
        const fs = require('fs');
        const path = require('path');
        const { Buffer } = require('buffer');
        
        // Filter out blobs and download them
        const filesToSync = treeData.tree.filter(item => item.type === 'blob');
        
        let syncedCount = 0;
        for (const file of filesToSync) {
            // Ignore some paths
            if (file.path.startsWith('node_modules/') || file.path.startsWith('.git/')) continue;
            
            const { data: blobData } = await octokit.git.getBlob({ owner, repo, file_sha: file.sha });
            const fileContent = Buffer.from(blobData.content, blobData.encoding).toString('utf-8');
            
            const fullPath = path.resolve(__dirname, file.path);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fileContent, 'utf-8');
            syncedCount++;
        }
        
        res.json({ success: true, message: \`Synced \${syncedCount} files from remote \${latestCommitSha}\`, commitSha: latestCommitSha });
    } catch (error) {
        console.error("Workspace pull error:", error);
        res.status(500).json({ error: error.message });
    }
});
`;

content = content.replace('app.post("/api/chat",', pullRoute + '\\napp.post("/api/chat",');
fs.writeFileSync(file, content);
console.log("Patched server.ts with /api/github/pull-workspace");
