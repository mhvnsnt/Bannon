import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, ChevronDown, 
  ChevronUp, Sliders, Play, Settings, FileCode2, GitFork, Trash2 
} from 'lucide-react';

interface ParliamentSession {
    id: string;
    session_id: string;
    project_id: string;
    timestamp: number;
    task_intent: string;
    proposer_model: string;
    critic_model: string;
    validator_model: string;
    proposal: string;
    critique_report: string;
    validation_report: string;
    revision_count: number;
    final_verdict: 'COMMIT' | 'REVISE' | 'ESCALATE';
    total_token_cost: number;
    github_issue_url: string | null;
    outcome: string;
}

export default function ParliamentViewer() {
    const [history, setHistory] = useState<ParliamentSession[]>([]);
    const [stats, setStats] = useState<any>({
        totalSessions: 12,
        approvalRate: 75.0,
        revisionRate: 16.7,
        escalationRate: 8.3,
        mostContestedTask: "grapple Move Physics",
        avgTokenCost: 0.0018,
        savingsPercentage: 83.2
    });

    const [activeTab, setActiveTab] = useState<'console' | 'history' | 'config' | 'escaped'>('console');
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationLog, setSimulationLog] = useState<string[]>([]);
    const [seatConfig, setSeatConfig] = useState({
        proposer: 'anthropic/claude-3-5-sonnet',
        critic: 'google/gemini-2.5-pro',
        validator: 'google/gemini-3.5-flash',
        profile: 'DEFAULT',
        autoSelect: true
    });

    // Fetch history and stats on load
    const fetchHistoryAndStats = () => {
        fetch('/api/parliament/history')
            .then(res => res.json())
            .then(data => {
                if (data.history) setHistory(data.history);
                if (data.stats) setStats(data.stats);
            })
            .catch(err => console.error('Failed to load parliament history:', err));
    };

    useEffect(() => {
        fetchHistoryAndStats();
        // Load default mock/active state for live console if empty
        setActiveSession({
            status: 'IDLE',
            task: "Add a new grapple move to the physics system",
            project: "BannonFighter",
            cycle: 1,
            proposer: { model: seatConfig.proposer, status: 'READY', output: '' },
            critic: { model: seatConfig.critic, status: 'READY', report: null },
            validator: { model: seatConfig.validator, status: 'READY', report: null }
        });
    }, []);

    const triggerMockSession = () => {
        setIsSimulating(true);
        setSimulationLog([]);
        
        setActiveSession({
            status: 'PROPOSING',
            task: "Add a new grapple move to the physics system",
            project: "BannonFighter",
            cycle: 1,
            proposer: { model: seatConfig.proposer, status: 'THINKING', output: '' },
            critic: { model: seatConfig.critic, status: 'WAITING', report: null },
            validator: { model: seatConfig.validator, status: 'WAITING', report: null }
        });

        setTimeout(() => {
            // STEP 1: Propose
            setActiveSession((prev: any) => ({
                ...prev,
                status: 'CRITIQUING',
                proposer: { 
                    ...prev.proposer, 
                    status: 'COMPLETE', 
                    output: `// File: src/components/GrappleMove_physics.tsx
export class GrapplePhysicsEngine {
    public applyGrappleMove(actor: any, target: any) {
        console.log("GRAVITY SNAP: Locking grapple coordinates.");
        const velocityDx = target.x - actor.x;
        const velocityDy = target.y - actor.y;
        
        // Acceleration snap phase
        const speed = 15;
        actor.vx = velocityDx * speed;
        actor.vy = velocityDy * speed;
    }
}` 
                },
                critic: { ...prev.critic, status: 'THINKING' }
            }));
            setSimulationLog(prev => [...prev, "Proposer authored original file successfully (Confidence: HIGH / Token cost: 0.0014)"]);

            setTimeout(() => {
                // STEP 2: Critique
                const criticReport = {
                    logicErrors: ["Physics frame acceleration is unaccounted for during snap phase."],
                    missingEdgeCases: ["Missing landing state check for animation cancellation."],
                    performanceIssues: ["NONE"],
                    breakingChanges: ["NONE"],
                    confidenceAssessment: "Disagrees with Proposer.",
                    verdict: 'REVISE',
                    revisionInstructions: ["Calculate physics frames accounting for acceleration snap.", "Add landing status checks during the grapple move."],
                    rejectionReason: ""
                };

                setActiveSession((prev: any) => ({
                    ...prev,
                    status: 'VALIDATING',
                    critic: { ...prev.critic, status: 'COMPLETE', report: criticReport },
                    validator: { ...prev.validator, status: 'THINKING' }
                }));
                setSimulationLog(prev => [...prev, "Critic Node Veto is cast: REVISE requested. Outstanding 2 hazards reported."]);

                setTimeout(() => {
                    // STEP 3: Validate
                    const valReport = {
                        syntaxValid: true,
                        criticIssuesAddressed: 'NO',
                        integrationSafe: true,
                        finalVerdict: 'HOLD',
                        holdReason: "Critic requested revisions for physics acceleration frame calculation.",
                        escalationReason: ""
                    };

                    setActiveSession((prev: any) => ({
                        ...prev,
                        status: 'REVISING',
                        validator: { ...prev.validator, status: 'COMPLETE', report: valReport }
                    }));
                    setSimulationLog(prev => [...prev, "Validator confirms non-destructive HOLD. Auto-triggering Revision Engine pass..."]);

                    // Run mock API on server to persist the session logic
                    fetch('/api/parliament/test-convene', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskIntent: "Add a new grapple move to the physics system", projectId: "BannonFighter" })
                    })
                    .then(res => res.json())
                    .then(data => {
                        fetchHistoryAndStats();
                        setIsSimulating(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setIsSimulating(false);
                    });

                }, 1500);
            }, 1500);
        }, 1500);
    };

    const handleEscalatedAction = (id: string, action: string) => {
        fetch('/api/parliament/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: id, action })
        })
        .then(res => res.json())
        .then(() => {
            fetchHistoryAndStats();
            alert(`Parliament override [${action}] committed successfully context.`);
        })
        .catch(err => console.error(err));
    };

    const handleProfileChange = (profile: string) => {
        const specs: any = {
            DEFAULT: { proposer: 'anthropic/claude-3-5-sonnet', critic: 'google/gemini-2.5-pro', validator: 'google/gemini-3.5-flash' },
            GAME_BUILD: { proposer: 'anthropic/claude-3-5-sonnet', critic: 'anthropic/claude-3-5-sonnet', validator: 'google/gemini-3.5-flash' },
            FAST: { proposer: 'google/gemini-3.5-flash', critic: 'google/gemini-3.5-flash', validator: 'google/gemini-3.5-flash' },
            HEAVY: { proposer: 'anthropic/claude-3-5-opus', critic: 'anthropic/claude-3-5-opus', validator: 'anthropic/claude-3-5-sonnet' }
        };
        const selected = specs[profile] || specs.DEFAULT;
        setSeatConfig(prev => ({
            ...prev,
            profile,
            ...selected
        }));
    };

    const escalatedSessions = history.filter(s => s.final_verdict === 'ESCALATE');

    return (
        <div id="parliament_viewer" className="p-6 bg-slate-950 border border-fuchsia-900/30 rounded-xl max-w-7xl mx-auto backdrop-blur-xl shadow-[0_0_50px_rgba(15,23,42,0.8)] text-slate-100 flex flex-col gap-6 font-sans">
            
            {/* Header branding */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-fuchsia-900/40 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-fuchsia-600 to-rose-600 rounded-lg text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                            <Users className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight uppercase text-fuchsia-200">The Model Parliament</h2>
                            <p className="text-xs text-fuchsia-400 font-mono tracking-wider">LAYER 12 CO-REASONING CONSENSUS ASSEMBLY</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 font-mono text-xs">
                    <button 
                        onClick={() => setActiveTab('console')} 
                        className={`px-4 py-2 rounded-lg border transition-all ${activeTab === 'console' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                    >
                        LIVE CONSOLE
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`px-4 py-2 rounded-lg border transition-all ${activeTab === 'history' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                    >
                        LAWS & LOGS ({history.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('config')} 
                        className={`px-4 py-2 rounded-lg border transition-all ${activeTab === 'config' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                    >
                        SEAT PROFILES
                    </button>
                    <button 
                        onClick={() => setActiveTab('escaped')} 
                        className={`px-4 py-2 rounded-lg border transition-all relative ${activeTab === 'escaped' ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                    >
                        ESCALATIONS
                        {escalatedSessions.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-bold tracking-widest">{escalatedSessions.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Parliament Stats Board */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-[#11051c]/40 border border-fuchsia-900/20 rounded-xl">
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">CONVENINGS</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{stats.totalSessions}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">APPROVALS</span>
                    <span className="text-xl font-bold font-mono text-green-400">{stats.approvalRate}%</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">REVISIONS</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{stats.revisionRate}%</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">VETO RATIO</span>
                    <span className="text-xl font-bold font-mono text-rose-500">{stats.escalationRate}%</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">AVG TOKEN FEE</span>
                    <span className="text-xl font-bold font-mono text-fuchsia-400">{stats.avgTokenCost}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 font-mono tracking-widest uppercase">TOKENS SAVED</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{stats.savingsPercentage}%</span>
                </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'console' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Progress Monitoring */}
                    <div className="lg:col-span-2 flex flex-col gap-5 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h3 className="text-xs uppercase font-mono tracking-wider text-rose-400 flex items-center gap-2">
                                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-fuchsia-400' : ''}`} />
                                Active Council Chamber Room
                            </h3>
                            <button 
                                onClick={triggerMockSession}
                                disabled={isSimulating}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-rose-600 hover:from-cyan-500 hover:to-rose-500 text-white text-xs font-bold rounded cursor-pointer transition-all uppercase font-mono tracking-wider disabled:opacity-40"
                            >
                                {isSimulating ? 'CONVENING SESSION...' : 'CONVENE MOCK SESSION'}
                            </button>
                        </div>

                        {/* Three Seats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs mt-2">
                            {/* Proposer */}
                            <div className="bg-slate-950 p-4 border border-cyan-900/30 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] text-cyan-400 pb-1 border-b border-cyan-900/40 font-bold">
                                    <span>SEAT 1: THE PROPOSER</span>
                                    <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 rounded uppercase">{activeSession?.proposer?.status}</span>
                                </div>
                                <div className="text-[11px] text-gray-600">{activeSession?.proposer?.model}</div>
                                <div className="mt-2 text-gray-300 leading-relaxed text-[10px]">
                                    {activeSession?.proposer?.status === 'THINKING' ? (
                                        <span className="text-cyan-500 animate-pulse">[Composing physical files. Structuring coordinates...]</span>
                                    ) : activeSession?.proposer?.output ? (
                                        <div className="bg-[#050c14] p-2 rounded text-[9px] text-emerald-400 max-h-[140px] overflow-y-auto">
                                            {activeSession.proposer.output.substring(0, 150)}...
                                        </div>
                                    ) : '[Idle pending next wave]'}
                                </div>
                            </div>

                            {/* Critic */}
                            <div className="bg-slate-950 p-4 border border-amber-900/30 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] text-amber-400 pb-1 border-b border-amber-900/40 font-bold">
                                    <span>SEAT 2: THE CRITIC</span>
                                    <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 rounded uppercase">{activeSession?.critic?.status}</span>
                                </div>
                                <div className="text-[11px] text-gray-600">{activeSession?.critic?.model}</div>
                                <div className="mt-2 text-gray-300 leading-relaxed text-[10px]">
                                    {activeSession?.critic?.status === 'THINKING' ? (
                                        <span className="text-amber-500 animate-pulse">[Simultaneously analyzing for logic hazards...]</span>
                                    ) : activeSession?.critic?.report ? (
                                        <div className="space-y-1 bg-[#140f05] p-2 rounded text-[9px] text-amber-200">
                                            <div>Verdict: <span className="font-bold text-rose-400">{activeSession.critic.report.verdict}</span></div>
                                            <div>Hazards: {activeSession.critic.report.logicErrors.length} detected.</div>
                                        </div>
                                    ) : '[Idle pending proposal review]'}
                                </div>
                            </div>

                            {/* Validator */}
                            <div className="bg-slate-950 p-4 border border-rose-900/30 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] text-rose-400 pb-1 border-b border-rose-900/40 font-bold">
                                    <span>SEAT 3: THE VALIDATOR</span>
                                    <span className="px-1.5 py-0.5 bg-rose-950 text-rose-400 rounded uppercase">{activeSession?.validator?.status}</span>
                                </div>
                                <div className="text-[11px] text-gray-600">{activeSession?.validator?.model}</div>
                                <div className="mt-2 text-gray-300 leading-relaxed text-[10px]">
                                    {activeSession?.validator?.status === 'THINKING' ? (
                                        <span className="text-rose-500 animate-pulse">[Veto analysis active. Sizing risk factors...]</span>
                                    ) : activeSession?.validator?.report ? (
                                        <div className="space-y-1 bg-[#14050a] p-2 rounded text-[9px] text-rose-400 font-bold">
                                            <div>Decision: {activeSession.validator.report.finalVerdict}</div>
                                            <div>Reason: <span className="font-normal text-rose-300">{activeSession.validator.report.holdReason || 'Passed safety matrix.'}</span></div>
                                        </div>
                                    ) : '[Idle pending decision parameters]'}
                                </div>
                            </div>
                        </div>

                        {/* Verdict Output Area */}
                        {activeSession?.status === 'REVISING' && (
                            <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-lg flex flex-col gap-2">
                                <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    VERDICT REACHED: REVISE (Cycle 1 concluded)
                                </span>
                                <p className="text-[11px] text-amber-200">
                                    Proposer's solution was held because of unresolved coordinate calculations. The RevisionEngine has auto-generated a targeted revision prompt to re-trigger the Proposer immediately.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Simulation logs panel */}
                    <div className="flex flex-col gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                        <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-gray-500">Live Council Logs</h3>
                        <div className="flex-1 bg-slate-950 p-4 rounded-lg font-mono text-[10px] space-y-2 overflow-y-auto max-h-[300px] text-cyan-300 custom-scrollbar">
                            {simulationLog.length === 0 ? (
                                <div className="text-gray-500 italic">[Awaiting session initiation command]</div>
                            ) : (
                                simulationLog.map((log, idx) => (
                                    <div key={idx} className="pb-1.5 border-b border-cyan-950/40">
                                        <span className="text-fuchsia-500">[{new Date().toLocaleTimeString()}]</span> {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Session Grid List */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-600 font-mono border border-fuchsia-900/10 rounded-lg">
                                No historical council sessions preserved in database.
                            </div>
                        ) : (
                            history.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className={`p-3.5 bg-slate-900 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${selectedSessionId === session.id ? 'border-cyan-500 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-fuchsia-400 capitalize">{session.project_id}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${session.final_verdict === 'COMMIT' ? 'bg-green-950 text-green-300' : 'bg-rose-950 text-rose-300'}`}>
                                            {session.final_verdict}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-bold text-gray-200 truncate">{session.task_intent}</div>
                                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 pt-1">
                                        <span>Cycles: {session.revision_count}</span>
                                        <span>Cost: {session.total_token_cost.toFixed(5)} tokens</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Expanded details view */}
                    <div className="flex-1 bg-slate-900/60 p-5 rounded-xl border border-slate-800 min-h-[400px]">
                        {selectedSessionId ? (
                            (() => {
                                const s = history.find(item => item.id === selectedSessionId);
                                if (!s) return null;
                                return (
                                    <div className="flex flex-col gap-4 font-mono text-xs">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                            <div>
                                                <div className="text-[10px] text-gray-400">{s.session_id}</div>
                                                <h4 className="text-sm font-bold text-gray-200 capitalize mt-1">Project: {s.project_id}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500">{new Date(s.timestamp).toLocaleString()}</div>
                                                <div className="text-[11px] font-bold text-cyan-400 mt-1">Cost: {s.total_token_cost.toFixed(5)} FEE</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <span className="block text-[10px] uppercase font-bold text-rose-400 mb-1">TASK CONTEXT INTENT</span>
                                                <p className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-gray-300 leading-relaxed text-[11px]">
                                                    {s.task_intent}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-cyan-400 mb-1">COUNCIL COMPOSITION</span>
                                                    <div className="bg-[#050a14] p-3 rounded space-y-1 text-cyan-200">
                                                        <div>Proposer: <span className="text-gray-400">{s.proposer_model}</span></div>
                                                        <div>Critic: <span className="text-gray-400">{s.critic_model}</span></div>
                                                        <div>Validator: <span className="text-gray-400">{s.validator_model}</span></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">COMMITTED OUTCOME</span>
                                                    <div className="bg-[#05140b] p-3 rounded text-emerald-300 leading-relaxed">
                                                        {s.outcome}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="block text-[10px] uppercase font-bold text-fuchsia-400 mb-1">PROPOSAL METRIC PREVIEW</span>
                                                <div className="bg-slate-950 p-3 rounded max-h-[160px] overflow-y-auto text-[10px] text-amber-400 border border-slate-900 custom-scrollbar">
                                                    <pre>{s.proposal}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-gray-600 font-mono italic">
                                Select a preserved Session Log to run decryption analysis
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col gap-4 font-mono text-xs">
                        <h3 className="text-xs uppercase font-bold text-cyan-400 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-cyan-400" />
                            Model Seat Assignments
                        </h3>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-gray-500 text-[10px] uppercase tracking-wider">Parliament Profile Preset</label>
                                <select 
                                    value={seatConfig.profile}
                                    onChange={(e) => handleProfileChange(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer text-cyan-300"
                                >
                                    <option value="DEFAULT">DEFAULT (Claude Proposer / Gemini Critic)</option>
                                    <option value="GAME_BUILD">GAME_BUILD (Dual Claude Council Chambers)</option>
                                    <option value="FAST">FAST (Flash Swarm Consensus)</option>
                                    <option value="HEAVY">HEAVY (Full Claude 3.5 Opus Matrix)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-gray-500 uppercase">Proposer</span>
                                    <input 
                                        type="text" 
                                        value={seatConfig.proposer} 
                                        onChange={(e) => setSeatConfig(prev => ({ ...prev, proposer: e.target.value }))}
                                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] focus:outline-none" 
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-gray-500 uppercase">Critic</span>
                                    <input 
                                        type="text" 
                                        value={seatConfig.critic} 
                                        onChange={(e) => setSeatConfig(prev => ({ ...prev, critic: e.target.value }))}
                                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] focus:outline-none" 
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-gray-500 uppercase">Validator</span>
                                    <input 
                                        type="text" 
                                        value={seatConfig.validator} 
                                        onChange={(e) => setSeatConfig(prev => ({ ...prev, validator: e.target.value }))}
                                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] focus:outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input 
                                    type="checkbox" 
                                    id="autoSelect" 
                                    checked={seatConfig.autoSelect} 
                                    onChange={(e) => setSeatConfig(prev => ({ ...prev, autoSelect: e.target.checked }))}
                                    className="rounded border-slate-800 bg-slate-950 text-cyan-600 focus:ring-cyan-500 focus:ring-opacity-50 cursor-pointer"
                                />
                                <label htmlFor="autoSelect" className="text-gray-400 text-[10px] uppercase cursor-pointer">Auto-select profile based on keyword semantics</label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col gap-4 font-mono text-xs">
                        <h3 className="text-xs uppercase font-bold text-gray-500">Live Cost Meter Estimator</h3>
                        <p className="text-gray-400 leading-relaxed text-[11px]">
                            Current Parliament compose costs about **0.0018 FEE** per convened turn. By routing payloads through the Void Compression Engine first, token weight was structuralized by **83.2%**, saving **0.0150 FEE** per execution slot.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'escaped' && (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <h3 className="text-xs uppercase font-mono tracking-wider text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            Autonomous Exception Escalation Queue
                        </h3>
                    </div>

                    {escalatedSessions.length === 0 ? (
                        <div className="p-12 text-center text-xs text-gray-600 font-mono border border-fuchsia-900/10 rounded-lg">
                            Safe and clear. No unaligned sessions are holding state.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {escalatedSessions.map(session => (
                                <div key={session.id} className="p-5 bg-[#1a0c10] border border-rose-950/80 rounded-xl flex flex-flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1 flex flex-col gap-1.5 font-mono text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 bg-rose-950 text-rose-400 rounded text-[9px] font-bold">ESCALATED CYCLE {session.revision_count}</span>
                                            <span className="text-gray-400">{session.session_id}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-200 mt-1">{session.task_intent}</h4>
                                        <p className="text-[10px] text-rose-300 leading-relaxed mt-1">
                                            Reason: {session.outcome}
                                        </p>
                                        {session.github_issue_url && (
                                            <a 
                                                href={session.github_issue_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-1.5 mt-2"
                                            >
                                                <GitFork className="w-3 h-3" />
                                                Review GitHub Issue: {session.github_issue_url}
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-end gap-2.5 font-mono text-[10px]">
                                        <button 
                                            onClick={() => handleEscalatedAction(session.session_id, 'APPROVE')}
                                            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-bold cursor-pointer uppercase transition-all"
                                        >
                                            HUMAN COMMIT
                                        </button>
                                        <button 
                                            onClick={() => handleEscalatedAction(session.session_id, 'RETRY')}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-white font-bold cursor-pointer uppercase transition-all"
                                        >
                                            RE-SESSION (HEAVY)
                                        </button>
                                        <button 
                                            onClick={() => handleEscalatedAction(session.session_id, 'REJECT')}
                                            className="px-4 py-2 bg-rose-900 hover:bg-rose-800 rounded text-slate-200 font-bold cursor-pointer uppercase transition-all"
                                        >
                                            ABANDON TASK
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
