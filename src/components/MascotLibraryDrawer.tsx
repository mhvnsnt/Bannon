import React, { useState, useEffect } from 'react';
import { MascotUploader } from './MascotUploader';
import { AssetVault } from '../services/AssetVault';

export const MascotLibraryDrawer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [assets, setAssets] = useState<any[]>([]);

    useEffect(() => {
        const toggle = () => setIsOpen(v => !v);
        window.addEventListener('toggle-mascot-library', toggle);
        return () => window.removeEventListener('toggle-mascot-library', toggle);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Fetch cached library or God-Mode global list if admin
            const isGodMode = localStorage.getItem('codedummy-is-buyer') === 'true'; // simplified
            if (isGodMode) {
                AssetVault.getGlobalAssetRegistry().then(setAssets);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-[90] shadow-2xl p-6 flex flex-col text-white transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[#00F5D4] font-bold uppercase tracking-widest text-sm">Asset Vault</h2>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <MascotUploader />

            <div className="mt-8 flex-1 overflow-y-auto">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">God-Mode Panopticon Index</h3>
                <div className="space-y-3">
                    {assets.map(asset => (
                        <div key={asset.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center group hover:border-[#F15BB5] cursor-pointer transition-colors">
                            <div>
                                <div className="text-xs text-[#00F5D4] font-mono mb-1">{asset.filename}</div>
                                <div className="text-[10px] text-slate-500 font-mono">Owner: {asset.owner} | {asset.size}</div>
                            </div>
                            <button className="text-slate-400 group-hover:text-[#F15BB5] p-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <div className="text-slate-600 text-xs text-center mt-8 italic">No global assets indexed.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
