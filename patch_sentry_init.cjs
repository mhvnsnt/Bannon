const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');
code = code.replace(/\/\/ \/\/ Sentry\.init\(\{\n  dsn: process\.env\.SENTRY_DSN \|\| ".*",\n  tracesSampleRate: 1\.0,\n\}\);/g, '');
fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
