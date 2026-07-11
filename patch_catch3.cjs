const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/} catch \(error: any\) \{[\s\S]*?throw error;\n        \}/, `} catch (error: any) { 
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                continue;
             }
             throw error;
        }`);

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
console.log("Forcibly patched catch block.");
