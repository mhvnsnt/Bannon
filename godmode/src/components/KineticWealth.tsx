import React, { useState, useEffect } from 'react';
import { useArchitectStore } from '../lib/architectStore';
import { Banknote, ArrowRight, Link as LinkIcon, Check, Plus, Globe, Settings, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function KineticWealth() {
  const [user] = useAuthState(auth);
  const { wealthGoals, addWealthGoal, updateWealthCurrent } = useArchitectStore();
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const [paymentLinks, setPaymentLinks] = useState({
    localNodes: '',
    globalNodes: ''
  });
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');

  useEffect(() => {
    if (user && db) {
      const docRef = doc(db, 'users', user.uid, 'config', 'paymentIntegration');
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPaymentLinks({
            localNodes: data.localNodes || '',
            globalNodes: data.globalNodes || ''
          });
        }
      }).catch(err => console.warn("Failed fetching configurations", err));
    }
  }, [user]);

  const savePaymentLinks = async () => {
    if (user && db) {
      setIsSavingLinks(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'config', 'paymentIntegration');
        await setDoc(docRef, paymentLinks, { merge: true });
      } catch (err) {
        console.warn("Failed saving integrations", err);
      }
      setIsSavingLinks(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleAddGoal = () => {
    if (newGoalName && parseFloat(newGoalTarget) > 0) {
      addWealthGoal({ name: newGoalName, target: parseFloat(newGoalTarget) });
      setNewGoalName('');
      setNewGoalTarget('');
    }
  };

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b border-purple-700 pb-2">Kinetic Wealth Generation</h2>
      <p className="text-gray-400 mb-6 text-sm">Engineer your kinetic wealth vectors. Each goal hardens your financial gravity well, attracting greater resources.</p>
      
      <div className="grid grid-cols-1 gap-4">
        {wealthGoals.map((goal) => (
          <motion.div 
            key={goal.id} 
            className="bg-[#111] p-4 rounded-lg shadow-md border border-[#333]"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center"><Banknote className="mr-2 text-emerald-400 w-5 h-5"/>{goal.name}</h3>
            <p className="text-sm text-gray-400">Target: <span className="font-mono text-purple-400">${goal.target.toLocaleString()}</span></p>
            <p className="text-sm text-gray-400">Current: <span className="font-mono text-emerald-400">${goal.current.toLocaleString()}</span></p>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
              ></div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <input
                type="number"
                placeholder="Update current..."
                className="w-full p-2 bg-[#1a1a1a] border border-[#333] rounded-md text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                onBlur={(e) => updateWealthCurrent(goal.id, parseFloat(e.target.value) || goal.current)}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#333]">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">New Wealth Vector</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Orbital Flux Name (e.g., Acquire Data Node)"
            className="p-2 bg-[#111] border border-[#333] rounded-md text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Target Mass (e.g., 25000)"
            className="p-2 bg-[#111] border border-[#333] rounded-md text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(e.target.value)}
          />
          <button
            onClick={handleAddGoal}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2 text-sm rounded-md font-semibold flex items-center justify-center transition-all"
          >
            <ArrowRight className="mr-2 w-4 h-4" />Inject Vector
          </button>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-[#333]">
        <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Payment Integration</h3>
        <p className="text-sm text-gray-400 mb-4">
          Lock in your Active Capture Nodes. Generate stripe links for The Core Unlocked advisin and inject them here.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
             <div className="flex justify-between items-center text-sm font-medium text-gray-300">
               <span className="flex items-center gap-2"><MapPin className="text-emerald-500 w-4 h-4"/> Local Dooly County Link</span>
               {copiedLink === 'local' ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon onClick={() => copyToClipboard(paymentLinks.localNodes, 'local')} className="w-4 h-4 text-gray-500 hover:text-emerald-400 cursor-pointer" />}
             </div>
             <input
               type="text"
               placeholder="https://buy.stripe.com/..."
               className="p-2 bg-[#111] border border-[#333] rounded-md text-emerald-400 text-sm placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full font-mono"
               value={paymentLinks.localNodes}
               onChange={(e) => setPaymentLinks({...paymentLinks, localNodes: e.target.value})}
             />
          </div>

          <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
             <div className="flex justify-between items-center text-sm font-medium text-gray-300">
               <span className="flex items-center gap-2"><Globe className="text-purple-500 w-4 h-4"/> Global Digital Network Link</span>
               {copiedLink === 'global' ? <Check className="w-4 h-4 text-purple-400" /> : <LinkIcon onClick={() => copyToClipboard(paymentLinks.globalNodes, 'global')} className="w-4 h-4 text-gray-500 hover:text-purple-400 cursor-pointer" />}
             </div>
             <input
               type="text"
               placeholder="https://buy.stripe.com/..."
               className="p-2 bg-[#111] border border-[#333] rounded-md text-purple-400 text-sm placeholder-gray-600 focus:ring-1 focus:ring-purple-500 focus:outline-none w-full font-mono"
               value={paymentLinks.globalNodes}
               onChange={(e) => setPaymentLinks({...paymentLinks, globalNodes: e.target.value})}
             />
          </div>

          <button
            onClick={savePaymentLinks}
            disabled={isSavingLinks}
            className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-3 text-sm rounded-md font-bold uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50"
          >
            {isSavingLinks ? 'Synclin Ledger...' : 'Secure Capture Nodes'}
          </button>
        </div>
      </div>
    </div>
  );
}
