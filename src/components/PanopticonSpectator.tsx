import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Panopticon } from '../utils/Panopticon';

interface PanopticonSpectatorProps {
    targetUserId: string | null;
    onClose: () => void;
}

export const PanopticonSpectator: React.FC<PanopticonSpectatorProps> = ({ targetUserId, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [codeState, setCodeState] = useState<string>("// Waiting for telemetry...");
    
    useEffect(() => {
        if (!targetUserId || !mountRef.current) return;
        
        // 1. Initialize Secondary Shadow Three.js Scene
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.Fog(0x0a0a0a, 5, 20);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 2, 8);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0x00F5D4, 1.5);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Grid helper to show the spatial plane
        const grid = new THREE.GridHelper(20, 20, 0x333333, 0x222222);
        scene.add(grid);

        let shadowMascot: THREE.Group | null = null;
        
        // Load default mascot (or we would load their active model)
        const loader = new GLTFLoader();
        loader.load('/dummy.glb', (gltf) => {
            shadowMascot = gltf.scene;
            shadowMascot.position.set(0, 0, 0);
            scene.add(shadowMascot);
            console.log("[Panopticon] Shadow Mascot Loaded in Spectator View.");
        });

        // 2. Subscribe to Panopticon Telemetry
        const panopticon = new Panopticon('admin', 'admin_' + Math.floor(Math.random() * 1000));
        panopticonRef.current = panopticon;

        const sub = panopticon.subscribeToUser(targetUserId, (data) => {
            if (data.code !== undefined) {
                setCodeState(data.code);
            }
            if (data.mascotPos && shadowMascot) {
                shadowMascot.position.set(data.mascotPos.x, data.mascotPos.y, data.mascotPos.z);
            }
        });
        
        const renderLoop = () => {
            requestAnimationFrame(renderLoop);
            renderer.render(scene, camera);
        };
        renderLoop();

        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            sub.unsubscribe();
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [targetUserId]);

    const panopticonRef = useRef<Panopticon | null>(null);

    if (!targetUserId) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-slate-900 border border-[#F15BB5] w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl rounded-xl overflow-hidden relative shadow-[#F15BB5]/20">
                
                {/* Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-[#F15BB5]/30">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <h2 className="text-[#F15BB5] font-bold uppercase tracking-widest text-sm">Panopticon Live Spectator</h2>
                        <span className="text-slate-400 text-xs font-mono">Targeting: {targetUserId}</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white uppercase text-xs font-bold px-3 py-1 bg-slate-700 rounded">Disconnect</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Shadow Code Editor */}
                    <div className="w-1/3 border-r border-slate-700 bg-[#0d1117] p-4 flex flex-col">
                        <h3 className="text-[#00F5D4] text-xs font-bold uppercase tracking-wider mb-2">Live AST State (Read-Only)</h3>
                        <pre className="text-green-400 font-mono text-xs overflow-auto flex-1 whitespace-pre-wrap p-2 bg-black/50 rounded border border-slate-800">
                            {codeState}
                        </pre>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <h3 className="text-[#F15BB5] text-xs font-bold uppercase tracking-wider mb-2">God-Mode Override</h3>
                            <button className="w-full bg-slate-800 hover:bg-[#F15BB5]/20 text-[#F15BB5] border border-[#F15BB5]/50 py-2 rounded text-xs font-bold uppercase transition-colors"
                                onClick={() => {
                                    if (panopticonRef.current) {
                                        panopticonRef.current.forceInjectPayload(targetUserId, { action: 'force_reload' });
                                    }
                                }}
                            >
                                Force Payload Execution
                            </button>
                        </div>
                    </div>

                    {/* Shadow WebGL Viewport */}
                    <div className="w-2/3 relative">
                        <div className="absolute top-4 left-4 z-10 bg-black/50 text-[#00F5D4] text-xs font-mono px-2 py-1 rounded border border-[#00F5D4]/30 pointer-events-none">
                            THREE.js Shadow Clone (Latency: 142ms)
                        </div>
                        <div ref={mountRef} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
