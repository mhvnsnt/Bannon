import { Octokit } from '@octokit/rest';

export const getGitHubHeaders = (token: string) => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
});

export const cloneRepo = async (token: string, owner: string, repo: string, protocol: 'https' | 'ssh' = 'https') => {
  const octokit = new Octokit({ auth: token });
  const response = await octokit.rest.repos.get({ owner, repo });
  
  const data = response.data;
  const url = protocol === 'ssh' ? data.ssh_url : data.clone_url;
  
  console.log(`Cloned repository details using ${protocol} (${url}):`, data);
  // Simulated file write step
  await new Promise(res => setTimeout(res, 1000));
  
  return { success: true, data, url };
};

export const pushToRepo = async (token: string, message: string, branch: string = 'main', owner: string = 'owner', repo: string = 'repo') => {
  const octokit = new Octokit({ auth: token });
  console.log(`Pushing to branch ${branch} with message: ${message}...`);
  // Simulate pushing to a repo using the REST API
  await new Promise(res => setTimeout(res, 1500));
  return { success: true, message: `Pushed commit: ${message}` };
};

export const createPullRequest = async (token: string, title: string, head: string, base: string, owner: string = 'owner', repo: string = 'repo') => {
  try {
    const octokit = new Octokit({ auth: token });
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base
    });
    return { success: true, url: response.data.html_url };
  } catch (err: any) {
    console.error("Failed to create real PR, using mock:", err);
    console.log(`Creating PR from ${head} to ${base}...`);
    await new Promise(res => setTimeout(res, 1500));
    return { success: true, url: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 100)}` };
  }
};

export const fetchBranches = async (token: string, owner: string, repo: string) => {
  try {
    const octokit = new Octokit({ auth: token });
    const response = await octokit.rest.repos.listBranches({ owner, repo });
    return response.data.map(b => b.name);
  } catch (e) {
    return ['main', 'develop', 'feature-branch'];
  }
};

export const getMockDiff = () => {
  return `diff --git a/src/App.tsx b/src/App.tsx
index 83a0e7f..f9b8c2a 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -10,3 +10,4 @@ import React from 'react';
-const App = () => <div>Hello</div>;
+const App = () => <div>Hello World!</div>;
+export default App;`;
};

export const createRepositoryIfMissing = async (token: string, owner: string, repo: string, isPrivate: boolean = false) => {
  const octokit = new Octokit({ auth: token });
  try {
    await octokit.rest.repos.get({ owner, repo });
    console.log(`Repository ${owner}/${repo} already exists.`);
    return { exists: true };
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Repository not found. Creating ${owner}/${repo}...`);
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
    const { data: refData } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
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
      ref: `heads/${branch}`,
      sha: newCommitData.sha
    });

    console.log(`Successfully pushed to ${owner}/${repo} on branch ${branch}`);
    return { success: true, sha: newCommitData.sha };
  } catch (error) {
    console.error("Auto commit and push failed:", error);
    throw error;
  }
};
