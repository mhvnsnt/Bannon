const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add state for AgentToolsModal
if (!content.includes('const [isAgentToolsOpen, setIsAgentToolsOpen]')) {
    content = content.replace(
        "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);",
        "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  const [isAgentToolsOpen, setIsAgentToolsOpen] = useState(false);"
    );
}

// Add import
if (!content.includes('import { AgentToolsModal }')) {
    content = content.replace(
        "import { TerminalEmulator } from './components/TerminalEmulator';",
        "import { TerminalEmulator } from './components/TerminalEmulator';\nimport { AgentToolsModal } from './components/AgentToolsModal';"
    );
}

// Add the trigger to mobile menu
const cmdPaletteTrigger = `{/* Command Palette Trigger */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3">`;

const newTrigger = `{/* Agent Tools Trigger */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3 pb-3">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAgentToolsOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-900 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Open Agent Tools</span>
                  </button>
                </div>
                
                {/* Command Palette Trigger */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3">`;

content = content.replace(cmdPaletteTrigger, newTrigger);

// Render the AgentToolsModal at the bottom
const commandPaletteRender = `<CommandPalette 
        isOpen={isCommandPaletteOpen}`;

const renderModal = `<AgentToolsModal isOpen={isAgentToolsOpen} onClose={() => setIsAgentToolsOpen(false)} userId={userId} />\n      <CommandPalette 
        isOpen={isCommandPaletteOpen}`;

content = content.replace(commandPaletteRender, renderModal);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx for Agent Tools Modal");
