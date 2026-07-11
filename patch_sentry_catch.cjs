const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

const targetCatch = `        } catch (error: any) { 
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                // Sentry.withScope((scope) => {
                    scope.setLevel("warning");
                    scope.setTag("error_type", "rate_limit");
                    scope.setTag("provider", provider.name);
                    // Sentry.captureMessage(\`Rate limit exception hit: \${provider.name} was throttled.\`, "warning");
                });
                continue;
             }
             // Sentry.captureException(error);
             throw error;
        }`;

const replacementCatch = `        } catch (error: any) { 
             if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                console.warn(\`[!] \${provider.name} hit rate limit. Swapping to next node...\`);
                continue;
             }
             throw error;
        }`;

code = code.replace(targetCatch, replacementCatch);
fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
