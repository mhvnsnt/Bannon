const fs = require('fs');

let service = fs.readFileSync('src/services/repoSyncService.ts', 'utf8');

const updatedClass = `
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
`;

service = service.replace(/constructor[\s\S]*?\}/, updatedClass);
fs.writeFileSync('src/services/repoSyncService.ts', service);
console.log("Updated repoSyncService.ts");
