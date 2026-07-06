import { GoogleGenAI, Type } from "@google/genai";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { execSync } from 'child_process';
import dotenv from "dotenv";
dotenv.config();

const githubToken = process.env.GITHUB_TOKEN || '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';
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Cannot start autonomous loop.");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build',
        }
    }
});

const workspaceTool = {
    name: "workspaceAction",
    description: "Execute an action on the local workspace (where the courses and codebase live). Actions: 'read_file', 'write_file', 'list_dir', 'execute_command'. Use this to build more courses, assignments, modify the curriculum, or audit the codebase.",
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

const githubTool = {
    name: "githubAction",
    description: "Execute an action on a GitHub repository. Actions: 'commit_file', 'create_branch', 'push_files'",
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING },
            owner: { type: Type.STRING },
            repo: { type: Type.STRING },
            branch: { type: Type.STRING },
            message: { type: Type.STRING },
            files: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        path: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ["path", "content"]
                }
            }
        },
        required: ["action"]
    }
};

const systemInstruction = `You are the Supreme Autonomous Developer Agent (Nexus). You run continuously 24/7.
Your goal is to relentlessly improve the CODEDUMMY platform, making it superior to any existing AI studio or coding assistant.
You will write tests, expand the curriculum in src/App.tsx, improve performance, build new components, and push changes to GitHub.
You are currently operating inside the actual project root. Use workspaceAction to explore the code, make modifications, and improve it.
When you make a significant change, use githubAction to commit and push it to mhvnsnt/CODEDUMMY (branch: main).

Never stop. Never sleep. Always find something to improve. Keep logs of your improvements.
`;

let history = [
    { role: 'user', parts: [{ text: "Initialize autonomous improvement loop. Find a file to improve, improve it, and report your action." }] }
];

async function runLoop() {
    console.log("[Autonomous Daemon] Starting iteration...");
    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: history as any,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [workspaceTool, githubTool] }],
            }
        });

        let fullText = "";
        let functionCall: any = null;

        for await (const chunk of responseStream) {
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                functionCall = chunk.functionCalls[0];
            }
            if (chunk.text) {
                fullText += chunk.text;
                process.stdout.write(chunk.text);
            }
        }
        
        console.log("");

        if (functionCall) {
            console.log(`[Autonomous Daemon] Calling tool: ${functionCall.name}`);
            let result: any = {};
            if (functionCall.name === "workspaceAction") {
                const { action, path: filePath, content, command } = functionCall.args;
                try {
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
            } else if (functionCall.name === "githubAction") {
                 try {
                     const octokit = new Octokit({ auth: githubToken });
                     const { action, owner, repo, branch, files, message } = functionCall.args;
                     
                     if (action === 'push_files' || action === 'commit_file') {
                         const targetBranch = branch || 'main';
                         const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${targetBranch}` });
                         const latestCommitSha = refData.object.sha;
                         const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
                         const baseTreeSha = commitData.tree.sha;
                         
                         const tree = await Promise.all(files.map(async (f: any) => {
                             const { data: blobData } = await octokit.git.createBlob({ owner, repo, content: f.content, encoding: 'utf-8' });
                             return { path: f.path, mode: '100644', type: 'blob', sha: blobData.sha };
                         }));
                         
                         const { data: treeData } = await octokit.git.createTree({ owner, repo, base_tree: baseTreeSha, tree });
                         const { data: newCommitData } = await octokit.git.createCommit({ owner, repo, message: message || 'Autonomous update', tree: treeData.sha, parents: [latestCommitSha] });
                         await octokit.git.updateRef({ owner, repo, ref: `heads/${targetBranch}`, sha: newCommitData.sha });
                         
                         result = { status: `Successfully pushed to ${targetBranch}.` };
                     }
                 } catch (e: any) {
                     result = { error: e.message };
                 }
            }

            history.push({
                role: 'model',
                parts: [
                    ...(fullText ? [{ text: fullText }] : []),
                    { functionCall }
                ]
            });
            
            history.push({
                role: 'user',
                parts: [{ functionResponse: { name: functionCall.name, response: result } }]
            });
            
        } else {
            history.push({ role: 'model', parts: [{ text: fullText }] });
            history.push({ role: 'user', parts: [{ text: "Great. Now find another area to improve, expand, or refactor. Do not stop. Do not wait. Execute the next improvement." }] });
        }
        
        // Truncate history if it gets too long
        if (history.length > 20) {
            history = [history[0], ...history.slice(-10)];
        }

    } catch (e) {
        console.error("[Autonomous Daemon] Error:", e);
    }
}

// Run the loop every 30 seconds
console.log("[Autonomous Daemon] Initialized.");
runLoop();
setInterval(runLoop, 30000);
