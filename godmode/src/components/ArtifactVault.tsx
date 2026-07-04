import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, ChevronRight, X, Database } from 'lucide-react';
import { BlueprintArchives } from '../data/BlueprintArchives';

export const ArtifactVault = () => {
    const [selectedFile, setSelectedFile] = useState<{filename: string, content: string} | null>(null);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 text-emerald-400 font-mono h-full">
            <div className="bg-[#0b120b] border-2 border-emerald-500/50 rounded-xl p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black opacity-40 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <BookOpen className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-widest flex items-center gap-2">
                           THE MASTER BLUEPRINT ARCHIVES
                        </h3>
                        <p className="text-xs text-emerald-400/80 mt-1 uppercase tracking-wider">All foundational documents, prompts, and specs injected into the neural core.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* File List */}
                <div className="md:col-span-4 bg-[#050a05] border border-emerald-900/50 rounded-xl overflow-hidden flex flex-col">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest p-4 border-b border-emerald-900/50 bg-[#0a120a] flex items-center justify-between">
                        <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Core Fragments</span>
                        <span className="text-emerald-700">{BlueprintArchives.length} files</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {BlueprintArchives.map((file, i) => (
                            <button 
                                key={i}
                                onClick={() => setSelectedFile(file)}
                                className={`w-full text-left p-3 rounded mb-2 font-mono text-xs truncate transition-all flex items-center justify-between hover:bg-emerald-900/40 ${selectedFile?.filename === file.filename ? 'bg-emerald-900/60 border border-emerald-500 text-emerald-300' : 'bg-[#0b120b] border border-emerald-900/30 text-emerald-600 hover:text-emerald-400'}`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <FileText className="w-3 h-3 shrink-0" /> {file.filename.split('/').pop()}
                                </span>
                                <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${selectedFile?.filename === file.filename ? 'rotate-90 text-emerald-400' : 'text-emerald-800'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Contents */}
                <div className="md:col-span-8 bg-[#050a05] border border-emerald-900/50 rounded-xl overflow-hidden flex flex-col">
                    {selectedFile ? (
                        <>
                            <div className="bg-[#0a120a] p-4 border-b border-emerald-900/50 flex justify-between items-center shrink-0">
                                <h4 className="text-sm font-bold text-emerald-300 truncate">
                                    {selectedFile.filename}
                                </h4>
                                <button onClick={() => setSelectedFile(null)} className="text-emerald-700 hover:text-rose-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-emerald-400/80 leading-relaxed font-medium">
                                    {selectedFile.content}
                                </pre>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-900/50 p-6 text-center">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm uppercase tracking-widest font-bold">Select a blueprint to load into active memory</p>
                            <p className="text-[10px] mt-2 max-w-sm">Every line of logic provided has been structurally crystallized into the simulation engine. The truth is autonomous.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
