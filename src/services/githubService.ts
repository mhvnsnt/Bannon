import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }


  /**
   * List repositories for the authenticated user
   */
  async listRepositories(): Promise<any[]> {
    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    return response.data;
  }

  /**
   * List all branches in a repository
   */
  async listBranches(owner: string, repo: string): Promise<string[]> {
    const response = await this.octokit.rest.repos.listBranches({ owner, repo });
    return response.data.map(b => b.name);
  }

  /**
   * Create a new feature branch enforcing naming conventions
   */
  async createFeatureBranch(owner: string, repo: string, featureName: string, baseBranch: string = 'main'): Promise<{ success: boolean; branchName: string; sha: string }> {
    // Enforce branch naming convention
    const sanitizedName = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const branchName = `feature/${sanitizedName}`;

    // Get base branch SHA
    const baseRef = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`
    });

    // Create new branch
    const response = await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.data.object.sha
    });

    return {
      success: true,
      branchName,
      sha: response.data.object.sha
    };
  }

  /**
   * Create a Pull Request programmatically
   */
  async openPullRequest(owner: string, repo: string, title: string, head: string, base: string = 'main', body: string = ''): Promise<{ success: boolean; url: string }> {
    const response = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body
    });

    return {
      success: true,
      url: response.data.html_url
    };
  }

  /**
   * Cleanup stale experimental branches (e.g. older than 30 days or specifically experimental ones)
   */
  async cleanupStaleBranches(owner: string, repo: string, prefix: string = 'experimental/'): Promise<{ deleted: string[] }> {
    const branches = await this.listBranches(owner, repo);
    const staleBranches = branches.filter(b => b.startsWith(prefix));
    
    const deleted: string[] = [];
    for (const branch of staleBranches) {
      try {
        await this.octokit.rest.git.deleteRef({
          owner,
          repo,
          ref: `heads/${branch}`
        });
        deleted.push(branch);
      } catch (e) {
        console.error(`Failed to delete branch ${branch}:`, e);
      }
    }

    return { deleted };
  }
}
