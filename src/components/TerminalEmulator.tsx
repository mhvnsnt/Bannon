import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Square, RefreshCw, Trash2, HelpCircle } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

const FILES_STRUCTURE: Record<string, string> = {
  'package.json': `{
  "name": "orion-enterprises",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "vite": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  }
}`,
  'metadata.json': `{
  "name": "Orion Enterprises",
  "description": "Premium Coding Sandbox & Autonomous Data Node",
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}`,
  'src/App.tsx': '// Main Application Component\nimport React from "react";\n...',
  'src/types.ts': '// Shared Type Definitions\n...',
  'src/components/AgentView.tsx': '// Autonomous Scraper Node View\n...',
};

export default function TerminalEmulator() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', text: 'Orion Workspace Terminal v1.0.0' },
    { type: 'output', text: 'Type "help" to see available commands.' },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunningScript, setIsRunningScript] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const newHistory = [...history, { type: 'input' as const, text: `$ ${trimmedInput}` }];
    setHistory(newHistory);
    setInput('');
    setCommandHistory(prev => [trimmedInput, ...prev]);
    setHistoryIndex(-1);

    const parts = trimmedInput.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        setHistory(prev => [
          ...prev,
          { type: 'output', text: '╔═════════════════════════════════════════════════════════════════════════╗' },
          { type: 'success', text: '║                       CODEDUMMY WORKSPACE SHELL                         ║' },
          { type: 'output', text: '╚═════════════════════════════════════════════════════════════════════════╝' },
          { type: 'output', text: 'AVAILABLE SHELL COMMANDS:' },
          { type: 'success', text: '  [ File System & Basics ]' },
          { type: 'output', text: '    ls                        - List files in workspace' },
          { type: 'output', text: '    cat <file>                - Display file content' },
          { type: 'output', text: '    clear                     - Clear terminal screen' },
          { type: 'success', text: '  [ Node & NPM Package Management ]' },
          { type: 'output', text: '    npm install <pkg>         - Install an npm package' },
          { type: 'output', text: '    npm run build             - Compile and build applet' },
          { type: 'output', text: '    npm run dev               - Boot dev server on port 3000' },
          { type: 'success', text: '  [ Git & Version Control ]' },
          { type: 'output', text: '    git status                - View modified or unstaged changes' },
          { type: 'output', text: '    git log                   - Review workspace commit timeline' },
          { type: 'output', text: '    git diff                  - Display active side-by-side modifications' },
          { type: 'success', text: '  [ Autonomous Scraper Nodes ]' },
          { type: 'output', text: '    agent status              - Check Scraper Engine status' },
          { type: 'output', text: '    agent run <prompt>        - Trigger autonomous scraping simulation' },
          { type: 'success', text: '  [ MCP Plugin System ]' },
          { type: 'output', text: '    mcp list                  - List active Model Context Protocol tools' },
          { type: 'output', text: '    mcp status                - Diagnose connected MCP services' },
        ]);
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'ls':
        setHistory(prev => [
          ...prev,
          { type: 'success', text: 'package.json      metadata.json      tsconfig.json      src/' },
          { type: 'success', text: 'src/App.tsx       src/types.ts       src/components/' },
          { type: 'success', text: 'src/utils/        src/services/      supabase/' },
        ]);
        break;

      case 'cat':
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'error', text: 'Usage: cat <filename>' }]);
        } else {
          const filename = args[0];
          const content = FILES_STRUCTURE[filename];
          if (content) {
            setHistory(prev => [
              ...prev,
              ...content.split('\n').map(line => ({ type: 'output' as const, text: line })),
            ]);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `cat: ${filename}: No such file or directory` }]);
          }
        }
        break;

      case 'npm':
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'error', text: 'Usage: npm <command>' }]);
        } else {
          const subCommand = args[0].toLowerCase();
          if (subCommand === 'install' || subCommand === 'i') {
            const pkgName = args.slice(1).join(' ') || 'dependencies';
            setIsRunningScript(true);
            setHistory(prev => [...prev, { type: 'output', text: `Installing ${pkgName}...` }]);
            
            await new Promise(res => setTimeout(res, 1200));
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'added 14 packages, and audited 125 packages in 1.12s' },
              { type: 'success', text: `+ ${pkgName}@latest successfully installed` },
            ]);
            setIsRunningScript(false);
          } else if (subCommand === 'run') {
            const script = args.slice(1).join(' ').toLowerCase();
            if (script === 'build') {
              setIsRunningScript(true);
              setHistory(prev => [
                ...prev,
                { type: 'output', text: '> codedummy@1.0.0 build' },
                { type: 'output', text: '> tsc --noEmit && vite build' },
                { type: 'output', text: 'vite v6.2.3 building for production...' },
              ]);
              await new Promise(res => setTimeout(res, 1500));
              setHistory(prev => [
                ...prev,
                { type: 'success', text: '✓ 52 modules transformed.' },
                { type: 'success', text: 'dist/index.html                  0.82 kB │ gzip: 0.44 kB' },
                { type: 'success', text: 'dist/assets/index-D8yG7e.js     186.40 kB │ gzip: 58.10 kB' },
                { type: 'success', text: 'dist/assets/index-Cc8f7A.css     31.20 kB │ gzip:  8.40 kB' },
                { type: 'success', text: '✨ Codebase compiled with 0 type errors. Built successfully in 1.48s' },
              ]);
              setIsRunningScript(false);
            } else if (script === 'dev') {
              setIsRunningScript(true);
              setHistory(prev => [
                ...prev,
                { type: 'output', text: '> codedummy@1.0.0 dev' },
                { type: 'output', text: '> tsx server.ts' },
                { type: 'output', text: '  VITE v6.2.3  ready in 180 ms' },
                { type: 'success', text: '  ➜  Local Container Port:   http://localhost:3000/' },
                { type: 'output', text: '  ➜  Hot Module Replacement is disabled (agent mode active)' },
              ]);
              setIsRunningScript(false);
            } else {
              setHistory(prev => [...prev, { type: 'error', text: `npm ERR! missing script: ${script}` }]);
            }
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `npm ERR! unknown subcommand: ${subCommand}` }]);
          }
        }
        break;

      case 'git':
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'output', text: 'Usage: git <status | log | diff | branch>' }]);
        } else {
          const subCommand = args[0].toLowerCase();
          if (subCommand === 'status') {
            setHistory(prev => [
              ...prev,
              { type: 'output', text: 'On branch main' },
              { type: 'output', text: 'Your branch is up to date with \'origin/main\'.' },
              { type: 'output', text: '' },
              { type: 'output', text: 'Changes not staged for commit:' },
              { type: 'output', text: '  (use "git add <file>..." to update what will be committed)' },
              { type: 'error', text: '\tmodified:   src/App.tsx' },
              { type: 'error', text: '\tmodified:   src/components/AgentView.tsx' },
              { type: 'output', text: '' },
              { type: 'success', text: 'Untracked files:' },
              { type: 'success', text: '\tsrc/components/TerminalEmulator.tsx' },
              { type: 'success', text: '\tsrc/components/ContextHint.tsx' },
              { type: 'success', text: '\tsrc/utils/indexedDB.ts' },
              { type: 'output', text: '' },
              { type: 'output', text: 'no changes added to commit (use "git add" and/or "git commit -a")' },
            ]);
          } else if (subCommand === 'log') {
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'commit a4e2776c5332f05a5a1f0a1c9b2f6 (HEAD -> main)' },
              { type: 'output', text: 'Author: CODEDUMMY Agent <agent@codedummy.io>' },
              { type: 'output', text: 'Date:   Sat Jul 4 10:52:11 2026 -0700' },
              { type: 'output', text: '    feat: implement persistent side-by-side diff PR preview and IndexedDB fallbacks' },
              { type: 'output', text: '' },
              { type: 'success', text: 'commit 5f61ba28b4382c7a6e1291b8a101f' },
              { type: 'output', text: 'Author: User Developer <user@codedummy.io>' },
              { type: 'output', text: 'Date:   Sat Jul 4 09:12:05 2026 -0700' },
              { type: 'output', text: '    feat: configure Supabase client & persistent database tables' },
            ]);
          } else if (subCommand === 'diff') {
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'diff --git a/src/App.tsx b/src/App.tsx' },
              { type: 'success', text: '--- a/src/App.tsx' },
              { type: 'success', text: '+++ b/src/App.tsx' },
              { type: 'output', text: '@@ -238,3 +238,15 @@' },
              { type: 'error', text: '-   const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);' },
              { type: 'success', text: '+   const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);' },
              { type: 'success', text: '+   // Connectivity diagnostics loop running' },
              { type: 'output', text: '@@ -516,2 +528,10 @@' },
              { type: 'success', text: '+   <div className="connectivity-indicator">' },
              { type: 'success', text: '+     <Wifi className="w-3 h-3 text-emerald-500" />' },
              { type: 'success', text: '+   </div>' },
            ]);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `git: unknown subcommand: ${subCommand}` }]);
          }
        }
        break;

      case 'agent':
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'output', text: 'Usage: agent <status | run <prompt>>' }]);
        } else {
          const subCommand = args[0].toLowerCase();
          if (subCommand === 'status') {
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'Scraper Engine: ONLINE (Local Mode)' },
              { type: 'output', text: 'Active Workers: 0 idle' },
              { type: 'output', text: 'Target Proxy Routing: Enabled (Cloudflare Bypass Enabled)' },
              { type: 'output', text: 'Persistence Layer: IndexedDB Sync Active' },
            ]);
          } else if (subCommand === 'run') {
            const promptStr = args.slice(1).join(' ') || 'scrape target';
            setIsRunningScript(true);
            setHistory(prev => [
              ...prev,
              { type: 'output', text: `Initiating scraper agent for task: "${promptStr}"` },
              { type: 'output', text: '[Step 1/3] Parsing headers and setting up headless browser configuration...' },
            ]);
            await new Promise(res => setTimeout(res, 1000));
            setHistory(prev => [
              ...prev,
              { type: 'output', text: '[Step 2/3] Bypassing secure gateway. Extracting schema structured keys...' },
            ]);
            await new Promise(res => setTimeout(res, 1200));
            setHistory(prev => [
              ...prev,
              { type: 'success', text: '[Step 3/3] Structured data successfully scraped and cached to IndexedDB.' },
              { type: 'success', text: '✓ Scraped 42 records. Prompt history updated.' },
            ]);
            setIsRunningScript(false);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `agent: unknown subcommand: ${subCommand}` }]);
          }
        }
        break;

      case 'mcp':
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'output', text: 'Usage: mcp <list | status>' }]);
        } else {
          const subCommand = args[0].toLowerCase();
          if (subCommand === 'list') {
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'REGISTERED MODEL CONTEXT PROTOCOL (MCP) TOOLS:' },
              { type: 'output', text: '  - Discord Server Client  (mcp-discord-server)' },
              { type: 'output', text: '  - Telegram Bot Client    (mcp-telegram-server)' },
              { type: 'output', text: '  - iMessage SQLite Worker (mcp-imessage-server)' },
              { type: 'output', text: '  - Web Scraper Engine     (mcp-fakechat-server)' },
            ]);
          } else if (subCommand === 'status') {
            setHistory(prev => [
              ...prev,
              { type: 'success', text: 'MCP status: 4/4 clients connected.' },
              { type: 'output', text: '  discord-client:  Connected (idle)' },
              { type: 'output', text: '  telegram-bot:    Connected (listening)' },
              { type: 'output', text: '  imessage-sqlite: Connected (indexed)' },
              { type: 'output', text: '  scraper-service: Connected (hot standby)' },
            ]);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `mcp: unknown subcommand: ${subCommand}` }]);
          }
        }
        break;

      default:
        setHistory(prev => [...prev, { type: 'error', text: `sh: command not found: ${command}. Type "help" to see valid commands.` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl font-mono text-xs text-slate-300">
      {/* Header bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-slate-400 font-bold tracking-wide ml-2 flex items-center gap-1.5 uppercase text-[10px]">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            Workspace Terminal
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Local Node: Online
        </div>
      </div>

      {/* Terminal Screen output */}
      <div 
        className="p-4 h-64 overflow-y-auto space-y-1.5 bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-800"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => {
          let color = 'text-slate-300';
          if (line.type === 'input') color = 'text-white font-bold';
          else if (line.type === 'error') color = 'text-red-400';
          else if (line.type === 'success') color = 'text-emerald-400 font-semibold';
          else if (line.type === 'output') color = 'text-slate-400';

          return (
            <div key={i} className={`${color} leading-relaxed whitespace-pre-wrap`}>
              {line.text}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleCommandSubmit} className="flex items-center bg-slate-950 border-t border-slate-900 px-4 py-2">
        <span className="text-slate-400 font-bold mr-2 select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunningScript}
          placeholder={isRunningScript ? "Script executing..." : "Type command here (e.g. ls, npm run build)"}
          className="flex-1 bg-transparent text-white outline-none border-none placeholder:text-slate-600 focus:ring-0 p-0 text-xs"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
