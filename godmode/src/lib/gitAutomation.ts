import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

/**
 * Autonomous Git Worker that wraps isomorphic-git for the Builder Agent.
 * Handles autonomous branching, test commits, and reverts.
 */
export class GitAutomation {
  fs: any;
  dir: string;

  constructor(virtualFs: any, dir: string = '/') {
    this.fs = virtualFs;
    this.dir = dir;
  }

  /**
   * Initializes the repository if it doesn't exist
   */
  async initRepo() {
    try {
      await git.init({ fs: this.fs, dir: this.dir });
      console.log(`[GitWorker] Repo initialized at ${this.dir}`);
    } catch (e) {
      console.error(`[GitWorker] Init error:`, e);
    }
  }

  /**
   * Branches to a new experiment ref
   */
  async createExperimentBranch(featureName: string) {
    const branchName = `experiment/${featureName}-${Date.now()}`;
    await git.branch({
      fs: this.fs,
      dir: this.dir,
      ref: branchName,
      checkout: true
    });
    console.log(`[GitWorker] Branched into ${branchName}`);
    return branchName;
  }

  /**
   * Commits the builder agent's proposed changes
   */
  async commitProposal(message: string, confidentScore: number) {
    // Stage all changes
    await git.add({ fs: this.fs, dir: this.dir, filepath: '.' });
    
    const sha = await git.commit({
      fs: this.fs,
      dir: this.dir,
      author: {
        name: 'Nexus Builder',
        email: 'builder@nexus.local',
      },
      message: `[C:${confidentScore}] ${message}`
    });
    console.log(`[GitWorker] Committed Proposal: ${sha}`);
    return sha;
  }

  /**
   * Reverts changes if the automated test harness validates failure
   */
  async revertToMain() {
    console.log(`[GitWorker] Validator failed. Reverting to main branch...`);
    await git.checkout({
      fs: this.fs,
      dir: this.dir,
      ref: 'main',
      force: true
    });
    console.log(`[GitWorker] Successfully reverted to main.`);
  }

  /**
   * Merges experiment into main upon successful validation
   */
  async pushToMain(experimentBranch: string) {
    console.log(`[GitWorker] Validator passed. Merging ${experimentBranch} into main.`);
    await git.checkout({
      fs: this.fs,
      dir: this.dir,
      ref: 'main'
    });
    
    // In a full implementation, you'd use git.merge. For simulation, 
    // isomorphic-git fast-forwards if possible.
    await git.merge({
      fs: this.fs,
      dir: this.dir,
      ours: 'main',
      theirs: experimentBranch,
      author: { name: 'Nexus Evolution Manager', email: 'evolution@nexus.local' }
    });
    console.log(`[GitWorker] DNA Updated. Fast-forward successful.`);
  }
}
