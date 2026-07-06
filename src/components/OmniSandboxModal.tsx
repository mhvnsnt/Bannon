import React, { useState, useEffect } from 'react';
import { OmniTerminal } from './OmniTerminal';

export const OmniSandboxModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const toggle = () => setIsOpen(v => !v);
        window.addEventListener('toggle-omni-sandbox', toggle);
        return () => window.removeEventListener('toggle-omni-sandbox', toggle);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl relative">
                <button onClick={() => setIsOpen(false)} className="absolute -top-10 right-0 text-slate-400 hover:text-white">✕ Close Sandbox</button>
                <OmniTerminal />
            </div>
        </div>
    );
};
