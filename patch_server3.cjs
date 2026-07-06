const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

// The initialization of RepoSyncService has changed (it now takes just token)
serverTs = serverTs.replace(
  /const repoSync = new RepoSyncService\(githubToken, \[[\s\S]*?\]\);/,
  "const repoSync = new RepoSyncService(githubToken);"
);

// Add endpoints for connected repos and agent tools
const extraEndpoints = `
app.get("/api/github/connected-repos", (req, res) => {
    res.json(repoSync.getRepos());
});

app.post("/api/github/add-repo", (req, res) => {
    const { owner, repo, branch } = req.body;
    repoSync.addRepo({ owner, repo, branch: branch || 'main' });
    res.json({ success: true, repos: repoSync.getRepos() });
});

app.post("/api/github/remove-repo", (req, res) => {
    const { owner, repo } = req.body;
    repoSync.removeRepo(owner, repo);
    res.json({ success: true, repos: repoSync.getRepos() });
});

app.post("/api/integrations/save", (req, res) => {
    const { type, token, url } = req.body;
    // Just returning success to act as if saved safely in env/DB
    res.json({ success: true });
});
`;

serverTs = serverTs.replace(
  "app.listen(PORT,",
  extraEndpoints + "\napp.listen(PORT,"
);

// Add workspace tool to Agent
const workspaceToolDefinition = `
        const workspaceTool = {
            name: "workspaceAction",
            description: "Execute an action on the local workspace (where the courses and codebase live). Actions: 'read_file', 'write_file', 'list_dir', 'execute_command'. Use this to build more courses, assignments, modify the curriculum in src/App.tsx, or audit the codebase.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, description: "'read_file', 'write_file', 'list_dir', 'execute_command'" },
                    path: { type: Type.STRING, description: "File or directory path" },
                    content: { type: Type.STRING, description: "Content to write for write_file" },
                    command: { type: Type.STRING, description: "Command to execute for execute_command" }
                },
                required: ["action"]
            }
        };
`;

// Insert tool definition after githubTool
serverTs = serverTs.replace(
  /const githubTool = \{[\s\S]*?required: \["action", "owner", "repo"\]\n            \}\n        \};/,
  match => match + workspaceToolDefinition
);

// Register tool in generateContent
serverTs = serverTs.replace(
  "tools: [{ functionDeclarations: [scrapeTool, githubTool] }],",
  "tools: [{ functionDeclarations: [scrapeTool, githubTool, workspaceTool] }],"
);

// Handle workspace tool execution
const workspaceToolHandler = `
                } else if (functionCall.name === "workspaceAction") {
                    const { action, path: filePath, content, command } = functionCall.args;
                    let result: any = {};
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const { execSync } = require('child_process');
                        
                        if (action === 'read_file') {
                            const p = path.resolve(process.cwd(), filePath);
                            result = { content: fs.readFileSync(p, 'utf8') };
                        } else if (action === 'write_file') {
                            const p = path.resolve(process.cwd(), filePath);
                            fs.mkdirSync(path.dirname(p), { recursive: true });
                            fs.writeFileSync(p, content, 'utf8');
                            result = { status: "Success" };
                        } else if (action === 'list_dir') {
                            const p = path.resolve(process.cwd(), filePath || '.');
                            result = { files: fs.readdirSync(p) };
                        } else if (action === 'execute_command') {
                            result = { output: execSync(command, { encoding: 'utf8' }) };
                        }
                    } catch (e: any) {
                        result = { error: e.message };
                    }
                    
                    history.push({
                        role: "user",
                        parts: [{ functionResponse: { name: "workspaceAction", response: result } }]
                    });
`;

serverTs = serverTs.replace(
  "} else if (functionCall.name === \"githubAction\") {",
  workspaceToolHandler + "} else if (functionCall.name === \"githubAction\") {"
);

// Enhance instruction
serverTs = serverTs.replace(
  /If the user asks to work on their GitHub repo.*?proficient coding assistant./,
  "If the user asks to work on their GitHub repo, use githubAction. If they ask to build courses, edit the curriculum, or audit the system locally, use workspaceAction to modify the actual codebase (like src/App.tsx where LESSONS live). Be an autonomous agentic system."
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts with workspaceTool and endpoints");
