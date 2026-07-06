const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts.start = "pm2-runtime start dist/server.cjs --name 'codedummy-daemon'";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log("Patched package.json with pm2 start script");
