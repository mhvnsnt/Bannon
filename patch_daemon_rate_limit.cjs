const fs = require('fs');
let code = fs.readFileSync('start-autonomous-agent.ts', 'utf8');

// Switch to gemini-2.5-flash which might have a different rate limit bucket or just handle backoff
code = code.replace(
  'model: "gemini-3.5-flash",',
  'model: "gemini-2.5-flash",'
);

// Add error handling and backoff
code = code.replace(
  /setInterval\(runLoop, 30000\);/,
  `
let errorCount = 0;
async function loopWithBackoff() {
    try {
        await runLoop();
        errorCount = 0; // reset on success
        setTimeout(loopWithBackoff, 60000); // 1 minute between loops
    } catch (e) {
        errorCount++;
        const backoff = Math.min(60000 * Math.pow(2, errorCount), 3600000); // Exponential backoff up to 1 hour
        console.log(\`[Autonomous Daemon] Loop failed. Retrying in \${backoff / 1000}s...\`);
        setTimeout(loopWithBackoff, backoff);
    }
}
setTimeout(loopWithBackoff, 60000);
`
);

fs.writeFileSync('start-autonomous-agent.ts', code);
console.log("Patched start-autonomous-agent.ts");
