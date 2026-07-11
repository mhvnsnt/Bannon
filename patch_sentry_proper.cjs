const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/start-autonomous-agent.ts', 'utf8');

// Remove import
code = code.replace(/import \* as Sentry from "@sentry\/node";/g, '');

// Remove Sentry.init block
code = code.replace(/Sentry\.init\(\{\s+dsn: process\.env\.SENTRY_DSN[\s\S]*?tracesSampleRate: 1\.0,\s+\}\);/, '');

// Replace catch block rate limit sentry
code = code.replace(/Sentry\.withScope\(\(scope\) => \{[\s\S]*?Sentry\.captureMessage[^}]+\}\);/, '');

// Remove Sentry.captureException
code = code.replace(/Sentry\.captureException\([^)]+\);/g, '');

fs.writeFileSync('/tmp/bannon2/start-autonomous-agent.ts', code);
