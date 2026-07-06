const fs = require('fs');
let content = fs.readFileSync('src/components/AdminTelemetryPanel.tsx', 'utf-8');

if (!content.includes('import { GitDeploymentManager }')) {
    content = content.replace(
        "import { GhostWriter } from '../utils/GhostWriter';",
        "import { GhostWriter } from '../utils/GhostWriter';\nimport { GitDeploymentManager } from '../utils/GitDeploymentManager';"
    );
}

const authButtons = `
                {/* DEPLOYMENT CONTROLS */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <button 
                        onClick={() => GitDeploymentManager.connectOAuth('github')}
                        className="bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Auth GitHub
                    </button>
                    <button 
                        onClick={() => GitDeploymentManager.connectOAuth('railway')}
                        className="bg-slate-800 hover:bg-slate-700 text-[#FF9F1C] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Auth Railway
                    </button>
                    <button 
                        onClick={async () => {
                             await GitDeploymentManager.pushToGitHub("Auto-mutated codebase via God-Mode");
                             await GitDeploymentManager.deployToRailway();
                        }}
                        className="col-span-2 bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-2 rounded-lg uppercase text-xs font-bold tracking-wider transition-colors border border-slate-700 flex items-center justify-center">
                        Push to GitHub & Railway Deploy
                    </button>
                </div>
`;

if (!content.includes('DEPLOYMENT CONTROLS')) {
    content = content.replace(
        "{/* ACTION CONTROLS */}",
        authButtons + "\n                {/* ACTION CONTROLS */}"
    );
    fs.writeFileSync('src/components/AdminTelemetryPanel.tsx', content);
}

