const fs = require('fs');
let content = fs.readFileSync('src/components/AutonomousMascot.tsx', 'utf-8');

if (!content.includes('import { GhostWriter }')) {
    content = content.replace(
        "import { AdminTelemetryPanel } from '../components/AdminTelemetryPanel';",
        "import { AdminTelemetryPanel } from '../components/AdminTelemetryPanel';\nimport { GhostWriter } from '../utils/GhostWriter';\nimport { MutationEngine } from '../utils/MutationEngine';\nimport { VerificationSupervisor } from '../utils/VerificationSupervisor';\nimport { RuntimeLinker } from '../utils/RuntimeLinker';"
    );
}

const mutationLogic = `
        const mutationEngine = new MutationEngine(async (status, mutatedCode, error) => {
            if (status === 'MUTATED' && mutatedCode) {
                const supervisor = new VerificationSupervisor();
                const passed = await supervisor.verifyMutation(mutatedCode, {});
                if (passed) {
                    await GhostWriter.patchFile('src/components/AutonomousMascot.tsx', mutatedCode);
                    const linker = new RuntimeLinker();
                    await linker.hotSwap('AutonomousMascot', mutatedCode, {});
                }
            }
        });

        window.addEventListener('trigger-self-mutation', async () => {
            console.log("[Auto-Upgrade] Initiating autonomous self-mutation cycle...");
            const currentCode = await GhostWriter.getFile('src/components/AutonomousMascot.tsx');
            if (currentCode) {
                mutationEngine.ingest(currentCode, 'PERFORMANCE_LOOP');
            } else {
                console.warn("[Auto-Upgrade] GhostWriter failed to read source. Is FS Access granted?");
            }
        });
`;

// Insert the mutation logic before the "// 5. MAIN INTEGRATION LOOP"
content = content.replace(/\/\/ 5\. MAIN INTEGRATION LOOP/, mutationLogic + "\n        // 5. MAIN INTEGRATION LOOP");

fs.writeFileSync('src/components/AutonomousMascot.tsx', content);
