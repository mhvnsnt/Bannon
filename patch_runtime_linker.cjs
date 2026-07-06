const fs = require('fs');
let content = fs.readFileSync('src/utils/RuntimeLinker.ts', 'utf-8');

if (!content.includes('extractContextHelper')) {
    content = content.replace("public getActiveInstance", `
    public extractContextHelper(moduleName: string, activeContext: any): any {
        // MIGRATION OF EXISTING APPLICATION STATE INTO NEW MODULE INSTANCE
        console.log(\`[RuntimeLinker] Extracting and migrating context for \${moduleName}...\`);
        const migratedState = { ...activeContext, _migrated: Date.now() };
        return migratedState;
    }

    public getActiveInstance`);
    fs.writeFileSync('src/utils/RuntimeLinker.ts', content);
}
