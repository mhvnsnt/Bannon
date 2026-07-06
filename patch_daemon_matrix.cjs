const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

const newProviders = `
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
    { name: 'Gemini (Primary Context Map)', type: 'gemini', model: 'gemini-2.5-flash' },
    { name: 'OpenRouter (Qwable Abliterated)', type: 'openrouter', model: 'huihui-ai/qwable-abliterated-32b' },
    { name: 'DeepInfra (Qwopus Reasoning)', type: 'deepinfra', model: 'Qwen/QwQ-32B-Preview' },
    { name: 'Together AI (Qwen Coder)', type: 'togetherai', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
    { name: 'SiliconFlow (Qwen)', type: 'openrouter', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' }, // placeholder routing
    { name: 'Featherless AI', type: 'openrouter', model: 'huihui-ai/qwen2.5-coder-32b-instruct:abliterated' }, // placeholder routing
    { name: 'Groq (Llama)', type: 'openrouter', model: 'llama-3.1-70b-versatile' }, // fallback
    { name: 'Local Ollama (Abliterated)', type: 'ollama', model: 'qwable-abliterated:latest' }
];
`;

code = code.replace(/const openRouter = new OpenAI\(\{[\s\S]*?const providers = \[[\s\S]*?\];/m, newProviders);

const newExecution = `
            if (provider.type === 'gemini') {
                const responseStream = await ai.models.generateContentStream({
                    model: provider.model,
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
`;

code = code.replace(/if \(provider\.type === 'gemini'\) \{[\s\S]*?success = true;\n            \}/m, newExecution.trim());

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts with massive Hydra Array.");
