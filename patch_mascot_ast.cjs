const fs = require('fs');
let content = fs.readFileSync('src/components/AutonomousMascot.tsx', 'utf-8');

const eventLogic = `
        window.addEventListener('editor-code-changed', (e: any) => {
            if (astSynthesizer) {
                astSynthesizer.updateFromCode(e.detail.code);
            }
        });
`;

if (!content.includes('editor-code-changed')) {
    content = content.replace(/\/\/ 5\. MAIN INTEGRATION LOOP/, eventLogic + "\n        // 5. MAIN INTEGRATION LOOP");
    fs.writeFileSync('src/components/AutonomousMascot.tsx', content);
}
