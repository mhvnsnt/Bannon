const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import { imagePipelineRouter } from "./src/services/imagePipeline.js";`;

if (!code.includes("imagePipelineRouter")) {
    code = code.replace(
        'const app = express();',
        importStatement + '\nconst app = express();\napp.use(imagePipelineRouter);'
    );
}

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with Vision Pipeline");
