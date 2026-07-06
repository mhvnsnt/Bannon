const fs = require('fs');
let content = fs.readFileSync('src/components/AdminTelemetryPanel.tsx', 'utf-8');

if (!content.includes('import { PanopticonSpectator }')) {
    content = content.replace(
        "import { AssetVault } from '../utils/AssetVault';",
        "import { AssetVault } from '../utils/AssetVault';\nimport { PanopticonSpectator } from './PanopticonSpectator';"
    );
}

if (!content.includes('const [spectatingUser')) {
    content = content.replace(
        "const [isVisible, setIsVisible] = useState(false);",
        "const [isVisible, setIsVisible] = useState(false);\n    const [spectatingUser, setSpectatingUser] = useState<string | null>(null);"
    );
}

if (content.includes("p.subscribeToUser('target_user_882');")) {
    content = content.replace(
        "p.subscribeToUser('target_user_882');\n                            logToTerminal(\"[PANOPTICON] Shadowing target_user_882. Real-time telemetry linked.\");",
        "setSpectatingUser('target_user_882');\n                            logToTerminal(\"[PANOPTICON] Initializing Spectator Canvas for target_user_882...\");"
    );
}

if (!content.includes('<PanopticonSpectator targetUserId=')) {
    content = content.replace(
        "</Draggable>",
        "</Draggable>\n            {spectatingUser && <PanopticonSpectator targetUserId={spectatingUser} onClose={() => setSpectatingUser(null)} />}"
    );
    fs.writeFileSync('src/components/AdminTelemetryPanel.tsx', content);
}
