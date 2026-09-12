import React, { useState } from 'react';

// Hardcoded for now based on context, ideally this is imported from a central config
const MODEL_LIBRARY = [
  { id: 'bannon', name: 'Bannon', path: 'assets/models/bannon.glb' },
  { id: 'queen_tyneshia', name: 'Queen Tyneshia', path: 'assets/models/queen_tyneshia.glb' },
  { id: 'cain_elias', name: 'Cain Elias', path: 'assets/models/cain_elias.glb' },
  { id: 'maime', name: 'Maime', path: 'assets/models/maime.glb' },
  { id: 'cipher', name: 'Cipher', path: 'assets/models/cipher.glb' },
];

export const ModelGallery = ({ onSelectModel }: { onSelectModel: (model: any) => void }) => {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = (model: any) => {
    setLoadingId(model.id);
    // Simulate loading time for model fetch
    setTimeout(() => {
      setActiveModelId(model.id);
      setLoadingId(null);
      onSelectModel(model);
    }, 800);
  };

  return (
    <div className="model-gallery bg-black/90 p-4 border border-red-900/50 rounded-md w-full">
      <h3 className="text-red-500 text-xl font-bold mb-4 border-b border-red-900/30 pb-2 uppercase tracking-widest">
        Character Model Library
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {MODEL_LIBRARY.map((model) => (
          <div
            key={model.id}
            onClick={() => handleSelect(model)}
            className={`cursor-pointer border-2 transition-all duration-300 relative overflow-hidden group
              ${activeModelId === model.id ? 'border-red-600 bg-red-900/20' : 'border-gray-800 hover:border-red-500/50'}
              rounded-lg p-3 flex flex-col items-center justify-center min-h-[120px]`}
          >
            {loadingId === model.id && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            )}
            
            <div className="w-16 h-16 bg-gray-900 rounded-full mb-3 flex items-center justify-center border border-gray-700 group-hover:border-red-500/50 transition-colors">
              <span className="text-gray-500 font-mono text-xs">GLB</span>
            </div>
            
            <span className="text-gray-200 font-bold text-sm text-center uppercase">
              {model.name}
            </span>
            
            {activeModelId === model.id && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
