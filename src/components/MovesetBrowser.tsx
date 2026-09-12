import { useState, useEffect } from 'react';
import { Play, Plus, Search, Activity, Maximize, Minimize, Save, Share2, Check } from 'lucide-react';
import { UMovesetLibraryAsset, EUnlockState } from '../data/schemas';
import { supabase } from '../lib/supabase';

const MOCK_MOVES: UMovesetLibraryAsset[] = [
    { MoveID: 'strike_jab_01', PositionGroup: 'Standing', MoveClass: 'Light Strikes', MoveMontage: 'anim_jab_01', PreviewThumbnail: '', StaminaCost: 5, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'strike_hook_heavy', PositionGroup: 'Standing', MoveClass: 'Heavy Strikes', MoveMontage: 'anim_hook_heavy', PreviewThumbnail: '', StaminaCost: 10, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'grapple_suplex_01', PositionGroup: 'Standing', MoveClass: 'Grapples Front', MoveMontage: 'anim_suplex_01', PreviewThumbnail: '', StaminaCost: 15, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'grapple_back_suplex', PositionGroup: 'Standing', MoveClass: 'Grapples Rear', MoveMontage: 'anim_back_suplex', PreviewThumbnail: '', StaminaCost: 15, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'run_clothesline', PositionGroup: 'Running', MoveClass: 'Running Strikes', MoveMontage: 'anim_run_clothesline', PreviewThumbnail: '', StaminaCost: 12, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'run_spear', PositionGroup: 'Running', MoveClass: 'Running Special', MoveMontage: 'anim_spear', PreviewThumbnail: '', StaminaCost: 30, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'finisher_stunner', PositionGroup: 'Standing', MoveClass: 'Signatures', MoveMontage: 'anim_stunner', PreviewThumbnail: '', StaminaCost: 50, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'corner_superplex', PositionGroup: 'Corner', MoveClass: 'Top Rope', MoveMontage: 'anim_superplex', PreviewThumbnail: '', StaminaCost: 40, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'ground_stomp', PositionGroup: 'Ground', MoveClass: 'Face Up', MoveMontage: 'anim_stomp', PreviewThumbnail: '', StaminaCost: 5, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'taunt_wakeup_01', PositionGroup: 'Taunt', MoveClass: 'Wake-up Taunt', MoveMontage: 'anim_taunt_wakeup', PreviewThumbnail: '', StaminaCost: 0, UnlockState: EUnlockState.Unlocked },
    { MoveID: 'payback_resiliency', PositionGroup: 'Paybacks', MoveClass: 'Resiliency', MoveMontage: 'anim_resiliency', PreviewThumbnail: '', StaminaCost: 0, UnlockState: EUnlockState.Unlocked },
];

const SUBTABS_MAP: Record<string, string[]> = {
    'moves_standing': ['Light Strikes', 'Heavy Strikes', 'Grapples Front', 'Grapples Rear'],
    'moves_running': ['Running Strikes', 'Running Grapples', 'Running Special'],
    'moves_ground': ['Face Up', 'Face Down', 'Seated (Snapmare)', 'Submissions'],
    'moves_corner': ['Standing Corner', 'Middle Rope', 'Top Rope', 'Tree of Woe', 'Avalanche Front', 'Avalanche Rear', 'Corner Run-In'],
    'moves_rope': ['Leaning on Ropes', 'Opponent on Apron', 'Player on Apron'],
    'moves_springboard': ['Standing Springboard', 'Running Springboard', 'Corner Springboard', 'Dive to Outside'],
    'moves_outside': ['Guardrail', 'Announcer Table', 'Ring Post', 'Floor Ground Offense'],
    'moves_signatures': ['Signatures', 'Finishers', 'Comebacks'],
    'moves_paybacks': ['Resiliency', 'Low Blow', 'Poison Mist', 'Run-In', 'Possum'],
    'moves_taunts': ['Wake-up Taunt', 'Crowd Taunt', 'Opponent Taunt'],
    'library': ['All Moves'],
    'editor': ['Move Editor']
};

export function MovesetBrowser({ activeSubcategoryId, onAssignMove }: { activeSubcategoryId?: string, onAssignMove?: (move: UMovesetLibraryAsset) => void }) {
    const subtabs = activeSubcategoryId ? (SUBTABS_MAP[activeSubcategoryId] || ['All']) : ['All'];
    const [activeTab, setActiveTab] = useState(subtabs[0]);
    const [search, setSearch] = useState('');
    const [previewMove, setPreviewMove] = useState<UMovesetLibraryAsset | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Reset active tab when subcategory changes
    useEffect(() => {
        if (subtabs.length > 0) {
            setActiveTab(subtabs[0]);
            setPreviewMove(null);
        }
    }, [activeSubcategoryId]);

    const filteredMoves = MOCK_MOVES.filter(m => {
        const matchesTab = activeTab === 'All Moves' || m.MoveClass === activeTab;
        const matchesSearch = m.MoveID.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleSaveAnimation = async () => {
        setSaveStatus('saving');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
                return;
            }

            // Create a custom animation payload
            const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            const customFinisher = {
                id: uuid,
                user_id: session.user.id,
                name: 'Custom Finisher',
                segments: ['Gut Kick', 'Fireman\'s Carry', 'Custom Impact'],
                created_at: new Date().toISOString()
            };

            // Push to shared Supabase table 'shared_animations' (or similar, we will use a generic table or user profile)
            // Assuming we save it to the user's profile under an array for now, since we don't know if shared_animations table exists
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            const existingAnimations = profile?.customAnimations || [];
            
            await supabase.from('profiles').upsert({
                id: session.user.id,
                customAnimations: [...existingAnimations, customFinisher]
            });

            setSaveStatus('success');
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
        }
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    if (activeSubcategoryId === 'editor') {
        return (
            <div className={`flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden min-h-[400px] transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'}`}>
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight uppercase">Create-A-Finisher</h2>
                        <p className="text-neutral-400 text-xs mt-1">Stitch together move segments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveStatus === 'success' && <span className="text-green-500 text-xs font-bold uppercase flex items-center gap-1"><Check className="w-3 h-3" /> Saved to Library</span>}
                        {saveStatus === 'error' && <span className="text-red-500 text-xs font-bold uppercase">Sync Failed (Auth Required)</span>}
                        {saveStatus === 'saving' && <span className="text-indigo-400 text-xs font-bold uppercase animate-pulse">Syncing to Cloud...</span>}
                        <button 
                            onClick={handleSaveAnimation}
                            disabled={saveStatus === 'saving'}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" /> Save & Share
                        </button>
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                    {/* Viewport for animation preview */}
                    <div className="flex-1 bg-black relative flex items-center justify-center border-b border-neutral-800 min-h-[200px]">
                         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 to-transparent" />
                         <div className="text-center z-10">
                             <Activity className={`text-neutral-600 mx-auto mb-2 opacity-50 ${isFullscreen ? 'w-24 h-24' : 'w-12 h-12'}`} />
                             <span className="text-neutral-500 text-xs font-mono uppercase tracking-widest">Animation Viewport {isFullscreen && '(Full Screen)'}</span>
                         </div>
                         <button className="absolute bottom-4 right-4 p-3 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors group">
                             <Play className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                         </button>
                    </div>

                    {/* Timeline & Segments */}
                    <div className="h-48 bg-neutral-950 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Timeline Segments</span>
                            <span className="text-xs font-mono text-indigo-400">0.00s / 5.00s</span>
                        </div>
                        
                        <div className="flex gap-2 items-stretch h-20">
                            {/* Setup/Clutch Segment */}
                            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded flex flex-col p-2 hover:border-indigo-500 cursor-pointer transition-colors relative group">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">1. Setup</span>
                                <span className="text-xs text-white truncate">Gut Kick</span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-neutral-800" />
                            </div>

                            {/* Lift/Transition Segment */}
                            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded flex flex-col p-2 hover:border-indigo-500 cursor-pointer transition-colors relative group">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">2. Lift</span>
                                <span className="text-xs text-white truncate">Fireman's Carry</span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-neutral-800" />
                            </div>

                            {/* Impact Segment */}
                            <div className="flex-1 bg-neutral-900 border border-indigo-900/50 rounded flex flex-col p-2 hover:border-indigo-500 cursor-pointer transition-colors relative group">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">3. Impact</span>
                                <span className="text-xs text-white truncate">+ Select Animation</span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-600" />
                            </div>

                            <button className="w-12 border border-dashed border-neutral-700 rounded flex items-center justify-center hover:border-neutral-500 transition-colors text-neutral-500 hover:text-white">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrub Bar */}
                        <div className="mt-6 relative">
                            <div className="h-1 bg-neutral-800 rounded-full w-full" />
                            <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-3 h-6 bg-indigo-500 rounded-sm shadow-[0_0_10px_rgba(79,70,229,0.5)] cursor-ew-resize" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden min-h-[400px]">
            {/* Library List */}
            <div className="w-1/2 flex flex-col border-r border-neutral-800">
                <div className="p-4 border-b border-neutral-800 space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {subtabs.map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input 
                            type="text" 
                            placeholder="Search moves..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredMoves.map(move => (
                        <div 
                            key={move.MoveID}
                            onClick={() => setPreviewMove(move)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${previewMove?.MoveID === move.MoveID ? 'bg-indigo-900/40 border border-indigo-500/50' : 'hover:bg-neutral-800 border border-transparent'}`}
                        >
                            <div>
                                <div className="text-sm font-medium text-white">{move.MoveID}</div>
                                <div className="text-xs text-neutral-500">{move.PositionGroup} • {move.StaminaCost} STM</div>
                            </div>
                            <Play className={`w-4 h-4 ${previewMove?.MoveID === move.MoveID ? 'text-indigo-400' : 'text-neutral-600'}`} />
                        </div>
                    ))}
                    {filteredMoves.length === 0 && (
                        <div className="p-4 text-center text-sm text-neutral-500">No moves found in this category.</div>
                    )}
                </div>
            </div>

            {/* Preview & Assign */}
            <div className="w-1/2 bg-neutral-950 p-6 flex flex-col items-center justify-center relative">
                {previewMove ? (
                    <div className="text-center w-full max-w-sm">
                        <div className="aspect-video bg-neutral-900 border border-neutral-800 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden shadow-xl shadow-black/50">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518611507436-f9221403cca2?q=80&w=3174&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <Play className="w-12 h-12 text-indigo-500 mb-2" />
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Previewing Animation</span>
                                <span className="text-sm text-white mt-1">{previewMove.MoveMontage}.montage</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{previewMove.MoveID}</h3>
                        <p className="text-sm text-neutral-400 mb-6">{previewMove.MoveClass} • {previewMove.PositionGroup}</p>
                        <button 
                            onClick={() => onAssignMove?.(previewMove)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" /> Assign to Slot
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-neutral-500">
                        <Play className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Select a move to preview</p>
                    </div>
                )}
            </div>
        </div>
    );
}
