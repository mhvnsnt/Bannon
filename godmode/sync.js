const fs = require('fs');
fs.copyFileSync('godmode_themed/src/server/nexusMind.ts', 'src/server/nexusMind.ts');
fs.copyFileSync('godmode_themed/src/server/overnightMind.ts', 'src/server/overnightMind.ts');
fs.copyFileSync('godmode_themed/src/server/patternRecognizer.ts', 'src/server/patternRecognizer.ts');
fs.copyFileSync('godmode_themed/src/server/db.ts', 'src/server/db.ts');
if (fs.existsSync('godmode_themed/src/server/autonomousEngine.ts')) {
   fs.copyFileSync('godmode_themed/src/server/autonomousEngine.ts', 'src/server/autonomousEngine.ts');
}
fs.copyFileSync('godmode_themed/src/components/MetaconsciousApotheosis.tsx', 'src/components/MetaconsciousApotheosis.tsx');
console.log("Done copying!");
