const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

const badPart = `                 } catch (e: any) {
                     result = { error: e.message };
                 }
            }
            } else if (functionCall.name === "railway_command") {`;

const goodPart = `                 } catch (e: any) {
                     result = { error: e.message };
                 }
            } else if (functionCall.name === "railway_command") {`;

code = code.replace(badPart, goodPart);
fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched extra brace with exact string match.");
