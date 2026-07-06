import React, { useState, useEffect } from 'react';
import { GitPullRequest, Check, ExternalLink, X, Loader2 } from 'lucide-react';
import { getMockDiff } from '../utils/github';

interface DiffLine {
  leftText?: string;
  leftBg?: string;
  leftColor?: string;
  rightText?: string;
  rightBg?: string;
  rightColor?: string;
  isHeader?: boolean;
}

function parseUnifiedDiffToSideBySide(diffText: string): DiffLine[] {
  const lines = diffText.split('\n');
  const result: DiffLine[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined) {
      i++;
      continue;
    }
    
    const trimmed = line.trim();
    if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
      result.push({
        leftText: line,
        isHeader: true
      });
      i++;
    } else {
      // Gather contiguous deleted and added lines to align them
      const deletes: string[] = [];
      const adds: string[] = [];
      
      while (i < lines.length) {
        const currentLine = lines[i];
        if (currentLine === undefined) break;
        if (currentLine.startsWith('-') && !currentLine.startsWith('---')) {
          deletes.push(currentLine.slice(1));
          i++;
        } else if (currentLine.startsWith('+') && !currentLine.startsWith('+++')) {
          adds.push(currentLine.slice(1));
          i++;
        } else {
          break;
        }
      }
      
      if (deletes.length > 0 || adds.length > 0) {
        const maxLength = Math.max(deletes.length, adds.length);
        for (let j = 0; j < maxLength; j++) {
          result.push({
            leftText: deletes[j] !== undefined ? `-${deletes[j]}` : ' ',
            leftBg: deletes[j] !== undefined ? 'bg-red-50' : 'bg-slate-50/40',
            leftColor: deletes[j] !== undefined ? 'text-red-700 font-medium' : 'text-transparent select-none',
            rightText: adds[j] !== undefined ? `+${adds[j]}` : ' ',
            rightBg: adds[j] !== undefined ? 'bg-emerald-50' : 'bg-slate-50/40',
            rightColor: adds[j] !== undefined ? 'text-emerald-700 font-medium' : 'text-transparent select-none',
          });
        }
      } else {
        // Normal context line
        result.push({
          leftText: line,
          leftBg: 'bg-transparent',
          leftColor: 'text-slate-600',
          rightText: line,
          rightBg: 'bg-transparent',
          rightColor: 'text-slate-600',
        });
        i++;
      }
    }
  }
  
  return result;
}

export default function PRPreviewModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        setDiff(getMockDiff());
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedDiff = parseUnifiedDiffToSideBySide(diff);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-black/5 bg-slate-50">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900">Review Pull Request Changes</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Generating diff...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden font-mono text-xs shadow-sm flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-slate-600 font-bold uppercase tracking-wider text-[10px] flex justify-between items-center">
                <span>Side-by-Side Diff Viewer</span>
                <span className="bg-slate-200 text-slate-700 rounded px-1.5 py-0.5 text-[9px] font-mono">App.tsx</span>
              </div>
              
              <div className="grid grid-cols-2 bg-slate-200 gap-[1px]">
                {/* Column Headers */}
                <div className="bg-slate-50/90 py-1.5 px-3 font-semibold text-slate-500 uppercase text-[9px] border-b border-slate-200">
                  Original (Local)
                </div>
                <div className="bg-slate-50/90 py-1.5 px-3 font-semibold text-slate-500 uppercase text-[9px] border-b border-slate-200">
                  Incoming (Modified)
                </div>
              </div>

              <div className="flex flex-col overflow-x-auto">
                {parsedDiff.map((row, i) => {
                  if (row.isHeader) {
                    let color = 'text-slate-500';
                    let bg = 'bg-slate-100/80';
                    if (row.leftText?.startsWith('@@')) {
                      color = 'text-blue-500';
                      bg = 'bg-blue-50/50';
                    }
                    return (
                      <div key={i} className={`w-full py-1 px-4 font-bold border-y border-slate-100 ${bg} ${color} truncate`}>
                        {row.leftText}
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="grid grid-cols-2 gap-[1px] bg-slate-200 border-b border-slate-100 last:border-b-0">
                      <div className={`${row.leftBg} p-2 font-mono whitespace-pre text-left overflow-x-auto min-h-[28px] ${row.leftColor}`}>
                        {row.leftText}
                      </div>
                      <div className={`${row.rightBg} p-2 font-mono whitespace-pre text-left overflow-x-auto min-h-[28px] ${row.rightColor}`}>
                        {row.rightText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-black/5 bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            Confirm & Create PR
            <GitPullRequest className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
