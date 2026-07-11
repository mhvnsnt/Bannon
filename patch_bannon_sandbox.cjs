const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/src/components/BannonSandbox.tsx', 'utf8');

const targetMenu = `          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setCurrentTab('arena')}
              className={\`px-4 py-2 rounded text-xs font-bold uppercase transition-all \${currentTab === 'arena' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}\`}
            >
              Sandbox Arena
            </button>
            <button
              onClick={() => setCurrentTab('roster')}
              className={\`px-4 py-2 rounded text-xs font-bold uppercase transition-all \${currentTab === 'roster' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}\`}
            >
              Roster & Slots
            </button>`;

if (code.includes('Sandbox Arena')) {
    // Already has tabs, let's inject a new one
    code = code.replace(
        "className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${currentTab === 'manifesto' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}\n            >\n              Physics Manifesto\n            </button>",
        "className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${currentTab === 'manifesto' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}\n            >\n              Physics Manifesto\n            </button>\n            <button\n              onClick={() => setCurrentTab('rigready')}\n              className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${currentTab === 'rigready' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}\n            >\n              RigReady Forge\n            </button>"
    );
}

const targetState = `  const [currentTab, setCurrentTab] = useState<'arena' | 'roster' | 'manifesto'>('arena');`;
if (code.includes(targetState)) {
    code = code.replace(targetState, `  const [currentTab, setCurrentTab] = useState<'arena' | 'roster' | 'manifesto' | 'rigready'>('arena');`);
}

const targetPanel = `          {/* RIG DYNAMIC SIM SPEED */}`;
const rigReadyPanel = `          {currentTab === 'rigready' && (
            <div className="lg:col-span-12 flex flex-col gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[580px] h-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Nexus Mesh Forge: RigReady Slots</h4>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">TRIPO3D V3 ALT PIPELINE ACTIVE</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div className="col-span-1 flex flex-col gap-2">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Target Mesh</div>
                    <select className="bg-slate-950 border border-slate-800 text-white text-xs p-2 rounded">
                      <option>BANNON_muscular.glb (Single-Mesh)</option>
                      <option>ONYX.glb (Single-Mesh)</option>
                      <option>ONYX_corset.glb (Single-Mesh)</option>
                      <option>codywrestlinggear1.glb (Single-Mesh)</option>
                    </select>
                    
                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase p-3 rounded mt-2 transition-all">
                      Execute Semantic Auto-Splitter
                    </button>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Runs the Alt Pipeline logic to automatically partition static single-mesh exports from Tripo3D into distinct, animatable structural pieces (Head, Torso, Arms, Legs).
                    </p>
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Head Slot</span>
                      <div className="h-16 bg-slate-900 border border-slate-800 border-dashed rounded flex items-center justify-center text-slate-600 text-xs font-mono">
                        [EMPTY / RIG-READY]
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Torso Slot</span>
                      <div className="h-16 bg-slate-900 border border-slate-800 border-dashed rounded flex items-center justify-center text-slate-600 text-xs font-mono">
                        [EMPTY / RIG-READY]
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Arms Slot</span>
                      <div className="h-16 bg-slate-900 border border-slate-800 border-dashed rounded flex items-center justify-center text-slate-600 text-xs font-mono">
                        [EMPTY / RIG-READY]
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded flex flex-col gap-2">
                      <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Legs Slot</span>
                      <div className="h-16 bg-slate-900 border border-slate-800 border-dashed rounded flex items-center justify-center text-slate-600 text-xs font-mono">
                        [EMPTY / RIG-READY]
                      </div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded flex flex-col gap-2 col-span-2">
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Attire Overlay Slot (Optional)</span>
                      <div className="h-12 bg-slate-900 border border-slate-800 border-dashed rounded flex items-center justify-center text-slate-600 text-xs font-mono">
                        [NO ATTIRE BOUND]
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
`;
if (code.includes(targetPanel)) {
    code = code.replace(targetPanel, rigReadyPanel + targetPanel);
}

fs.writeFileSync('/tmp/bannon2/src/components/BannonSandbox.tsx', code);
console.log("Patched BannonSandbox for RigReady tabs");
