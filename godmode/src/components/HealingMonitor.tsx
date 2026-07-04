import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, RefreshCw, AlertTriangle, CheckCircle2, History, XCircle, Code, HelpCircle, Flame, Target } from 'lucide-react';

const MotionDiv = motion.div as any;

export default function HealingMonitor() {
    const [health, setHealth] = useState({
        score: 100,
        breakdown: {
            errorsCount: 0,
            healSuccessRate: 100,
            escalations: 0
        }
    });

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIncident, setActiveIncident] = useState<any | null>(null);
    const [triggerSuccess, setTriggerSuccess] = useState<any | null>(null);

    const fetchHealingData = async () => {
        setLoading(true);
        try {
            const healthRes = await fetch('/api/healing/status');
            const healthData = await healthRes.json();
            if (healthData && !healthData.error) setHealth(healthData);

            const logsRes = await fetch('/api/healing/logs');
            const logsData = await logsRes.json();
            if (logsData && logsData.logs) setLogs(logsData.logs);
        } catch (e) {
            console.error('Failed to load healing stats:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealingData();
    }, []);

    const handleTriggerTest = async () => {
        setLoading(true);
        setTriggerSuccess(null);
        try {
            const res = await fetch('/api/healing/trigger-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data && !data.error) {
                setTriggerSuccess({
                    success: data.success,
                    level: data.level,
                    outcome: data.outcome,
                    attempts: data.attempts
                });
                fetchHealingData();
            }
        } catch (e) {
            console.error('Failed to run mock compile heal test:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#030008] p-6 text-gray-200 overflow-y-auto custom-scrollbar">
            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-fuchsia-900/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-red-400">LAYER 13 System</div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                            Autonomous Error Healing Monitor
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchHealingData} 
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 border border-red-900/50 bg-red-950/20 hover:bg-red-950/50 rounded-md text-xs font-mono text-red-400 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Sync Ledgers
                    </button>
                    <div className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-red-500/30 bg-red-950/20 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.1)]">
                        HEALTH DEFENSE ACTIVE
                    </div>
                </div>
            </div>

            {/* Health Score Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-red-900/20 bg-[#16030c]/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1">Project Health Score</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black text-rose-500 font-mono drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                            {health.score}/100
                        </div>
                    </div>
                    <div className="w-full bg-red-950/50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${health.score}%` }} />
                    </div>
                </div>

                <div className="border border-red-900/20 bg-[#16030c]/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1">Compile Errors Intercepted</div>
                    <div className="text-3xl font-black text-white font-mono">
                        {health.breakdown.errorsCount}
                    </div>
                    <div className="text-[10px] font-mono text-rose-450 uppercase">7-day active history</div>
                </div>

                <div className="border border-red-900/20 bg-[#16030c]/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1">Autonomous Recovery Rate</div>
                    <div className="text-3xl font-black text-green-400 font-mono">
                        {health.breakdown.healSuccessRate}%
                    </div>
                    <div className="text-[10px] font-mono text-[#f0abfc] uppercase">Self-healed without intervention</div>
                </div>

                <div className="border border-red-900/20 bg-[#16030c]/40 rounded-xl p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500 mb-1">Escalations Ignited</div>
                    <div className="text-3xl font-black text-amber-500 font-mono">
                        {health.breakdown.escalations}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Escalated to human supervisor</div>
                </div>
            </div>

            {/* Test Launcher Panel */}
            <div className="border border-rose-900/30 bg-[#190514]/60 rounded-xl p-5 mb-6 flex flex-col md:flex-row gap-6 justify-between items-center shadow-[0_4px_20px_rgba(244,63,94,0.05)]">
                <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-[#fda4af] flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#fb7185] animate-pulse" />
                        Ignite Autonomous Healing Loop Demonstration
                    </h3>
                    <p className="text-[11px] font-mono text-gray-400 max-w-2xl leading-relaxed">
                        Launches a real-time test of Layer 13. We create a syntactically broken file (<code className="text-rose-400">src/components/ErrorComponent.tsx</code> with key declaration omissions), catch the compile failure log, feed into the Healing Engine to diagnose, load reflex patterns, apply surgical disk write fixes, and auto-verify!
                    </p>
                </div>
                <button 
                    onClick={handleTriggerTest}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 border border-rose-500 bg-rose-950/40 hover:bg-rose-500/20 rounded-lg text-xs font-mono font-bold text-rose-200 transition-all uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                >
                     Run Auto-Heal Test
                </button>
            </div>

            {/* Test Report Animate Presence */}
            <AnimatePresence>
                {triggerSuccess && (
                    <MotionDiv 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-green-500/30 bg-green-950/10 rounded-xl p-5 mb-6 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 text-xs font-mono text-green-400 font-bold mb-3 uppercase tracking-wider border-b border-green-500/20 pb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Simulation Test Passed: {triggerSuccess.outcome}
                        </div>
                        <div className="space-y-2 font-mono text-[11px]">
                            <div className="text-gray-400">Total recovery iterations required: <strong className="text-white">{triggerSuccess.level}/3</strong></div>
                            <div className="text-gray-400 mb-2">Detailed Healing Diagnostic Log:</div>
                            <div className="pl-4 border-l border-green-500/30 space-y-2 mt-1">
                                {triggerSuccess.attempts.map((att: any, idx: number) => (
                                    <div key={idx} className="text-gray-300">
                                        <div className="text-emerald-400">Iteration Level {att.level}: {att.vulnerability}</div>
                                        <div className="text-gray-400">Operation: <strong className="text-white">{att.action}</strong></div>
                                        <pre className="text-[10px] bg-black/40 border border-green-500/15 p-2 rounded max-w-2xl overflow-x-auto text-green-300 mt-1 mt-1">
                                            {att.fixProposed}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>

            {/* History Ledgers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                {/* Incidents timeline feed */}
                <div className="md:col-span-1 border border-red-900/10 bg-[#090212]/80 rounded-xl p-5">
                    <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-rose-500" />
                        Healing Ledger Stream
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] custom-scrollbar flex flex-col gap-2 pr-1">
                        {logs.length === 0 ? (
                            <div className="text-xs font-mono text-center py-10 text-gray-500">
                                No previous hardware/software incident records logged.
                            </div>
                        ) : (
                            logs.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIncident(item)}
                                    className={`w-full text-left p-3 rounded-lg border flex flex-col gap-1 transition-colors ${
                                        activeIncident?.id === item.id 
                                            ? 'border-rose-400 bg-rose-950/20' 
                                            : 'border-red-900/20 bg-[#120521]/40 hover:bg-rose-950/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-xs font-mono text-white font-bold truncate max-w-[150px]">{item.error_message}</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                            item.final_outcome === 'HEAL_VERIFIED' 
                                                ? 'bg-green-500/10 text-green-400' 
                                                : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            {item.final_outcome === 'HEAL_VERIFIED' ? 'HEALED' : 'ESCALATED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 w-full mt-1">
                                        <span>Type: {item.error_type}</span>
                                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Incidents Diagnostic details panel */}
                <div className="md:col-span-2 border border-red-900/10 bg-[#090212]/80 rounded-xl p-5">
                    <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white mb-4 flex items-center gap-2">
                        <Code className="w-4 h-4 text-rose-500" />
                        Incident Diagnostic Center
                    </h3>
                    {activeIncident ? (
                        <div className="space-y-4 font-mono text-xs">
                            <div className="grid grid-cols-2 gap-4 border-b border-red-900/20 pb-3">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Error Type Signature</div>
                                    <div className="text-[#fb7185] font-bold">{activeIncident.error_type}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Severity Rating</div>
                                    <div className={`font-bold ${
                                        activeIncident.severity === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-amber-500'
                                    }`}>{activeIncident.severity}</div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Recovery Steps Taken</div>
                                    <div className="text-white">Iteration Level {activeIncident.level_reached}/3</div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Time To Recovery</div>
                                    <div className="text-cyan-400">{(activeIncident.time_to_heal_ms / 1000).toFixed(2)} seconds</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Intercepted Crash Log Message</div>
                                <div className="bg-[#11051b] border border-red-900/20 p-3 rounded text-gray-300 max-h-[100px] overflow-y-auto custom-scrollbar">
                                    {activeIncident.error_message}
                                </div>
                            </div>

                            {activeIncident.fix_applied && (
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Surgically-applied Hot-Fix Content</div>
                                    <pre className="bg-[#050010] border border-green-500/20 p-3 rounded text-green-400 text-[10px] overflow-x-auto max-h-[150px] custom-scrollbar">
                                        {activeIncident.fix_applied}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs font-mono text-gray-500 text-center py-24 flex flex-col justify-center items-center gap-2">
                            <HelpCircle className="w-8 h-8 text-red-900/30" />
                            Select an incident log from the ledger stream to inspect diagnostics.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
