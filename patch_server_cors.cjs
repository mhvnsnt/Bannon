const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(
  "app.use(cors({",
  "app.use(cors({\n    origin: ['https://codedummy-codedummy.up.railway.app', 'https://railway.com', 'http://localhost:3000', 'https://codedummy.app'],"
);

fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts with CORS");
