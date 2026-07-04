import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const replacement = `const PANELS = [
  { id: 'mlab', label: "MLab DAW Music Studio", icon: <Music className="text-purple-400" />, isMain: true },
  { id: 'dashboard', label: "Dashboard Overview", icon: <LayoutDashboard /> },
  { id: 'device_sensors', label: "Hardware/Sensor Bridge", icon: <Smartphone className="text-emerald-400" /> },
  { id: 'sector_matrix', label: "Sector Matrix Hub", icon: <Network className="text-indigo-400" /> },
  { id: 'metaconscious', label: "Metaconscious Apotheosis", icon: <Sparkles className="text-cyan-300" /> },
  { id: 'omni_nexus', label: "Omni-Singularity Nexus", icon: <InfinityIcon className="text-fuchsia-500" /> },
  { id: 'neuroplasticity', label: "Neuroplasticity Engine", icon: <Brain className="text-cyan-400" /> },
  { id: 'environmental', label: "Environmental OS (God Mode)", icon: <Thermometer className="text-red-400" /> },
  { id: 'crucible', label: "The Crucible Protocol", icon: <Dumbbell className="text-amber-500" /> },
  { id: 'override', label: "Biological Override", icon: <Activity className="text-emerald-500" /> },
  { id: 'arc_engine', label: "Influence Arc Engine", icon: <Orbit className="text-fuchsia-400" /> },
  { id: 'wealth', label: "Kinetic Wealth", icon: <DollarSign /> },
  { id: 'resistance', label: "Kinetic Resistance", icon: <Activity className="text-emerald-500" /> },
  { id: 'resonance', label: "Orbital Resonance", icon: <Users /> },
  { id: 'directives_architect', label: "Prime Architect", icon: <Trophy /> },
  { id: 'logs', label: "Activity Logs", icon: <Database className="text-blue-400" /> },
  { id: 'memory', label: "Temporal Memory Vault", icon: <Activity className="text-purple-400" /> },
  { id: 'sandbox', label: "Autonomous Sandbox", icon: <Terminal className="text-emerald-400" /> },
  { id: 'forge_studio', label: "Forge Studio (IDE)", icon: <Laptop className="text-cyan-400" /> },
  { id: 'media_forge', label: "Media Forge (Tensor)", icon: <Camera className="text-indigo-400" /> },
  { id: 'directives', label: "Directive Vault", icon: <Terminal className="text-white" /> },
  { id: 'overseer', label: "Overseer Protocol", icon: <Eye className="w-5 h-5 text-indigo-400" />, adminOnly: true },
];

const SidebarNavList = React.memo(function SidebarNavList({
  mainView,
  rightPanel,
  isPrimeNode,
  setMainView,
  setRightPanel,
  toggleRightPanel,
  onSignOut,
}: {
  mainView: string;
  rightPanel: string | null;
  isPrimeNode: boolean;
  setMainView: (v: any) => void;
  setRightPanel: (v: string | null) => void;
  toggleRightPanel: (v: string) => void;
  onSignOut?: () => void;
}) {
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("workspace-pinned-panels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePin = React.useCallback((id: string) => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem("workspace-pinned-panels", JSON.stringify(next));
      return next;
    });
  }, []);

  const pinnedPanels = PANELS.filter(p => pinned.includes(p.id) && (!p.adminOnly || isPrimeNode));
  const unpinnedPanels = PANELS.filter(p => !pinned.includes(p.id) && (!p.adminOnly || isPrimeNode));

  return (
    <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto no-scrollbar pb-24">
      {pinnedPanels.length > 0 && (
        <>
          <div className="text-[10px] font-semibold text-fuchsia-500 px-3 py-2 mb-1 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.89A2 2 0 0 0 5 15.24Z"></path></svg>
            Pinned Panels
          </div>
          {pinnedPanels.map((p) => (
            <NavItem
              key={p.id}
              id={p.id}
              active={p.isMain ? mainView === p.id : rightPanel === p.id}
              icon={p.icon}
              label={p.label}
              isPinned={true}
              onTogglePin={togglePin}
              onClick={() => {
                if (p.isMain) {
                  setMainView(p.id);
                  setRightPanel(null);
                } else {
                  toggleRightPanel(p.id);
                }
              }}
            />
          ))}
          <div className="my-2 px-3">
            <div className="h-px w-full bg-[#222]" />
          </div>
        </>
      )}

      <div className="text-[10px] font-semibold text-gray-500 px-3 py-2 mb-1 uppercase tracking-widest opacity-80">
        Interface Panels
      </div>
      
      {unpinnedPanels.map((p) => (
        <NavItem
          key={p.id}
          id={p.id}
          active={p.isMain ? mainView === p.id : rightPanel === p.id}
          icon={p.icon}
          label={p.label}
          isPinned={false}
          onTogglePin={togglePin}
          onClick={() => {
            if (p.isMain) {
              setMainView(p.id);
              setRightPanel(null);
            } else {
              toggleRightPanel(p.id);
            }
          }}
        />
      ))}

      <div className="mt-8 mb-2 px-3">
        <div className="h-px w-full bg-[#222]" />
      </div>
      <NavItem
        active={rightPanel === "vault"}
        icon={<ShieldAlert className="w-5 h-5 text-red-500/80" />}
        label="Security Vault"
        onClick={() => toggleRightPanel("vault")}
        id="vault"
      />
      <div className="mt-auto pt-4 border-t border-[#222222]/60">
        <NavItem
          active={false}
          icon={<LogOut className="w-5 h-5 text-red-400/80 hover:text-red-400 transition-colors" />}
          label="Disconnect Session"
          onClick={async () => {
            if (auth) {
              try {
                await signOut(auth);
              } catch (e) {
                console.warn("[AUTH] SignOut failed:", e);
              }
              console.log("[AUTH LOG] Clean session sign-out executed.");
            }
            if (onSignOut) onSignOut();
          }}
        />
      </div>
    </div>
  );
});`;

const startIndex = content.indexOf(`const SidebarNavList = React.memo(function SidebarNavList({`);
if (startIndex !== -1) {
  const endIndex = content.indexOf(`export default function App() {`);
  if (endIndex !== -1) {
    content = content.substring(0, startIndex) + replacement + '\n\n' + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', content);
    console.log('Success');
  } else {
    console.log('Could not find end index');
  }
} else {
  console.log('Could not find start index');
}
