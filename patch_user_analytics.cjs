const fs = require('fs');
let code = fs.readFileSync('src/components/UserAnalytics.tsx', 'utf8');

// Add imports
code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1 } from 'lucide-react';\nimport GlobalLeaderboard from './GlobalLeaderboard';\nimport DailyMissions from './DailyMissions';\nimport { SkillTreeData } from '../types';");

// Update props
code = code.replace(/export default function UserAnalytics\(\{ streak \}: \{ streak: number \}\) \{/, "export default function UserAnalytics({ streak, skillTree, addXp }: { streak: number, skillTree: SkillTreeData, addXp: (amount: number) => void }) {");

// Inject components at the end of the grid row
const newWidgets = `
        {/* Leaderboard and Missions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DailyMissions skillTree={skillTree} addXp={addXp} />
          <GlobalLeaderboard />
        </div>
      </div>
    </div>
  );
`;

code = code.replace(/      <\/div>\n    <\/div>\n  \);\n\}/, newWidgets + "\n}");

fs.writeFileSync('src/components/UserAnalytics.tsx', code);
console.log("Patched UserAnalytics.tsx");
