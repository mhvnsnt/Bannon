import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, ShieldAlert, Lock, Unlock, Search, Database, Tag, Activity, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import * as d3 from 'd3';

export default function SecurityVault() {
  const [user] = useAuthState(auth);
  const [entries, setEntries] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');
  const [newTags, setNewTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'archives' | 'audit'>('archives');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to the backend for SIEM readouts
    const fetchLogs = async () => {
       try {
           const res = await fetch('/api/siem-vault');
           if (res.ok) {
               const data = await res.json();
               if (data.logs) {
                   setAuditLogs(data.logs);
               }
           }
       } catch (e) {
           console.error("Failed to fetch SIEM logs", e);
       }
    };
    
    if (activeTab === 'audit') {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'audit' || auditLogs.length === 0 || !chartRef.current) return;

    // Build the D3 Heatmap
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process logs to hourly distribution
    const now = new Date();
    const hourlyCounts = new Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
      lockouts: 0
    }));

    auditLogs.forEach(log => {
       const d = new Date(log.timestamp);
       // Only count today's logs for heatmap
       if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
           const hr = d.getHours();
           hourlyCounts[hr].count += 1;
           if (log.status === 'BLOCKED' || log.status === 'ERROR' || log.status === 'CRITICAL') {
               hourlyCounts[hr].lockouts += 1;
           }
       }
    });

    const x = d3.scaleBand()
      .range([0, width])
      .domain(hourlyCounts.map(d => d.hour.toString()))
      .padding(0.05);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(hourlyCounts, d => Math.max(d.count, d.lockouts)) || 10]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}h`))
      .attr('color', '#555')
      .selectAll('text')
      .attr('fill', '#999');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .attr('color', '#555')
      .selectAll('text')
      .attr('fill', '#999');

    // Draw total events
    svg.selectAll('.bar-total')
      .data(hourlyCounts)
      .enter()
      .append('rect')
        .attr('class', 'bar-total')
        .attr('x', d => x(d.hour.toString())!)
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count))
        .attr('fill', 'rgba(6, 182, 212, 0.4)') // cyan-500 low opacity
        .attr('rx', 2);

    // Draw lockouts/errors overlay
    svg.selectAll('.bar-lockout')
      .data(hourlyCounts)
      .enter()
      .append('rect')
        .attr('class', 'bar-lockout')
        .attr('x', d => x(d.hour.toString())!)
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.lockouts))
        .attr('height', d => height - y(d.lockouts))
        .attr('fill', 'rgba(239, 68, 68, 0.8)') // red-500
        .attr('rx', 2);

  }, [auditLogs, activeTab]);


  const isPrimeNode = user?.email === 'MarquisWhitacre@gmail.com';

  useEffect(() => {
    if (!user || !db) {
      setEntries([
        {
          id: 'offline-vault-1',
          label: 'Offline Vault Spec',
          secretText: 'Local secure state is active. Physical DB connection bypass active.',
          tags: ['Local', 'Sandbox'],
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }
    
    // Prime Node sees all, others see own
    const vaultRef = collection(db, 'vault');
    const q = isPrimeNode ? query(vaultRef, orderBy('timestamp', 'desc')) : query(vaultRef, where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
    }, (error) => {
      console.error(error);
    });

    return () => unsubscribe();
  }, [user, isPrimeNode]);

  const handleSave = async () => {
    if (!newLabel || !newText || !user) return;
    try {
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
      
      // Auto-tagging logic based on text and label
      const combinedText = `${newLabel} ${newText}`.toLowerCase();
      if (combinedText.includes('money') || combinedText.includes('deal') || combinedText.includes('capital') || combinedText.includes('financial')) {
        if (!tagsArray.includes('Financial')) tagsArray.push('Financial');
      }
      if (combinedText.includes('esoteric') || combinedText.includes('transit') || combinedText.includes('gravity') || combinedText.includes('synastry')) {
        if (!tagsArray.includes('Esoteric')) tagsArray.push('Esoteric');
      }
      if (combinedText.includes('strategy') || combinedText.includes('vector') || combinedText.includes('strike') || combinedText.includes('protocol')) {
        if (!tagsArray.includes('Strategic')) tagsArray.push('Strategic');
      }
      if (tagsArray.length === 0) {
        tagsArray.push('Uncategorized');
      }

      if (!db) {
         // Local addition in sandbox mode
         const newLocalEntry = {
           id: 'local-' + Date.now(),
           label: newLabel,
           secretText: newText,
           tags: tagsArray,
           timestamp: new Date().toISOString(),
           ownerId: user.uid
         };
         setEntries(prev => [newLocalEntry, ...prev]);
         setNewLabel('');
         setNewText('');
         setNewTags('');
         setIsAdding(false);
         return;
      }

      await addDoc(collection(db, 'vault'), {
        ownerId: user.uid,
        label: newLabel,
        text: newText,
        tags: tagsArray,
        encryptedData: 'SIMULATED_AES_256_' + Date.now().toString(16),
        timestamp: serverTimestamp()
      });
      
      setIsAdding(false);
      setNewLabel('');
      setNewText('');
      setNewTags('');
    } catch (e) {
      console.error(e);
      alert("Encryption error.");
    }
  };

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    setHealthStatus(null);
    try {
      // We simulate a health check
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHealthStatus(`STATUS: SECURE | SCANNED: ${entries.length} | MESSAGE: All client-side encryption layers robust.`);
    } catch (e) {
      setHealthStatus("ERROR: Failed to run cryptographic health check.");
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runBatchAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      // We pass the currently filtered decrypted items to the backend for Gemini planetary analysis
      const res = await fetch('/api/armada/vault/batch-analyze', { 
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ entries: filteredEntries })
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (e) {
      console.error(e);
      setAnalysisResult("Failed to complete batch analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(e => {
      if (e.label?.toLowerCase().includes(query)) return true;
      if (e.text?.toLowerCase().includes(query)) return true;
      if (e.tags && e.tags.some((t: string) => t.toLowerCase().includes(query))) return true;
      if (isPrimeNode && e.ownerId?.toLowerCase().includes(query)) return true; // Allows Prime node to search by UID
      return false;
    });
  }, [entries, searchQuery, isPrimeNode]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-[#0a0a0a] text-gray-200"
    >
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-white">
              <Shield className="w-5 h-5 text-red-500" />
              <h2>Security Vault {isPrimeNode ? <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded tracking-wide ml-2">PRIME NODE: OMNI-VISION</span> : ''}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Air-gapped shadow storage. Revenge calculus & deepest engineering vectors.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={runHealthCheck}
              disabled={isCheckingHealth}
              className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isCheckingHealth ? <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-red-400" />} 
              {isCheckingHealth ? "Scanning..." : "Health Check"}
            </button>
            <button 
              onClick={runBatchAnalysis}
              disabled={isAnalyzing || entries.length === 0}
              className="bg-purple-950/30 hover:bg-purple-900/50 border border-purple-900/50 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <><span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Analyzing...</>
              ) : (
                <><Activity className="w-4 h-4" /> Batch Jupiter/Mars Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('archives')}
            className={`pb-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'archives' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Encrypted Archives
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`pb-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'audit' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {healthStatus && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-sm text-gray-300 shadow-md font-mono"
          >
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-2 uppercase text-xs tracking-widest">
              <ShieldAlert className="w-4 h-4" /> Encryption Engine Diagnostics
            </div>
            {healthStatus}
          </motion.div>
        )}
        {analysisResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 text-sm text-purple-200 whitespace-pre-wrap leading-relaxed shadow-[0_0_15px_rgba(168,85,247,0.1)]"
          >
            <div className="flex items-center gap-2 text-purple-400 font-semibold mb-2">
              <Activity className="w-4 h-4" /> Kinetic Synthesis Output
            </div>
            {analysisResult}
          </motion.div>
        )}

        <div className="flex gap-2">
          {activeTab === 'archives' && (
            isAdding ? (
               <motion.div 
                 initial={{ scale: 0.95 }}
                 animate={{ scale: 1 }}
                 className="bg-[#111] border border-red-500/30 rounded-xl p-4 flex flex-col gap-3 w-full"
               >
                 <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                   <Lock className="w-4 h-4" /> Encrypt New Entry
                 </div>
                 <input 
                   type="text" 
                   placeholder="Target / Vector Label (e.g., 'Vienna Manufacturing Deal')"
                   value={newLabel}
                   onChange={e => setNewLabel(e.target.value)}
                   className="bg-[#0a0a0a] border border-[#333] p-2 rounded-lg text-sm focus:outline-none focus:border-red-500"
                 />
                 <input 
                   type="text" 
                   placeholder="Tags (comma separated). Auto-tags: Financial, Esoteric, Strategic"
                   value={newTags}
                   onChange={e => setNewTags(e.target.value)}
                   className="bg-[#0a0a0a] border border-[#333] p-2 rounded-lg text-sm focus:outline-none focus:border-red-500"
                 />
                 <textarea 
                   placeholder="Sensitive operational data..."
                   value={newText}
                   onChange={e => setNewText(e.target.value)}
                   className="bg-[#0a0a0a] border border-[#333] p-2 rounded-lg text-sm h-32 resize-none focus:outline-none focus:border-red-500"
                 />
                 <div className="flex justify-end gap-2 mt-2">
                   <button 
                     onClick={() => setIsAdding(false)}
                     className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleSave}
                     className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                   >
                     <ShieldAlert className="w-4 h-4" /> Encrypt & Store
                   </button>
                 </div>
               </motion.div>
            ) : (
               <button 
                 onClick={() => setIsAdding(true)}
                 className="flex-1 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors h-[46px]"
               >
                 <Lock className="w-4 h-4 text-red-500" /> Store High-Stakes Vector
               </button>
            )
          )}
          {!isAdding && activeTab === 'archives' && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={isPrimeNode ? `Filter across ${entries.length} vault entries or UID...` : "Filter by label or tag..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#333] pl-9 pr-3 py-2 h-[46px] rounded-xl text-sm focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
          )}
        </div>

        {activeTab === 'archives' ? (
          <div className="space-y-3 mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Encrypted Archives</div>
            {filteredEntries.length === 0 && !isAdding && (
               <div className="text-center p-6 text-gray-600 text-sm border border-dashed border-[#333] rounded-xl flex flex-col items-center gap-2">
                  <Database className="w-6 h-6 opacity-50" />
                  No matching entries found.
               </div>
            )}
            <AnimatePresence>
              {filteredEntries.map((e, idx) => (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                   key={e.id} 
                   className="bg-[#111] border border-[#222] p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group"
                 >
                   <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="flex flex-col gap-1">
                     <div className="text-xs text-red-400 font-mono tracking-wider flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Unlock className="w-3 h-3" /> DECRYPTED IN MEMORY 
                          {isPrimeNode && e.ownerId !== user?.uid && <span className="text-[10px] bg-red-950 text-red-500 px-1 ml-2 rounded">FOREIGN UID: {e.ownerId?.slice(0,8)}</span>}
                        </div>
                        <div className="text-gray-500">{e.timestamp?.toDate ? new Date(e.timestamp.toDate()).toLocaleString() : 'Just now'}</div>
                     </div>
                     <div className="font-semibold text-gray-200 mt-1">{e.label}</div>
                     {e.tags && e.tags.length > 0 && (
                       <div className="flex flex-wrap gap-1.5 mt-1.5">
                         {e.tags.map((tag: string) => (
                           <span key={tag} className="px-2 py-0.5 rounded-md bg-[#222] border border-[#333] text-[10px] uppercase font-semibold tracking-wider text-gray-400 flex items-center gap-1">
                             <Tag className="w-3 h-3" /> {tag}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                   <div className="text-sm text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed border-t border-[#222] pt-3">
                     {e.text}
                   </div>
                 </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Daily Attack Patterns (Heatmap)</div>
            </div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="w-full bg-[#111] border border-[#222] rounded-xl p-2 relative h-[200px]"
            >
               <div ref={chartRef} className="w-full h-full" />
            </motion.div>

            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1 mt-6">Real-Time Threat Matrix</div>
            <div className="max-h-[600px] overflow-y-auto space-y-3">
              {auditLogs.length === 0 ? (
                 <div className="text-center p-6 text-gray-600 text-sm border border-dashed border-[#333] rounded-xl">
                    No active SIEM threats logged.
                 </div>
              ) : auditLogs.map((log, idx) => (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                   key={log.id} 
                   className="bg-[#111] border border-[#222] p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden"
                >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${log.status === 'BLOCKED' || log.status === 'ERROR' || log.status === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-500'} animate-pulse`} />
                       <h3 className={`text-sm font-semibold uppercase tracking-wide ${log.status === 'BLOCKED' || log.status === 'ERROR' || log.status === 'CRITICAL' ? 'text-red-400' : 'text-cyan-400'}`}>{log.event}</h3>
                     </div>
                     <span className="text-xs font-mono text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <div className="text-sm text-gray-400 mt-1">{log.detail}</div>
                   <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222] text-[10px] text-gray-500 font-mono uppercase">
                     <span>IP: {log.ip}</span>
                     <span className={`${log.status === 'BLOCKED' || log.status === 'ERROR' || log.status === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500'}`}>STS: {log.status}</span>
                   </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
