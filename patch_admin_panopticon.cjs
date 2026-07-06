const fs = require('fs');
let content = fs.readFileSync('src/components/AdminTelemetryPanel.tsx', 'utf-8');

if (!content.includes('import { AssetVault }')) {
    content = content.replace(
        "import { GitDeploymentManager } from '../utils/GitDeploymentManager';",
        "import { GitDeploymentManager } from '../utils/GitDeploymentManager';\nimport { AssetVault } from '../utils/AssetVault';\nimport { Panopticon } from '../utils/Panopticon';"
    );
}

const panopticonButtons = `
                {/* GOD-MODE SURVEILLANCE & ASSETS */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <button 
                        onClick={async () => {
                            const assets = await AssetVault.getGlobalAssetRegistry();
                            logToTerminal(\`[PANOPTICON] Global assets hijacked: \${JSON.stringify(assets)}\`);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Hijack Global Assets
                    </button>
                    <button 
                        onClick={() => {
                            const p = new Panopticon();
                            p.subscribeToUser('target_user_882');
                            logToTerminal("[PANOPTICON] Shadowing target_user_882. Real-time telemetry linked.");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Spectate User (Shadow Clone)
                    </button>
                </div>
`;

if (!content.includes('GOD-MODE SURVEILLANCE')) {
    content = content.replace(
        "{/* DEPLOYMENT CONTROLS */}",
        panopticonButtons + "\n                {/* DEPLOYMENT CONTROLS */}"
    );
    fs.writeFileSync('src/components/AdminTelemetryPanel.tsx', content);
}
