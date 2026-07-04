const fs = require('fs');
const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
fs.writeFileSync('public/icon-192x192.png', buf);
fs.writeFileSync('public/icon-512x512.png', buf);
