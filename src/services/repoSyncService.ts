import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';

export interface ConnectedRepo {
  owner: string;
  repo: string;
  branch: string;
}

export class RepoSyncService {
  private githubToken: string;
  private repos: ConnectedRepo[];
  private localRepoPath: string;
  private configPath: string;

  constructor(githubToken: string) {
    this.githubToken = githubToken;
    this.localRepoPath = path.resolve(process.cwd());
    this.configPath = path.join(this.localRepoPath, 'repos_config.json');
    this.repos = this.loadConfig();
  }

  private loadConfig(): ConnectedRepo[] {
    if (fs.existsSync(this.configPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    const defaultRepos = [
      { owner: 'mhvnsnt', repo: 'BANNON', branch: 'main' },
      { owner: 'mhvnsnt', repo: 'CODEDUMMY', branch: 'main' }
    ];
    this.saveConfig(defaultRepos);
    return defaultRepos;
  }

  public saveConfig(repos: ConnectedRepo[]) {
    this.repos = repos;
    fs.writeFileSync(this.configPath, JSON.stringify(repos, null, 2), 'utf8');
  }

  public getRepos() {
    return this.repos;
  }

  public addRepo(repo: ConnectedRepo) {
    if (!this.repos.find(r => r.owner === repo.owner && r.repo === repo.repo)) {
      this.repos.push(repo);
      this.saveConfig(this.repos);
      // Trigger sync immediately for the new repo
      this.syncRepo(repo).catch(console.error);
    }
  }

  public removeRepo(owner: string, repo: string) {
    this.repos = this.repos.filter(r => !(r.owner === owner && r.repo === repo));
    this.saveConfig(this.repos);
  }

  private getOctokit() {
    return new Octokit({ auth: this.githubToken });
  }

  public getLocalHash(repoName: string): string | null {
    const syncHashFile = path.join(this.localRepoPath, `.sync_hash_${repoName}`);
    if (fs.existsSync(syncHashFile)) {
      return fs.readFileSync(syncHashFile, 'utf8').trim();
    }
    return null;
  }

  public setLocalHash(repoName: string, hash: string) {
    const syncHashFile = path.join(this.localRepoPath, `.sync_hash_${repoName}`);
    fs.writeFileSync(syncHashFile, hash, 'utf8');
  }

  public async getRemoteHash(owner: string, repo: string, branch: string): Promise<string | null> {
    try {
      const octokit = this.getOctokit();
      const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
      return refData.object.sha;
    } catch (e: any) {
      console.warn(`[RepoSync] Could not fetch remote hash for ${owner}/${repo}:`, e.message);
      return null;
    }
  }

  public async syncAll() {
    console.log(`[RepoSync] Starting sync process for ${this.repos.length} connected repos...`);
    
    // 1. Initialize git if not present
    if (!fs.existsSync(path.join(this.localRepoPath, '.git'))) {
        console.log("[RepoSync] Initializing local git repository...");
        execSync('git init', { cwd: this.localRepoPath, stdio: 'ignore' });
        execSync('git config user.email "codedummy@orion.local"', { cwd: this.localRepoPath, stdio: 'ignore' });
        execSync('git config user.name "CodeDummy Automaton"', { cwd: this.localRepoPath, stdio: 'ignore' });
    }

    for (const connectedRepo of this.repos) {
        await this.syncRepo(connectedRepo);
    }
  }

  private async syncRepo(connectedRepo: ConnectedRepo) {
    const { owner, repo, branch } = connectedRepo;
    const remoteName = `${owner}_${repo}`;
    console.log(`\n[RepoSync] --- Syncing ${owner}/${repo} ---`);
    
    try {
      // Ensure remote exists
      const remotes = execSync('git remote', { cwd: this.localRepoPath, encoding: 'utf8' });
      const remoteUrl = `https://${this.githubToken}@github.com/${owner}/${repo}.git`;
      
      if (!remotes.includes(remoteName)) {
         execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: this.localRepoPath, stdio: 'ignore' });
      } else {
         execSync(`git remote set-url ${remoteName} ${remoteUrl}`, { cwd: this.localRepoPath, stdio: 'ignore' });
      }

      // Fetch remote
      console.log(`[RepoSync] Fetching ${remoteName}...`);
      try {
        execSync(`git fetch ${remoteName}`, { cwd: this.localRepoPath, stdio: 'ignore' });
      } catch (e) {
        console.warn(`[RepoSync] Failed to fetch ${remoteName}. Repository might be empty or unreachable.`);
        return;
      }

      const remoteHash = await this.getRemoteHash(owner, repo, branch);
      if (!remoteHash) return;

      const localHash = this.getLocalHash(repo);
      
      // If we don't have a local hash, establish baseline
      if (!localHash) {
          console.log(`[RepoSync] No local sync hash for ${repo}. Establishing baseline...`);
          try {
              execSync('git add .', { cwd: this.localRepoPath, stdio: 'ignore' });
              execSync(`git commit -m "Local baseline before sync with ${repo}"`, { cwd: this.localRepoPath, stdio: 'ignore' });
          } catch(e) {}
          
          try {
              console.log(`[RepoSync] Merging ${remoteName} into baseline...`);
              execSync(`git merge ${remoteName}/${branch} --allow-unrelated-histories --strategy-option=theirs -m "Initial merge from ${repo}"`, { cwd: this.localRepoPath, stdio: 'ignore' });
          } catch(e) {
              console.error(`[RepoSync] Merge conflict during initial sync, forcing patch.`);
              execSync(`git reset --hard ${remoteName}/${branch}`, { cwd: this.localRepoPath, stdio: 'ignore' });
          }
          
          this.setLocalHash(repo, remoteHash);
          console.log(`[RepoSync] Initial sync complete for ${repo}.`);
          return;
      }

      if (localHash === remoteHash) {
         console.log(`[RepoSync] Local is up-to-date with ${repo}.`);
         const status = execSync('git status --porcelain', { cwd: this.localRepoPath, encoding: 'utf8' });
         if (status.trim().length > 0) {
             console.log(`[RepoSync] Local changes detected. Pushing to ${repo}...`);
             execSync('git add .', { cwd: this.localRepoPath, stdio: 'ignore' });
             execSync('git commit -m "Automated local patch"', { cwd: this.localRepoPath, stdio: 'ignore' });
             execSync(`git push ${remoteName} HEAD:${branch}`, { cwd: this.localRepoPath, stdio: 'ignore' });
             
             const newLocalHash = execSync('git rev-parse HEAD', { cwd: this.localRepoPath, encoding: 'utf8' }).trim();
             this.setLocalHash(repo, newLocalHash);
         }
         return;
      }

      console.log(`[RepoSync] Hash mismatch for ${repo}! Local: ${localHash.slice(0,7)} Remote: ${remoteHash.slice(0,7)}`);
      
      const status = execSync('git status --porcelain', { cwd: this.localRepoPath, encoding: 'utf8' });
      if (status.trim().length > 0) {
          console.log(`[RepoSync] Committing local changes before merge...`);
          execSync('git add .', { cwd: this.localRepoPath, stdio: 'ignore' });
          execSync(`git commit -m "Save local changes before merging ${repo}"`, { cwd: this.localRepoPath, stdio: 'ignore' });
      }

      try {
          execSync(`git merge ${remoteName}/${branch} -m "Merge remote changes from ${repo} into local"`, { cwd: this.localRepoPath, stdio: 'ignore' });
          console.log(`[RepoSync] Merge successful. Pushing resolved state to ${repo}...`);
          execSync(`git push ${remoteName} HEAD:${branch}`, { cwd: this.localRepoPath, stdio: 'ignore' });
          
          const newLocalHash = execSync('git rev-parse HEAD', { cwd: this.localRepoPath, encoding: 'utf8' }).trim();
          this.setLocalHash(repo, newLocalHash);
      } catch (mergeError) {
          console.error(`[RepoSync] Merge conflict! Applying remote patch forcefully to keep Railway instance alive...`);
          execSync('git merge --abort', { cwd: this.localRepoPath, stdio: 'ignore' }).toString();
          execSync(`git reset --hard ${remoteName}/${branch}`, { cwd: this.localRepoPath, stdio: 'ignore' });
          this.setLocalHash(repo, remoteHash);
      }

    } catch (err) {
      console.error(`[RepoSync] Failed during sync process for ${repo}:`, err);
    }
  }

  public startDaemon(intervalMs: number = 60000) {
    console.log(`[RepoSync] Daemon started. Checking every ${intervalMs}ms...`);
    setInterval(() => {
       this.syncAll().catch(console.error);
    }, intervalMs);
    
    // Run first sync immediately
    this.syncAll().catch(console.error);
  }
}

const gitToken = process.env.GITHUB_TOKEN || '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';
export const repoSyncService = new RepoSyncService(gitToken);
