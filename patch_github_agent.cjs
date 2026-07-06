const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the githubTool description
const oldToolDef = /const githubTool = \{[\s\S]*?required: \["action", "owner", "repo"\]\n\s*\}\n\s*\};/;
const newToolDef = `const githubTool = {
            name: "githubAction",
            description: "Execute an action on a GitHub repository. Actions: 'read_file', 'create_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: {
                        type: Type.STRING,
                        description: "The action to perform: 'read_file', 'create_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'"
                    },
                    owner: { type: Type.STRING },
                    repo: { type: Type.STRING },
                    path: { type: Type.STRING, description: "File path (for read_file or commit_file)" },
                    branch: { type: Type.STRING, description: "Branch name" },
                    content: { type: Type.STRING, description: "File content to commit" },
                    message: { type: Type.STRING, description: "Commit message or PR title" },
                    base: { type: Type.STRING, description: "Base branch for PR" },
                    files: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                path: { type: Type.STRING },
                                content: { type: Type.STRING }
                            },
                            required: ["path", "content"]
                        },
                        description: "List of files to push (for push_files)"
                    },
                    isPrivate: { type: Type.BOOLEAN, description: "Whether the repo should be private (for create_repo)" }
                },
                required: ["action", "owner", "repo"]
            }
        };`;
content = content.replace(oldToolDef, newToolDef);

// 2. Add the action handlers
const endOfGithubAction = `} else if (action === 'create_pr') {
                            const pr = await octokit.pulls.create({
                                owner, repo, title: message || 'New Pull Request',
                                head: branch, base: base || 'main'
                            });
                            result = { url: pr.data.html_url };
                        } else {
                            throw new Error(\`Unknown action: \${action}\`);
                        }`;

const newEndOfGithubAction = `} else if (action === 'create_pr') {
                            const pr = await octokit.pulls.create({
                                owner, repo, title: message || 'New Pull Request',
                                head: branch, base: base || 'main'
                            });
                            result = { url: pr.data.html_url };
                        } else if (action === 'create_repo') {
                            const { isPrivate } = functionCall.args;
                            try {
                                await octokit.repos.get({ owner, repo });
                                result = { status: \`Repository \${owner}/\${repo} already exists.\` };
                            } catch (e) {
                                if (e.status === 404) {
                                    try {
                                        const createResp = await octokit.repos.createForAuthenticatedUser({
                                            name: repo,
                                            private: isPrivate || false,
                                            auto_init: true
                                        });
                                        result = { status: \`Created repository \${owner}/\${repo}\`, url: createResp.data.html_url };
                                    } catch (err) {
                                        const createOrgResp = await octokit.repos.createInOrg({
                                            org: owner,
                                            name: repo,
                                            private: isPrivate || false,
                                            auto_init: true
                                        });
                                        result = { status: \`Created repository \${owner}/\${repo} in org\`, url: createOrgResp.data.html_url };
                                    }
                                } else {
                                    throw e;
                                }
                            }
                        } else if (action === 'push_files') {
                            const { files } = functionCall.args;
                            if (!files || files.length === 0) throw new Error("No files provided for push_files.");
                            
                            const targetBranch = branch || 'main';
                            let latestCommitSha;
                            let baseTreeSha;
                            try {
                                const { data: refData } = await octokit.git.getRef({ owner, repo, ref: \`heads/\${targetBranch}\` });
                                latestCommitSha = refData.object.sha;
                                
                                const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
                                baseTreeSha = commitData.tree.sha;
                            } catch (e) {
                                throw new Error(\`Could not get reference for branch \${targetBranch}. Does it exist? \${e.message}\`);
                            }

                            const tree = await Promise.all(files.map(async (f) => {
                                const { data: blobData } = await octokit.git.createBlob({
                                    owner,
                                    repo,
                                    content: f.content,
                                    encoding: 'utf-8'
                                });
                                return {
                                    path: f.path,
                                    mode: '100644',
                                    type: 'blob',
                                    sha: blobData.sha
                                };
                            }));

                            const { data: treeData } = await octokit.git.createTree({
                                owner,
                                repo,
                                base_tree: baseTreeSha,
                                tree
                            });

                            const { data: newCommitData } = await octokit.git.createCommit({
                                owner,
                                repo,
                                message: message || 'Automated commit',
                                tree: treeData.sha,
                                parents: [latestCommitSha]
                            });

                            await octokit.git.updateRef({
                                owner,
                                repo,
                                ref: \`heads/\${targetBranch}\`,
                                sha: newCommitData.sha
                            });
                            result = { status: \`Successfully pushed \${files.length} files to \${targetBranch}.\`, sha: newCommitData.sha };
                        } else {
                            throw new Error(\`Unknown action: \${action}\`);
                        }`;
                        
content = content.replace(endOfGithubAction, newEndOfGithubAction);

fs.writeFileSync(file, content);
console.log("Patched server.ts with create_repo and push_files!");
