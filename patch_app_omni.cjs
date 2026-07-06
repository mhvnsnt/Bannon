const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import { OmniSandboxModal }')) {
    content = content.replace(
        "import { MascotLibraryDrawer } from './components/MascotLibraryDrawer';",
        "import { MascotLibraryDrawer } from './components/MascotLibraryDrawer';\nimport { OmniSandboxModal } from './components/OmniSandboxModal';"
    );
}

if (!content.includes('<OmniSandboxModal />')) {
    content = content.replace(
        "<MascotLibraryDrawer />",
        "<OmniSandboxModal />\n      <MascotLibraryDrawer />"
    );
    fs.writeFileSync('src/App.tsx', content);
}
