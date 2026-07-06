import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGodModeStore } from '../store/useGodModeStore';
import { useBiologicalStore } from '../store/useBiologicalStore';

export const KineticVisualizer = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const bassAvg = useGodModeStore(state => state.bassAvg);
    const formForce = useGodModeStore(state => state.formForce);
    
    // Neural integration
    const neurochemicals = useBiologicalStore(state => state.neurochemicals);
    const myelinDensity = useBiologicalStore(state => state.myelinDensity);
    
    // We maintain mutable references to bypass React render cycles
    const kineticState = useRef({ bass: 0, force: 0, dopamine: 50, myelin: 1.0 });

    useEffect(() => {
        kineticState.current.bass = bassAvg;
        kineticState.current.force = formForce;
        kineticState.current.dopamine = neurochemicals.dopamine;
        kineticState.current.myelin = myelinDensity;
    }, [bassAvg, formForce, neurochemicals.dopamine, myelinDensity]);

    useEffect(() => {
        if (!mountRef.current) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
        
        // We initialize your exact particle geometry here
        const geometry = new THREE.BufferGeometry();
        const particleCount = 2000;
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const baseColor = new THREE.Color(0xffaa00); // Amber base

        for(let i = 0; i < particleCount * 3; i++) {
          const val = (Math.random() - 0.5) * 100;
          positions[i] = val;
          originalPositions[i] = val;
          
          if (i % 3 === 0) {
              colors[i] = baseColor.r;
              colors[i+1] = baseColor.g;
              colors[i+2] = baseColor.b;
          }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Material that takes vertex colors
        const material = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
        const particleSystem = new THREE.Points(geometry, material);
        scene.add(particleSystem);

        let animationFrameId: number;
        const targetColor = new THREE.Color(0xd946ef); // Fuchsia for Dopamine

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            const state = kineticState.current;
            const currentBass = state.bass;
            const currentForce = state.force;
            const currentDopamine = state.dopamine;
            const currentMyelin = state.myelin; // Increases structural resistance to chaos

            // Myelin reduces the chaotic turbulence. High myelin = structured lattice.
            const structuralDamping = Math.max(0.1, 1.0 / currentMyelin); 
            
            // Dopamine pushes expansion speed
            const motivationDrive = 1.0 + (currentDopamine * 0.05);

            const dynamicScale = 1.0 + Math.pow((2.2 * currentBass), 2);
            
            const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
            const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

            for(let i = 0; i < particleCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                const r0x = originalPositions[ix];
                const r0y = originalPositions[iy];
                const r0z = originalPositions[iz];

                // Delta r = r0 * dynamicScale * turbulence
                // Damping reduces the sin wave amplitude
                const turbulence = 1.0 + (Math.sin(Date.now() * 0.001 * motivationDrive + i) * 0.1 * structuralDamping);
                
                posAttr.array[ix] = r0x * dynamicScale * turbulence;
                posAttr.array[iy] = r0y * dynamicScale * turbulence;
                posAttr.array[iz] = r0z * dynamicScale * turbulence;

                // Color Morph based on Dopamine level
                // Interpolate from baseColor (Amber) to targetColor (Fuchsia) based on dopamine > 50
                const dopaRatio = Math.max(0, (currentDopamine - 50) / 50.0);
                const mixedColor = baseColor.clone().lerp(targetColor, dopaRatio);

                colorAttr.array[ix] = mixedColor.r;
                colorAttr.array[iy] = mixedColor.g;
                colorAttr.array[iz] = mixedColor.b;
            }
            
            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;

            particleSystem.rotation.y += (0.002 * motivationDrive) + (currentBass * 0.01);
            
            camera.position.z = 200 - (currentForce * 26) - (currentBass * 14) + (structuralDamping * 10);
            
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} />;
};
