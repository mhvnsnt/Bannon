import React, { useState } from 'react';
import { useArchitectStore } from '../lib/architectStore';
import { Sigma, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrbitalResonance() {
  const { relationshipInsights, addRelationshipInsight } = useArchitectStore();
  const [newInsight, setNewInsight] = useState('');

  const handleAddInsight = () => {
    if (newInsight) {
      addRelationshipInsight(newInsight);
      setNewInsight('');
    }
  };

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h2 className="text-2xl font-bold mb-4 text-pink-500 border-b border-pink-500/30 pb-2">Orbital Resonance</h2>
      <p className="text-gray-400 mb-6 text-sm">Map the complex fields of human interaction. Parse the light and shadow dynamics of all human archetypes to refine your own social architecture.</p>
      
      <div className="space-y-3">
        {relationshipInsights.map((insight, index) => (
          <motion.div 
            key={index} 
            className="bg-[#111] p-3 rounded-lg shadow-md border border-[#333] flex items-start space-x-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Sigma className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-200 leading-relaxed">{insight}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#333]">
        <h3 className="text-lg font-semibold text-pink-400 mb-4">Inject New Resonance Insight</h3>
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="New observation (e.g., Active listening amplifies trust vectors)"
            className="p-3 bg-[#111] border border-[#333] rounded-md text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-pink-500 focus:outline-none min-h-[80px]"
            value={newInsight}
            onChange={(e) => setNewInsight(e.target.value)}
          />
          <button
            onClick={handleAddInsight}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white p-2 text-sm rounded-md font-semibold flex items-center justify-center transition-all"
          >
            <ArrowRight className="mr-2 w-4 h-4" />Calibrate Circuit
          </button>
        </div>
      </div>
    </div>
  );
}
