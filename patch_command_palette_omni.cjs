const fs = require('fs');
let content = fs.readFileSync('src/components/CommandPalette.tsx', 'utf-8');

const omniCommand = `
          { id: 'omni-sandbox', label: 'Boot Omni-Execution WASM Sandbox', action: () => window.dispatchEvent(new CustomEvent('toggle-omni-sandbox')) },
`;

if (!content.includes('omni-sandbox')) {
    content = content.replace(
        "const filteredCommands = [",
        "const filteredCommands = [\n" + omniCommand
    );
    fs.writeFileSync('src/components/CommandPalette.tsx', content);
}
