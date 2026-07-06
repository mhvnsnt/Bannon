const fs = require('fs');
let content = fs.readFileSync('src/components/AdminTelemetryPanel.tsx', 'utf-8');

const hookInsert = `
    const [isGhostActive, setIsGhostActive] = useState(false);
    const [activeTarget, setActiveTarget] = useState<string | null>(null);

    useEffect(() => {
        const toggle = () => setIsVisible(v => !v);
        const onGhostActive = (e: any) => { setIsGhostActive(true); setActiveTarget(e.detail?.filePath || null); };
        const onGhostIdle = () => setIsGhostActive(false);

        window.addEventListener('toggle-autonomous-shell', toggle);
        window.addEventListener('ghost-writer-active', onGhostActive);
        window.addEventListener('ghost-writer-idle', onGhostIdle);
        return () => {
            window.removeEventListener('toggle-autonomous-shell', toggle);
            window.removeEventListener('ghost-writer-active', onGhostActive);
            window.removeEventListener('ghost-writer-idle', onGhostIdle);
        };
    }, []);

    const handleGrantFSAccess = async () => {
        await GhostWriter.requestProjectAccess();
    };

    const handleTriggerSelfImprovement = () => {
        // Trigger the mutation pipeline
        window.dispatchEvent(new CustomEvent('trigger-self-mutation'));
    };
`;

content = content.replace(/    useEffect\(\(\) => \{[\s\S]*?    \}, \[\]\);/, hookInsert);

const newButtons = `
                <div className="flex space-x-4 mt-4">
                    <button 
                        onClick={handleGrantFSAccess}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-[#F15BB5] px-4 py-3 rounded-lg uppercase text-sm font-bold tracking-wider transition-colors">
                        Grant FS Access
                    </button>
                    <button 
                        onClick={handleTriggerSelfImprovement}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-[#00F5D4] px-4 py-3 rounded-lg uppercase text-sm font-bold tracking-wider transition-colors relative overflow-hidden">
                        {isGhostActive ? (
                           <span className="animate-pulse">Mutating {activeTarget}...</span>
                        ) : (
                           <span>Trigger Self-Mutation</span>
                        )}
                        {isGhostActive && <div className="absolute bottom-0 left-0 h-1 bg-[#00F5D4] animate-pulse w-full"></div>}
                    </button>
                </div>
`;

content = content.replace(/                <\/div>(\s*)            <\/div>(\s*)        <\/div>/, `                <\/div>${newButtons}$1            <\/div>$2        <\/div>`);

fs.writeFileSync('src/components/AdminTelemetryPanel.tsx', content);
