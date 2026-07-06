import React, { useState, useRef } from 'react';
import { usePrimeStore } from '../lib/store';

type SurgeryMode = 'surgical' | 'enhance' | 'audit';
type ChunkStatus = 'pending' | 'processing' | 'done' | 'error';

interface Chunk {
  index: number;
  startLine: number;
  endLine: number;
  content: string;
  status: ChunkStatus;
}

const PRESETS: Record<string, string> = {
  skin: `Fix the continuous skin coverage gaps in the fighter body geometry.
- Add pelvis connector tube between torso and legs
- Add hand cap geometry at wrist endpoints
- Add foot geometry caps at ankle endpoints  
- Add smooth joint connectors between all limb segments
- Do NOT modify the combat system, IK solver, animation state machine, physics joints, or arena code`,
  combat: `Deepen the combat impact feel throughout the fight system.
- Add camera shake on hard hits proportional to damage
- Add hit flash / brief white overlay on impact
- Improve ragdoll momentum transfer on knockdowns
- Deepen stagger variety based on strike type and location
- Do NOT touch geometry, character creator, or audio`,
  perf: `Performance optimization pass for mobile browsers.
- Identify per-frame allocations inside render loop and cache them
- Check for redundant matrix updates, batch where possible
- Review shadow and post-processing for mobile performance
- Do NOT change visual output or gameplay logic`,
  ragdoll: `Improve ragdoll knockdown system to feel like UFC/Fight Night.
- Knockdowns carry momentum vector of finishing strike
- Body should fly back or spin based on strike type
- Add flash knockdown vs full KO vs rope stumble states
- Do NOT modify character creator, geometry, or UI`,
  ui: `Polish the HUD and UI elements.
- Make health bars feel more broadcast-style
- Improve round timer display
- Add visual feedback for stamina depletion
- Fix any overlapping or illegible UI elements
- Do NOT touch gameplay logic, physics, or geometry`,
};

export default function CodeSurgeonPanel() {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [directive, setDirective] = useState('');
  const [mode, setSurgeryMode] = useState<SurgeryMode>('surgical');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [outputContent, setOutputContent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<Array<{ msg: string; type: 'ok' | 'err' | 'info' | 'warn' }>>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string, type: 'ok' | 'err' | 'info' | 'warn' = 'info') => {
    setLog(prev => [...prev, { msg, type }]);
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      const lines = content.split('\n').length;
      const kb = (file.size / 1024).toFixed(1);
      addLog(`[FILE] Loaded: ${file.name} (${lines} lines, ${kb}KB)`, 'ok');
      const est = Math.ceil(lines / chunkSize);
      addLog(`[SYS] At ${chunkSize} lines/chunk → ~${est} chunks`, 'info');
    };
    reader.readAsText(file);
  };

  const buildChunks = (content: string, size: number): Chunk[] => {
    const lines = content.split('\n');
    const result: Chunk[] = [];
    for (let i = 0; i < lines.length; i += size) {
      result.push({
        index: result.length,
        startLine: i + 1,
        endLine: Math.min(i + size, lines.length),
        content: lines.slice(i, i + size).join('\n'),
        status: 'pending',
      });
    }
    return result;
  };

  const callModel = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const res = await fetch('/api/armada/surgeon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        taskType: 'CODE_GEN'
      }),
    });
    
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || data.response || data.text || '';
  };

  const runSurgery = async () => {
    if (!fileContent) { addLog('[ERR] No file loaded', 'err'); return; }
    if (!directive) { addLog('[ERR] No surgical directive', 'err'); return; }

    setIsRunning(true);
    setOutputContent('');
    setPreviewOpen(false);

    const allChunks = buildChunks(fileContent, chunkSize);
    setChunks(allChunks.map(c => ({ ...c, status: 'pending' })));
    const total = allChunks.length;

    addLog(`[SURGERY] Starting on ${fileName} — ${total} chunks`, 'ok');
    addLog(`[MODE] ${mode} | DIRECTIVE: ${directive.slice(0, 80)}...`, 'warn');

    const modeInstructions: Record<SurgeryMode, string> = {
      surgical: `You are a surgical code editor. You receive one chunk of a larger file.
RULE 1: If this chunk contains code relevant to the directive — apply the fix precisely.
RULE 2: If this chunk has NO code related to the directive — return it EXACTLY as given.
RULE 3: NEVER add comments. NEVER add markdown. NEVER truncate.
RULE 4: Output ONLY the raw code. Nothing else.`,
      enhance: `You are a code enhancement engine. Apply the directive improvements wherever relevant.
Return the complete chunk with improvements. Do not truncate. Do not add markdown.
Output ONLY the raw code.`,
      audit: `You are a code auditor. Return chunk UNCHANGED, prepend //[AUDIT]: with issues found.
If nothing relevant, return chunk unchanged with no comment.`,
    };

    const systemPrompt = `${modeInstructions[mode]}

SURGICAL DIRECTIVE:
${directive}

FILE: ${fileName} — you are processing one chunk of ${total} total chunks. Chunks will be reassembled in order.`;

    const resultParts = new Array(total).fill('');
    let done = 0;

    const processChunk = async (chunk: Chunk) => {
      setChunks(prev => prev.map(c => c.index === chunk.index ? { ...c, status: 'processing' } : c));
      try {
        const userPrompt = `CHUNK ${chunk.index + 1} — LINES ${chunk.startLine} to ${chunk.endLine}\n\n${chunk.content}`;
        let result = await callModel(systemPrompt, userPrompt);
        result = result.replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
        resultParts[chunk.index] = result;
        setChunks(prev => prev.map(c => c.index === chunk.index ? { ...c, status: 'done' } : c));
        done++;
        setProgress(Math.round((done / total) * 100));
        addLog(`[C${chunk.index + 1}/${total}] ✓ processed`, 'ok');
      } catch (err: any) {
        resultParts[chunk.index] = chunk.content;
        setChunks(prev => prev.map(c => c.index === chunk.index ? { ...c, status: 'error' } : c));
        done++;
        setProgress(Math.round((done / total) * 100));
        addLog(`[C${chunk.index + 1}/${total}] ✗ error — using original: ${err.message}`, 'err');
      }
    };

    const CONCURRENCY = 3;
    let cursor = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < total) {
        const c = allChunks[cursor++];
        await processChunk(c);
      }
    });
    await Promise.all(workers);

    const finalOutput = resultParts.join('\n');
    setOutputContent(finalOutput);
    const lines = finalOutput.split('\n').length;
    const kb = (new Blob([finalOutput]).size / 1024).toFixed(1);
    addLog(`[COMPLETE] ${lines} lines · ${kb}KB — surgery done`, 'ok');
    setIsRunning(false);
  };

  const downloadOutput = () => {
    const blob = new Blob([outputContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/(\.[^.]+)$/, '_SURGERED$1') || 'surgered_output.html';
    a.click();
    URL.revokeObjectURL(a.href);
    addLog('[DOWNLOAD] File dispatched', 'ok');
  };

  const logColors: Record<string, string> = {
    ok: 'text-emerald-400',
    err: 'text-red-400',
    warn: 'text-amber-400',
    info: 'text-gray-500',
  };

  const chunkColors: Record<ChunkStatus, string> = {
    pending: 'border-gray-700 text-gray-600',
    processing: 'border-amber-500 text-amber-400 animate-pulse',
    done: 'border-emerald-500 text-emerald-400',
    error: 'border-red-500 text-red-400',
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto font-mono text-[12px]">
      <div className="text-[10px] text-amber-400 uppercase tracking-[0.3em] font-bold">// CODE SURGEON — OPERATIVE CONSOLE</div>

      {/* File drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-[#333] hover:border-emerald-500/50 rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-emerald-900/5"
      >
        <input ref={fileInputRef} type="file" accept=".html,.js,.ts,.jsx,.tsx" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
        {fileName ? (
          <span className="text-emerald-400">✓ {fileName}</span>
        ) : (
          <span className="text-gray-600">DROP HTML / JS / TS FILE — or tap to browse</span>
        )}
      </div>

      {/* Chunk size + Mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">CHUNK SIZE</div>
          <select
            value={chunkSize}
            onChange={e => setChunkSize(Number(e.target.value))}
            className="w-full bg-[#111] border border-[#333] text-gray-300 rounded px-2 py-1.5 text-[11px] font-mono"
          >
            <option value={300}>300 lines — safe</option>
            <option value={500}>500 lines — recommended</option>
            <option value={800}>800 lines — fast</option>
            <option value={1000}>1000 lines — max</option>
          </select>
        </div>
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">SURGERY MODE</div>
          <select
            value={mode}
            onChange={e => setSurgeryMode(e.target.value as SurgeryMode)}
            className="w-full bg-[#111] border border-[#333] text-gray-300 rounded px-2 py-1.5 text-[11px] font-mono"
          >
            <option value="surgical">SURGICAL — targeted changes only</option>
            <option value="enhance">ENHANCE — improve throughout</option>
            <option value="audit">AUDIT — scan and report</option>
          </select>
        </div>
      </div>

      {/* Directive */}
      <div>
        <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">SURGICAL DIRECTIVE</div>
        <textarea
          value={directive}
          onChange={e => setDirective(e.target.value)}
          rows={4}
          placeholder="Describe what needs to change. Be specific. Reference function names if known."
          className="w-full bg-[#080810] border border-[#333] focus:border-emerald-500/50 text-gray-300 rounded px-3 py-2 text-[11px] font-mono resize-none outline-none"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.keys(PRESETS).map(key => (
            <button
              key={key}
              onClick={() => setDirective(PRESETS[key])}
              className="px-2 py-1 bg-transparent border border-[#333] hover:border-amber-500/50 text-gray-500 hover:text-amber-400 rounded text-[9px] uppercase tracking-wider transition-all"
            >
              ▸ {key}
            </button>
          ))}
        </div>
      </div>

      {/* Execute button */}
      <button
        onClick={runSurgery}
        disabled={isRunning || !fileContent || !directive}
        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold uppercase tracking-[0.2em] rounded transition-all"
      >
        {isRunning ? `⚡ OPERATING... ${progress}%` : '⚡ EXECUTE SURGERY'}
      </button>

      {/* Progress bar */}
      {isRunning && (
        <div className="w-full bg-[#111] border border-[#222] rounded h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Chunk pills */}
      {chunks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chunks.map(c => (
            <span key={c.index} className={`px-2 py-0.5 border rounded-full text-[9px] ${chunkColors[c.status]}`}>
              C{c.index + 1}
            </span>
          ))}
        </div>
      )}

      {/* Log */}
      <div className="bg-[#040408] border border-[#1a1a1a] rounded p-3 h-32 overflow-y-auto space-y-0.5">
        {log.length === 0 && <div className="text-gray-700">[CODE SURGEON] — ONLINE · AWAITING TARGET</div>}
        {log.map((entry, i) => (
          <div key={i} className={logColors[entry.type] || 'text-gray-500'}>{entry.msg}</div>
        ))}
      </div>

      {/* Output actions */}
      {outputContent && (
        <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-emerald-900/20 border-b border-emerald-500/20 text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
            ✓ SURGERY COMPLETE — OUTPUT READY
          </div>
          <div className="flex gap-2 p-3">
            <button
              onClick={downloadOutput}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider rounded text-[11px] transition-all"
            >
              ⬇ DOWNLOAD FILE
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(outputContent)}
              className="flex-1 py-2 bg-transparent border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/20 rounded text-[11px] font-bold uppercase tracking-wider transition-all"
            >
              ⎘ COPY OUTPUT
            </button>
            <button
              onClick={() => setPreviewOpen(p => !p)}
              className={`flex-1 py-2 border rounded text-[11px] font-bold uppercase tracking-wider transition-all ${previewOpen ? 'bg-purple-600 text-white border-purple-500' : 'bg-transparent border-purple-500/40 text-purple-400 hover:bg-purple-900/20'}`}
            >
              {previewOpen ? '✕ CLOSE' : '▶ PREVIEW'}
            </button>
          </div>
          {previewOpen && (
            <div className="w-full h-[600px] border-t border-[#1a1a1a]">
              <iframe
                title="Surgery Output Preview"
                srcDoc={outputContent}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
