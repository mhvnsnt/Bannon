const fs = require('fs');
const file = 'src/components/AgentView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import ProjectPlayground from '\.\/ProjectPlayground';/, `import ProjectPlayground from './ProjectPlayground';\nimport RealTimeAgentLog from './RealTimeAgentLog';`);

const hookRegex = /const \[agentStream, setAgentStream\] = useState<\s*\{id:\s*string,\s*text:\s*string\}\s*\[\]>\(\[\]\);\n\s*const sessionId = 'global-codedummy-session';\n\s*useEffect\(\(\) => \{\n\s*const unsubscribe = subscribeToAgentStream\(sessionId, \(data\) => \{\n\s*if \(Array.isArray\(data\)\) \{\n\s*setAgentStream\(data\);\n\s*\} else \{\n\s*setAgentStream\(prev => \[\.\.\.prev, \{ id: Math.random\(\).toString\(\), text: data.text \}\]\);\n\s*\}\n\s*\}\);\n\s*return \(\) => unsubscribe\(\);\n\s*\}, \[sessionId\]\);/gm;
content = content.replace(hookRegex, `const sessionId = 'global-codedummy-session';`);

const jsxRegex = /\{isStreamOpen && \([\s\S]*?<\/aside>\s*\)\}/gm;
content = content.replace(jsxRegex, `{isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}`);

fs.writeFileSync(file, content);
console.log("Patched!");
