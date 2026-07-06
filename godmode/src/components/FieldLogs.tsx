import React, { useState, useEffect } from 'react';
import { FieldLog } from '../types';
import { Plus, Target, FileText, CheckCircle, XCircle, AlertCircle, BrainCircuit, Zap } from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function FieldLogs() {
  const [user] = useAuthState(auth);
  const [logs, setLogs] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState<Partial<FieldLog>>({ outcome: 'Success', negentropyDelta: 0 });
  const [agentResponse, setAgentResponse] = useState<string | null>(null);

  const isPrimeNode = user?.email === 'MarquisWhitacre@gmail.com';

  useEffect(() => {
    if (!user) return;
    if (!db) {
      setLogs([
        {
          id: 'offline-log-1',
          action: '[Field Log] Local Sandbox Vector - Success',
          timestamp: new Date().toISOString(),
          vector: 'Master Reality Compilation Matrix',
          outcome: 'Success',
          negentropyDelta: 99.9,
          notes: 'Running safely in localized offline-first client architecture.'
        }
      ]);
      return;
    }
    const logsRef = collection(db, 'logs');
    // FieldLogs: show own logs or Prime Node sees all
    const q = isPrimeNode ? query(logsRef, orderBy('timestamp', 'desc')) : query(logsRef, where('ownerId', '==', user.uid), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    }, (error) => {
      console.warn("[FieldLogs] Firestore listener error, reverting to local mock logs:", error);
      setLogs([
        {
          id: 'offline-log-1',
          action: '[Field Log] Local Sandbox Vector - Success',
          timestamp: new Date().toISOString(),
          vector: 'Master Reality Compilation Matrix',
          outcome: 'Success',
          negentropyDelta: 99.9,
          notes: 'Running safely in localized offline-first client architecture.'
        }
      ]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isPrimeNode]);

  const handleAdd = async () => {
    if (!newLog.vector || !user) return;
    
    // Check if offline
    if (!db) {
      const payload = {
        id: 'local-' + Date.now(),
        ownerId: user.uid,
        action: `[Field Log] ${newLog.vector} - ${newLog.outcome}`,
        timestamp: new Date().toISOString(),
        vector: newLog.vector,
        outcome: newLog.outcome,
        negentropyDelta: newLog.negentropyDelta,
        notes: newLog.notes || '',
        initialStrategy: newLog.initialStrategy || ''
      };
      setLogs(prev => [payload, ...prev]);
      setIsAdding(false);
      setNewLog({ outcome: 'Success', negentropyDelta: 0 });
      return;
    }
    
    try {
      // 1. Send to Gemini Backend for Agent Reflection
      const response = await fetch('/api/armada/fieldlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      const data = await response.json();
      
      if (data.success) {
        setAgentResponse(data.agentResponse);
      }

      // 2. Persist to Firestore Telemetry
      const payload = {
        ownerId: user.uid,
        action: `[Field Log] ${newLog.vector} - ${newLog.outcome}`,
        timestamp: serverTimestamp(),
        vector: newLog.vector,
        outcome: newLog.outcome,
        negentropyDelta: newLog.negentropyDelta,
        notes: newLog.notes || '',
        initialStrategy: newLog.initialStrategy || ''
      };
      await addDoc(collection(db, 'logs'), payload);

    } catch (e) {
      console.error(e);
    }

    setIsAdding(false);
    setNewLog({ outcome: 'Success', negentropyDelta: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-[#222] bg-[#111]">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Observation Logs
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Log
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {agentResponse && (
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-start gap-3">
             <BrainCircuit className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
             <div className="text-sm text-purple-100 max-w-full overflow-hidden" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{agentResponse}</div>
          </div>
        )}

        {isAdding && (
          <div className="p-5 bg-[#1a1a1a] border border-[#333] rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Focus or Goal</label>
              <input 
                type="text" 
                value={newLog.vector || ''}
                onChange={e => setNewLog({...newLog, vector: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-white transition-colors" 
                placeholder="e.g., Agricultural hub networking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Approach Used</label>
              <textarea 
                value={newLog.initialStrategy || ''}
                onChange={e => setNewLog({...newLog, initialStrategy: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none h-20 resize-none text-white transition-colors"
                placeholder="What did you do?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Result</label>
                <select 
                  value={newLog.outcome}
                  onChange={e => setNewLog({...newLog, outcome: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none text-white transition-colors"
                >
                  <option>Success</option>
                  <option>Mixed</option>
                  <option>Failure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4 text-purple-400"/> RL Reward Signal (Impact)</label>
                <input 
                  type="number" 
                  value={newLog.negentropyDelta || 0}
                  onChange={e => setNewLog({...newLog, negentropyDelta: Number(e.target.value)})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none text-white transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Notes / Reflection</label>
              <textarea 
                value={newLog.notes || ''}
                onChange={e => setNewLog({...newLog, notes: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none h-20 resize-none text-white transition-colors"
                placeholder="What did you learn?"
              />
            </div>
            <button 
              onClick={handleAdd}
              className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-2 rounded-lg transition-colors mt-2 flex justify-center items-center gap-2"
            >
              Submit to RLHF Training Loop <Zap className="w-4 h-4" />
            </button>
          </div>
        )}

        {logs.map(log => (
          <div key={log.id} className="p-5 bg-[#1a1a1a] border border-[#222] rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-white">{log.vector}</span>
              </div>
              <span className="text-xs text-gray-500 text-right">
                {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
                {isPrimeNode && log.ownerId !== user?.uid && <div className="text-[10px] bg-[#333] mt-1 px-1 rounded text-red-400 font-mono">FOREIGN ID</div>}
              </span>
            </div>
            
            <div className="pl-7 space-y-2">
              <p className="text-sm text-gray-300">
                <strong className="text-gray-500 mr-2 font-medium">Approach:</strong>
                {log.initialStrategy}
              </p>
              {log.notes && (
                <p className="text-sm text-gray-300">
                  <strong className="text-gray-500 mr-2 font-medium">Notes:</strong>
                  {log.notes}
                </p>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#222] pl-7">
              <div className={`flex items-center gap-1.5 text-sm font-medium ${
                log.outcome === 'Success' ? 'text-emerald-500' : 
                log.outcome === 'Failure' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {log.outcome === 'Success' && <CheckCircle className="w-4 h-4" />}
                {log.outcome === 'Failure' && <XCircle className="w-4 h-4" />}
                {log.outcome === 'Mixed' && <AlertCircle className="w-4 h-4" />}
                {log.outcome}
              </div>
              <div className="text-sm text-gray-400">
                Impact: <span className="font-semibold text-white">+{log.negentropyDelta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
