const fs = require('fs');
let content = fs.readFileSync('src/components/CommandPalette.tsx', 'utf-8');

const drawerCommand = `
          { id: 'mascot-library', label: 'Open Mascot Library (Custom GLB)', action: () => window.dispatchEvent(new CustomEvent('toggle-mascot-library')) },
`;

if (!content.includes('mascot-library')) {
    content = content.replace(
        "const filteredCommands = [",
        "const filteredCommands = [\n" + drawerCommand
    );
    fs.writeFileSync('src/components/CommandPalette.tsx', content);
}
