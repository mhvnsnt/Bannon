const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/\\napp\.post/g, '\napp.post');
fs.writeFileSync('server.ts', content);
