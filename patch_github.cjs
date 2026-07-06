const fs = require('fs');
const file = 'src/utils/github.ts';
let content = fs.readFileSync(file, 'utf8');

content += `
export const createRepositoryIfMissing = async (token: string, owner: string, repo: string, isPrivate: boolean = false) => {
  const octokit = new Octokit({ auth: token });
  try {
    await octokit.rest.repos.get({ owner, repo });
    console.log(\`Repository \${owner}/\${repo} already exists.\`);
    return { exists: true };
  } catch (error: any) {
    if (error.status === 404) {
      console.log(\`Repository not found. Creating \${owner}/\${repo}...\`);
      try {
        const response = await octokit.rest.repos.createForAuthenticatedUser({
          name: repo,
          private: isPrivate,
          auto_init: true
        });
        return { exists: false, created: true, url: response.data.html_url };
      } catch (createError) {
        // Fallback for org repos
        try {
           const response = await octokit.rest.repos.createInOrg({
             org: owner,
             name: repo,
             private: isPrivate,
             auto_init: true
           });
           return { exists: false, created: true, url: response.data.html_url };
        } catch (orgCreateError) {
           console.error("Failed to create repository in user or org:", createError, orgCreateError);
           throw createError;
        }
      }
    }
    throw error;
  }
};

export const autoCommitAndPush = async (token: string, owner: string, repo: string, files: {path: string, content: string}[], message: string, branch: string = 'main') => {
  const octokit = new Octokit({ auth: token });
  try {
    // 1. Get latest commit SHA
    const { data: refData } = await octokit.rest.git.getRef({ owner, repo, ref: \`heads/\${branch}\` });
    const latestCommitSha = refData.object.sha;
    
    // 2. Get the base tree SHA
    const { data: commitData } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for files and construct tree array
    const tree = await Promise.all(files.map(async (file) => {
      const { data: blobData } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: 'utf-8'
      });
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha
      };
    }));

    // 4. Create new tree
    const { data: treeData } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree
    });

    // 5. Create new commit
    const { data: newCommitData } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: treeData.sha,
      parents: [latestCommitSha]
    });

    // 6. Update reference (push)
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: \`heads/\${branch}\`,
      sha: newCommitData.sha
    });

    console.log(\`Successfully pushed to \${owner}/\${repo} on branch \${branch}\`);
    return { success: true, sha: newCommitData.sha };
  } catch (error) {
    console.error("Auto commit and push failed:", error);
    throw error;
  }
};
`;

fs.writeFileSync(file, content);
console.log("Patched GitHub Utils!");
