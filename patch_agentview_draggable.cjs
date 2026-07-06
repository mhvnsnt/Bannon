const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// Add motion import if not present
if (!content.includes("import { motion } from 'motion/react'")) {
    content = content.replace("import React, { useState", "import React, { useState");
    content = content.replace("import { clsx", "import { motion } from 'motion/react';\nimport { clsx");
}

// Replace the aside with motion.div
const asideStart = `<aside className="w-80 border-l border-black/5 bg-slate-100 flex flex-col h-full overflow-y-auto select-none shrink-0 scrollbar-thin">`;
const motionDivStart = `<motion.div 
          drag 
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-20 right-4 w-80 max-h-[80vh] border border-black/10 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[100]"
        >
        <div className="flex-1 overflow-y-auto scrollbar-thin">`;

content = content.replace(asideStart, motionDivStart);
content = content.replace(
    `            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
              title="Close sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-6">`,
    `            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-6">`
);

// We need to close the added div wrapper inside the motion.div
const asideEnd = `        </aside>`;
const motionDivEnd = `        </div>\n        </motion.div>`;
content = content.replace(asideEnd, motionDivEnd);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView to make diagnostics panel draggable");
