import React, { useState, useRef, useEffect } from 'react';
import { ZeroPointArchitecture } from '../lib/primeSingularity';
import { executeAbsoluteOcclusion } from '../lib/kineticMechanics';
import { trackMyelination } from '../lib/myelinationTracker';

export const CommandMatrix = () => {
    const [commandLog, setCommandLog] = useState<{ id: string; cmd: string; timestamp: string; status: string }[]>([]);
    const [inputVal, setInputVal] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputVal.trim() !== '') {
            executeCommand(inputVal.trim());
            setInputVal('');
        }
    };

    const executeCommand = (cmd: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        let status = 'EXECUTED';
        const upperCmd = cmd.toUpperCase();

        try {
            if (upperCmd === 'INITIATE_SINGULARITY') {
                const nexus = ZeroPointArchitecture.initiate();
                nexus.manifestIntent(1.0);
            } else if (upperCmd.startsWith('APPLY_OCCLUSION')) {
                // Synthesize the choke constraint
                executeAbsoluteOcclusion({ id: 'Atum_Grip' }, { id: 'Target_Joint', equationStiffness: 0, equationRelaxation: 0 });
            } else if (upperCmd.startsWith('SHIFT_GRAVITY')) {
                // We would pipe this to the CANNON.World instance in RootInitialization
                status = 'GRAVITY_VORTEX_ALIGNED';
            } else {
                status = 'COMMAND_UNRECOGNIZED_BY_GRID';
            }

            // Route through the myelination pathway to increase dense execution
            trackMyelination(upperCmd);

        } catch (error) {
            status = 'FRACTURE_IN_EXECUTION';
        }

        setCommandLog(prev => [...prev, { id, cmd: upperCmd, timestamp, status }]);
        
        if (inputRef.current) {
            inputRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Auto-focus the raw terminal
        if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
        <div className="w-full h-64 bg-[#020202] border border-emerald-900/50 flex flex-col font-mono text-[10px] uppercase text-emerald-500 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full bg-emerald-900/20 text-emerald-400 p-1 font-bold border-b border-emerald-900/50">
                [ TERM ] TERMINAL OF ABSOLUTE COMMAND
            </div>
            <div className="flex-1 overflow-y-auto p-2 pt-6 flex flex-col gap-1">
                {commandLog.map(entry => (
                    <div key={entry.id} className="flex flex-col border-b border-[#111] pb-1">
                        <span className="text-[#555]">{entry.timestamp}</span>
                        <div className="flex gap-2">
                            <span className="text-emerald-700">INPUT:</span>
                            <span className="text-white">{entry.cmd}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-emerald-700">OUTPUT:</span>
                            <span className={entry.status === 'COMMAND_UNRECOGNIZED_BY_GRID' ? 'text-red-500' : 'text-emerald-400'}>
                                {entry.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-emerald-900/50 flex items-center bg-black">
                <span className="text-emerald-500 mr-2">{'>'}</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent border-none outline-none text-emerald-300 placeholder-emerald-900 focus:ring-0"
                    placeholder="ENTER KINETIC VECTOR..."
                    spellCheck="false"
                    autoComplete="off"
                />
            </div>
        </div>
    );
};
