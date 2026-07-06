const fs = require('fs');
let file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// Update the tool description
content = content.replace("description: \"Execute an action on a GitHub repository. Actions: 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'\"", "description: \"Execute an action on a GitHub repository. Actions: 'list_repos', 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'\"");

content = content.replace("description: \"The action to perform: 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'\"", "description: \"The action to perform: 'list_repos', 'read_file', 'create_branch', 'delete_branch', 'commit_file', 'create_pr', 'create_repo', 'push_files'\"");

const listReposBlock = `                        if (action === 'list_repos') {
                            const ghService = new GitHubService(githubToken);
                            const repos = await ghService.listRepositories();
                            result = { repos: repos.map((r: any) => ({ name: r.name, full_name: r.full_name, private: r.private, url: r.html_url })) };
                        } else if (action === 'read_file') {`;

content = content.replace("if (action === 'read_file') {", listReposBlock);

fs.writeFileSync(file, content);
console.log("Patched server.ts with list_repos!");
