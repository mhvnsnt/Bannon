const fs = require('fs');
const filePath = '/tmp/bannon2/start-autonomous-agent.ts';
let code = fs.readFileSync(filePath, 'utf8');
const target = `const providers = [
    { name: 'Gemini (Primary Context Map)', type: 'gemini', model: 'gemini-2.5-flash' },`;
const replacement = `const providers = [
    { name: 'Gemini (Unlimited Context Coder)', type: 'gemini', model: 'gemini-2.5-pro' },
    { name: 'Gemini (Primary Context Map)', type: 'gemini', model: 'gemini-2.5-flash' },`;
code = code.replace(target, replacement);
fs.writeFileSync(filePath, code);
console.log("Patched start-autonomous-agent.ts with Gemini Pro");
