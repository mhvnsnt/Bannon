const fs = require('fs');
let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add static import at top
content = content.replace('import express from "express";', 'import express from "express";\nimport { GitHubService } from "./src/services/githubService";');

// 2. Remove the duplicated and ugly code block
const badBlockStart = `                        } else if (action === 'create_branch') {
                            const { GitHubService } = require('./src/services/githubService.js');
                            const gh = new GitHubService(process.env.GITHUB_TOKEN || '');
                            // Actually wait we might not have process.env.GITHUB_TOKEN. It uses process.env.GITHUB_TOKEN ? No, the agent is acting on behalf of the user, we should pass the token. Wait, AI agent uses octokit created inside server.ts with process.env.GITHUB_TOKEN
                            
                            // Let's use the local octokit already instantiated:
                            const targetBranch = branch;
                            const targetBase = base || 'main';
                            const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: \`heads/\${targetBase}\` });
                            const newRef = await octokit.git.createRef({
                                owner, repo, ref: \`refs/heads/\${targetBranch}\`, sha: baseRef.object.sha
                            });
                            result = { status: \`Created branch \${targetBranch}\`, sha: newRef.data.object.sha };`;
                            
content = content.replace(badBlockStart, "");

// 3. Now let's integrate GitHubService into the remaining github actions
// For 'create_branch'
const oldCreateBranch = `                        } else if (action === 'create_branch') {
                            const { data: refData } = await octokit.git.getRef({
                                owner, repo, ref: \`heads/\${base || 'main'}\`
                            });
                            await octokit.git.createRef({
                                owner, repo, ref: \`refs/heads/\${branch}\`, sha: refData.object.sha
                            });
                            result = { status: \`Branch \${branch} created.\` };`;
const newCreateBranch = `                        } else if (action === 'create_branch') {
                            const ghService = new GitHubService(githubToken);
                            const res = await ghService.createFeatureBranch(owner, repo, branch, base || 'main');
                            result = { status: \`Branch \${res.branchName} created.\`, sha: res.sha };`;
content = content.replace(oldCreateBranch, newCreateBranch);

// For 'create_pr'
const oldCreatePR = `                        } else if (action === 'create_pr') {
                            const pr = await octokit.pulls.create({
                                owner, repo, title: message || 'New Pull Request',
                                head: branch, base: base || 'main'
                            });
                            result = { url: pr.data.html_url };`;
const newCreatePR = `                        } else if (action === 'create_pr') {
                            const ghService = new GitHubService(githubToken);
                            const res = await ghService.openPullRequest(owner, repo, message || 'New Pull Request', branch, base || 'main');
                            result = { url: res.url };`;
content = content.replace(oldCreatePR, newCreatePR);

fs.writeFileSync(file, content);
console.log("Patched server.ts with GitHubService integration!");
