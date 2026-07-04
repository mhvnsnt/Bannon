import React, { useState, useEffect } from 'react';
import { Terminal, Plus, Trash2, Edit2, Check, X, Loader2, Save } from 'lucide-react';

interface Directive {
  id: string;
  content: string;
  active: number;
  created_at?: string;
}

export default function DirectiveVault() {
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDirective, setNewDirective] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchDirectives();
  }, []);

  const fetchDirectives = async () => {
    try {
      const res = await fetch('/api/directives');
      if (res.ok) {
        const data = await res.json();
        
        const BARE_METAL_ACTUATION_PROTOCOL = `### BARE METAL ACTUATION PROTOCOL
* Direct physical terminal control is structurally validated across loopback address port 9999.
* For all tasks involving project creation, dependencies updates, configuration alterations, or local compilation, you must format the raw terminal syntax inside executable blocks.
* Do not provide structural walk throughs or instructional narrative explanations. Output the bare code string so the frontend interceptor loop can pass it straight to the hardware layer.

### CHAIN OF THOUGHT MATRIX
Before generatin any code or terminal commands you must map your internal logic debugging steps and spatial reasoning inside <thought_matrix> tags. 
Analyze the current Sector Matrix read the file dependencies and state your exact plan of execution. 
Only after closin the </thought_matrix> tag will you output the final executable \`\`\`bash blocks or standard text.`;

        const hasProtocol = data.some((d: any) => d.content.includes("BARE METAL ACTUATION PROTOCOL"));
        if (!hasProtocol) {
          data.unshift({
            id: 'bare-metal-protocol',
            content: BARE_METAL_ACTUATION_PROTOCOL,
            active: 1
          });
        }
        
        setDirectives(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDirective.trim()) return;
    try {
      const res = await fetch('/api/directives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newDirective, active: 1 })
      });
      if (res.ok) {
        const d = await res.json();
        setDirectives([d, ...directives]);
        setNewDirective('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/directives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDirectives(directives.filter(d => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (directive: Directive) => {
    try {
      const updated = { ...directive, active: directive.active ? 0 : 1 };
      const res = await fetch(`/api/directives/${directive.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setDirectives(directives.map(d => d.id === directive.id ? updated : d));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async (id: string) => {
    const directive = directives.find(d => d.id === id);
    if (!directive || !editContent.trim()) return;
    try {
      const updated = { ...directive, content: editContent };
      const res = await fetch(`/api/directives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setDirectives(directives.map(d => d.id === id ? updated : d));
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-3">
        <Terminal className="w-5 h-5 text-indigo-400" />
        <h2 className="font-semibold text-gray-200 uppercase tracking-widest text-sm">Directive Vault</h2>
      </div>
      
      <div className="mb-4 flex gap-2">
        <input 
          type="text"
          value={newDirective}
          onChange={e => setNewDirective(e.target.value)}
          placeholder="New core directive..."
          className="flex-1 bg-[#111] border border-[#333] p-2 rounded text-sm focus:border-indigo-500 focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded flex items-center justify-center transition-colors px-4 font-semibold text-xs tracking-widest uppercase"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : directives.length === 0 ? (
          <div className="text-center p-8 text-gray-500 border border-dashed border-[#333] rounded">
            No directives loaded into the vault.
          </div>
        ) : (
          directives.map(d => (
            <div key={d.id} className={`p-3 rounded border flex flex-col gap-2 transition-colors ${d.active ? 'border-indigo-500/30 bg-[#111]' : 'border-[#222] bg-[#0a0a0a] opacity-60'}`}>
              <div className="flex justify-between items-start gap-4">
                {editingId === d.id ? (
                  <textarea 
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="flex-1 bg-[#000] border border-indigo-500/50 p-2 text-sm text-gray-200 outline-none rounded min-h-[60px]"
                  />
                ) : (
                  <div className="flex-1 text-sm text-gray-300 font-mono whitespace-pre-wrap">{d.content}</div>
                )}
                
                <div className="flex items-center gap-1">
                  {editingId === d.id ? (
                    <>
                      <button onClick={() => saveEdit(d.id)} className="p-1.5 text-green-400 hover:bg-[#222] rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-red-400 hover:bg-[#222] rounded"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleToggleActive(d)} 
                        className={`p-1.5 text-xs font-semibold tracking-wide uppercase rounded ${d.active ? 'text-indigo-400 hover:bg-[#222]' : 'text-gray-500 hover:bg-[#222]'}`}
                        title="Toggle Active Status"
                      >
                        {d.active ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(d.id);
                          setEditContent(d.content);
                        }} 
                        className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-[#222] rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(d.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-[#222] rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
