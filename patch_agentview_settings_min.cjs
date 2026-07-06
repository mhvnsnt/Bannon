const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

if (!content.includes('const [isSettingsMinimized, setIsSettingsMinimized]')) {
    content = content.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);"
    );
}

// Add the minimize button
const originalButtons = `
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
              title="Close sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
`;

const newButtons = `
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSettingsMinimized(!isSettingsMinimized)}
                className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
                title={isSettingsMinimized ? "Maximize" : "Minimize"}
              >
                {isSettingsMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded bg-white border border-black/5 text-slate-400 hover:text-black cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
`;

content = content.replace(originalButtons, newButtons);
content = content.replace(
    '<PanelRightClose className="w-4 h-4" />',
    '<X className="w-4 h-4" />' // just in case it was replaced in a previous step
);

content = content.replace(
    'className="fixed top-20 right-4 w-80 max-h-[80vh] border border-black/10 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[100]"',
    'className="fixed top-20 right-4 w-80 max-h-[80vh] border border-black/10 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[100] cursor-move"'
);

// We need to wrap the contents in a check for !isSettingsMinimized
const contentStart = '<div className="p-4 flex flex-col gap-6">';
content = content.replace(contentStart, '{!isSettingsMinimized && (\n          <div className="p-4 flex flex-col gap-6 cursor-auto">');

// Find the end of the settings container
// It ends with 
//             <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
//         </div>
content = content.replace(
    `            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />\n        </div>`,
    `            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />\n        </div>\n        )}`
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView to add minimized state to Agent Console");
