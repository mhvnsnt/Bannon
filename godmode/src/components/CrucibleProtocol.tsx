import React, { useState, useEffect } from 'react';
import { Target, Activity, Shield, Zap, CheckCircle2, Circle } from 'lucide-react';
import { useBiologicalStore } from '../store/useBiologicalStore';

interface CrucibleTask {
  id: string;
  category: 'ROOT_ANCHOR' | 'KINETIC_VECTOR' | 'TENSILE_MESH' | 'ABSOLUTE_OCCLUSION';
  description: string;
  completed: boolean;
}

const DEFAULT_TASKS: CrucibleTask[] = [
    { id: '1', category: 'ROOT_ANCHOR', description: 'Circadian Alignment: Sleep by 22:00, Wake at 05:00', completed: false },
    { id: '2', category: 'ROOT_ANCHOR', description: 'Hydration Matrix: 1 Gallon Water + Electrolytes', completed: false },
    { id: '3', category: 'KINETIC_VECTOR', description: 'Deep Work: 4 Hours Uninterrupted Code/Creation (Zero Context Switching)', completed: false },
    { id: '4', category: 'TENSILE_MESH', description: 'Hypertrophic Resistance: 60M Heavy Load Physical Training', completed: false },
    { id: '5', category: 'ABSOLUTE_OCCLUSION', description: 'Dopamine Fast: 0 Minutes Cheap Scrolling/Algorithmic Feeds', completed: false }
];

export const CrucibleProtocol = () => {
    // Persist tasks in local storage explicitly
    const [tasks, setTasks] = useState<CrucibleTask[]>(() => {
        const saved = localStorage.getItem('crucible_tasks');
        return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    });
    
    const [newTask, setNewTask] = useState('');
    const [activeCategory, setActiveCategory] = useState<CrucibleTask['category']>('KINETIC_VECTOR');
    
    // Connect to biological state orchestrator
    const triggerDopamineSpike = useBiologicalStore(state => state.triggerDopamineSpike);
    const buildMyelin = useBiologicalStore(state => state.buildMyelin);

    useEffect(() => {
        localStorage.setItem('crucible_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const toggleCompletion = (id: string) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        const isNowCompleted = !task.completed;
        
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: isNowCompleted } : t));

        // Neurochemical feedback loop
        if (isNowCompleted) {
            triggerDopamineSpike(15); // Reward Prediction Error positive delta
            buildMyelin(5);           // Reinforces the execution pathway
            console.log(`[NEUROCHEMISTRY] +15 Dopamine (RPE Positive). +5 Acetylcholine. Pathway myelinated.`);
        }
    };

    const addTask = () => {
        if (!newTask.trim()) return;
        setTasks([...tasks, {
            id: Math.random().toString(36).substr(2, 9),
            category: activeCategory,
            description: newTask,
            completed: false
        }]);
        setNewTask('');
    };

    const categories = [
        { id: 'ROOT_ANCHOR', name: 'Biological Baseline', icon: <Activity className="w-4 h-4" />, desc: 'Sleep, Fuel, Vitals', color: 'text-blue-500' },
        { id: 'KINETIC_VECTOR', name: 'Forward Momentum', icon: <Target className="w-4 h-4" />, desc: 'Deep Work, Capital, Output', color: 'text-emerald-500' },
        { id: 'TENSILE_MESH', name: 'Physical Density', icon: <Zap className="w-4 h-4" />, desc: 'Resistance Training, Stress', color: 'text-amber-500' },
        { id: 'ABSOLUTE_OCCLUSION', name: 'Noise Damping', icon: <Shield className="w-4 h-4" />, desc: 'Vice Cutoffs, Boundaries', color: 'text-fuchsia-500' }
    ];

    const getScore = () => {
        if (tasks.length === 0) return 0;
        return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
    };

    return (
        <div className="w-full h-full bg-[#020202] flex flex-col font-mono text-emerald-500 overflow-hidden border-l border-emerald-900/30">
            <div className="p-4 border-b border-emerald-900/50 flex justify-between items-end bg-[#050505]">
                <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest text-emerald-400">The Crucible Protocol</h2>
                    <p className="text-[10px] text-emerald-700 mt-1 max-w-md">
                        Theory is dead without execution. This is the absolute physical translation of your engine. Move the biological 3D mesh.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-emerald-600 mb-1">DAILY YIELD</div>
                    <div className="text-3xl font-bold text-emerald-400">{getScore()}%</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                {categories.map(cat => {
                    const catTasks = tasks.filter(t => t.category === cat.id);
                    return (
                        <div key={cat.id} className="bg-black border border-[#111] rounded-sm overflow-hidden">
                            <div className="p-3 bg-[#0a0a0a] border-b border-[#111] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cat.color}>{cat.icon}</div>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>{cat.name}</h3>
                                </div>
                                <span className="text-[9px] text-gray-600">{cat.desc}</span>
                            </div>
                            <div className="p-2 flex flex-col gap-1">
                                {catTasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => toggleCompletion(task.id)}
                                        className={`flex items-start gap-3 p-2 cursor-pointer border hover:bg-[#111] transition-colors
                                            ${task.completed ? 'border-emerald-900/20 bg-[#051105]' : 'border-transparent'}`}
                                    >
                                        <button className="mt-0.5">
                                            {task.completed ? 
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                                                <Circle className="w-4 h-4 text-[#333]" />}
                                        </button>
                                        <span className={`text-xs transition-all ${task.completed ? 'text-emerald-700 line-through' : 'text-gray-300'}`}>
                                            {task.description}
                                        </span>
                                    </div>
                                ))}
                                {catTasks.length === 0 && (
                                    <div className="p-2 text-[10px] text-[#444] italic">No variables established in this vector.</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-[#050505] border-t border-emerald-900/50">
                <div className="flex gap-2 mb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as any)}
                            className={`px-3 py-1.5 text-[9px] uppercase font-bold border rounded-sm transition-colors ${
                                activeCategory === cat.id ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300' : 'border-[#333] text-gray-500 hover:border-emerald-700'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        placeholder="Define rigid physical action..."
                        className="flex-1 bg-black border border-emerald-900/50 p-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                        onClick={addTask}
                        className="bg-emerald-900 text-emerald-300 px-4 text-xs font-bold hover:bg-emerald-800 transition-colors"
                    >
                        INJECT
                    </button>
                </div>
            </div>
        </div>
    );
};
