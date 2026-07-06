const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

// Add imports
if (!code.includes("import OpenAI from 'openai';")) {
    code = code.replace(
        'import dotenv from "dotenv";',
        'import OpenAI from "openai";\nimport dotenv from "dotenv";'
    );
}

// Add the provider configuration
const providerConfig = `
const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "sk-or-placeholder",
});
const localOllama = new OpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama",
});

const providers = [
    { name: 'Gemini', type: 'gemini' },
    { name: 'OpenRouter (Qwable)', type: 'openrouter' },
    { name: 'Local Ollama (Abliterated)', type: 'ollama' }
];
`;

if (!code.includes("const providers = [")) {
    code = code.replace(
        'const ai = new GoogleGenAI({',
        providerConfig + '\nconst ai = new GoogleGenAI({'
    );
}

// Rewrite the runLoop to use the providers array
const newRunLoop = `
async function runLoop() {
    console.log("[Autonomous Daemon] Starting iteration...");
    const mergedPrompt = history.map(m => m.parts[0].text || JSON.stringify(m.parts[0].functionResponse)).join("\\n");
    let fullText = "";
    let functionCall = null;
    let success = false;

    for (const provider of providers) {
        if (success) break;
        console.log(\`[Autonomous Daemon] Attempting execution with \${provider.name}...\`);
        try {
            if (provider.type === 'gemini') {
                const responseStream = await ai.models.generateContentStream({
                    model: "gemini-2.5-flash",
                    contents: history as any,
                    config: {
                        systemInstruction,
                        tools: [{ functionDeclarations: [workspaceTool, githubTool] }],
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
                    model: "huihui-ai/qwen2.5-coder-32b-instruct:abliterated",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = completion.choices[0].message.content;
                console.log(fullText);
                success = true;
            } else if (provider.type === 'ollama') {
                const localCompletion = await localOllama.chat.completions.create({
                    model: "qwen2.5-coder:7b",
                    messages: [{ role: "system", content: systemInstruction }, { role: "user", content: mergedPrompt }],
                });
                fullText = localCompletion.choices[0].message.content;
                console.log(fullText);
                success = true;
            }
        } catch (error: any) {
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                continue;
             }
             throw error;
        }
    }
    
    if (!success) {
        throw new Error("All providers in the fallback matrix failed.");
    }
`;

code = code.replace(
    /async function runLoop\(\) \{[\s\S]*?console\.log\(""\);/m,
    newRunLoop
);

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts with Multi-Provider Load Balancer");
