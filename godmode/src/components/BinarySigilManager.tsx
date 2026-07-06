import React, { useState, useEffect } from 'react';
import { Database, Upload, Download, Trash2, Camera, Loader2 } from 'lucide-react';
import { openDB, IDBPDatabase } from 'idb';

const STORE_NAME = 'sigil-store';
const SECURE_DB_NAME = 'autonomous_binary_vault';

interface SigilVector {
  id: string;
  name: string;
  dataUrl: string; // Base64 chunk
  timestamp: string;
  gridLock: string; // Used for context mapping
}

export const useSigilVault = () => {
   const [db, setDb] = useState<IDBPDatabase | null>(null);

   useEffect(() => {
     let mounted = true;
     const initDB = async () => {
        try {
           const database = await openDB(SECURE_DB_NAME, 1, {
              upgrade(db) {
                 if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    console.log(`[SIGIL VAULT] Binary partition formatted at IndexedDB level.`);
                 }
              }
           });
           if (mounted) setDb(database);
        } catch (e: any) {
           console.error(`[SIGIL VAULT] Fatal IndexedDB breach:`, e.message);
        }
     };
     initDB();
     return () => { mounted = false; };
   }, []);

   const lockSigil = async (name: string, dataUrl: string, gridLock: string = 'Core') => {
      if (!db) return;
      const vector: SigilVector = {
          id: crypto.randomUUID(),
          name,
          dataUrl,
          timestamp: new Date().toISOString(),
          gridLock
      };
      await db.put(STORE_NAME, vector);
      return vector;
   };

   const extractSigils = async (): Promise<SigilVector[]> => {
      if (!db) return [];
      const keys = await db.getAllKeys(STORE_NAME);
      const items = await Promise.all(keys.map(k => db.get(STORE_NAME, k)));
      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
   };
   
   const purgeSigil = async (id: string) => {
      if (!db) return;
      await db.delete(STORE_NAME, id);
   };

   return { lockSigil, extractSigils, purgeSigil, isLocked: db !== null };
};

export default function BinarySigilManager() {
    const vault = useSigilVault();
    const [sigils, setSigils] = useState<SigilVector[]>([]);
    const [isIngesting, setIsIngesting] = useState(false);

    const refreshVault = async () => {
        if (!vault.isLocked) return;
        const vectors = await vault.extractSigils();
        setSigils(vectors);
    };

    useEffect(() => {
        refreshVault();
    }, [vault.isLocked]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsIngesting(true);
        try {
           const reader = new FileReader();
           reader.onload = async (event) => {
               const result = event.target?.result as string;
               if (result) {
                  await vault.lockSigil(file.name, result, 'GUI-Upload');
                  await refreshVault();
               }
               setIsIngesting(false);
           };
           reader.onerror = () => setIsIngesting(false);
           reader.readAsDataURL(file); // Convert binary SVG/PNG to locked Base64 string
        } catch (err) {
           console.error(err);
           setIsIngesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-4">
            <div className="flex items-center gap-2 border-b border-[#222] pb-3 mb-4">
                <Database className="w-5 h-5 text-fuchsia-500" />
                <h2 className="font-semibold text-gray-200">Local IndexedDB Binary Sigil Vault</h2>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 border border-[#222] p-3 rounded-lg bg-[#111]">
                Execute client-side persistence mechanisms. Binary vectors (SVGs, PNGs) minted here remain
                locked within the browser's local sandbox across reloads.
            </p>

            <div className="flex items-center justify-between mb-4">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                   Ingest Graphic Sigil Layer
                </label>
                
                <label className="bg-fuchsia-950/20 hover:bg-fuchsia-900/40 border border-fuchsia-900/50 text-fuchsia-400 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors">
                    {isIngesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isIngesting ? 'INGESTING...' : 'MANUAL INGEST'}</span>
                    <input 
                       type="file" 
                       accept="image/svg+xml,image/png,image/jpeg" 
                       className="hidden" 
                       onChange={handleFileUpload} 
                       disabled={isIngesting}
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto no-scrollbar pb-10">
                {sigils.length === 0 ? (
                    <div className="col-span-full border border-dashed border-[#333] rounded-xl p-8 flex flex-col items-center justify-center text-gray-600 gap-2">
                        <Camera className="w-8 h-8 opacity-50" />
                        <span className="text-xs font-mono uppercase">Vault Empty. Awaiting initial vector mapping.</span>
                    </div>
                ) : (
                    sigils.map(sigil => (
                        <div key={sigil.id} className="bg-[#111] border border-[#222] rounded-xl p-3 flex flex-col group relative overflow-hidden transition-all hover:border-[#444]">
                            <div className="w-full aspect-square bg-[#0a0a0a] rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-[#222]">
                                <img src={sigil.dataUrl} alt={sigil.name} className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="flex-1 flex flex-col justify-end">
                                <h3 className="text-xs font-bold text-gray-300 truncate w-full" title={sigil.name}>{sigil.name}</h3>
                                <div className="text-[10px] text-gray-600 font-mono mt-1">LOCKED: {new Date(sigil.timestamp).toLocaleTimeString()}</div>
                            </div>
                            
                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                  href={sigil.dataUrl} 
                                  download={sigil.name}
                                  className="p-1.5 bg-black/80 hover:bg-emerald-600 border border-[#333] rounded-md backdrop-blur-sm transition-colors cursor-pointer"
                                  title="Extract Vector Payload"
                                >
                                   <Download className="w-3.5 h-3.5 text-white" />
                                </a>
                                <button 
                                  onClick={async () => {
                                      await vault.purgeSigil(sigil.id);
                                      refreshVault();
                                  }}
                                  className="p-1.5 bg-black/80 hover:bg-red-600 border border-[#333] rounded-md backdrop-blur-sm transition-colors cursor-pointer"
                                  title="Purge Vector from Indexed Partition"
                                >
                                   <Trash2 className="w-3.5 h-3.5 text-white" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
