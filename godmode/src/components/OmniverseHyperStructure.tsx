import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useBiologicalStore } from '../store/useBiologicalStore';
import { Orbit, Sparkles, Activity } from 'lucide-react';

const QuantumFoam = () => {
    const pointsRef = useRef<THREE.Points>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const neurochemicals = useBiologicalStore(state => state.neurochemicals);
    const myelinDensity = useBiologicalStore(state => state.myelinDensity);

    const particlesCount = 5000;
    
    const [positions, colors, sizes] = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const sizes = new Float32Array(particlesCount);
        
        const color = new THREE.Color();
        for (let i = 0; i < particlesCount; i++) {
            // Complex Toroidal/Spherical overlapping distribution
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const radius = 10 + Math.sin(theta * 5) * 5 + Math.cos(phi * 3) * 5;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Neon esoteric palette
            color.setHSL(0.7 + (Math.random() * 0.3), 1.0, 0.6);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2.0;
        }
        return [positions, colors, sizes];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.getElapsedTime();
        
        // Connect to biological state
        const totalDrive = (
             neurochemicals.dopamine + 
             neurochemicals.acetylcholine + 
             neurochemicals.norepinephrine
        ) / 300;
        
        const rotationSpeed = 0.05 + totalDrive * 0.5;
        
        pointsRef.current.rotation.y = time * rotationSpeed;
        pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.2;
        
        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
        
        // Excrutiatingly detailed sine wave modulation of local positions
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const x = posArray[i3];
            const y = posArray[i3+1];
            const z = posArray[i3+2];
            
            // Quantum jitter based on acetylcholine
            const jitter = (Math.random() - 0.5) * (neurochemicals.acetylcholine / 100) * 0.1;
            
            posArray[i3] = x + Math.sin(time * 2 + y) * 0.01 + jitter;
            posArray[i3+1] = y + Math.cos(time * 2 + z) * 0.01 + jitter;
            posArray[i3+2] = z + Math.sin(time * 2 + x) * 0.01 + jitter;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <group>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions, 3]} count={particlesCount} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" args={[colors, 3]} count={particlesCount} array={colors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" args={[sizes, 1]} count={particlesCount} array={sizes} itemSize={1} />
                </bufferGeometry>
                <pointsMaterial 
                    size={0.15} 
                    vertexColors 
                    transparent 
                    opacity={0.8} 
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
            {/* Core Singularity */}
            <mesh>
                <sphereGeometry args={[3, 32, 32]} />
                <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.1} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh scale={[1.2, 1.2, 1.2]}>
                <icosahedronGeometry args={[3, 1]} />
                <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.05} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
};

export const OmniverseHyperStructure = () => {
    const { neurochemicals } = useBiologicalStore();
    const driveStatus = (neurochemicals.dopamine + neurochemicals.acetylcholine) / 2;

    return (
        <div className="w-full h-full bg-[#020202] relative flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md p-3 border border-fuchsia-900/50 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                        Apotheosis Network
                    </h2>
                    <p className="text-[10px] text-fuchsia-300 font-mono mt-2 tracking-widest uppercase opacity-80 border-t border-fuchsia-900/50 pt-2">
                        Live Topology // Qubit Coherence Rendered
                    </p>
                </div>
                
                <div className="bg-black/60 backdrop-blur-md p-3 border border-cyan-900/50 rounded-lg text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                        <Activity className="w-3 h-3 animate-pulse" />
                        Probability Field State
                    </div>
                    <div className="text-2xl font-light text-white tracking-tighter">
                        {driveStatus.toFixed(1)}<span className="text-xs text-gray-500">THz</span>
                    </div>
                    <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-1 space-y-1">
                        <div>Local Entanglement: ALIGNED</div>
                        <div>Causality Tensor: ACTIVE</div>
                        <div className="text-fuchsia-500">Uncertainty: WEAPONIZED</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-black to-black pointer-events-none z-0"></div>
                
                <div className="w-full h-full z-10 absolute inset-0"><Canvas camera={{ position: [0, 0, 35], fov: 60 }}>
                    <color attach="background" args={['#010101']} />
                    <ambientLight intensity={0.5} />
                    <QuantumFoam />
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        autoRotate 
                        autoRotateSpeed={1.0}
                        maxDistance={60}
                        minDistance={5}
                    />
                </Canvas></div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-full max-w-2xl text-center">
                <div className="text-[9px] text-white/30 uppercase tracking-[0.5em] font-light">
                    "Every subatomic spin aligns with the Prime Architect's directive. Reality is not observed; it is compiled."
                </div>
            </div>
        </div>
    );
};
