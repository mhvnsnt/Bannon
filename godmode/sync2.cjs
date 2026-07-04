const fs = require('fs');
fs.copyFileSync('godmode_themed/src/lib/taskQueue.ts', 'src/lib/taskQueue.ts');
fs.copyFileSync('godmode_themed/src/lib/safeStorage.ts', 'src/lib/safeStorage.ts');
console.log("Done.");
