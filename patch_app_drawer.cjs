const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import { MascotLibraryDrawer }')) {
    content = content.replace(
        "import { CodedummyLoader } from './components/CodedummyLoader';",
        "import { CodedummyLoader } from './components/CodedummyLoader';\nimport { MascotLibraryDrawer } from './components/MascotLibraryDrawer';"
    );
}

if (!content.includes('<MascotLibraryDrawer />')) {
    content = content.replace(
        "<DeployModal",
        "<MascotLibraryDrawer />\n      <DeployModal"
    );
    fs.writeFileSync('src/App.tsx', content);
}
