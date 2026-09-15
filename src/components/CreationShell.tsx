import { useState, ReactNode } from 'react';
import { ArrowLeft, Save, Shuffle, Check } from 'lucide-react';

export interface ShellCategory {
    id: string;
    label: string;
    icon: ReactNode;
    subcategories: { id: string; label: string }[];
}

interface CreationShellProps {
    title: string;
    categories: ShellCategory[];
    onSave?: () => void;
    renderGrid: (activeCategory: string, activeSubcategory: string) => ReactNode;
    renderPreview: () => ReactNode;
}

export function CreationShell({ title, categories, onSave, renderGrid, renderPreview }: CreationShellProps) {
    const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id);
    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const [activeSubcategoryId, setActiveSubcategoryId] = useState(activeCategory?.subcategories[0]?.id);

    const handleCategoryChange = (id: string) => {
        setActiveCategoryId(id);
        const cat = categories.find(c => c.id === id);
        if (cat && cat.subcategories.length > 0) {
            setActiveSubcategoryId(cat.subcategories[0].id);
        }
    };

    return (
        <div className="relative flex flex-col h-full bg-neutral-950 text-white overflow-hidden rounded-xl border border-neutral-800 font-sans">
            {/* Background 3D Preview (Full Screen) */}
            <div className="absolute inset-0 z-0">
                {renderPreview()}
            </div>

            {/* Foreground UI Layer */}
            <div className="relative z-10 flex flex-col h-full pointer-events-none">
                {/* Top Bar / Breadcrumbs */}
                <div className="h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 shrink-0 pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-neutral-800/80 rounded-full text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-sm drop-shadow-md">
                            <span className="font-bold text-neutral-300">{title}</span>
                            <span className="text-neutral-500">/</span>
                            <span className="text-indigo-400 font-medium">{activeCategory?.label}</span>
                            <span className="text-neutral-500">/</span>
                            <span className="text-neutral-300">{activeCategory?.subcategories.find(s => s.id === activeSubcategoryId)?.label}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden pointer-events-none">
                    {/* Left Sidebar and Menus (pointer-events-auto) */}
                    <div className="flex pointer-events-auto bg-gradient-to-r from-black/90 via-black/80 to-transparent w-[500px]">
                        {/* Vertical Category Tab Rail */}
                        <div className="w-20 flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto no-scrollbar border-r border-white/5">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 scale-105' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/10'}`}
                                    title={cat.label}
                                >
                                    {cat.icon}
                                    <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Horizontal Subcategory Strip */}
                            <div className="h-12 border-b border-white/5 flex items-center px-2 shrink-0 overflow-x-auto no-scrollbar">
                                {activeCategory?.subcategories.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setActiveSubcategoryId(sub.id)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors mx-1 ${activeSubcategoryId === sub.id ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>

                            {/* Center-Right Item Grid */}
                            <div className="flex-1 overflow-y-auto p-4 mask-image-bottom pb-20">
                                {renderGrid(activeCategoryId, activeSubcategoryId || '')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Controls */}
                <div className="h-16 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between px-6 shrink-0 pointer-events-auto">
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                            <Shuffle className="w-4 h-4" /> Randomize
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={onSave}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                        >
                            <Save className="w-4 h-4" /> Save Profile
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600/90 hover:bg-green-600 text-white rounded text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-sm shadow-[0_0_15px_rgba(22,163,74,0.3)]">
                            <Check className="w-4 h-4" /> Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
