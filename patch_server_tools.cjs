const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const newToolDef = `const githubTool = {
            name: "githubAction",
            description: "Execute an action on a GitHub repository. Actions: 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: {
                        type: Type.STRING,
                        description: "The action to perform: 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'"
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
                        }
                    },
                    isPrivate: { type: Type.BOOLEAN, description: "Whether the repo should be private (for create_repo)" }
                },
                required: ["action", "owner", "repo"]
            }
        };`;

// replace the old githubTool def
content = content.replace(/const githubTool = \{[\s\S]*?required: \["action", "owner", "repo"\]\n\s*\}\n\s*\};/, newToolDef);

const branchHandlers = `
                        } else if (action === 'create_branch') {
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
                            result = { status: \`Created branch \${targetBranch}\`, sha: newRef.data.object.sha };
                        } else if (action === 'delete_branch') {
                            await octokit.git.deleteRef({ owner, repo, ref: \`heads/\${branch}\` });
                            result = { status: \`Deleted branch \${branch}\` };
`;

// Insert the new handlers right before create_pr
content = content.replace("} else if (action === 'create_pr') {", branchHandlers + "\n                        } else if (action === 'create_pr') {");

fs.writeFileSync(file, content);
console.log("Patched server.ts with create_branch and delete_branch!");
