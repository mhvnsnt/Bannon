import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Shield, Terminal, Zap, Layers, RefreshCw, Sparkles, 
    Trash2, Save, FileCode2, Radar, TrendingUp, AlertTriangle, Eye, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar } from 'recharts';

const MotionDiv = motion.div as any;

interface CurationProfile {
    projectId: string;
    projectName: string;
    tone: {
        descriptors: string[];
        antiDescriptors: string[];
        exampleFunctionNames: string[];
        exampleVariableNames: string[];
        exampleUIcopy: string[];
    };
    complexityCeiling: {
        maxFunctionLines: number;
        minFunctionLines: number;
        maxFileLines: number;
        warningThreshold: number;
    };
    patternLanguage: {
        requiredPatterns: string[];
        allowedPatterns: string[];
        forbiddenPatterns: string[];
    };
    namingConventions: {
        prefixes: string[];
        suffixes: string[];
        caseStyle: string;
        exampleNames: string[];
        antiNames: string[];
    };
    soulKeywords: string[];
    antiKeywords: string[];
}

interface CurationLedgerEntry {
    id: string;
    timestamp: number;
    project_id: string;
    session_id: string;
    task_intent: string;
    tone_score: number;
    complexity_score: number;
    pattern_score: number;
    naming_score: number;
    soul_score: number;
    total_score: number;
    passed: boolean;
    flags: string; // JSON
    revision_count: number;
    final_outcome: string;
    token_cost: number;
}

export default function CurationDashboard() {
    const [profiles, setProfiles] = useState<CurationProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<CurationProfile | null>(null);
    const [stats, setStats] = useState<any>({
        totalCuratedCount: 0,
        firstPassRate: 100,
        averageScores: { tone: 100, complexity: 100, pattern: 100, naming: 100, soul: 100 },
        failureReasons: ["None"],
        averageRevisions: 0,
        blockedPermanently: 0
    });
    const [ledger, setLedger] = useState<CurationLedgerEntry[]>([]);
    const [soulMap, setSoulMap] = useState<any[]>([]);
    const [selectedMapFile, setSelectedMapFile] = useState<any | null>(null);
    const [emergingCandidates, setEmergingCandidates] = useState<string[]>([]);
    const [driftDetails, setDriftDetails] = useState<string[]>([]);

    // Edit states for the profiles
    const [editMode, setEditMode] = useState(false);
    const [soulInputs, setSoulInputs] = useState('');
    const [antiInputs, setAntiInputs] = useState('');
    const [forbiddenInputs, setForbiddenInputs] = useState('');

    const loadDashboardData = () => {
        // Fetch profiles lists
        fetch('/api/curation/profiles')
            .then(res => res.json())
            .then(data => {
                setProfiles(data);
                if (data.length > 0 && !selectedProfile) {
                    setSelectedProfile(data[0]);
                }
            })
            .catch(err => console.error('Failed to load curation profiles:', err));

        // Fetch ledger history
        fetch('/api/curation/ledger')
            .then(res => res.json())
            .then(data => setLedger(data))
            .catch(err => console.error('Failed to load curation ledger:', err));

        // Fetch curation stats analytics
        fetch('/api/curation/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Failed to load statistics:', err));
    };

    useEffect(() => {
        loadDashboardData();
        const t = setInterval(loadDashboardData, 15000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!selectedProfile) return;
        
        // Fetch specific soulMap density lists
        fetch(`/api/curation/soulmap?projectId=${selectedProfile.projectId}`)
            .then(res => res.json())
            .then(data => setSoulMap(data))
            .catch(err => console.error('Error fetching soulmap:', err));

        // Fetch emerging candidated keywords & drift
        fetch(`/api/curation/drifts?projectId=${selectedProfile.projectId}`)
            .then(res => res.json())
            .then(data => {
                setEmergingCandidates(data.candidates || []);
                setDriftDetails(data.driftDetails || []);
            })
            .catch(err => console.error('Drift checking error:', err));

        // Configure profile editing defaults
        setSoulInputs(selectedProfile.soulKeywords.join(', '));
        setAntiInputs(selectedProfile.antiKeywords.join(', '));
        setForbiddenInputs(selectedProfile.patternLanguage.forbiddenPatterns.join(', '));

    }, [selectedProfile]);

    const handleSaveProfile = () => {
        if (!selectedProfile) return;

        const updatedProfile = {
            ...selectedProfile,
            soulKeywords: soulInputs.split(',').map(s => s.trim()).filter(Boolean),
            antiKeywords: antiInputs.split(',').map(s => s.trim()).filter(Boolean),
            patternLanguage: {
                ...selectedProfile.patternLanguage,
                forbiddenPatterns: forbiddenInputs.split(',').map(s => s.trim()).filter(Boolean)
            }
        };

        fetch('/api/curation/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setEditMode(false);
                loadDashboardData();
                setSelectedProfile(updatedProfile);
            }
        })
        .catch(err => console.error('Failed to save profile:', err));
    };

    const handleApproveKeyword = (word: string) => {
        if (!selectedProfile) return;
        const keywords = [...new Set([...selectedProfile.soulKeywords, word])];
        
        fetch('/api/curation/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...selectedProfile,
                soulKeywords: keywords
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setSelectedProfile({
                    ...selectedProfile,
                    soulKeywords: keywords
                });
                loadDashboardData();
            }
        })
        .catch(err => console.error('Failed to approve keyword:', err));
    };

    // Radar stats configuration
    const radarData = [
        { subject: 'Tone', A: stats.averageScores.tone },
        { subject: 'Complexity', A: stats.averageScores.complexity },
        { subject: 'Pattern Language', A: stats.averageScores.pattern },
        { subject: 'Naming Conventions', A: stats.averageScores.naming },
        { subject: 'Soul Alignment', A: stats.averageScores.soul }
    ];

    return (
        <div className="flex flex-col p-8 w-full h-full overflow-y-auto bg-[#010003] text-gray-200 font-mono relative custom-scrollbar">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4a044e]/10 via-[#010003]/85 to-[#010003] pointer-events-none" />
            
            {/* Top Amber-Pink Energy line */}
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 via-[#d946ef] to-pink-500 shadow-[0_0_20px_#d946ef] opacity-70" />

            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full relative z-10 pb-20">
                
                <div className="flex items-center justify-between border-b border-fuchsia-950 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-fuchsia-950 border border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.3)] rounded-lg">
                            <Layers className="text-fuchsia-400 w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-widest text-white uppercase flex items-center gap-2">
                                Curation <span className="text-fuchsia-400 font-light font-sans">Engine</span>
                            </h1>
                            <p className="text-xs text-fuchsia-500/60 uppercase tracking-widest font-mono">
                                Layer 14 — Naming, Patterns, Tone & Soul Alignment Filters
                            </p>
                        </div>
                    </div>

                    {/* SELECT PROFILE CONTROL */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Profile Sector:</span>
                        <select 
                            value={selectedProfile?.projectId || ''} 
                            onChange={(e) => {
                                const found = profiles.find(p => p.projectId === e.target.value);
                                if (found) setSelectedProfile(found);
                            }}
                            className="bg-[#11051c] text-fuchsia-300 border border-fuchsia-900/50 rounded px-3 py-1.5 text-xs font-mono focus:outline-none cursor-pointer focus:border-fuchsia-400"
                        >
                            {profiles.map(p => (
                                <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* THREE PILLAR METRICS PANEL CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#110521]/30 border border-fuchsia-950 p-5 rounded-xl flex items-center justify-between col-span-1 shadow-lg">
                        <div>
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Aggregate Scores</span>
                            <div className="text-xl font-bold text-white mt-1 uppercase">Vibe Fingerprint</div>
                        </div>
                        <RadarChart cx={45} cy={45} outerRadius={32} width={100} height={100} data={radarData}>
                            <PolarGrid stroke="#f43f5e" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={false} />
                            <RechartsRadar name="Curation" dataKey="A" stroke="#d946ef" fill="#d946ef" fillOpacity={0.3} />
                        </RadarChart>
                    </div>

                    <div className="bg-[#110521]/30 border border-fuchsia-950 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Total Checked Files</span>
                        <span className="text-3xl font-black text-white mt-1">{stats.totalCuratedCount}</span>
                        <span className="text-[9px] text-fuchsia-500 mt-1 uppercase tracking-wider font-bold">First Pass Acceptance: {stats.firstPassRate}%</span>
                    </div>

                    <div className="bg-[#110521]/30 border border-fuchsia-950 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Average Revision Cycles</span>
                        <span className="text-3xl font-black text-white mt-1">{stats.averageRevisions}</span>
                        <span className="text-[9px] text-[#f43f5e] mt-1 uppercase tracking-wider font-bold">Permanent Disqualify: {stats.blockedPermanently}</span>
                    </div>

                    <div className="bg-[#110521]/30 border border-fuchsia-950 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Tone Drift Breaches</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {stats.failureReasons.map((r: string, idx: number) => (
                                <span key={idx} className="bg-[#3b0764] text-red-300 text-[8px] uppercase tracking-normal px-1.5 py-0.5 rounded border border-red-500/25">
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* GRAPHIC SOULMAP AND ACTIVE PROFILES EDITORS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT GRAPHICS: EDIT SECTOR PROFILE, CANDIDATE APPROVAL */}
                    <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8">
                        
                        {/* THE PROFILE PROFILE EDITOR PANEL */}
                        <div className="bg-[#0b0312]/60 border border-fuchsia-950 rounded-xl p-6 flex flex-col gap-5 shadow-xl">
                            <div className="flex items-center justify-between border-b border-fuchsia-950 pb-3">
                                <span className="text-xs uppercase font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-fuchsia-400" /> Layer Profile Parameters Editor
                                </span>
                                <button
                                    onClick={() => {
                                        if (editMode) {
                                            handleSaveProfile();
                                        } else {
                                            setEditMode(true);
                                        }
                                    }}
                                    className="px-3.5 py-1.5 bg-fuchsia-950 border border-fuchsia-400/50 hover:bg-fuchsia-900 text-fuchsia-300 hover:text-white rounded-lg text-[9px] uppercase font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    {editMode ? <Save className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                    {editMode ? 'Save Alignments' : 'Modify Parameters'}
                                </button>
                            </div>

                            {selectedProfile && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <span className="text-gray-500 uppercase tracking-wider font-bold">Resonating Tone Descriptors</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {selectedProfile.tone.descriptors.map(d => (
                                                    <span key={d} className="bg-fuchsia-950/40 border border-fuchsia-500/30 px-2 py-0.5 rounded text-[10px] text-fuchsia-300 font-mono lowercase">{d}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 uppercase tracking-wider font-bold">Prohibited Anti Tone Terms</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {selectedProfile.tone.antiDescriptors.map(d => (
                                                    <span key={d} className="bg-red-950/40 border border-red-500/25 px-2 py-0.5 rounded text-[10px] text-red-400 font-mono lowercase">{d}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAILED STRING EDITOR FOR PROFILE PATTERNS */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-gray-500 uppercase tracking-wider font-bold">SOUL RESONATING KEYWORDS (Comma Separated)</span>
                                            {editMode ? (
                                                <textarea 
                                                    value={soulInputs} 
                                                    onChange={e => setSoulInputs(e.target.value)}
                                                    className="w-full bg-black border border-fuchsia-900/60 p-2.5 text-[10px] rounded focus:outline-none focus:border-fuchsia-400 text-fuchsia-300 h-20 font-mono"
                                                />
                                            ) : (
                                                <div className="bg-black/40 border border-fuchsia-950 p-2.5 rounded max-h-[85px] overflow-y-auto custom-scrollbar flex flex-wrap gap-1">
                                                    {selectedProfile.soulKeywords.map(k => (
                                                        <span key={k} className="bg-[#121c22] text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">{k}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 uppercase tracking-wider font-bold">PROHIBITED ANTI-KEYWORDS</span>
                                                {editMode ? (
                                                    <input 
                                                        type="text" 
                                                        value={antiInputs} 
                                                        onChange={e => setAntiInputs(e.target.value)}
                                                        className="w-full bg-black border border-fuchsia-900/60 p-2 text-[10px] rounded focus:outline-none focus:border-fuchsia-400 text-fuchsia-300 font-mono"
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-1 p-2 bg-black/40 border border-fuchsia-950 rounded">
                                                        {selectedProfile.antiKeywords.length === 0 ? '- None -' : selectedProfile.antiKeywords.map(k => (
                                                            <span key={k} className="bg-red-950/40 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] lowercase">{k}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 uppercase tracking-wider font-bold">FORBIDDEN PATTERNS</span>
                                                {editMode ? (
                                                    <input 
                                                        type="text" 
                                                        value={forbiddenInputs} 
                                                        onChange={e => setForbiddenInputs(e.target.value)}
                                                        className="w-full bg-black border border-fuchsia-900/60 p-2 text-[10px] rounded focus:outline-none focus:border-fuchsia-400 text-fuchsia-300 font-mono"
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-1 p-2 bg-black/40 border border-fuchsia-950 rounded">
                                                        {selectedProfile.patternLanguage.forbiddenPatterns.length === 0 ? '- None -' : selectedProfile.patternLanguage.forbiddenPatterns.map(p => (
                                                            <span key={p} className="bg-amber-950/40 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">{p}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* CORE VISUAL RESONATING SOUL MAP GRID */}
                        <div className="bg-[#0b0312]/60 border border-fuchsia-950 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
                            <span className="text-xs uppercase font-bold text-white flex items-center gap-2 border-b border-fuchsia-950 pb-3">
                                <Radar className="w-4 h-4 text-fuchsia-400" /> Space Core Soul Map Visualizer
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    {soulMap.map((file, i) => (
                                        <div 
                                            key={file.filepath || i}
                                            onClick={() => setSelectedMapFile(selectedMapFile?.filepath === file.filepath ? null : file)}
                                            className="flex items-center justify-between p-3 bg-black/40 border border-fuchsia-950 rounded-lg hover:border-fuchsia-500/30 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    file.alignment === 'HIGH' ? 'bg-teal-400' :
                                                    file.alignment === 'MODERATE' ? 'bg-fuchsia-400' : 'bg-red-400'
                                                }`} />
                                                <span className="text-[10px] font-bold text-white truncate max-w-[200px]">{file.filepath}</span>
                                            </div>
                                            <div className="text-right text-[10px]">
                                                <div className="text-fuchsia-300">{file.keywordDensity}% Alignment</div>
                                                <div className="text-[8px] text-gray-500 uppercase mt-0.5">Lines: {file.lines}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {selectedMapFile ? (
                                        <MotionDiv 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="bg-black/60 border border-fuchsia-950/60 p-4 rounded-xl flex flex-col gap-3 font-mono"
                                        >
                                            <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest border-b border-fuchsia-950/50 pb-2">File Statistics: {selectedMapFile.filepath}</div>
                                            <div className="flex flex-col gap-1.5 text-[9px] text-[#9ca3af]">
                                                <div>Resonance Quality Alignment: <span className="text-white font-bold">{selectedMapFile.alignment}</span></div>
                                                <div>Keywords density count: <span className="text-white">{selectedMapFile.keywordsCount} hits</span></div>
                                                {selectedMapFile.antiDetected && (
                                                    <div className="text-red-400 font-bold uppercase mt-1">Anti Domain Keywords identified: {selectedMapFile.antiKeywords.join(', ')}</div>
                                                )}
                                            </div>
                                            <div className="text-[9px] uppercase text-gray-500 mt-2 font-bold select-none">Keyword Specific hits:</div>
                                            <div className="bg-[#020104] p-3 border border-fuchsia-950 rounded max-h-[110px] overflow-y-auto custom-scrollbar flex flex-wrap gap-1.5">
                                                {Object.entries(selectedMapFile.breakdown).map(([word, cnt]: any) => (
                                                    <span key={word} className="bg-fuchsia-950/30 text-fuchsia-300 border border-fuchsia-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono">{word} ({cnt})</span>
                                                ))}
                                            </div>
                                        </MotionDiv>
                                    ) : (
                                        <div className="bg-[#000000]/20 border border-dashed border-fuchsia-950 rounded-xl flex items-center justify-center p-12 text-center text-gray-600 font-mono text-[10px]">
                                            Select a workspace file catalog on the left to map detailed style resonance
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLLUMN PANELS: RECENT LEDGER ENTRIES */}
                    <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-8">
                        
                        {/* THE AUTOMATED DRIFT APPROVER PANEL */}
                        <div className="bg-[#0b0312]/60 border border-fuchsia-950 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-fuchsia-950 pb-2">
                                <TrendingUp className="w-4 h-4 text-fuchsia-400" /> Automated Codebase Style Drift Tracker
                            </span>
                            
                            {driftDetails.length > 0 && (
                                <div className="border border-amber-500/20 bg-amber-950/10 p-3 rounded-lg text-amber-400/90 text-[9px] leading-relaxed flex flex-col gap-1 uppercase">
                                    {driftDetails.map((detStr, i) => (
                                        <div key={i} className="flex items-start gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 min-w-[14px]" />
                                            <span>{detStr}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] block font-bold text-gray-500 uppercase pb-2 font-mono">Emerging Soul Candidates (Crawl approval)</span>
                                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                                    {emergingCandidates.length === 0 ? (
                                        <div className="text-[9px] text-gray-600 py-3">No undefined patterns or vocab detected. Resonance aligned.</div>
                                    ) : (
                                        emergingCandidates.map((word, idx) => {
                                            const inSoul = selectedProfile?.soulKeywords.includes(word);
                                            return (
                                                <div key={word || idx} className="flex items-center justify-between p-2 bg-black/40 border border-fuchsia-950 rounded hover:border-fuchsia-900/60 font-mono">
                                                    <span className="text-[10.5px] text-white font-bold">{word}</span>
                                                    {inSoul ? (
                                                        <span className="text-emerald-400 text-[8px] uppercase">Approved</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleApproveKeyword(word)}
                                                            className="px-2 py-0.5 bg-fuchsia-950 border border-fuchsia-500/40 text-fuchsia-400 hover:text-white rounded text-[8px] uppercase cursor-pointer"
                                                        >
                                                            + Approve
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LIVE TRANSACTION LEDGER RECORDS */}
                        <div className="bg-[#0b0312]/60 border border-fuchsia-950 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-fuchsia-950 pb-2 font-mono">
                                <Terminal className="w-4 h-4 text-fuchsia-400" /> Curation Ledger Logs
                            </span>

                            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                                {ledger.length === 0 ? (
                                    <div className="text-center text-[9px] text-gray-600 py-12 font-mono uppercase">Ledger is empty. Awaiting transacted curation scores.</div>
                                ) : (
                                    ledger.map((l, i) => (
                                        <div key={l.id || i} className="p-3 bg-[#11051c]/40 border border-fuchsia-950 hover:border-fuchsia-500/30 rounded-lg flex flex-col justify-between font-mono">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-white truncate max-w-[120px]">{l.task_intent}</span>
                                                <span className={`text-[10px] font-bold ${l.passed ? 'text-emerald-400' : 'text-red-400'}`}>{l.total_score}/100</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] text-gray-500 uppercase mt-2.5">
                                                <span>Revisions: {l.revision_count}</span>
                                                <span>Outcome: {l.final_outcome}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
