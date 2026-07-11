const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

const target = `        } catch (error: any) { 
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                // Sentry.withScope((scope) => {
                    scope.setLevel("warning");
                    scope.setTag("error_type", "rate_limit");
                    scope.setTag("provider", provider.name);
                    // Sentry.captureMessage(\`Rate limit exception hit: \${provider.name} was throttled.\`, "warning");
                // });
                continue;
             }
             // Sentry.captureException(error);
             throw error;
        }`;

const replacement = `        } catch (error: any) { 
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                continue;
             }
             throw error;
        }`;

if (code.includes(target.split('\\n')[0])) {
    code = code.replace(target, replacement);
    fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
    console.log("Patched catch block.");
}
