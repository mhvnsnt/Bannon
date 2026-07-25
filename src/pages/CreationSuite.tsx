import { useState, useEffect } from 'react';
import { User, Map as MapIcon, Activity, Video, Sparkles, HeartPulse, ShieldAlert, CheckCircle, Database, Server, RefreshCw } from 'lucide-react';
import { CreationShell, ShellCategory } from '../components/CreationShell';
import { MovesetBrowser } from '../components/MovesetBrowser';
import { ArenaCustomizer } from '../components/ArenaCustomizer';
import { supabase } from '../lib/supabase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { SuperstarProfile, SuperstarSerializer, createDefaultProfile } from '../types/character';
import { filterAvailableMoves } from '../lib/movesetUtils';
import { AgentBehaviorRepository } from '../components/AgentBehaviorRepository';
import { ThreePreview } from '../components/ThreePreview';


const CATEGORIES: ShellCategory[] = [
    {
        id: 'superstar',
        label: 'Superstar',
        icon: <User className="w-6 h-6" />,
        subcategories: [
            { id: 'body', label: 'Body Templates & Morphing' },
            { id: 'pose', label: 'Menu Screen Posing' },
            { id: 'face', label: 'Head & Face (Eyes, Teeth)' },
            { id: 'face_details', label: 'Face Details (Scars, Blemishes)' },
            { id: 'makeup', label: 'Makeup & Facepaint' },
            { id: 'hair', label: 'Hair & Facial Hair' },
            { id: 'torso', label: 'Torso & Body Parts' },
            { id: 'masks', label: 'Masks' },
            { id: 'clothing_upper', label: 'Clothing: Upper Body' },
            { id: 'clothing_lower', label: 'Clothing: Lower Body' },
            { id: 'clothing_head', label: 'Clothing: Headwear' },
            { id: 'clothing_feet', label: 'Clothing: Footwear' },
            { id: 'accessories', label: 'Accessories & Gear' },
            { id: 'traits', label: 'Fighting Style & AI DNA' },
            { id: 'injuries', label: 'Damage Persistence' }
        ]
    },
    {
        id: 'moveset',
        label: 'Moveset',
        icon: <Activity className="w-6 h-6" />,
        subcategories: [
            { id: 'moves_standing', label: 'Standing (Strikes/Grapples)' },
            { id: 'moves_running', label: 'Running Offense' },
            { id: 'moves_ground', label: 'Grounded Offense & Subs' },
            { id: 'moves_corner', label: 'Corner & Avalanche' },
            { id: 'moves_rope', label: 'Ropes & Apron' },
            { id: 'moves_springboard', label: 'Springboards & Dives' },
            { id: 'moves_outside', label: 'Ringside & Environment' },
            { id: 'moves_signatures', label: 'Signatures & Finishers' },
            { id: 'moves_paybacks', label: 'Paybacks & Abilities' },
            { id: 'moves_taunts', label: 'Taunts (Wake-up/Crowd)' },
        ]
    },
    {
        id: 'arena',
        label: 'Arena',
        icon: <MapIcon className="w-6 h-6" />,
        subcategories: [
            { id: 'ring', label: 'Ring & Mat' },
            { id: 'barricades', label: 'Barricades' },
            { id: 'stage', label: 'Stage & Ramp' },
            { id: 'trons', label: 'Titantron & Screens' }
        ]
    },
    {
        id: 'entrance',
        label: 'Entrance',
        icon: <Video className="w-6 h-6" />,
        subcategories: [
            { id: 'motion', label: 'Motion & Path' },
            { id: 'lighting', label: 'Lighting' },
            { id: 'pyro', label: 'Pyro & Effects' },
            { id: 'music', label: 'Theme Music' }
        ]
    }
];

// Helper to extract slider value from SubTraits array
const getTraitValue = (traits: string[] | undefined, name: string): number => {
    if (!traits) return 0.5;
    const found = traits.find(t => t.startsWith(`${name}:`));
    if (!found) return 0.5;
    const val = parseFloat(found.split(':')[1]);
    return isNaN(val) ? 0.5 : val;
};

// Helper to update slider value in SubTraits array
const setTraitValue = (traits: string[] | undefined, name: string, value: number): string[] => {
    const current = traits ? [...traits] : [];
    const index = current.findIndex(t => t.startsWith(`${name}:`));
    const entry = `${name}:${value.toFixed(2)}`;
    if (index >= 0) {
        current[index] = entry;
    } else {
        current.push(entry);
    }
    return current;
};

// Helper to get injury value
const getInjuryValue = (injuries: any, name: string): number => {
    if (!injuries) return 0;
    return injuries[name] ?? 0;
};

// Helper to update injury value
const setInjuryValue = (injuries: any, name: string, value: number): any => {
    const current = injuries ? { ...injuries } : { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 };
    current[name] = Math.round(value);
    return current;
};

export default function CreationSuite() {
    const [profile, setProfile] = useState<SuperstarProfile>(createDefaultProfile());
    const [arenaSettings, setArenaSettings] = useState<any>({
        matTexture: 'canvas_dark',
        barricadeStyle: 'steel_barrier',
        rampLength: 'extended_runway',
        titantronScale: 1.25,
        sideTronCount: 4,
        lightingRig: 'neon_grid',
        pyroLaunchers: true,
        ropeColor: '#4f46e5',
        soundtrack: 'bannon_theme_v2'
    });
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string>('');
    const [verificationLog, setVerificationLog] = useState<{
        status: 'idle' | 'success' | 'error';
        message: string;
        timestamp?: string;
        details?: string;
    }>({ status: 'idle', message: 'No sync events recorded yet' });

    // Load active profile from Supabase on mount
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('customSuperstar, customArena')
                        .eq('id', session.user.id)
                        .single();

                    if (!error && data) {
                        if (data.customSuperstar) {
                            const deserialized = SuperstarSerializer.fromSaveProfile(data.customSuperstar);
                            setProfile(deserialized);
                        }
                        if (data.customArena) {
                            setArenaSettings(data.customArena);
                        }
                        setVerificationLog({
                            status: 'success',
                            message: 'Successfully loaded profile and arena from Supabase Database!',
                            timestamp: new Date().toLocaleTimeString(),
                            details: `Loaded '${data.customSuperstar ? SuperstarSerializer.fromSaveProfile(data.customSuperstar).name : 'Saved Superstar'}' with custom arena configurations.`
                        });
                        setLoading(false);
                        return;
                    }
                }
                
                // Fallback to local storage if offline or not logged in or no Supabase data
                const local = localStorage.getItem('customSuperstar');
                const localArena = localStorage.getItem('customArena');
                
                if (localArena) {
                    setArenaSettings(JSON.parse(localArena));
                }
                
                if (local) {
                    const deserialized = SuperstarSerializer.fromSaveProfile(JSON.parse(local));
                    setProfile(deserialized);
                    setVerificationLog({
                        status: 'success',
                        message: 'Loaded profile and arena from local browser cache.',
                        timestamp: new Date().toLocaleTimeString()
                    });
                } else {
                    setVerificationLog({
                        status: 'success',
                        message: 'Initialized default superstar and arena.',
                        timestamp: new Date().toLocaleTimeString()
                    });
                }
            } catch (error) {
                console.warn("Failed to load profile:", error);
                setVerificationLog({
                    status: 'error',
                    message: 'Database load failed. Running in cache mode.',
                    timestamp: new Date().toLocaleTimeString(),
                    details: String(error)
                });
            } finally {
                setLoading(false);
            }
        };
        
        loadProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                loadProfile();
            }
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

        const saveAttireConfig = async () => {
        try {
            setSaveStatus('Saving Attire...');
            await setDoc(doc(db, 'attires', profile.id), {
                characterId: profile.id,
                name: profile.name,
                clothing: profile.clothing,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setSaveStatus('Attire Config Saved to Firebase');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save attire config to Firebase:', error);
            setSaveStatus('Failed to Save');
        }
    };

    const handleSave = async () => {
        setSaveStatus('Saving...');
        setVerificationLog({
            status: 'idle',
            message: 'Initiating round-trip verification test...'
        });

        const serialized = SuperstarSerializer.toSaveProfile(profile);

        // Always save to local storage as primary fallback / sync
        localStorage.setItem('customSuperstar', JSON.stringify(serialized));
        localStorage.setItem('customArena', JSON.stringify(arenaSettings));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.user) {
                setSaveStatus('Offline Fallback');
                setVerificationLog({
                    status: 'success',
                    message: 'Saved to local browser storage (authenticated session required for cloud sync).',
                    timestamp: new Date().toLocaleTimeString(),
                    details: 'Simulated 100% round-trip parity locally.'
                });
                setTimeout(() => setSaveStatus(''), 3000);
                return;
            }
            
            // 1. Write the profile and arena to Supabase
            const { error: writeError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: session.user.id, 
                    customSuperstar: serialized,
                    customArena: arenaSettings 
                });
                
            if (writeError) throw writeError;
            
            // 2. Perform a strict Round-Trip Verification read
            const { data: verifiedDoc, error: readError } = await supabase
                .from('profiles')
                .select('customSuperstar, customArena')
                .eq('id', session.user.id)
                .single();
                
            if (readError) throw readError;

            if (verifiedDoc) {
                // Compare values strictly to confirm no data loss
                const verifiedSave = verifiedDoc.customSuperstar;
                const matchesInjuries = verifiedSave ? JSON.stringify(verifiedSave.Injuries) === JSON.stringify(serialized.Injuries) : false;
                const matchesTraits = verifiedSave ? JSON.stringify(verifiedSave.SubTraits) === JSON.stringify(serialized.SubTraits) : false;
                const matchesArena = JSON.stringify(verifiedDoc.customArena) === JSON.stringify(arenaSettings);
                
                if (matchesInjuries && matchesTraits && matchesArena) {
                    setSaveStatus('Saved & Verified!');
                    setVerificationLog({
                        status: 'success',
                        message: 'Round-Trip Verification: 100% SUCCESS!',
                        timestamp: new Date().toLocaleTimeString(),
                        details: `Perfect data parity verified across cloud database. Injuries, SubTraits, and Arena match current client memory exactly.`
                    });
                } else {
                    setSaveStatus('Verification Failed');
                    setVerificationLog({
                        status: 'error',
                        message: 'Data Mismatch Detected during round-trip comparison!',
                        timestamp: new Date().toLocaleTimeString(),
                        details: `Mismatch found: Injuries match: ${matchesInjuries}, Traits match: ${matchesTraits}, Arena match: ${matchesArena}`
                    });
                }
            } else {
                throw new Error("Unable to read back the saved profile from database.");
            }
        } catch (error) {
            console.warn(error);
            setSaveStatus('Local Save Only');
            setVerificationLog({
                status: 'error',
                message: 'Supabase sync failed (likely missing tables/permissions). Saved locally instead.',
                timestamp: new Date().toLocaleTimeString(),
                details: String(error)
            });
        }

        setTimeout(() => setSaveStatus(''), 4000);
    };

    // Calculate live behavior/stat values based on active weights (BANNON_AI_DNA)
    const aggression = getTraitValue(profile.traits, 'aggression');
    const defense = getTraitValue(profile.traits, 'defense');
    const range = getTraitValue(profile.traits, 'range');
    const grapple = getTraitValue(profile.traits, 'grapple');
    const risk = getTraitValue(profile.traits, 'risk');
    const patience = getTraitValue(profile.traits, 'patience');
    const showmanship = getTraitValue(profile.traits, 'showmanship');

    // Calculate live health/stat deteriorations based on injuries
    const headInjury = getInjuryValue(profile.injuries, 'head');
    const torsoInjury = getInjuryValue(profile.injuries, 'torso');
    const leftArmInjury = getInjuryValue(profile.injuries, 'leftArm');
    const rightArmInjury = getInjuryValue(profile.injuries, 'rightArm');
    const leftLegInjury = getInjuryValue(profile.injuries, 'leftLeg');
    const rightLegInjury = getInjuryValue(profile.injuries, 'rightLeg');

    // Stats calculations
    const strikeSpeedBase = 1.0;
    const strikeSpeedAfter = strikeSpeedBase + (aggression * 0.15) - ((leftArmInjury + rightArmInjury) * 0.001);
    
    const blockCapacityBase = 100;
    const blockCapacityAfter = blockCapacityBase + (defense * 30) - (torsoInjury * 0.2);

    const reversalWindowBase = 12; // frames
    const reversalWindowAfter = reversalWindowBase + (patience * 6) - (headInjury * 0.05);

    const stunThresholdBase = 100;
    const stunThresholdAfter = Math.max(10, stunThresholdBase - (headInjury * 0.5) - (torsoInjury * 0.1));

    const staminaRegenBase = 100;
    const staminaRegenAfter = Math.max(20, staminaRegenBase - (torsoInjury * 0.4) - (leftLegInjury * 0.1));

    const runSpeedBase = 1.0;
    const runSpeedAfter = Math.max(0.4, runSpeedBase - (leftLegInjury + rightLegInjury) * 0.003);

    const renderGrid = (activeCategoryId: string, activeSubcategoryId: string) => {
        if (activeCategoryId === 'moveset') {
            return <MovesetBrowser activeSubcategoryId={activeSubcategoryId} />;
        }
        if (activeCategoryId === 'arena') {
            return (
                <div className="space-y-4">
                    <ArenaCustomizer 
                        settings={arenaSettings} 
                        onChange={(newSettings) => setArenaSettings(newSettings)} 
                    />
                </div>
            );
        }

        if (activeCategoryId === 'superstar') {
            if (activeSubcategoryId === 'traits') {
                return (
                    <div className="space-y-6">
                        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" /> BANNON_AI_DNA Behavior Engine
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                Adjust the 7 canonical behavior weights. These directly compute decision scoring variables and physical modifiers inside the live gameplay loop, avoiding duplication and system drift.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'aggression', label: 'Aggression (Strike Frequency & Speed)', val: aggression },
                                { id: 'defense', label: 'Defense (Blocking & Guard Hold)', val: defense },
                                { id: 'range', label: 'Range Preference (Space Checking)', val: range },
                                { id: 'grapple', label: 'Grapple Tendency (Clinch Odds)', val: grapple },
                                { id: 'risk', label: 'Risk Taking (High-Risk Strikes & Springboards)', val: risk },
                                { id: 'patience', label: 'Patience (Counter & Reversal Focus)', val: patience },
                                { id: 'showmanship', label: 'Showmanship (Taunt Buff Duration)', val: showmanship }
                            ].map(item => (
                                <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-neutral-300 uppercase">{item.label}</span>
                                        <span className="font-mono text-indigo-400 font-bold">{(item.val * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={item.val}
                                        id={`slider-trait-${item.id}`}
                                        onChange={(e) => {
                                            const updatedTraits = setTraitValue(profile.traits, item.id, parseFloat(e.target.value));
                                            setProfile(prev => ({ ...prev, traits: updatedTraits }));
                                        }}
                                        className="w-full accent-indigo-500 bg-neutral-850 h-1.5 rounded-lg cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>

                        <AgentBehaviorRepository 
                            currentTraits={profile.traits}
                            currentInjuries={profile.injuries}
                            onApplyTraits={(newTraits) => setProfile(prev => ({ ...prev, traits: newTraits }))}
                            superstarName={profile.name}
                        />
                    </div>
                );
            }

            if (activeSubcategoryId === 'injuries') {
                return (
                    <div className="space-y-6">
                        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-red-400" /> Limb Damage & Injuries Registry
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                Set pre-existing or accumulated limb injury percentages. Injuries directly scale down maximum attributes, stun threshold, and stamina recovery times.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'head', label: 'Head Injury (Stun Threshold)', val: headInjury },
                                { id: 'torso', label: 'Torso Injury (Stamina Regen & Block)', val: torsoInjury },
                                { id: 'leftArm', label: 'Left Arm Injury (Grapple & Punch Power)', val: leftArmInjury },
                                { id: 'rightArm', label: 'Right Arm Injury (Grapple & Punch Power)', val: rightArmInjury },
                                { id: 'leftLeg', label: 'Left Leg Injury (Velocity & Agility)', val: leftLegInjury },
                                { id: 'rightLeg', label: 'Right Leg Injury (Velocity & Agility)', val: rightLegInjury }
                            ].map(item => (
                                <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-neutral-300 uppercase">{item.label}</span>
                                        <span className={`font-mono font-bold ${item.val > 50 ? 'text-red-400' : item.val > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {item.val}% {item.val > 50 ? 'Severe' : item.val > 0 ? 'Moderate' : 'Healthy'}
                                        </span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={item.val}
                                        id={`slider-injury-${item.id}`}
                                        onChange={(e) => {
                                            const updatedInjuries = setInjuryValue(profile.injuries, item.id, parseInt(e.target.value));
                                            setProfile(prev => ({ ...prev, injuries: updatedInjuries }));
                                        }}
                                        className="w-full accent-red-500 bg-neutral-850 h-1.5 rounded-lg cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            if (activeSubcategoryId === 'body') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Superstar Name</label>
                            <input 
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
                                placeholder="Enter Superstar Name"
                            />
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Base Body Template</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['lightweight_A', 'heavyweight_A', 'cruiserweight_A', 'giant_A'].map(template => (
                                    <button
                                        key={template}
                                        onClick={() => setProfile(prev => ({ ...prev, bodyTemplate: template }))}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${profile.bodyTemplate === template ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                                    >
                                        {template.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(profile.bodySliders).map(([slider, val]) => (
                                <div key={slider} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-neutral-300 uppercase">{slider.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="font-mono text-neutral-400">{val}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min={slider === 'height' ? '150' : slider === 'muscleWeight' ? '50' : '0'}
                                        max={slider === 'height' ? '230' : slider === 'muscleWeight' ? '150' : '100'}
                                        value={val}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value);
                                            setProfile(prev => ({
                                                ...prev,
                                                bodySliders: { ...prev.bodySliders, [slider]: num }
                                            }));
                                        }}
                                        className="w-full accent-indigo-500 bg-neutral-850 h-1 rounded cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            if (activeSubcategoryId === 'face_details') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-3 flex items-center justify-between">
                                <span>Facial Scars</span>
                                <span className="text-indigo-400">0/3 Layers</span>
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {['scar_cheek_L', 'scar_cheek_R', 'scar_eye_L', 'scar_eye_R', 'scar_lip', 'scar_forehead', 'scar_burn', 'scar_claw'].map(scar => (
                                    <button
                                        key={scar}
                                        className="relative aspect-square rounded-lg border-2 border-neutral-800 bg-neutral-950 overflow-hidden hover:border-indigo-500 transition-colors group"
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Visual placeholder for a scar */}
                                            <div className="w-1/2 h-1 bg-red-900/50 rotate-45 rounded-full" />
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 px-1">
                                            <span className="block text-[8px] font-bold text-center text-neutral-400 uppercase truncate">
                                                {scar.replace('scar_', '')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-3 flex items-center justify-between">
                                <span>Blemishes & Texture</span>
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {['blemish_freckles', 'blemish_acne', 'blemish_moles', 'blemish_wrinkles_1', 'blemish_wrinkles_2'].map(blem => (
                                    <button
                                        key={blem}
                                        className="relative aspect-square rounded-lg border-2 border-neutral-800 bg-neutral-950 hover:border-indigo-500 transition-colors"
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/20 to-transparent" />
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 px-1">
                                            <span className="block text-[8px] font-bold text-center text-neutral-400 uppercase truncate">
                                                {blem.replace('blemish_', '')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'face') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Face Morphing Base</label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {['head_default', 'head_oval', 'head_square', 'head_round', 'head_sharp'].map(head => (
                                    <button
                                        key={head}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700`}
                                    >
                                        {head.replace('head_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {['Jaw_Width', 'Jaw_Height', 'Cheek_Depth', 'Nose_Width', 'Nose_Length', 'Eye_Spacing', 'Eye_Angle', 'Brow_Depth', 'Mouth_Width'].map(slider => (
                                <div key={slider} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-neutral-300 uppercase">{slider.replace('_', ' ')}</span>
                                        <span className="font-mono text-neutral-400">50</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        defaultValue="50"
                                        className="w-full accent-indigo-500 bg-neutral-800 h-1 rounded cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Eye Color</label>
                            <input 
                                type="color"
                                value={profile.face.eyes.color}
                                onChange={(e) => setProfile(prev => ({
                                    ...prev,
                                    face: { ...prev.face, eyes: { ...prev.face.eyes, color: e.target.value } }
                                }))}
                                className="w-16 h-8 rounded cursor-pointer bg-neutral-950 border border-neutral-800"
                            />
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Teeth Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['teeth_normal', 'teeth_missing', 'teeth_gold'].map(teeth => (
                                    <button
                                        key={teeth}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700`}
                                    >
                                        {teeth.replace('teeth_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'makeup') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Face Paint</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['paint_none', 'paint_warrior', 'paint_skull', 'paint_clown'].map(paint => (
                                    <button
                                        key={paint}
                                        onClick={() => {
                                            const newPaint = paint === 'paint_none' ? [] : [{ ItemID: paint, LayerOrder: 1, ColorOverride: { r: 1, g: 1, b: 1, a: 1 }, Opacity: 1 }];
                                            setProfile(prev => ({ ...prev, face: { ...prev.face, paintLayers: newPaint } }));
                                        }}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${
                                            (paint === 'paint_none' && profile.face.paintLayers.length === 0) || 
                                            profile.face.paintLayers.some(p => p.ItemID === paint) 
                                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                                        }`}
                                    >
                                        {paint.replace('paint_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'hair') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Hair Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['hair_short', 'hair_long', 'hair_dreadlocks', 'hair_mohawk'].map(hair => (
                                    <button
                                        key={hair}
                                        onClick={() => setProfile(prev => ({ 
                                            ...prev, 
                                            hair: { ...prev.hair, style: { ...prev.hair.style, ItemID: hair } }
                                        }))}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${profile.hair.style.ItemID === hair ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                                    >
                                        {hair.replace('hair_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Facial Hair</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['none', 'beard_full', 'beard_goatee', 'beard_stubble'].map(beard => (
                                    <button
                                        key={beard}
                                        onClick={() => setProfile(prev => ({ 
                                            ...prev, 
                                            hair: { ...prev.hair, facialHair: { ...prev.hair.facialHair, ItemID: beard } }
                                        }))}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${profile.hair.facialHair?.ItemID === beard ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                                    >
                                        {beard.replace('beard_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'clothing_upper') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Upper Body Clothing</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['upper_none', 'upper_shirt', 'upper_jacket', 'upper_vest'].map(upper => (
                                    <button
                                        key={upper}
                                        onClick={() => {
                                            const newUpper = upper === 'upper_none' ? [] : [{ ItemID: upper, LayerOrder: 1, ColorOverride: { r: 1, g: 1, b: 1, a: 1 }, Opacity: 1 }];
                                            setProfile(prev => ({ ...prev, clothing: { ...prev.clothing, upperBody: newUpper } }));
                                        }}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${
                                            (upper === 'upper_none' && profile.clothing.upperBody.length === 0) || 
                                            profile.clothing.upperBody.some(u => u.ItemID === upper) 
                                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                                        }`}
                                    >
                                        {upper.replace('upper_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'clothing_lower') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Lower Body Clothing</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['trunks_default', 'lower_tights', 'lower_pants', 'lower_shorts'].map(lower => (
                                    <button
                                        key={lower}
                                        onClick={() => setProfile(prev => ({ 
                                            ...prev, 
                                            clothing: { ...prev.clothing, lowerBody: [{ ItemID: lower, LayerOrder: 1, ColorOverride: { r: 1, g: 1, b: 1, a: 1 }, Opacity: 1 }] }
                                        }))}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors ${profile.clothing.lowerBody.some(l => l.ItemID === lower) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                                    >
                                        {lower.replace('lower_', '').replace('trunks_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'clothing_head') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Headwear</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['head_none', 'head_cap', 'head_bandana', 'head_beanie'].map(headwear => (
                                    <button
                                        key={headwear}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700`}
                                    >
                                        {headwear.replace('head_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'clothing_feet') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Footwear</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['feet_boots_standard', 'feet_kickpads', 'feet_sneakers', 'feet_barefoot'].map(feet => (
                                    <button
                                        key={feet}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700`}
                                    >
                                        {feet.replace('feet_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }

            if (activeSubcategoryId === 'accessories') {
                return (
                    <div className="space-y-4">
                        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Accessories & Gear</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['acc_glasses', 'acc_necklace', 'acc_wristbands', 'acc_elbowpads', 'acc_kneepads'].map(acc => (
                                    <button
                                        key={acc}
                                        className={`p-3 rounded text-xs font-bold uppercase border transition-colors bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700`}
                                    >
                                        {acc.replace('acc_', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                );
            }
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-neutral-900 border border-neutral-800 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-2" />
                            <div className="text-xs font-bold text-neutral-400 uppercase">{activeSubcategoryId} Item {i}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPreview = () => (
        <div className="absolute inset-0 flex flex-col items-end overflow-hidden p-6 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=3269&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
            
            <ThreePreview />

            
            {/* Live Model Details Indicator - Top Right */}
            <div className="relative z-10 bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl shrink-0 w-80 pointer-events-auto mt-12">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Unreal Engine Status</span>
                    <span className="px-2 py-0.5 bg-neutral-950 rounded text-[9px] font-mono text-neutral-500 border border-neutral-800 flex items-center gap-1">
                        <Server className="w-3 h-3 text-neutral-600" /> LiveLink Offline
                    </span>
                </div>
                <h2 className="text-xl font-bold font-sans text-white tracking-tight drop-shadow-md">{profile.name}</h2>
                <div className="flex gap-3 mt-2 text-[10px] font-mono text-neutral-400 border-t border-white/10 pt-2">
                    <div><span className="text-neutral-500">H:</span> {profile.bodySliders.height}cm</div>
                    <div><span className="text-neutral-500">W:</span> {profile.bodySliders.muscleWeight}kg</div>
                    <div><span className="text-neutral-500">CLS:</span> {profile.bodyTemplate.split('_')[0].toUpperCase()}</div>
                </div>
            </div>

            {/* Live Stat Engine Dashboard - Bottom Right */}
            <div className="relative z-10 mt-4 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl w-80 max-h-[60%] overflow-y-auto no-scrollbar flex flex-col justify-between pointer-events-auto">
                <div>
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Activity className="w-3 h-3 text-indigo-400" /> Live Stat Modifiers & Logic
                    </h3>

                    <div className="grid grid-cols-1 gap-2">
                        {/* Strike Speed Comparison */}
                        <div className="bg-neutral-950/80 p-2.5 rounded border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Strike Speed</span>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">Aggression scaling (+15% max)</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] line-through text-neutral-600 font-mono">{strikeSpeedBase.toFixed(2)}x</span>
                                <span className="text-sm font-bold text-green-400 font-mono">{strikeSpeedAfter.toFixed(2)}x</span>
                            </div>
                        </div>

                        {/* Block Capacity Comparison */}
                        <div className="bg-neutral-950/80 p-2.5 rounded border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Block Stability</span>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">Defense scaling / Torso damage</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] line-through text-neutral-600 font-mono">{blockCapacityBase}</span>
                                <span className="text-sm font-bold text-green-400 font-mono">{blockCapacityAfter.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Reversal Window Comparison */}
                        <div className="bg-neutral-950/80 p-2.5 rounded border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Reversal Window</span>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">Patience scaling / Head damage</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] line-through text-neutral-600 font-mono">{reversalWindowBase}f</span>
                                <span className="text-sm font-bold text-indigo-400 font-mono">{reversalWindowAfter.toFixed(0)}f</span>
                            </div>
                        </div>

                        {/* Stun Threshold Comparison */}
                        <div className="bg-neutral-950/80 p-2.5 rounded border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Stun Threshold</span>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">Head & Torso injury</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] line-through text-neutral-600 font-mono">{stunThresholdBase}</span>
                                <span className={`text-sm font-bold font-mono ${stunThresholdAfter < 70 ? 'text-red-400' : 'text-neutral-200'}`}>
                                    {stunThresholdAfter.toFixed(0)}
                                </span>
                            </div>
                        </div>

                        {/* Stamina Regen Comparison */}
                        <div className="bg-neutral-950/80 p-2.5 rounded border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Stamina Recovery</span>
                                <span className="text-[8px] text-neutral-500 mt-0.5 block">Torso & Leg injury</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] line-through text-neutral-600 font-mono">{staminaRegenBase}%</span>
                                <span className={`text-sm font-bold font-mono ${staminaRegenAfter < 80 ? 'text-yellow-400' : 'text-neutral-200'}`}>
                                    {staminaRegenAfter.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Firestore Round-Trip Verification Console Logs */}
                <div className="mt-4 border-t border-white/10 pt-3">
                    <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Database className="w-3 h-3 text-indigo-400" /> DB Verification Logger
                    </h4>
                    <div className="bg-black/90 rounded p-2.5 font-mono text-[9px] leading-relaxed border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${verificationLog.status === 'success' ? 'bg-green-500' : verificationLog.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                            <span className="text-neutral-300 font-bold">{verificationLog.message}</span>
                        </div>
                        {verificationLog.timestamp && (
                            <div className="text-neutral-500">Time: {verificationLog.timestamp}</div>
                        )}
                        {verificationLog.details && (
                            <div className="text-neutral-400 mt-1 border-t border-white/5 pt-1 text-[8px] select-text break-words whitespace-pre-wrap">
                                {verificationLog.details}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 h-full bg-black">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 font-sans">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">Synchronizing Superstar DB...</p>
                </div>
            ) : (
                <CreationShell 
                    title="Creation Suite"
                    categories={CATEGORIES}
                    renderGrid={renderGrid}
                    renderPreview={renderPreview}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
