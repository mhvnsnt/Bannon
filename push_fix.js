const { Octokit } = require('@octokit/rest');
const fs = require('fs');

async function run() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';

  const newContent = fs.readFileSync('index.js', 'utf8');

  let existingSha;
  try {
    const { data: existing } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: 'index.js', ref: BRANCH
    });
    existingSha = existing.sha;
  } catch (e) {
    console.log("No existing file found or error:", e.message);
  }

  try {
    const { data: commit } = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO, path: 'index.js',
      message: 'FIX: Switch from Webhooks to Polling to ensure 100% uptime, add admin fallback',
      content: Buffer.from(newContent).toString('base64'),
      branch: BRANCH,
      sha: existingSha
    });
    console.log("Pushed successfully:", commit.commit.html_url);
  } catch (e) {
    console.error("Failed to push:", e.message);
  }
}
run();
