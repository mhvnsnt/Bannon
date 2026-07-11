const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

const targetRegex = /\} catch \(error: any\) \{[\s\S]*?throw error;\n        \}/;
const cleanCatch = `} catch (error: any) { 
             if (error?.status === 429 || error?.status === 401 || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('Authentication') || error?.message?.includes('rate limit')) {
                console.warn(\`[!] \${provider.name} hit rate limit or auth error. Swapping to next node...\`);
                continue;
             }
             throw error;
        }`;

code = code.replace(targetRegex, cleanCatch);
fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
