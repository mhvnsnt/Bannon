import React, { useState } from 'react';
import { useArchitectStore } from '../lib/architectStore';
import { Trophy, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdvisinMatrix from './AdvisinMatrix';
import BroadcastEngine from './BroadcastEngine';

export default function PrimeDirectivesOS() {
  const { primeDirectives, addPrimeDirective, togglePrimeDirective } = useArchitectStore();
  const [newDirective, setNewDirective] = useState('');

  const handleAddDirective = () => {
    if (newDirective) {
      addPrimeDirective({ name: newDirective });
      setNewDirective('');
    }
  };

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h2 className="text-2xl font-bold mb-4 text-amber-500 border-b border-amber-500/30 pb-2">Prime Architect</h2>
      <p className="text-gray-400 mb-6 text-sm">Dictate your overarching directives, map your trajectory, and track the hardening of your reality construct.</p>
      
      <div className="space-y-3">
        {primeDirectives.map((directive) => (
          <motion.div 
            key={directive.id} 
            className={`p-3 rounded-lg shadow-md border flex items-center justify-between transition-colors duration-200 cursor-pointer ${
              directive.complete ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111] border-[#333] hover:border-amber-500/50'
            }`}
            onClick={() => togglePrimeDirective(directive.id)}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              {directive.complete ? (
                <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
              <span className={`text-sm ${directive.complete ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                {directive.name}
              </span>
            </div>
            {directive.complete && <Trophy className="text-amber-400 flex-shrink-0 ml-2" size={16} />}
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#333]">
        <h3 className="text-lg font-semibold text-amber-400 mb-4">Declare New Prime Directive</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Declare new reality construct..."
            className="p-3 bg-[#111] border border-[#333] rounded-md text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            value={newDirective}
            onChange={(e) => setNewDirective(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDirective()}
          />
          <button
            onClick={handleAddDirective}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white p-2 text-sm rounded-md font-semibold flex items-center justify-center transition-all"
          >
            <ArrowRight className="mr-2 w-4 h-4" />Inject Directive
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
          <AdvisinMatrix />
          <BroadcastEngine />
      </div>
    </div>
  );
}
