const fs = require('fs');
let file = 'src/services/githubService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/  \/\*\*\n   \* List repositories for the authenticated user\n   \*\/\n  async listRepositories\(\): Promise<any\[\]> \{\n    const response = await this.octokit.rest.repos.listForAuthenticatedUser\(\{\n      sort: 'updated',\n      per_page: 100\n    \}\);\n    return response.data;\n  \}\n/, '');
fs.writeFileSync(file, content);
