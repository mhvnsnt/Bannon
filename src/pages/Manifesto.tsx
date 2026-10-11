import React, { useState, useEffect } from 'react';
import { FileText, Cpu, Shield, Zap, Sparkles, Code2, BookOpen, Layers, GitBranch, Terminal, Search, Database, RefreshCw, Layers3, Play } from 'lucide-react';
import { manifesto, RegistryItem } from '../lib/manifesto';

interface Section {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export default function Manifesto() {
  const [activeTab, setActiveTab] = useState('ue5-cpp');
  
  // Registry search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchResults, setSearchResults] = useState<RegistryItem[]>([]);
  
  // Terminal states
  const [consoleInput, setConsoleInput] = useState('window.MANIFESTO.query("combat")');
  const [consoleOutput, setConsoleOutput] = useState<string>('// Enter query and click Run\n// Try typing: window.MANIFESTO.query("ragdoll")');

  // Load and refresh results
  useEffect(() => {
    const results = manifesto.query(searchTerm);
    if (typeFilter === 'All') {
      setSearchResults(results);
    } else {
      setSearchResults(results.filter(item => item.type.toLowerCase().includes(typeFilter.toLowerCase())));
    }
  }, [searchTerm, typeFilter]);

  const runConsoleQuery = () => {
    try {
      if (consoleInput.trim() === 'window.MANIFESTO.list()') {
        setConsoleOutput(JSON.stringify(manifesto.list(), null, 2));
      } else if (consoleInput.startsWith('window.MANIFESTO.query(')) {
        // Extract query arg
        const match = consoleInput.match(/query\(['"](.*)['"]\)/);
        if (match) {
          const queryTerm = match[1];
          const results = manifesto.query(queryTerm);
          setConsoleOutput(`// Found ${results.length} matches for "${queryTerm}"\n` + JSON.stringify(results, null, 2));
        } else {
          setConsoleOutput('// Error: Invalid query syntax. Use: window.MANIFESTO.query("keyword")');
        }
      } else {
        // Evaluate simple search term or guide
        const results = manifesto.query(consoleInput);
        setConsoleOutput(`// Evaluated as search for: "${consoleInput}"\n// Found ${results.length} matches\n` + JSON.stringify(results, null, 2));
      }
    } catch (err: any) {
      setConsoleOutput(`// Error: ${err?.message || err}`);
    }
  };

  const sections: Section[] = [
    {
      id: 'ue5-cpp',
      title: '1. UE5 & Native C++',
      icon: Cpu,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Cpu className="w-6 h-6" />
              <h3 className="font-bold text-lg">Unreal Engine 5 and C++ Transition</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              The Bannon Engine has undergone a complete structural evolution. This project is no longer a single-page HTML or browser-bound application. All core gameplay loops, collision matrices, skeletal animations, character psychology runtimes, and rendering pipelines are natively built using <strong className="text-white">Unreal Engine 5 and Object-Oriented C++</strong>.
            </p>
            <div className="bg-neutral-950/80 p-4 border-l-4 border-indigo-500 rounded-r-md text-xs text-neutral-400">
              <span className="font-bold text-neutral-200">The Legacy Exception:</span> To respect the origins of the engine, the legacy 25,000-line Three.js "Brick System" is officially deprecated. A lightweight Three.js subset remains active exclusively for browser legacy arena preview widgets, attire design texture maps, and model viewport previews.
            </div>
          </div>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Code2 className="w-6 h-6" />
              <h3 className="font-bold text-lg">Core C++ Architecture Declarations</h3>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Base Creation Category Enum</h4>
              <pre className="p-4 bg-neutral-950 text-neutral-300 font-mono text-xs rounded-lg overflow-x-auto border border-neutral-800">
{`UENUM(BlueprintType)
enum class ECreationCategory : uint8
{
    Superstar_Body,
    Superstar_Face,
    Superstar_Hair,
    Superstar_Torso,
    Superstar_Masks,
    Superstar_Clothing,
    Superstar_Accessories,
    Moveset_Library,
    Arena_Barricade,
    Arena_Ramp,
    Arena_Tron,
    Entrance_Sequence
};`}
              </pre>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'physics',
      title: '2. Combat Physics',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Zap className="w-6 h-6" />
              <h3 className="font-bold text-lg">Active Ragdolls & Interceptive Air-Collisions</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              Inspired by the visceral weight of Steve Masson's <em>Neckbreaker: Visceral Pro Wrestling</em> and the realistic physics modeling of classic <em>UFC</em> and <em>Fight Night</em> engines, Bannon Engine deploys an <strong className="text-white">Active Ragdoll Physics System</strong>:
            </p>
            <ul className="space-y-3 text-sm text-neutral-400 list-disc pl-5">
              <li>
                <strong className="text-neutral-200">Non-Canned Hit Reactions:</strong> Upon receiving high-impact moves, characters transition dynamically into active ragdoll simulations, blending skeletal animation keys with physics constraints.
              </li>
              <li>
                <strong className="text-neutral-200">Interceptive Strikes (Falling Physics):</strong> Players can strike opponents out of mid-air during dives or falls. The engine calculates localized momentum vectors, skeletal torque, and impact forces to alter the trajectory dynamically.
              </li>
              <li>
                <strong className="text-neutral-200">Environmental Collisions:</strong> Characters thrown into barricades, ropes, ring posts, or steel steps collide with real-time physical constraints, creating realistic deformities and limp body reactions.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'creation-suite',
      title: '3. Creation Suite Blueprint',
      icon: Layers,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Layers className="w-6 h-6" />
              <h3 className="font-bold text-lg">WWE 2K Style Modular Architecture</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              The Bannon Creation Suite is modeled after the industrial-standard modular layout of modern wrestling games:
            </p>
            <ul className="space-y-3 text-sm text-neutral-400 list-disc pl-5">
              <li>
                <strong className="text-neutral-200">FCreationItemRow Registry:</strong> A structured DataTable driving all mesh references, unlock states, subcategory tags, and exclusive slot index limits.
              </li>
              <li>
                <strong className="text-neutral-200">GORO_RIG Layer Bindings:</strong> Drives dynamic skeletal bone-scaling transformations within a custom AnimInstance, mapped directly from client's sliders: <code className="text-indigo-300 font-mono text-xs bg-neutral-950 px-1 py-0.5 rounded">Head_Size</code>, <code className="text-indigo-300 font-mono text-xs bg-neutral-950 px-1 py-0.5 rounded">Neck_Width</code>, <code className="text-indigo-300 font-mono text-xs bg-neutral-950 px-1 py-0.5 rounded">Chest_Scale</code>, etc.
              </li>
              <li>
                <strong className="text-neutral-200">Dynamic Layering & Color Overrides:</strong> Fully supports stacked facepaint, makeup, masks, and accessories utilizing material instance dynamics for real-time visual parameters.
              </li>
            </ul>
          </div>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Unreal Struct: FCreationItemRow</h4>
            <pre className="p-4 bg-neutral-950 text-neutral-300 font-mono text-xs rounded-lg overflow-x-auto border border-neutral-800">
{`USTRUCT(BlueprintType)
struct FCreationItemRow : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    FName ItemID;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    ECreationCategory Category;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    FName Subcategory;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    FText DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    TSoftObjectPtr<UTexture2D> ThumbnailIcon;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    TSoftObjectPtr<UObject> AssetRef;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    EUnlockState UnlockState;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    int32 SlotIndex;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    bool bAllowsLayering;
};`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'agent-loop',
      title: '4. Dual-Agent & PE Loop',
      icon: GitBranch,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <GitBranch className="w-6 h-6" />
              <h3 className="font-bold text-lg">Dual-Layer Agent Architecture</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              Our development and synchronization flows utilize a dual-layer AI agent architecture paired with a strict proactive execution loop to guarantee system-wide integrity:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-neutral-200 text-sm mb-2">1. Orchestration Layer</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Collects React state, coordinates OAuth/database operations, registers webhooks (e.g. Telegram Bot), and maps live-link payloads.
                </p>
              </div>
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <h4 className="font-bold text-neutral-200 text-sm mb-2">2. Execution Layer</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Compiles native Unreal Engine code, parses psychology JSON, executes the 4-axis Finite State Machine (FSM), and drives the stamina-constrained active gameplay.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Terminal className="w-6 h-6" />
              <h3 className="font-bold text-lg">Proactive Execution Loop (PE Loop)</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              Before writing any code or updating any C++ headers/source files, the AI agent is bound to run a Codebase Awareness Check:
            </p>
            <ul className="space-y-3 text-sm text-neutral-400 list-decimal pl-5">
              <li>
                <strong className="text-neutral-200">Search First (DRY Verification):</strong> Execute strict searches to identify preexisting functions, classes, and structs across the directories.
              </li>
              <li>
                <strong className="text-neutral-200">Redundancy Interception:</strong> If a requested system already exists, do not duplicate. Refactor, extend, or bind directly to the existing codebase.
              </li>
              <li>
                <strong className="text-neutral-200">Verification Gate:</strong> Any edit must pass linter validation (`tsc --noEmit`) and C++ compile validation before it is labeled as complete.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'sequencing',
      title: '5. Sequencing & Anchors',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Sparkles className="w-6 h-6" />
              <h3 className="font-bold text-lg">Next Executing Sequence Protocol</h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              In accordance with the project rules, all development must maintain the <strong className="text-white">Bannon Repo Anchor</strong>:
            </p>
            <ul className="space-y-3 text-sm text-neutral-400 list-disc pl-5">
              <li>
                <strong className="text-neutral-200 font-mono">Bannon Repo Anchor:</strong> Never output historical summaries, AKI-era comparisons, or theoretical game design mechanics. Focus strictly on active technical integration, relative code modifications, and Unreal Engine bindings.
              </li>
              <li>
                <strong className="text-neutral-200">Next Executing Sequence:</strong> Every single agent response MUST conclude with a clear, structured section titled <code>NEXT EXECUTING SEQUENCE</code> listing the file paths, line ranges, and exact technical steps for the next sequence of operations.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'queryable-registry',
      title: '6. Queryable Registry',
      icon: Database,
      content: (
        <div className="space-y-6">
          {/* Section description */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-indigo-400">
                <Database className="w-6 h-6 text-indigo-500 animate-pulse" />
                <h3 className="font-bold text-lg">Bannon Engine Live Subsystem Registry</h3>
              </div>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-1 rounded">
                window.MANIFESTO Active
              </span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-sm">
              To prevent redundant development of C++ enums, subsystems, or client UI components, this **Queryable Registry** serves as the canonical index. Every core sub-routine or data structure is registered here and is queryable at runtime both by engineers and AI autonomous coding loops.
            </p>
            <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>Import: <code className="text-neutral-200">import {`{ manifesto }`} from '../lib/manifesto';</code></span>
              <span>Usage: <code className="text-indigo-400">window.MANIFESTO.query("combat")</code></span>
            </div>
          </div>

          {/* Explorer Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search and Filters List */}
            <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search systems, files, keywords (e.g. ragdoll, sliders)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Enum">C++ Enum</option>
                  <option value="Struct">C++ Struct</option>
                  <option value="Component">Physics/Component</option>
                  <option value="Engine">Combat/Skeletal</option>
                </select>
              </div>

              {/* Matching Count */}
              <div className="text-xs text-neutral-400 flex items-center justify-between">
                <span>Showing {searchResults.length} systems in registry</span>
                <span className="text-neutral-500">Baseline sync: manifesto-registry.json</span>
              </div>

              {/* Subsystems Stack */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {searchResults.map((item) => (
                  <div key={item.id} className="p-4 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          {item.name}
                          <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            {item.type}
                          </span>
                        </h4>
                        <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{item.cpp_header || item.file}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded shrink-0">
                        {item.id}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.keywords.map(kw => (
                        <span key={kw} className="text-[9px] font-mono bg-indigo-950/40 text-indigo-400 px-1.5 py-0.5 rounded">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="py-8 text-center text-neutral-500 text-sm">
                    No registered systems matched your search criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Live Console */}
            <div className="lg:col-span-5 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-sm text-white">Interactive Registry Terminal</h4>
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Enter queries or list requests directly to search the live registry map.
                </p>

                {/* Preset suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setConsoleInput('window.MANIFESTO.query("ragdoll")')}
                    className="text-[9px] font-mono bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-1.5 py-1 rounded border border-neutral-800"
                  >
                    query("ragdoll")
                  </button>
                  <button 
                    onClick={() => setConsoleInput('window.MANIFESTO.query("moveset")')}
                    className="text-[9px] font-mono bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-1.5 py-1 rounded border border-neutral-800"
                  >
                    query("moveset")
                  </button>
                  <button 
                    onClick={() => setConsoleInput('window.MANIFESTO.list()')}
                    className="text-[9px] font-mono bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-1.5 py-1 rounded border border-neutral-800"
                  >
                    list()
                  </button>
                </div>

                {/* Command Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    className="flex-1 bg-neutral-950 font-mono text-xs text-indigo-300 border border-neutral-800 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={runConsoleQuery}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Run
                  </button>
                </div>

                {/* Command Output Terminal Panel */}
                <div className="flex-1 min-h-[160px] bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[10px] text-neutral-400 overflow-y-auto whitespace-pre">
                  {consoleOutput}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-full bg-neutral-900 text-neutral-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3 text-indigo-400 mb-1">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs font-mono uppercase tracking-widest">SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Bannon Project Manifesto</h2>
          <p className="text-neutral-400 text-xs">Official blueprint, enums, data structures, and developer protocols.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-950 p-2 border border-neutral-800 rounded-lg text-xs text-neutral-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Status: Verified Active Architecture</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium transition-colors ${
                  activeTab === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-950/50 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 min-h-[500px]">
          {sections.find((s) => s.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
}
