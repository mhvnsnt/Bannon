const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

const devOpsTools = `
const railwayTool = {
    name: "railway_command",
    description: "Execute a Railway CLI command to manage infrastructure (e.g. provision volumes, set variables).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: { type: Type.STRING, description: "The arguments for the railway CLI, e.g. 'volume create workspace'" }
        },
        required: ["command"]
    }
};

const supabaseTool = {
    name: "supabase_command",
    description: "Execute a Supabase CLI command to manage database schema and migrations.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: { type: Type.STRING, description: "The arguments for the supabase CLI, e.g. 'migration new feature_x'" }
        },
        required: ["command"]
    }
};
`;

if (!code.includes("railway_command")) {
    code = code.replace(
        'const systemInstruction = `You are the Supreme Autonomous Developer Agent',
        devOpsTools + '\nconst systemInstruction = `You are the Supreme Autonomous Developer Agent'
    );
    
    // Add tools to generateContentStream configurations
    code = code.replace(
        /tools: \[\{ functionDeclarations: \[workspaceTool, githubTool\] \}\],/g,
        'tools: [{ functionDeclarations: [workspaceTool, githubTool, railwayTool, supabaseTool] }],'
    );
}

// Implement railway_command and supabase_command execution
const executeDevOps = `
            } else if (functionCall.name === "railway_command") {
                 try {
                     const { command } = functionCall.args;
                     const railwayToken = process.env.RAILWAY_TOKEN;
                     if (!railwayToken) throw new Error("RAILWAY_TOKEN not found in environment");
                     const output = execSync(\`railway \${command} --token \${railwayToken}\`, { encoding: 'utf8' });
                     result = { status: "Success", output };
                 } catch (e: any) {
                     result = { error: e.message };
                 }
            } else if (functionCall.name === "supabase_command") {
                 try {
                     const { command } = functionCall.args;
                     const output = execSync(\`supabase \${command}\`, { encoding: 'utf8' });
                     result = { status: "Success", output };
                 } catch (e: any) {
                     result = { error: e.message };
                 }
            }

            history.push({
`;

if (!code.includes('functionCall.name === "railway_command"')) {
    code = code.replace(
        /history\.push\(\{\s*role: 'model'/m,
        executeDevOps.trim() + '\n            history.push({\n                role: \'model\''
    );
}

// Add workspace logic
if (!code.includes('const WORKSPACE_DIR = process.env.WORKSPACE_DIR || "/workspace";')) {
    code = code.replace(
        'const apiKey = process.env.GEMINI_API_KEY;',
        'const WORKSPACE_DIR = process.env.WORKSPACE_DIR || "/workspace";\nconst apiKey = process.env.GEMINI_API_KEY;'
    );
    
    code = code.replace(/process\.cwd\(\)/g, 'WORKSPACE_DIR');
}

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts with DevOps tools and Workspace support.");
