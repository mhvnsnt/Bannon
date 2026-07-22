import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';

// Using a subset for Batch 1 as a starting point. This can be expanded.

const BATCH_2 = [
  { id: 'solaris_justice', name: 'Solaris Justice' },
  { id: 'atlas_vance', name: 'Atlas Vance' },
  { id: 'stick_up', name: 'Stick Up (Andre Curtis)' },
  { id: 'finxsse', name: 'Finxsse' },
  { id: 'red_cloud', name: 'Red Cloud' },
  { id: 'cassian_thorne', name: 'Cassian Thorne' },
  { id: 'sombra_negra', name: 'Sombra Negra' },
  { id: 'karma', name: 'Karma' }
];

const BATCH_1 = [
  { id: 'bannon', name: 'Bannon' },
  { id: 'queen_tyneshia', name: 'Queen Tyneshia' },
  { id: 'cain_elias', name: 'Cain Elias' },
  { id: 'maime', name: 'Maime' },
  { id: 'cipher', name: 'Cipher' },
];

export const VoiceManager = () => {
  const [availableReferences, setAvailableReferences] = useState<string[]>([]);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const fetchReferences = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/list_references');
      const data = await response.json();
      setAvailableReferences(data.available_references || []);
    } catch (error) {
      console.error('Failed to fetch available references:', error);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  const getCharName = (id: string) => [...BATCH_1, ...BATCH_2].find(c => c.id === id)?.name || id;

  return (
    <div className="voice-manager bg-black/90 p-4 border border-red-900/50 rounded-md w-full mt-4">
      <div className="flex justify-between items-center mb-4 border-b border-red-900/30 pb-2">
        <h3 className="text-red-500 text-xl font-bold uppercase tracking-widest">
          Voice Reference Manager
        </h3>
        <button 
          onClick={fetchReferences}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-900/50 rounded"
        >
          Refresh List
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-gray-300 font-bold mb-2">Batch 1 (Core & Unhinged)</h4>
        <div className="flex flex-wrap gap-2">
          {BATCH_1.map(char => {
            const hasRef = availableReferences.includes(char.id);
            return (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char.id)}
                className={`px-3 py-2 border rounded text-sm font-bold transition-all ${
                  selectedChar === char.id ? 'ring-2 ring-red-500 bg-gray-800' : 'bg-black hover:bg-gray-900'
                } ${hasRef ? 'border-green-600 text-green-500' : 'border-red-900/50 text-red-500'}`}
              >
                {char.name} {hasRef && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      
      <div className="mb-4">
        <h4 className="text-gray-300 font-bold mb-2">Batch 2 (Core Additions)</h4>
        <div className="flex flex-wrap gap-2">
          {BATCH_2.map(char => {
            const hasRef = availableReferences.includes(char.id);
            return (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char.id)}
                className={`px-3 py-2 border rounded text-sm font-bold transition-all ${
                  selectedChar === char.id ? 'ring-2 ring-red-500 bg-gray-800' : 'bg-black hover:bg-gray-900'
                } ${hasRef ? 'border-green-600 text-green-500' : 'border-red-900/50 text-red-500'}`}
              >
                {char.name} {hasRef && '✓'}
              </button>
            );
          })}
        </div>
      </div>
  
      {selectedChar && (
        <VoiceRecorder 
          characterId={selectedChar} 
          characterName={getCharName(selectedChar)} 
        />
      )}
    </div>
  );
};
