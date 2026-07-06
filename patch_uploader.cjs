const fs = require('fs');
let content = fs.readFileSync('src/components/MascotUploader.tsx', 'utf-8');

if (!content.includes('import { ProtocolShunt }')) {
    content = content.replace(
        "import { AssetVault } from '../utils/AssetVault';",
        "import { AssetVault } from '../utils/AssetVault';\nimport { ProtocolShunt } from '../utils/ProtocolShunt';"
    );
}

const blendLogic = `
            if (file.name.endsWith('.blend')) {
                setUploadStatus(\`Delegating \${file.name} to external MCP Blender fallback...\`);
                const localUrl = await ProtocolShunt.delegateConversionMCP(file, setUploadStatus);
                setUploadStatus("Success! Model converted and cached to OPFS via MCP.");
                window.dispatchEvent(new CustomEvent('mascot-model-uploaded', { detail: { url: localUrl } }));
                return;
            }
`;

content = content.replace(
    /if \(file\.name\.endsWith\('\.blend'\)\) \{[\s\S]*?return;\n            \}/,
    blendLogic
);

fs.writeFileSync('src/components/MascotUploader.tsx', content);
