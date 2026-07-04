const fs = require('fs');
let content = fs.readFileSync('src/components/QuantumChat.tsx', 'utf8');

content = content.replace(
  /let intent = "strategy";[\s\S]*?(?=if \(!hasActiveProject)/m,
  `let intent = "strategy";
        const lowerInput = textToSend.toLowerCase();

        if (lowerInput.match(/code|function|component|script|class|implement|write.*\\b(js|ts|tsx|jsx|py|html|css)\\b|build|create.*app|react|hook|api|endpoint|fix.*bug|debug|refactor|algorithm/)) intent = "code";
        else if (lowerInput.match(/compile|deploy|launch|ship|publish|generate.*game|bannon|physics|rig|animation|wrestling/)) intent = "build";
        else if (lowerInput.match(/deploy|push.*railway|go live|release/)) intent = "deploy";
        else intent = "strategy";

        let taskType = "HIGH_REASONING";
        if (intent === 'code' || intent === 'build') taskType = "CODE_GEN";
        else if (intent === 'deploy') taskType = "ARCHITECTURE";
        else if (intent === 'strategy') taskType = textToSend.length > 200 ? "HIGH_REASONING" : "SWARM_WORKER";
        
        `
);

content = content.replace(
  /body: JSON\.stringify\(\{ message: textToSend[\s\S]*?\}\)/m,
  `body: JSON.stringify({ message: textToSend, taskType, ...((intent === "code" || intent === "build") && hasActiveProject && { context: currentFiles }) })`
);

content = content.replace(
  /msg\.role === "armada" && msg\.content\.includes\("```"\)/g,
  `msg.role === "armada" && (msg.content.includes("\`\`\`") || msg.content.includes("\`") || msg.content.match(/function|export|const|import|<|if \\(/))`
);

content = content.replace(
  /onClick=\{\(\) => \{\n\s*const codeBlocks = \[\];\n\s*const regex = \/\`\`\`(?:\\w\+)\?\\n\(\[\\s\\S\]\*\?\)\\n\`\`\`\/g;\n\s*let match;\n\s*while \(\(match = regex\.exec\(msg\.content\)\) !== null\) \{\n\s*codeBlocks\.push\(match\[1\]\);\n\s*\}\n\s*if \(codeBlocks\.length > 0\) \{\n\s*setProjectFiles\(prev => \(\{\n\s*\.\.\.prev,\n\s*'src\/components\/QuantumGenerated\.tsx': codeBlocks\.join\("\\n\\n"\)\n\s*\}\)\);\n\s*\}\n\s*\}\}/m,
  `onClick={() => {
                                        try {
                                            if (!setProjectFiles) throw new Error("Forge not initialized");
                                            const codeBlocks = [];
                                            const regex = /\`\`\`(?:\\w+)?\\n([\\s\\S]*?)\\n\`\`\`/g;
                                            let match;
                                            while ((match = regex.exec(msg.content)) !== null) {
                                                codeBlocks.push(match[1]);
                                            }
                                            if (codeBlocks.length === 0) {
                                                codeBlocks.push(msg.content); // Fallback
                                            }
                                            if (codeBlocks.length > 0) {
                                                setProjectFiles(prev => ({
                                                    ...prev,
                                                    'src/components/QuantumGenerated.tsx': codeBlocks.join("\\n\\n")
                                                }));
                                                alert("Successfully synced to Forge!");
                                            }
                                        } catch (e) {
                                            alert("Forge not initialized — open Forge Studio tab first");
                                        }
                                    }}`
);

content = content.replace(
  /onClick=\{\(\) => \{\n\s*if \(!runSingleCommand\) return;\n\s*const codeBlocks = \[\];\n\s*const regex = \/\`\`\`(?:\w\+)\?\\n\(\[\\s\\S\]\*\?\)\\n\`\`\`\/g;[\s\S]*?runSingleCommand\(codeBlocks\[0\]\);\n\s*\}\n\s*\}\}/m,
  `onClick={() => {
                                        if (bridgeStatus !== 'connected') {
                                            alert("Hardware Actuator not connected. Install Termux on your device and run the bootstrap script.");
                                            return;
                                        }
                                        if (!runSingleCommand) return;
                                        const codeBlocks = [];
                                        const regex = /\`\`\`(?:bash|sh)?\\n([\\s\\S]*?)\\n\`\`\`/g;
                                        let match;
                                        while ((match = regex.exec(msg.content)) !== null) {
                                            codeBlocks.push(match[1]);
                                        }
                                        if (codeBlocks.length > 0) {
                                            runSingleCommand(codeBlocks[0]);
                                        } else {
                                            runSingleCommand(msg.content);
                                        }
                                    }}`
);

content = content.replace(
  /(<button[\s\S]*?Run on Hardware\s*<\/button>)/m,
  `$1\n                                    <button 
                                        onClick={(e) => {
                                            const btn = e.currentTarget;
                                            const codeBlocks = [];
                                            const regex = /\`\`\`(?:\\w+)?\\n([\\s\\S]*?)\\n\`\`\`/g;
                                            let match;
                                            while ((match = regex.exec(msg.content)) !== null) {
                                                codeBlocks.push(match[1]);
                                            }
                                            const textToCopy = codeBlocks.length > 0 ? codeBlocks.join("\\n\\n") : msg.content;
                                            navigator.clipboard.writeText(textToCopy);
                                            btn.innerText = "Copied!";
                                            setTimeout(() => btn.innerText = "Copy Code", 2000);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[#121812] hover:bg-[#1a201a] border border-emerald-900/50 rounded text-[10px] font-bold text-emerald-500 uppercase tracking-widest transition-all"
                                    >
                                        Copy Code
                                    </button>`
);

content = content.replace(
  /<div className="text-\[10px\] uppercase tracking-widest font-bold text-cyan-700 mt-2 border-t border-cyan-900\/30 pt-2">/m,
  `<div className="text-[10px] uppercase tracking-widest font-bold text-cyan-700 mt-2 border-t border-cyan-900/30 pt-2 flex items-center justify-between">
    <span>`
);
content = content.replace(
  /(Processed by Node:\s*<span className="text-cyan-500">\{msg\.nodeUsed\}<\/span>)/m,
  `$1</span> {msg.modelUsed && <span className="text-gray-500 bg-gray-900 px-2 py-0.5 rounded ml-2">{msg.provider && \`\${msg.provider} / \`}{msg.modelUsed}</span>}</div>`
);

content = content.replace(
  /nodeUsed\?: string;/m,
  `nodeUsed?: string;\n  modelUsed?: string;\n  provider?: string;`
);

fs.writeFileSync('src/components/QuantumChat.tsx', content);
