import React, { useState } from 'react';
import { GitCommit, GitBranch, Terminal, FileCode, Network, Link as LinkIcon, Cpu } from 'lucide-react';

interface ASTNode {
  id: string;
  name: string;
  type: string;
  children?: ASTNode[];
  dependencies?: string[];
}

const mockCodebaseAST: ASTNode = {
  id: 'root',
  name: 'God-Mode-OS-D3MN-V2',
  type: 'Directory',
  children: [
    {
      id: 'src',
      name: 'src',
      type: 'Directory',
      children: [
        {
          id: 'server',
          name: 'server',
          type: 'Directory',
          children: [
            { id: 'taskMatrix.ts', name: 'taskMatrix.ts', type: 'File', dependencies: ['better-sqlite3', '@babel/parser', 'express'] },
            { id: 'server.ts', name: 'server.ts', type: 'File', dependencies: ['express', './taskMatrix.ts'] },
          ]
        },
        {
          id: 'components',
          name: 'components',
          type: 'Directory',
          children: [
            { id: 'QuantumChat.tsx', name: 'QuantumChat.tsx', type: 'Component', dependencies: ['useHardwareActuator.ts', 'lucide-react'] },
            { id: 'DirectiveVault.tsx', name: 'DirectiveVault.tsx', type: 'Component', dependencies: ['lucide-react'] },
            { id: 'ForgeStudio.tsx', name: 'ForgeStudio.tsx', type: 'Component', dependencies: [] },
            { id: 'ASTVisualizer.tsx', name: 'ASTVisualizer.tsx', type: 'Component', dependencies: ['lucide-react'] }
          ]
        },
        {
          id: 'hooks',
          name: 'hooks',
          type: 'Directory',
          children: [
            { id: 'useHardwareActuator.ts', name: 'useHardwareActuator.ts', type: 'Hook', dependencies: [] }
          ]
        }
      ]
    }
  ]
};

const ASTNodeRenderer: React.FC<{ node: ASTNode; level: number }> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(level < 2);

  return (
    <div className="flex flex-col border-l border-zinc-800 ml-2 overflow-hidden transition-all">
      <div 
        className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-900 cursor-pointer text-xs"
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${level * 8}px` }}
      >
        {node.type === 'Directory' ? <LayoutIcon isOpen={isOpen} /> : <FileSymbol type={node.type} />}
        <span className={`font-mono ${node.type === 'Directory' ? 'text-zinc-300 font-bold' : 'text-emerald-400'}`}>
          {node.name}
        </span>
        {node.dependencies && node.dependencies.length > 0 && (
          <span className="text-[9px] text-zinc-500 bg-zinc-900 px-1 rounded ml-auto flex items-center gap-1">
            <LinkIcon size={10} /> {node.dependencies.length}
          </span>
        )}
      </div>

      {isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map(child => (
            <ASTNodeRenderer key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}

      {isOpen && node.dependencies && node.dependencies.length > 0 && (
        <div className="flex flex-col pl-6 pr-2 py-1 bg-zinc-950 border-t border-b border-zinc-900">
          <span className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1 flex items-center gap-1"><Network size={10}/> Structural Links</span>
          {node.dependencies.map(dep => (
            <div key={dep} className="text-[10px] text-purple-400 font-mono py-0.5 flex items-center gap-1">
              <Cpu size={10} /> {dep}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LayoutIcon = ({ isOpen }: { isOpen: boolean }) => (
  <span className="text-zinc-500">
    <Network size={12} className={isOpen ? "rotate-90 transition-transform" : "transition-transform"} />
  </span>
);

const FileSymbol = ({ type }: { type: string }) => {
  if (type === 'Component') return <GitBranch size={12} className="text-purple-500" />;
  if (type === 'Hook') return <Terminal size={12} className="text-blue-500" />;
  return <FileCode size={12} className="text-emerald-500" />;
};

export const ASTVisualizer: React.FC = () => {
  return (
    <div className="w-64 h-full bg-black border-l border-zinc-800 flex flex-col hidden lg:flex">
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2">
        <GitCommit className="text-purple-500" size={16} />
        <h2 className="text-xs font-bold text-white tracking-widest uppercase">AST Visualizer</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-[10px] text-zinc-500 mb-4 tracking-wider leading-relaxed">
          ACTIVE SYNTAX GRAPH OVERLAY. DISPLAYING SPATIAL LINKS AND MODULE DEPENDENCIES.
        </p>
        <ASTNodeRenderer node={mockCodebaseAST} level={0} />
      </div>
    </div>
  );
};

export default ASTVisualizer;
