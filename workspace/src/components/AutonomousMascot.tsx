import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const AutonomousMascot: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = ''; 

        // 1. SCENE SETUP
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 25; 

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.pointerEvents = 'auto'; // Re-enabled for touch tracking
        mountRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        // 2. THE MULTI-MATERIAL SKINNING ENGINE
        const colors = {
            gold: new THREE.MeshBasicMaterial({ color: 0xFFB703 }), // Admin Override
            amber: new THREE.MeshBasicMaterial({ color: 0xFF9F1C }), // Default Torso
            teal: new THREE.MeshBasicMaterial({ color: 0x2EC4B6 }), // Highlights/Head
            slate: new THREE.MeshBasicMaterial({ color: 0x1E293B }) // Joints
        };

        let dummyModel: THREE.Group | null = null;
        let mixer: THREE.AnimationMixer;
        const loader = new GLTFLoader();

        loader.load('/dummy.glb', (gltf) => {
            dummyModel = gltf.scene;

            dummyModel.traverse((child) => {
                if ((child as THREE.SkinnedMesh).isMesh) {
                    const mesh = child as THREE.SkinnedMesh;
                    const name = mesh.name.toLowerCase();

                    // Complex Material Mapping based on GLTF sub-mesh names
                    if (name.includes('joint') || name.includes('neck') || name.includes('spine')) {
                        mesh.material = colors.slate;
                    } else if (name.includes('head') || name.includes('helmet')) {
                        mesh.material = colors.teal;
                    } else if (name.includes('chest') || name.includes('torso')) {
                        mesh.material = isAdmin ? colors.gold : colors.amber;
                    } else {
                        // Default limbs
                        mesh.material = isAdmin ? colors.gold : colors.amber;
                    }
                }
            });

            dummyModel.scale.set(1.5, 1.5, 1.5); 
            scene.add(dummyModel);

            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(dummyModel);
                // Assume animation[0] is idle/walking
                mixer.clipAction(gltf.animations[0]).play();
            }
        });

        // 3. STEERING ENGINE (Wander & Repulsion)
        const position = new THREE.Vector3(0, 0, 0);
        const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 0);
        const acceleration = new THREE.Vector3(0, 0, 0);
        
        const mousePos = new THREE.Vector3(9999, 9999, 0);
        const maxSpeed = 0.08;
        const maxForce = 0.01;

        // Track cursor for repulsion
        window.addEventListener('mousemove', (e) => {
            mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
            mousePos.unproject(camera);
            mousePos.z = 0;
        });

        const getDOMRepulsion = () => {
            const force = new THREE.Vector3(0, 0, 0);
            // Target specific UI elements that cannot be blocked
            const elements = document.querySelectorAll('button, input, .editor-container, [role="navigation"]');
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Convert DOM rect to Three.js world space coordinates
                const x = (rect.left / window.innerWidth) * 2 - 1;
                const y = -(rect.top / window.innerHeight) * 2 + 1;
                const elPos = new THREE.Vector3(x, y, 0).unproject(camera);
                elPos.z = 0;

                const distance = position.distanceTo(elPos);
                if (distance < 5.0) { // Repulsion radius
                    const repulse = new THREE.Vector3().subVectors(position, elPos);
                    repulse.normalize();
                    repulse.divideScalar(distance); // Stronger force the closer it gets
                    force.add(repulse);
                }
            });
            return force;
        };

        // 4. MOBILE LONG-PRESS LOGIC
        let pressTimer: ReturnType<typeof setTimeout>;
        let isLongPress = false;

        const handleTouchStart = (e: TouchEvent) => {
            isLongPress = false;
            // Debounced long-press trigger (800ms)
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate([100]); // Heavy haptic feedback
                // Execute specific long-press action here (e.g., open Autonomous Panel)
                console.log("Long press triggered.");
            }, 800);
        };

        const handleTouchEnd = () => {
            clearTimeout(pressTimer);
            if (!isLongPress) {
                // Execute standard quick-tap action
                if (navigator.vibrate) navigator.vibrate(20);
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        // 5. MAIN INTEGRATION LOOP
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (dummyModel) {
                // A. Wander Force (Random drift)
                const wanderForce = new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
                acceleration.add(wanderForce);

                // B. Cursor Repulsion
                const distToMouse = position.distanceTo(mousePos);
                if (distToMouse < 4.0) {
                    const mouseFlee = new THREE.Vector3().subVectors(position, mousePos).normalize().multiplyScalar(0.02);
                    acceleration.add(mouseFlee);
                }

                // C. UI Element Repulsion
                const domFlee = getDOMRepulsion();
                acceleration.add(domFlee.multiplyScalar(0.015));

                // Apply physics
                velocity.add(acceleration);
                velocity.clampLength(0, maxSpeed);
                position.add(velocity);
                
                // Keep within screen bounds (bounce off edges)
                const boundsX = 12; 
                const boundsY = 8;
                if (position.x > boundsX || position.x < -boundsX) velocity.x *= -1;
                if (position.y > boundsY || position.y < -boundsY) velocity.y *= -1;

                dummyModel.position.copy(position);
                
                // Point the model in the direction it is moving
                if (velocity.lengthSq() > 0.001) {
                    const angle = Math.atan2(velocity.x, velocity.y);
                    dummyModel.rotation.y = angle;
                }

                acceleration.set(0, 0, 0); // Reset for next frame
                if (mixer) mixer.update(delta);
            }

            renderer.render(scene, camera);
        };
        animate();

        // 6. CLEANUP
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            if (mountRef.current) mountRef.current.innerHTML = '';
            renderer.dispose();
        };
    }, [isAdmin]);

    return (
        <div 
            ref={mountRef} 
            className="fixed inset-0 z-50 pointer-events-none" // Canvas ignores pointer, but window listener catches touch
        />
    );
};
