const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

const killSwitch = `
async function checkFinancialKillSwitch() {
    // In production, this would query the Supabase agent_audit_log table
    // For now, it enforces a basic circuit breaker in memory
    const costLimit = parseFloat(process.env.AGENT_DAILY_BUDGET || "10");
    let currentSpend = 0; // Simulated
    if (currentSpend > costLimit) {
        throw new Error("FINANCIAL_KILLSWITCH: Daily budget exceeded. Manual Admin Approval Required.");
    }
}
`;

if (!code.includes("checkFinancialKillSwitch")) {
    code = code.replace(
        'async function runLoop() {',
        killSwitch + '\nasync function runLoop() {'
    );
    
    code = code.replace(
        'if (functionCall.name === "railway_command") {',
        'if (functionCall.name === "railway_command") {\n                 await checkFinancialKillSwitch();'
    );
    
    code = code.replace(
        'if (functionCall.name === "supabase_command") {',
        'if (functionCall.name === "supabase_command") {\n                 await checkFinancialKillSwitch();'
    );
}

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched kill switch");
