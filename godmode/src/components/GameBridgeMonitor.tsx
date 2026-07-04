import React, { useState, useEffect } from 'react';
import { Network, ShieldCheck, RefreshCw, Play, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

interface MutationEvent {
  variables: Record<string, number>;
  updated: Record<string, number>;
  changeLabel: string;
  timestamp: string;
}

export function GameBridgeMonitor() {
  const [config, setConfig] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [mutations, setMutations] = useState<MutationEvent[]>([]);
  const [manualVars, setManualVars] = useState<Record<string, string>>({});

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/armada/gamebridge/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        // Pre-fill manual input boxes with current values
        const strings: Record<string, string> = {};
        Object.entries(data.config).forEach(([k, v]) => {
          strings[k] = String(v);
        });
        setManualVars(strings);
      }
    } catch (err) {
      console.error('Failed to load Game Bridge config:', err);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      const res = await fetch('/api/armada/gamebridge/validate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.validation);
      }
    } catch (err) {
      console.error('Validation failure:', err);
    } finally {
      setValidating(false);
    }
  };

  const injectManualDNA = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed: Record<string, number> = {};
    Object.entries(manualVars).forEach(([k, v]) => {
      const num = parseFloat(v as any);
      if (!isNaN(num)) {
        parsed[k] = num;
      }
    });

    try {
      const res = await fetch('/api/armada/gamebridge/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: parsed, changeLabel: 'Manual tuning slider adjust' }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        // Add manual change to log
        const newMutation: MutationEvent = {
          variables: data.config,
          updated: parsed,
          changeLabel: 'Manual tuning slider adjust',
          timestamp: new Date().toLocaleTimeString(),
        };
        setMutations(prev => [newMutation, ...prev]);
        runValidation();
      }
    } catch (err) {
      console.error('Failed to inject manual DNA:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Configuration Header & Connection Grid */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Primary Node Grid Authority</h3>
          </div>
          <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono font-bold">
            LOCK CONFIRMED: public/bannon.html
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Verifies live skeletal joint multipliers, velocity transfer indices, and anatomical configurations inside the target environment. Every dynamic change uses high-precision clinical tracking.
        </p>

        {/* Live Master DNA Config Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#0b0b0b] border border-zinc-900 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-zinc-550 uppercase">Gravity Target</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{config['GRAVITY'] !== undefined ? `${config['GRAVITY']} m/s²` : 'Loading...'}</span>
          </div>
          <div className="bg-[#0b0b0b] border border-zinc-900 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-zinc-550 uppercase">Strike Impact</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{config['STRIKE'] !== undefined ? `${config['STRIKE']} N` : 'Loading...'}</span>
          </div>
          <div className="bg-[#0b0b0b] border border-zinc-900 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-zinc-550 uppercase">Reach Modifier</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{config['reach'] !== undefined ? `${config['reach']}x` : 'Loading...'}</span>
          </div>
          <div className="bg-[#0b0b0b] border border-zinc-900 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-zinc-550 uppercase">Max Body Vel</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{config['MAX_BODY_VEL'] !== undefined ? `${config['MAX_BODY_VEL']} m/s` : 'Loading...'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-1 border-t border-zinc-900 mt-2">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-xs px-3 py-1.5 rounded text-zinc-350 transition-all font-semibold font-sans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Variables
          </button>
          <button
            onClick={runValidation}
            disabled={validating}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-xs px-3 py-1.5 rounded text-zinc-350 transition-all font-semibold font-sans"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
            Run Validation Pass
          </button>
        </div>
      </div>

      {/* Validation Pass Status Banner */}
      {validationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          validationResult.success 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
            : 'bg-red-950/20 border-red-900/40 text-red-400'
        }`}>
          {validationResult.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 flex flex-col gap-1 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {validationResult.success ? 'KINETIC INTEGRITY STABLE' : 'KINETIC ANOMALY DETECTED'}
            </span>
            <p className="opacity-90">{validationResult.message}</p>
            <div className="flex gap-4 mt-2 font-mono text-[10px] opacity-75">
              <span>JITTER: {validationResult.jitter?.toFixed(4)}</span>
              {validationResult.fps && <span>FPS: {validationResult.fps} (simulated)</span>}
              {validationResult.impactForce && <span>STRIKE FORCE: {validationResult.impactForce?.toFixed(2)}N</span>}
            </div>
          </div>
        </div>
      )}

      {/* Manual DNA Variable Grid Tuning Sliders */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm">Direct Chemical Variable Injection</h3>
        <p className="text-xs text-zinc-450 leading-relaxed">
          Manually alter skeletal parameters in the live context layer. Mutated parameters compile dynamically into index coordinates.
        </p>

        <form onSubmit={injectManualDNA} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(config).slice(0, 8).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-450 font-medium">{key}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={manualVars[key] || ''}
                    onChange={(e) => setManualVars({ ...manualVars, [key]: e.target.value })}
                    className="w-16 bg-zinc-950 border border-zinc-900 px-1 py-0.5 rounded font-mono text-center text-emerald-400 text-xs focus:outline-none focus:border-zinc-800"
                  />
                </div>
                <input
                  type="range"
                  min={key === 'GRAVITY' ? -25 : 0}
                  max={key === 'STRIKE' ? 500 : 5}
                  step="0.05"
                  value={parseFloat(manualVars[key] || '0')}
                  onChange={(e) => setManualVars({ ...manualVars, [key]: e.target.value })}
                  className="w-full h-1 bg-zinc-950 rounded cursor-pointer accent-emerald-500"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-500 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors self-start mt-1"
          >
            Surgically Inject DNA variables
          </button>
        </form>
      </div>

      {/* Auto-Mutation Stream Event Logs */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-white text-sm">Skeletal Mutation Stream</h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
          {mutations.length === 0 ? (
            <span className="text-zinc-550 text-xs italic">No mutations executed in current login session. Waiting for DNA promotion alignment...</span>
          ) : (
            mutations.map((m, idx) => (
              <div key={idx} className="bg-zinc-950 rounded border border-zinc-900 p-2.5 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">{m.changeLabel}</span>
                  <span className="text-[10px] text-zinc-550 font-mono">{m.timestamp}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-450 mt-1 flex flex-wrap gap-2">
                  {Object.entries(m.updated).map(([k, v]) => (
                    <span key={k} className="bg-zinc-900/60 px-1 rounded text-emerald-400/90">{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
