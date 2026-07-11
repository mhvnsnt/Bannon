const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

code = code.replace(/if \(fs\.existsSync\(queuePath\)\) \{/, `console.log("Checking queue at: " + queuePath);
    if (fs.existsSync(queuePath)) {`);

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
