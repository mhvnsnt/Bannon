import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { physicsBridgeClient } from '../utils/PhysicsFFIBridgeClient';


interface KineticDOMProps {
    targetElementId: string; // The DOM ID of the element to explode (e.g., 'code-editor-panel')
}

export const KineticDOM: React.FC<KineticDOMProps> = ({ targetElementId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExploded, setIsExploded] = useState(false);
    const [hasErrorState, setHasErrorState] = useState(false);

    // Advanced interactive configuration parameters
    const [gridSize, setGridSize] = useState(8);
    const [explosionForce, setExplosionForce] = useState(6.0);
    const [gravityType, setGravityType] = useState<'standard' | 'low' | 'zero'>('standard');
    const [isPanelMinimized, setIsPanelMinimized] = useState(false);
    
    // Maintain references to clear physics/Three instances
    const animationFrameRef = useRef<number | null>(null);
    const threeSceneRef = useRef<THREE.Scene | null>(null);
    const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cannonWorldRef = useRef<CANNON.World | null>(null);
    const debrisRef = useRef<{ mesh: THREE.Mesh; body: CANNON.Body }[]>([]);

    useEffect(() => {
        // Listen to global compilation errors or trigger events
        const handleErrorEvent = (e: Event) => {
            console.log("[KineticDOM] Compilation error event intercepted! Launching destruction sequence...");
            setHasErrorState(true);
            triggerExplosion();
        };

        const handleResetEvent = (e: Event) => {
            resetExplosion();
        };

        window.addEventListener('compilation-failed', handleErrorEvent);
        window.addEventListener('reset-kinetic-dom', handleResetEvent);

        window.removeEventListener('click', handleGlobalClick);
        return () => {
            window.removeEventListener('compilation-failed', handleErrorEvent);
            window.removeEventListener('reset-kinetic-dom', handleResetEvent);
            cleanUp();
        };
    }, [targetElementId, gridSize, explosionForce, gravityType]);

    const cleanUp = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Restore target element visibility
        const el = document.getElementById(targetElementId);
        if (el) {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = 'none';
        }

        // Dispose Three.js objects
        debrisRef.current.forEach(({ mesh }) => {
            if (threeSceneRef.current) {
                threeSceneRef.current.remove(mesh);
            }
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }
        });
        debrisRef.current = [];

        if (threeRendererRef.current && containerRef.current) {
            try {
                containerRef.current.removeChild(threeRendererRef.current.domElement);
            } catch (e) {}
            threeRendererRef.current.dispose();
        }

        threeSceneRef.current = null;
        threeRendererRef.current = null;
        cannonWorldRef.current = null;
    };

    const resetExplosion = () => {
        cleanUp();
        setIsExploded(false);
        setHasErrorState(false);
    };

    const triggerExplosion = async () => {
        const originalElement = document.getElementById(targetElementId);
        if (!originalElement) {
            console.warn(`[KineticDOM] Target element #${targetElementId} not found in DOM.`);
            return;
        }

        setIsExploded(true);
        console.log(`[KineticDOM] Rasterizing element #${targetElementId} with html2canvas...`);

        try {
            // Take visual capture of the target DOM node
            const canvas = await html2canvas(originalElement, {
                backgroundColor: null,
                logging: false,
                useCORS: true,
                scale: window.devicePixelRatio || 1
            });

            const rect = originalElement.getBoundingClientRect();
            
            // Hide the original HTML node
            originalElement.style.opacity = '0';
            originalElement.style.pointerEvents = 'none';

            // Setup Three.js overlay canvas
            const width = window.innerWidth;
            const height = window.innerHeight;

            const scene = new THREE.Scene();
            threeSceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.z = 10;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            threeRendererRef.current = renderer;

            if (containerRef.current) {
                containerRef.current.appendChild(renderer.domElement);
            }

            // Setup Cannon.js physics engine
            const world = new CANNON.World();
            if (gravityType === 'zero') {
                world.gravity.set(0, 0, 0);
            } else if (gravityType === 'low') {
                world.gravity.set(0, -2.5, 0);
            } else {
                world.gravity.set(0, -9.82, 0); // Standard Earth gravity
            }
            cannonWorldRef.current = world;

            // Generate high-quality texture from screenshot canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;

            // Divide the element into a dynamic puzzle/debris grid based on shrapnel density state
            const cols = gridSize;
            const rows = gridSize;
            const elementWidth3D = (rect.width / width) * 20; // Normalizing screen to perspective frustum units
            const elementHeight3D = (rect.height / height) * (20 * (height / width));
            const aspectX = elementWidth3D / cols;
            const aspectY = elementHeight3D / rows;

            // Compute center position in normalized screen space
            const screenCenterX = rect.left + rect.width / 2;
            const screenCenterY = rect.top + rect.height / 2;
            const worldX = ((screenCenterX / width) * 2 - 1) * (10 * Math.tan((45 * Math.PI) / 360) * (width / height));
            const worldY = -((screenCenterY / height) * 2 - 1) * (10 * Math.tan((45 * Math.PI) / 360));

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Create geometries representing chunks
                    const geom = new THREE.BoxGeometry(aspectX * 0.95, aspectY * 0.95, 0.05);

                    // Setup custom UV coordinates for texture mapping onto individual grid blocks
                    const uvs = geom.attributes.uv;
                    for (let i = 0; i < uvs.count; i++) {
                        const u = uvs.getX(i);
                        const v = uvs.getY(i);
                        
                        // Map UV according to fragment grid positions
                        const newU = (c + u) / cols;
                        const newV = (rows - 1 - r + v) / rows;
                        uvs.setXY(i, newU, newV);
                    }
                    geom.attributes.uv.needsUpdate = true;

                    const mat = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        side: THREE.DoubleSide
                    });

                    const mesh = new THREE.Mesh(geom, mat);

                    // Set initial positions in 3D scene matching layout position
                    const offsetPosX = worldX - elementWidth3D / 2 + (c + 0.5) * aspectX;
                    const offsetPosY = worldY + elementHeight3D / 2 - (r + 0.5) * aspectY;
                    mesh.position.set(offsetPosX, offsetPosY, 0);
                    scene.add(mesh);

                    // Create physical counterpart in Cannon.js
                    const shape = new CANNON.Box(new CANNON.Vec3(aspectX * 0.48, aspectY * 0.48, 0.025));
                    const body = new CANNON.Body({
                        mass: 0.1,
                        shape: shape,
                        position: new CANNON.Vec3(offsetPosX, offsetPosY, 0)
                    });

                    // Infuse radial explosive thrust from center using state-based explosion force
                    const dx = offsetPosX - worldX;
                    const dy = offsetPosY - worldY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const forceMagnitude = explosionForce + Math.random() * (explosionForce * 0.5);
                    body.velocity.set(
                        (dx / dist) * forceMagnitude,
                        (dy / dist) * forceMagnitude + (Math.random() * 2), // upward bias
                        (Math.random() - 0.5) * 3
                    );

                    // Add wild rotational velocities (angular momentum)
                    body.angularVelocity.set(
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10
                    );

                    world.addBody(body);
                    debrisRef.current.push({ mesh, body });
                }
            }

            // High-Performance Physics Loop
            let lastTime = performance.now();
            const tick = () => {
                const now = performance.now();
                const dt = Math.min((now - lastTime) / 1000, 0.1);
                lastTime = now;

                // Step physical simulation
                world.step(1 / 60, dt, 3);

                // Re-align visual meshes with rigid bodies
                debrisRef.current.forEach(({ mesh, body }) => {
                    mesh.position.copy(body.position as any);
                    mesh.quaternion.copy(body.quaternion as any);
                    
                    // Slow fadeout
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((m: any) => {
                            if (m.opacity > 0) m.opacity -= 0.005;
                        });
                    } else {
                        const m = mesh.material as THREE.MeshBasicMaterial;
                        if (m.opacity > 0) m.opacity -= 0.005;
                    }
                });

                renderer.render(scene, camera);
                animationFrameRef.current = requestAnimationFrame(tick);
            };

            tick();

            // Auto-cleanup after physics fadeout completes
            setTimeout(() => {
                resetExplosion();
            }, 6000);

        } catch (err) {
            console.error("[KineticDOM] Failed to run destruction animation:", err);
            setIsExploded(false);
        }
    };

    // Helper trigger function to demo/simulate compilation failures visually
    const triggerMockError = () => {
        window.dispatchEvent(new CustomEvent('compilation-failed'));
    };

    return (
        <>
            <div 
                ref={containerRef} 
                className={`fixed inset-0 z-[10000] pointer-events-none transition-all duration-300 ${
                    isExploded ? 'bg-slate-950/40 backdrop-blur-[2px]' : 'bg-transparent'
                }`}
            />
            
            {isPanelMinimized ? (
                <button
                    onClick={() => setIsPanelMinimized(false)}
                    className="fixed bottom-4 right-4 z-[9999] pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 hover:bg-slate-900 border border-red-500/40 hover:border-red-400 text-red-400 text-[10px] font-mono rounded-full shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:scale-105 transition duration-200 cursor-pointer"
                >
                    💥 SHATTER CONTROL
                </button>
            ) : (
                <div className="fixed bottom-4 right-4 z-[9999] pointer-events-auto w-72 bg-slate-950/85 border border-red-500/30 backdrop-blur-md rounded-lg p-3 text-xs font-mono text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] select-none">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-red-500/20 pb-2 mb-2">
                        <span className="font-bold tracking-widest text-[10px]">💥 KINETIC SHATTER</span>
                        <button 
                            onClick={() => setIsPanelMinimized(true)}
                            className="text-red-500 hover:text-red-300 font-bold px-1.5 py-0.5 rounded hover:bg-red-500/10 cursor-pointer text-[10px]"
                            title="Minimize Control"
                        >
                            —
                        </button>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-2.5 mb-3 text-[10px]">
                        {/* Shrapnel Density */}
                        <div className="space-y-1 flex flex-col">
                            <div className="flex justify-between text-slate-400">
                                <span>SHRAPNEL DENSITY (GRID):</span>
                                <span className="text-red-300 font-bold">{gridSize}x{gridSize}</span>
                            </div>
                            <input 
                                type="range" 
                                min="4" 
                                max="16" 
                                step="2"
                                value={gridSize}
                                onChange={(e) => setGridSize(parseInt(e.target.value))}
                                className="w-full h-1 bg-red-950 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>

                        {/* Explosion Force */}
                        <div className="space-y-1 flex flex-col">
                            <div className="flex justify-between text-slate-400">
                                <span>EXPLOSION FORCE:</span>
                                <span className="text-red-300 font-bold">{explosionForce.toFixed(1)}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="2" 
                                max="15" 
                                step="1"
                                value={explosionForce}
                                onChange={(e) => setExplosionForce(parseFloat(e.target.value))}
                                className="w-full h-1 bg-red-950 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>

                        {/* Gravity Type */}
                        <div className="space-y-1">
                            <span className="text-slate-400">GRAVITY SELECTOR:</span>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                                {(['standard', 'low', 'zero'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setGravityType(type)}
                                        className={`py-1 rounded border text-[9px] uppercase transition font-bold cursor-pointer ${
                                            gravityType === type 
                                                ? 'bg-red-950/65 border-red-500 text-red-300' 
                                                : 'bg-transparent border-red-500/15 text-slate-500 hover:border-red-500/30'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action trigger button */}
                    {hasErrorState ? (
                        <button
                            onClick={() => {
                                resetExplosion();
                                window.dispatchEvent(new CustomEvent('reset-kinetic-dom'));
                            }}
                            className="w-full py-2 bg-emerald-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-bold tracking-wider text-[10px] rounded transition duration-200 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        >
                            🔄 REASSEMBLE CODE BLOCK
                        </button>
                    ) : (
                        <button
                            onClick={triggerMockError}
                            className="w-full py-2 bg-red-950/40 hover:bg-red-950/80 border border-red-500/40 text-red-400 font-bold tracking-wider text-[10px] rounded transition duration-200 cursor-pointer"
                        >
                            💥 SIMULATE BUILD FAILURE
                        </button>
                    )}
                </div>
            )}
        </>
    );
};
export default KineticDOM;
