const fs = require('fs');
let file = 'src/services/githubService.ts';
let content = fs.readFileSync(file, 'utf8');

const listReposMethod = `  /**
   * List repositories for the authenticated user
   */
  async listRepositories(): Promise<any[]> {
    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    return response.data;
  }
`;

content = content.replace("  /**\n   * List all branches", listReposMethod + "\n  /**\n   * List all branches");
fs.writeFileSync(file, content);
