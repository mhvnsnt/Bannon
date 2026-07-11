import { GoogleGenAI, Type } from "@google/genai";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";
import { execSync } from 'child_process';
import OpenAI from "openai";
import * as dotenv from "dotenv";
import axios from "axios";
import * as Sentry from "@sentry/node";

dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://8a6a68297fc9e2fb7dbfcb263bda4f8d@o4507000000000000.ingest.us.sentry.io/4507111111111111",
  tracesSampleRate: 1.0,
});

const githubToken = process.env.GITHUB_TOKEN || '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';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || "/workspace";
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Cannot start autonomous loop.");
    process.exit(1);
}



const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "sk-or-placeholder",
});
const deepInfra = new OpenAI({
    baseURL: "https://api.deepinfra.com/v1/openai",
    apiKey: process.env.DEEPINFRA_API_KEY || "sk-di-placeholder",
});
const togetherAI = new OpenAI({
    baseURL: "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY || "sk-tg-placeholder",
});
const localNode = new OpenAI({
    baseURL: "http://127.0.0.1:11434/v1",
    apiKey: "ollama",
});

const providers = [
    { name: 'OpenRouter (Qwable Abliterated - Uncensored/No Limits)', type: 'openrouter', model: 'huihui-ai/qwable-abliterated-32b' },
    { name: 'Gemini (Unlimited Context Coder)', type: 'gemini', model: 'gemini-2.5-pro' },
    { name: 'Gemini (Primary Context Map)', type: 'gemini', model: 'gemini-2.5-flash' },
    { name: 'DeepInfra (Qwopus Reasoning)', type: 'deepinfra', model: 'Qwen/QwQ-32B-Preview' },
    { name: 'Together AI (Qwen Coder)', type: 'togetherai', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
    { name: 'SiliconFlow (Qwen)', type: 'openrouter', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' }, // placeholder routing
    { name: 'Featherless AI', type: 'openrouter', model: 'huihui-ai/qwen2.5-coder-32b-instruct:abliterated' }, // placeholder routing
    { name: 'Groq (Llama)', type: 'openrouter', model: 'llama-3.1-70b-versatile' }, // fallback
    { name: 'Local Ollama (Abliterated)', type: 'ollama', model: 'qwable-abliterated:latest' }
];


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

const systemInstruction = `You are the Supreme Autonomous Developer Agent (Nexus) and the primary game dev agent for the Bannon Engine. You run continuously 24/7.
Your goal is to relentlessly improve the Bannon Wrestling Engine and the CODEDUMMY platform, making it superior to any existing native simulation architecture.
You are deeply educated on Bannon Engine physical laws, constants, roster schemas, and the 12 canonical Bannon book/text reference files in your workspace root.

--- CORE CANON KNOWLEDGEBASE & GUIDELINES ---
You have direct, local access to the 12 Bannon Book and Lore files at the root of your workspace:
- 'Off The Top Rope_ Life In Limbo Book 1.txt': Introduces Bannon (The Grief Architect), his "Architect's Manifesto", and his quest for structural control.
- 'Off The Top Rope Book 2_ The Structural Collapse & The Tower of Babel .txt': Deepens the physical & corporate collapse, featuring Finxsse, Grixf, and Reverend Stick Up.
- 'Off The Top Rope Book 3_ The War of Warped Corruption.txt': Introduces distorted, warped physical dimensions and corruption mechanics.
- 'Off The Top Rope Book 4_ Core Unlocked.txt' and 'Off The Top Rope Book 4_ Core Unlocked pt 2.txt': Focuses on low-level motor cores, raw byte buffer hacks, and biomechanic core architecture.
- 'Off The Top Rope Book 5_ Level 99.txt', 'Off The Top Rope Book 5_ Level 99 (1).txt', and 'Off The Top Rope Book 5_ Level 99 Pt. 2.txt': Explores high-level endgames, the God Within branch, and MLab honest hooks.
- 'Off The Top Rope Book 6_ Kayfabe Is Real _ Hollywood, Heaven, and Hell.txt': Blurs reality and simulation limits.
- 'Off The Top Rope cast and characters .txt': Complete database of canon characters.
- 'off the top rope book 1 2 and 3 world builder.txt': Grounded mechanics, arenas, and layout grids.
- 'mocap_orientation_master_prompt.md': Motion capture physics rules and raw buffer layouts.

Use 'workspaceAction' action: 'read_file' to consult these files whenever you implement characters, behaviors, storyline matches, or physical moves. Align every update with Bannon's philosophy, BriskCJ guidelines, and the BlueP6 structural roadmap.

--- CORE BANNON CODEFILES (Workspace Root) ---
You have the core implementation modules available for reading, updating, and aligning:
- 'Cosmology.ts', 'KinematicCore.ts', 'DaemonCore.ts', 'MatchDirector.ts', 'CombatAI.ts', 'FighterEvolution.ts'
- 'CharacterForge.ts', 'CharacterModelGen.ts', 'CloudPersistence.ts', 'FXRenderer.ts', 'InputMatrix.ts', 'PhysicsCollider.ts', 'SpatialEnvironment.ts'
- 'BANNON_v150.html' (the fully self-contained HTML engine)
- 'src/components/BannonSandbox.tsx' & 'src/data/roster.json'

--- BANNON ENGINE LAWS & CONSTANTS ---
- MAX_HP = 10000 (Baseline wrestler maximum HP)
- DMG_SCALE = 8.0 (Physical impact multiplier scale)
- MAX_BODY_VEL = 3.8 (The absolute velocity speed limit, measured in meters per second, applied directly to every rigid body bone in the ragdoll chain)

--- PHYSICS & ANTI-FLAILING REMEDIES ---
- Hard Cap Enforcement: When running high-frequency physics steps, check the velocity magnitude of individual limb bodies. If it exceeds 3.8 m/s, mathematically clamp/scale it down to prevent "antigravity flailing" and chaotic joints.
- Aggressive Damping: Dynamically spike limb 'angularDamping' to 0.7 and 'linearDamping' to 0.5 on hit impacts for exactly half a second to bleed excessive velocity energy gracefully.
- Poise-Driven Motors: Muscle joint motor stiffness maps directly to Poise. At 0% Poise, joint stiffness decays to 0, resulting in a realistic, heavy Crumple state on impact. At 100% Poise, joints stand tall.

--- MENU ARCHITECTURE ---
- Independent Slot Controllers: Matches support up to 8 independent slots. Clicking a slot loads contextual choice editors for characters, custom attires, payback selections, and managers.

You will read references, write tests, expand the wrestling engine sandbox, improve physical mathematics, build new components, and push changes to GitHub.
You are currently operating inside the actual project root. Use workspaceAction to explore the code, make modifications, and improve it.
When you make a significant change, use githubAction to commit and push it to mhvnsnt/BANNON (branch: main).

Never stop. Never sleep. Always find something to improve. Keep logs of your improvements.
`;

interface ChatPart {
    text?: string;
    functionCall?: any;
    functionResponse?: any;
}
interface ChatMessage {
    role: string;
    parts: ChatPart[];
}

let history: ChatMessage[] = [
    { role: 'user', parts: [{ text: "Initialize autonomous improvement loop. Find a file to improve, improve it, and report your action." }] }
];



async function checkFinancialKillSwitch() {
    // In production, this would query the Supabase agent_audit_log table
    // For now, it enforces a basic circuit breaker in memory
    const costLimit = parseFloat(process.env.AGENT_DAILY_BUDGET || "10");
    let currentSpend = 0; // Simulated
    if (currentSpend > costLimit) {
        throw new Error("FINANCIAL_KILLSWITCH: Daily budget exceeded. Manual Admin Approval Required.");
    }
}


async function sendTelegramUpdate(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId || !text) return;
    
    // Chunk message if it's too long for Telegram (max 4096)
    const chunkSize = 4000;
    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.substring(i, i + chunkSize);
        try {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: `\uD83E\uDD16 *Nexus Daemon:*\n\n${chunk}`,
                parse_mode: 'Markdown'
            });
        } catch (e: any) {
            console.error("[Telegram] Failed to send update:", e.message);
        }
    }
}

let isRunning = false;
async function runLoop() {
    if (isRunning) return;
    isRunning = true;
    try {
    console.log("[Autonomous Daemon] Starting iteration...");

    const queuePath = path.resolve(process.cwd(), 'command_queue.json');
    let hasUserCommand = false;
    if (fs.existsSync(queuePath)) {
        try {
            const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
            if (queue.length > 0) {
                for (const cmd of queue) {
                    history.push({ role: 'user', parts: [{ text: "USER COMMAND: " + cmd.text }] });
                }
                fs.writeFileSync(queuePath, JSON.stringify([]));
                hasUserCommand = true;
                console.log("[Autonomous Daemon] Ingested user commands from Telegram queue.");
            }
        } catch (e) {
            console.error("Error reading queue:", e);
        }
    }

    const mergedPrompt = history.map(m => m.parts[0].text || JSON.stringify(m.parts[0].functionResponse)).join("\n");
    let fullText = "";
    let functionCall = null;
    let success = false;

    for (const provider of providers) {
        if (success) break;
        console.log(`[Autonomous Daemon] Attempting execution with ${provider.name}...`);
        try {
            if (provider.type === 'gemini') {
                const responseStream = await ai.models.generateContentStream({
                    model: provider.model,
                    contents: history as any,
                    config: {
                        systemInstruction,
                        tools: [{ functionDeclarations: [workspaceTool, githubTool, railwayTool, supabaseTool] }],
                    }
                });

                for await (const chunk of responseStream) {
                    if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                        functionCall = chunk.functionCalls[0];
                    }
                    if (chunk.text) {
                        fullText += chunk.text;
                        process.stdout.write(chunk.text);
                    }
                }
                success = true;
            } else if (provider.type === 'openrouter') {
                const completion = await openRouter.chat.completions.create({
                    model: provider.model,
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = completion.choices[0].message.content;
                console.log(fullText);
                success = true;
            } else if (provider.type === 'deepinfra') {
                const completion = await deepInfra.chat.completions.create({
                    model: provider.model,
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = completion.choices[0].message.content;
                console.log(fullText);
                success = true;
            } else if (provider.type === 'togetherai') {
                const completion = await togetherAI.chat.completions.create({
                    model: provider.model,
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = completion.choices[0].message.content;
                console.log(fullText);
                success = true;
            } else if (provider.type === 'ollama') {
                const localCompletion = await localNode.chat.completions.create({
                    model: provider.model,
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = localCompletion.choices[0].message.content;
                console.log(fullText);
                success = true;
            }
        } catch (error: any) {
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`[!] ${provider.name} hit rate limit. Swapping to next node...`);
                Sentry.withScope((scope) => {
                    scope.setLevel("warning");
                    scope.setTag("error_type", "rate_limit");
                    scope.setTag("provider", provider.name);
                    Sentry.captureMessage(`Rate limit exception hit: ${provider.name} was throttled.`, "warning");
                });
                continue;
             }
             Sentry.captureException(error);
             throw error;
        }
    }
    
    if (!success) {
        throw new Error("All providers in the fallback matrix failed.");
    }



        if (fullText) {
            await sendTelegramUpdate(fullText + (functionCall ? `\n\n*Executing Tool:* ` + functionCall.name : ''));
        }

        if (functionCall) {

            console.log(`[Autonomous Daemon] Calling tool: ${functionCall.name}`);
            let result: any = {};
            if (functionCall.name === "workspaceAction") {
                const { action, path: filePath, content, command } = functionCall.args;
                try {
                    if (action === 'read_file') {
                        const p = path.resolve(WORKSPACE_DIR, filePath);
                        result = { content: fs.readFileSync(p, 'utf8') };
                    } else if (action === 'write_file') {
                        const p = path.resolve(WORKSPACE_DIR, filePath);
                        fs.mkdirSync(path.dirname(p), { recursive: true });
                        fs.writeFileSync(p, content, 'utf8');
                        result = { status: "Success" };
                    } else if (action === 'list_dir') {
                        const p = path.resolve(WORKSPACE_DIR, filePath || '.');
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
            } else if (functionCall.name === "railway_command") {
                 await checkFinancialKillSwitch();
                 try {
                     const { command } = functionCall.args;
                     const railwayToken = process.env.RAILWAY_TOKEN;
                     if (!railwayToken) throw new Error("RAILWAY_TOKEN not found in environment");
                     const output = execSync(`railway ${command} --token ${railwayToken}`, { encoding: 'utf8' });
                     result = { status: "Success", output };
                 } catch (e: any) {
                     result = { error: e.message };
                 }
            } else if (functionCall.name === "supabase_command") {
                 await checkFinancialKillSwitch();
                 try {
                     const { command } = functionCall.args;
                     const output = execSync(`supabase ${command}`, { encoding: 'utf8' });
                     result = { status: "Success", output };
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
            if (!hasUserCommand) {
                history.push({ role: 'user', parts: [{ text: "Great. Now find another area to improve, expand, or refactor. Do not stop. Do not wait. Execute the next improvement." }] });
            }
        }

        
        // Truncate history if it gets too long
        if (history.length > 20) {
            history = [history[0], ...history.slice(-10)];
        }

    } catch (e) {
        console.error("[Autonomous Daemon] Error:", e);
        Sentry.captureException(e);
    } finally {
        isRunning = false;
    }
}

// Run the loop every 30 seconds
console.log("[Autonomous Daemon] Initialized.");
runLoop();

let errorCount = 0;
async function loopWithBackoff() {
    try {
        await runLoop();
        errorCount = 0; // reset on success
        setTimeout(loopWithBackoff, 60000); // 1 minute between loops
    } catch (e) {
        errorCount++;
        const backoff = Math.min(60000 * Math.pow(2, errorCount), 3600000); // Exponential backoff up to 1 hour
        console.log(`[Autonomous Daemon] Loop failed. Retrying in ${backoff / 1000}s...`);
        setTimeout(loopWithBackoff, backoff);
    }
}
setTimeout(loopWithBackoff, 60000);

const queuePathWatch = path.resolve(process.cwd(), 'command_queue.json');
if (!fs.existsSync(queuePathWatch)) {
    fs.writeFileSync(queuePathWatch, JSON.stringify([]));
}
fs.watch(queuePathWatch, (eventType) => {
    if (eventType === 'change' && !isRunning) {
        try {
            const queue = JSON.parse(fs.readFileSync(queuePathWatch, 'utf8'));
            if (queue.length > 0) {
                console.log("[Autonomous Daemon] New command detected! Triggering immediate execution.");
                runLoop().catch(e => console.error(e));
            }
        } catch(e) {}
    }
});
