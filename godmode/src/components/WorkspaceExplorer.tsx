import React, { useState, useEffect } from 'react';
import { Folder, FileCode, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkspaceNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: WorkspaceNode[];
}

export function WorkspaceExplorer({ onFileSelect }: { onFileSelect: (path: string, content: string) => void }) {
  const [tree, setTree] = useState<WorkspaceNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/armada/workspace/tree');
      const data = await res.json();
      if (data.success) {
        setTree(data.tree);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileClick = async (path: string) => {
    try {
      const res = await fetch(`/api/armada/workspace/file?p=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success) {
        onFileSelect(path, data.content);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderNode = (node: WorkspaceNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const isDir = node.type === 'directory';

    return (
      <div key={node.path} className="w-full">
        <div 
          onClick={() => isDir ? toggleExpand(node.path) : handleFileClick(node.path)}
          className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#1a1a2e] cursor-pointer text-xs font-mono text-gray-300 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isDir ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
              <Folder className="w-3.5 h-3.5 text-emerald-500" />
            </>
          ) : (
            <>
              <div className="w-3.5" />
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {isDir && isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-[#1a1a1a]">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Folder className="w-3.5 h-3.5 text-emerald-500" />
          Workspace FS
        </span>
        <button onClick={fetchTree} className="text-gray-500 hover:text-emerald-400 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {tree.map(node => renderNode(node))}
      </div>
    </div>
  );
}
