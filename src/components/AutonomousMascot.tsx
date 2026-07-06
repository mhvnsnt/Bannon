import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PolymorphicRig } from '../utils/PolymorphicRig';
import { getMascotAttitude } from '../utils/memoryMatrix';
import { VoiceNexus } from '../utils/VoiceNexus';
import { ParticleEmitter } from '../utils/ParticleEmitter';
import { TemporalAnchor } from '../utils/TemporalAnchor';
import { SandboxInfiltrator } from '../utils/SandboxInfiltrator';
import { ShadowBreaker } from '../utils/ShadowBreaker';
import { HeapProfiler } from '../utils/HeapProfiler';
import { AST_Synthesizer } from '../utils/AST_Synthesizer';
import { CloudGrid } from '../utils/CloudGrid';
import { AdminTelemetryPanel } from '../components/AdminTelemetryPanel';
import { GhostWriter } from '../utils/GhostWriter';
import { MutationEngine } from '../utils/MutationEngine';
import { VerificationSupervisor } from '../utils/VerificationSupervisor';
import { RuntimeLinker } from '../utils/RuntimeLinker';
import { Panopticon } from '../utils/Panopticon';
import { BiometricGaze, GazeData } from '../utils/BiometricGaze';

export const AutonomousMascot: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const temporalAnchor = useRef(new TemporalAnchor());
    const [isTracking, setIsTracking] = useState(false);
    const [gazeStats, setGazeStats] = useState<GazeData | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isHUDMinimized, setIsHUDMinimized] = useState(false);

    useEffect(() => {
        if (!mountRef.current) return;
        mountRef.current.innerHTML = ''; 

        // 0. TELEMETRY SOCKET SETUP
        const myUserId = isAdmin ? 'admin_user' : 'user_' + Math.floor(Math.random() * 1000);
        const panopticon = new Panopticon(isAdmin ? 'admin' : 'user', myUserId);
        
        panopticon.registerOverrideListener((payload) => {
            console.log("[AutonomousMascot] [OVERRIDE COMMAND RECEIVED]:", payload);
            if (payload.action === 'force_reload') {
                console.log("[AutonomousMascot] Executing forced administrative reload!");
                window.location.reload();
            }
        });

        // 1. SCENE SETUP
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 25; 

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.pointerEvents = 'none'; // Set to none so the user can click and scroll through the mascot canvas
        mountRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        // Particle Emitter for WASM compile visualization
        const particleEmitter = new ParticleEmitter(scene);
        let isCompiling = false;
        
        // Listen for compile events (mocked for now, this would be wired to the real compiler)
        window.addEventListener('wasm-compile-start', () => { isCompiling = true; });
        window.addEventListener('wasm-compile-end', () => { isCompiling = false; });

        // VoiceNexus setup
        const voiceNexus = new VoiceNexus();
        
        // Analytics and orchestration setup
        const heapProfiler = new HeapProfiler(scene);
        const astSynthesizer = new AST_Synthesizer(scene);
        const cloudGrid = new CloudGrid();
        
        window.addEventListener('trigger-heap-profile', () => {
            heapProfiler.ingestSample({ address: Date.now(), size: 1024, timestamp: Date.now(), depth: Math.random()*5, retained: Math.random()>0.5 });
        });
        
        window.addEventListener('trigger-ast-synth', () => {
            astSynthesizer.updateFromCode("function test() { if(true) { for(;;) {} } }");
        });
        
        let isRewinding = false;
        let editorBounds = new THREE.Vector3(0, 0, 0);

        window.addEventListener('wasm-crash', () => {
            const previousState = temporalAnchor.current.rewind();
            if (previousState) {
                isRewinding = true;
                voiceNexus.speak("Critical failure detected. Rewinding structural state.");
                
                setTimeout(() => {
                    isRewinding = false;
                    window.dispatchEvent(new CustomEvent('editor-restore-state', { detail: { code: previousState } }));
                }, 2000);
            }
        });

        // 2. THE MULTI-MATERIAL SKINNING ENGINE
        const logoPalette = [
            0xFF3366, // C - Pink
            0xFF9933, // O - Orange
            0xFFCC00, // D - Yellow
            0x33CC33, // E - Green
            0x00CCCC, // D - Cyan
            0x3366FF, // U - Blue
            0x9933CC, // M - Purple
            0xFF3333  // Y - Red
        ];

        const brandMaterials = logoPalette.map(hex => new THREE.MeshBasicMaterial({ color: hex }));
        const jointMaterial = new THREE.MeshBasicMaterial({ color: 0x1E293B }); // Slate black for joints

        const generateFaceTexture = (text?: string) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Base Head Color (Yellow)
                ctx.fillStyle = '#FFCC00';
                ctx.fillRect(0, 0, 512, 512);

                // Crash Target Outer Ring
                ctx.beginPath();
                ctx.arc(256, 256, 120, 0, Math.PI * 2);
                ctx.lineWidth = 15;
                ctx.strokeStyle = '#1E293B';
                ctx.stroke();

                // The Alternating Quadrants
                ctx.fillStyle = '#1E293B';
                // Top Right
                ctx.beginPath();
                ctx.moveTo(256, 256); ctx.arc(256, 256, 120, 0, Math.PI / 2); ctx.fill();
                // Bottom Left
                ctx.beginPath();
                ctx.moveTo(256, 256); ctx.arc(256, 256, 120, Math.PI, Math.PI * 1.5); ctx.fill();
                
                if (text) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 60px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(text, 256, 450);
                }
            }

            const texture = new THREE.CanvasTexture(canvas);
            // Adjust UV wrapping in case the Mixamo model's head UV is skewed
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            return new THREE.MeshBasicMaterial({ map: texture });
        };

        let faceMaterial = generateFaceTexture();

        let dummyModel: THREE.Group | null = null;
        let headBone: THREE.Object3D | null = null;
        let neckBone: THREE.Object3D | null = null;
        let leftEyeBone: THREE.Object3D | null = null;
        let rightEyeBone: THREE.Object3D | null = null;
        let spineBone: THREE.Object3D | null = null;
        let leftArmBone: THREE.Object3D | null = null;
        let rightArmBone: THREE.Object3D | null = null;
        let leftLegBone: THREE.Object3D | null = null;
        let rightLegBone: THREE.Object3D | null = null;
        let mixer: THREE.AnimationMixer;
        let animations: THREE.AnimationClip[] = [];
        const loader = new GLTFLoader();

        const updateFaceMaterials = (newMaterial: THREE.Material) => {
            if (!dummyModel) return;
            dummyModel.traverse((child) => {
                if ((child as THREE.SkinnedMesh).isMesh) {
                    const mesh = child as THREE.SkinnedMesh;
                    const name = mesh.name.toLowerCase();
                    if (name.includes('head') || name.includes('helmet') || name.includes('face')) {
                        mesh.material = newMaterial;
                    }
                }
            });
        };

        const applyHistoricalAttitude = async (mixer: THREE.AnimationMixer, gltf: any) => {
            const attitude = await getMascotAttitude();

            let targetAnimationIndex = 0; // Default idle

            if (!isAdmin) {
                if (attitude === 'annoyed') {
                    targetAnimationIndex = gltf.animations.findIndex((a: any) => a.name === 'ArmCrossIdle');
                } else if (attitude === 'cautious') {
                    targetAnimationIndex = gltf.animations.findIndex((a: any) => a.name === 'DefensiveIdle');
                }
            }

            if (targetAnimationIndex === -1) targetAnimationIndex = 0;
            
            if (gltf.animations[targetAnimationIndex]) {
                const action = mixer.clipAction(gltf.animations[targetAnimationIndex]);
                action.play();
            }
        };

        const buildProceduralRobot = () => {
            const group = new THREE.Group();
            group.name = "ProceduralRobot";

            // Hips / Pelvis Base
            const hipsGeom = new THREE.CylinderGeometry(0.5, 0.4, 0.8, 8);
            const hipsMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
            const hipsMesh = new THREE.Mesh(hipsGeom, hipsMat);
            hipsMesh.position.y = -2.0;
            group.add(hipsMesh);

            // Spine / Chest
            const chestGeom = new THREE.BoxGeometry(1.4, 1.6, 1.1);
            const chestMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
            const chestMesh = new THREE.Mesh(chestGeom, chestMat);
            chestMesh.position.y = 1.2;
            hipsMesh.add(chestMesh);
            spineBone = chestMesh;

            // Neck
            const neckGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
            const neckMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
            const neckMesh = new THREE.Mesh(neckGeom, neckMat);
            neckMesh.position.y = 1.0;
            chestMesh.add(neckMesh);
            neckBone = neckMesh;

            // Head (With multi-material face mapping)
            const headGeom = new THREE.BoxGeometry(1.6, 1.4, 1.4);
            const sideMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
            const headMaterials = [
                sideMat, // left
                sideMat, // right
                sideMat, // top
                sideMat, // bottom
                faceMaterial, // front face
                sideMat  // back
            ];
            const headMesh = new THREE.Mesh(headGeom, headMaterials);
            headMesh.position.y = 0.9;
            neckMesh.add(headMesh);
            headBone = headMesh;

            // Antenna
            const antGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 4);
            const antMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
            const antMesh = new THREE.Mesh(antGeom, antMat);
            antMesh.position.y = 0.9;
            headMesh.add(antMesh);

            const tipGeom = new THREE.SphereGeometry(0.14, 8, 8);
            const tipMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
            const tipMesh = new THREE.Mesh(tipGeom, tipMat);
            tipMesh.position.y = 0.25;
            antMesh.add(tipMesh);

            // Left Eye
            const eyeGeom = new THREE.SphereGeometry(0.15, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
            const leftEyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
            leftEyeMesh.position.set(-0.4, 0.1, 0.71);
            headMesh.add(leftEyeMesh);
            leftEyeBone = leftEyeMesh;

            // Right Eye
            const rightEyeMesh = leftEyeMesh.clone();
            rightEyeMesh.position.set(0.4, 0.1, 0.71);
            headMesh.add(rightEyeMesh);
            rightEyeBone = rightEyeMesh;

            // Left Arm
            const shoulderLGeom = new THREE.SphereGeometry(0.24, 8, 8);
            const shoulderLMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
            const shoulderL = new THREE.Mesh(shoulderLGeom, shoulderLMat);
            shoulderL.position.set(-0.9, 0.6, 0);
            chestMesh.add(shoulderL);
            leftArmBone = shoulderL;

            const bicepLGeom = new THREE.CylinderGeometry(0.14, 0.12, 1.0, 8);
            const bicepLMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const bicepL = new THREE.Mesh(bicepLGeom, bicepLMat);
            bicepL.position.y = -0.5;
            shoulderL.add(bicepL);

            // Right Arm
            const shoulderR = shoulderL.clone();
            shoulderR.position.x = 0.9;
            chestMesh.add(shoulderR);
            rightArmBone = shoulderR;

            // Left Leg
            const hipLGeom = new THREE.SphereGeometry(0.24, 8, 8);
            const hipLMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
            const hipL = new THREE.Mesh(hipLGeom, hipLMat);
            hipL.position.set(-0.45, -0.4, 0);
            hipsMesh.add(hipL);
            leftLegBone = hipL;

            const thighLGeom = new THREE.CylinderGeometry(0.16, 0.13, 1.1, 8);
            const thighLMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
            const thighL = new THREE.Mesh(thighLGeom, thighLMat);
            thighL.position.y = -0.55;
            hipL.add(thighL);

            // Right Leg
            const hipR = hipL.clone();
            hipR.position.x = 0.45;
            hipsMesh.add(hipR);
            rightLegBone = hipR;

            group.scale.set(3.2, 3.2, 3.2);
            group.position.set(0, -3.5, 0);
            scene.add(group);
            dummyModel = group;
        };

        loader.load('/dummy.glb', (gltf) => {
            dummyModel = gltf.scene;
            animations = gltf.animations;
            let colorIndex = 0;

            dummyModel.traverse((child) => {
                const lowerName = child.name.toLowerCase();
                if (lowerName.includes('neck')) {
                    neckBone = child;
                } else if (lowerName.includes('head')) {
                    headBone = child;
                } else if (lowerName.includes('lefteye') || (lowerName.includes('eye') && lowerName.includes('l'))) {
                    leftEyeBone = child;
                } else if (lowerName.includes('righteye') || (lowerName.includes('eye') && lowerName.includes('r'))) {
                    rightEyeBone = child;
                } else if (lowerName.includes('spine') || lowerName.includes('chest') || lowerName.includes('pelvis')) {
                    spineBone = child;
                } else if (lowerName.includes('leftarm') || (lowerName.includes('arm') && lowerName.includes('l') && !lowerName.includes('forearm'))) {
                    leftArmBone = child;
                } else if (lowerName.includes('rightarm') || (lowerName.includes('arm') && lowerName.includes('r') && !lowerName.includes('forearm'))) {
                    rightArmBone = child;
                } else if (lowerName.includes('leftleg') || (lowerName.includes('leg') && lowerName.includes('l') && !lowerName.includes('foot'))) {
                    leftLegBone = child;
                } else if (lowerName.includes('rightleg') || (lowerName.includes('leg') && lowerName.includes('r') && !lowerName.includes('foot'))) {
                    rightLegBone = child;
                }
                
                if ((child as THREE.SkinnedMesh).isMesh) {
                    const mesh = child as THREE.SkinnedMesh;
                    const name = mesh.name.toLowerCase();

                    if (name.includes('head') || name.includes('helmet') || name.includes('face')) {
                        mesh.material = faceMaterial;
                    } else if (name.includes('joint') || name.includes('neck') || name.includes('spine')) {
                        mesh.material = jointMaterial;
                    } else {
                        mesh.material = isAdmin ? new THREE.MeshBasicMaterial({ color: 0xFFB703 }) : brandMaterials[colorIndex % brandMaterials.length];
                        colorIndex++;
                    }
                }
            });

            dummyModel.scale.set(4.5, 4.5, 4.5);
            dummyModel.position.set(0, -5, 0); 
            scene.add(dummyModel);

            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(dummyModel);
                applyHistoricalAttitude(mixer, gltf);
            }
        }, undefined, (err) => {
            console.warn("[AutonomousMascot] /dummy.glb load failed or bypassed. Executing buildProceduralRobot fallback strategy.", err);
            buildProceduralRobot();
        });

        // 3. STEERING ENGINE (Wander & Repulsion)
        const position = new THREE.Vector3(0, 0, 0);
        const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 0);
        const acceleration = new THREE.Vector3(0, 0, 0);
        
        const mousePos = new THREE.Vector3(9999, 9999, 0);
        const maxSpeed = 0.08;
        
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
            mousePos.unproject(camera);
            mousePos.z = 0;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const getDOMRepulsion = () => {
            const force = new THREE.Vector3(0, 0, 0);
            // Include ShadowBreaker logic to find elements
            const elements = ShadowBreaker.deepQuerySelectorAll('button, input, .editor-container, [role="navigation"]');
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const x = (rect.left / window.innerWidth) * 2 - 1;
                const y = -(rect.top / window.innerHeight) * 2 + 1;
                const elPos = new THREE.Vector3(x, y, 0).unproject(camera);
                elPos.z = 0;

                const distance = position.distanceTo(elPos);
                if (distance < 5.0) {
                    const repulse = new THREE.Vector3().subVectors(position, elPos);
                    repulse.normalize();
                    repulse.divideScalar(distance); 
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
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                
                if (isAdmin && dummyModel && mixer) {
                    velocity.set(0, 0, 0);
                    dummyModel.position.set(0, 0, 5); 
                    dummyModel.rotation.y = 0;

                    const summonAnim = animations.find(a => a.name === 'SummonHologram');
                    if (summonAnim) {
                        const summonAction = mixer.clipAction(summonAnim);
                        summonAction.play();
                    }

                    window.dispatchEvent(new CustomEvent('toggle-autonomous-shell'));
                }
            }, 800);
        };

        const handleTouchEnd = () => {
            clearTimeout(pressTimer);
            if (!isLongPress) {
                if (navigator.vibrate) navigator.vibrate(20);
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        // Biometric Gaze Engine hooks
        let biometricGaze: BiometricGaze | null = null;
        let currentGazeData: GazeData | null = null;

        const handleToggleGaze = async (e: any) => {
            const active = e.detail.active;
            if (active) {
                setCameraError(null);
                biometricGaze = new BiometricGaze((data) => {
                    currentGazeData = data;
                    setGazeStats(data);
                });
                const success = await biometricGaze.start();
                if (success) {
                    setIsTracking(true);
                    voiceNexus.speak("Biometric link established. Gaze tracking system online.");
                    faceMaterial = generateFaceTexture("O_O");
                    updateFaceMaterials(faceMaterial);
                } else {
                    setIsTracking(false);
                    biometricGaze = null;
                    setCameraError("Camera blocked in iframe workspace. Open app in a new tab (top right icon) to grant permission!");
                    voiceNexus.speak("Biometric tracking failed. Verify camera permissions.");
                }
            } else {
                if (biometricGaze) {
                    biometricGaze.stop();
                    biometricGaze = null;
                }
                currentGazeData = null;
                setGazeStats(null);
                setIsTracking(false);
                setCameraError(null);
                voiceNexus.speak("Biometric interface severed.");
                faceMaterial = generateFaceTexture();
                updateFaceMaterials(faceMaterial);
            }
        };

        window.addEventListener('toggle-biometric-gaze', handleToggleGaze as EventListener);

        const mutationEngine = new MutationEngine(async (status, mutatedCode, error) => {
            if (status === 'MUTATED' && mutatedCode) {
                const supervisor = new VerificationSupervisor();
                const passed = await supervisor.verifyMutation('src/components/AutonomousMascot.tsx', mutatedCode, {});
                if (passed) {
                    await GhostWriter.patchFile('src/components/AutonomousMascot.tsx', mutatedCode);
                    const linker = new RuntimeLinker();
                    await linker.hotSwap('AutonomousMascot', mutatedCode, {});
                }
            }
        });

        window.addEventListener('trigger-self-mutation', async () => {
            console.log("[Auto-Upgrade] Initiating autonomous self-mutation cycle...");
            const currentCode = await GhostWriter.getFile('src/components/AutonomousMascot.tsx');
            if (currentCode) {
                mutationEngine.ingest(currentCode, 'PERFORMANCE_LOOP');
            } else {
                console.warn("[Auto-Upgrade] GhostWriter failed to read source. Is FS Access granted?");
            }
        });

        
        window.addEventListener('trigger-targeted-mutation', async (e: any) => {
            const target = e.detail.target;
            console.log(`[Auto-Upgrade] Targeted mutation request for: ${target}`);
            const currentCode = await GhostWriter.getFile(target);
            if (currentCode) {
                mutationEngine.ingest(currentCode, 'RUNTIME_CRASH'); // Mocking strategy flag based on CLI
                
                // Set up a one-time listener to handle the targeted patch
                const handleTargetedPatch = async (statusEvent: any) => {
                   if (statusEvent.detail.status === 'MUTATED' && statusEvent.detail.code) {
                       const supervisor = new VerificationSupervisor();
                       const passed = await supervisor.verifyMutation(target, statusEvent.detail.code, {});
                       if (passed) {
                           await GhostWriter.patchFile(target, statusEvent.detail.code);
                           console.log(`[RuntimeLinker] Emulating hot-swap for ${target} (Note: requires Vite HMR or full reload in dev env)`);
                       }
                   }
                };
            } else {
                console.warn(`[Auto-Upgrade] GhostWriter failed to read ${target}.`);
            }
        });

        
        let activeCodeValue = "// Workspace active session...";
        window.addEventListener('editor-code-changed', (e: any) => {
            activeCodeValue = e.detail.code;
            if (astSynthesizer) {
                astSynthesizer.updateFromCode(e.detail.code);
            }
        });

        
        window.addEventListener('mascot-model-uploaded', ((e: any) => {
            const url = e.detail.url;
            console.log("[AutonomousMascot] Hot-swapping custom model payload:", url);
            loader.load(url, (gltf) => {
                if (dummyModel) {
                    scene.remove(dummyModel);
                }
                dummyModel = gltf.scene;
                PolymorphicRig.normalizeScale(dummyModel, 4.5);
                scene.add(dummyModel);
                console.log("[AutonomousMascot] Model swapped successfully.");
            });
        }) as EventListener);

        // Mood and reaction state trackers
        let animTime = 0;
        let isSad = false;
        let sadTimer = 0;
        let isExcited = false;
        let excitedTimer = 0;
        let isSpinning = false;
        let spinProgress = 0;
        let blinkTimer = 0;
        let blinkActive = false;

        const handleCompileStart = () => {
            isExcited = true;
            excitedTimer = 3.0;
            faceMaterial = generateFaceTexture("^o^");
            updateFaceMaterials(faceMaterial);
        };

        const handleCompileEnd = () => {
            isExcited = false;
            excitedTimer = 0;
            isSpinning = true;
            spinProgress = 0;
            faceMaterial = generateFaceTexture("O_O");
            updateFaceMaterials(faceMaterial);
            voiceNexus.speak("Grid compiling phase finalized. Structural optimization verified!");
        };

        const handleCompileFail = () => {
            isSad = true;
            sadTimer = 6.0;
            isExcited = false;
            excitedTimer = 0;
            faceMaterial = generateFaceTexture("X_X");
            updateFaceMaterials(faceMaterial);
            voiceNexus.speak("Oh no! Compilation failed! The code structures are unstable!");
        };

        const handleReassemble = () => {
            isSad = false;
            sadTimer = 0;
            faceMaterial = generateFaceTexture("^_^");
            updateFaceMaterials(faceMaterial);
            setTimeout(() => {
                faceMaterial = generateFaceTexture();
                updateFaceMaterials(faceMaterial);
            }, 1500);
            voiceNexus.speak("Reassembly successful. System equilibrium restored.");
        };

        window.addEventListener('wasm-compile-start', handleCompileStart);
        window.addEventListener('wasm-compile-end', handleCompileEnd);
        window.addEventListener('compilation-failed', handleCompileFail);
        window.addEventListener('reset-kinetic-dom', handleReassemble);

        // 5. MAIN INTEGRATION LOOP
        const clock = new THREE.Clock();
        let attentionTriggerCooldown = 0;

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (isCompiling && dummyModel) {
                particleEmitter.emit(new THREE.Vector3(dummyModel.position.x, dummyModel.position.y + 2, dummyModel.position.z + 1));
            }
            particleEmitter.update(delta);

            if (dummyModel && !isLongPress) {
                if (isRewinding) {
                    const targetEditorPos = new THREE.Vector3(-10, 0, 0);
                    dummyModel.position.lerp(targetEditorPos, 0.05);
                    dummyModel.rotation.y = Math.PI / 4;
                    if (headBone && headBone.parent) {
                        headBone.parent.children.forEach(child => {
                            if (child.name.toLowerCase().includes('arm')) {
                                child.rotation.z = Math.PI / 2;
                            }
                        });
                    }
                } else {
                    animTime += delta;

                    // 1. BLINK ENGINE
                    blinkTimer += delta;
                    if (blinkTimer > 4.2) {
                        blinkActive = true;
                        if (blinkTimer > 4.35) {
                            blinkActive = false;
                            blinkTimer = 0;
                        }
                    }

                    // 2. MOOD TIMERS DECAY
                    if (sadTimer > 0) {
                        sadTimer -= delta;
                        if (sadTimer <= 0) {
                            isSad = false;
                            faceMaterial = generateFaceTexture();
                            updateFaceMaterials(faceMaterial);
                        }
                    }

                    if (excitedTimer > 0) {
                        excitedTimer -= delta;
                        if (excitedTimer <= 0) {
                            isExcited = false;
                            faceMaterial = generateFaceTexture();
                            updateFaceMaterials(faceMaterial);
                        }
                    }

                    // 3. CELEBRATORY SPIN / BACKFLIP
                    if (isSpinning) {
                        spinProgress += delta * 7.5;
                        dummyModel.rotation.x = spinProgress;
                        if (spinProgress >= Math.PI * 2) {
                            isSpinning = false;
                            dummyModel.rotation.x = 0;
                        }
                    }

                    // 4. FLOATING AND BREATHING BOBBING CYCLE
                    const breathCycle = Math.sin(animTime * 2.2);
                    const idleSwingX = Math.sin(animTime * 0.6) * 0.08;
                    const idleSwingY = Math.cos(animTime * 0.8) * 0.05;

                    dummyModel.position.y += breathCycle * 0.005;

                    if (spineBone) {
                        spineBone.rotation.x = breathCycle * 0.025;
                        spineBone.rotation.y = idleSwingX * 0.15;
                    }

                    // 5. LOCOMOTION SWING OR SPECIAL SKELETAL POSING
                    const speedSq = velocity.lengthSq();
                    const isMoving = speedSq > 0.0001;

                    if (isSad) {
                        // Slouched sad posture
                        if (headBone) headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, 0.45, 0.1);
                        if (leftArmBone) {
                            leftArmBone.rotation.x = THREE.MathUtils.lerp(leftArmBone.rotation.x, 0.4, 0.1);
                            leftArmBone.rotation.z = THREE.MathUtils.lerp(leftArmBone.rotation.z, -0.1, 0.1);
                        }
                        if (rightArmBone) {
                            rightArmBone.rotation.x = THREE.MathUtils.lerp(rightArmBone.rotation.x, 0.4, 0.1);
                            rightArmBone.rotation.z = THREE.MathUtils.lerp(rightArmBone.rotation.z, 0.1, 0.1);
                        }
                        if (leftLegBone) leftLegBone.rotation.x = THREE.MathUtils.lerp(leftLegBone.rotation.x, -0.1, 0.1);
                        if (rightLegBone) rightLegBone.rotation.x = THREE.MathUtils.lerp(rightLegBone.rotation.x, -0.1, 0.1);
                    } else if (isExcited) {
                        // Joyous arm flapping
                        if (headBone) headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, -0.2, 0.1);
                        if (leftArmBone) {
                            leftArmBone.rotation.z = THREE.MathUtils.lerp(leftArmBone.rotation.z, -Math.PI / 1.5 + Math.sin(animTime * 18) * 0.4, 0.2);
                            leftArmBone.rotation.x = 0;
                        }
                        if (rightArmBone) {
                            rightArmBone.rotation.z = THREE.MathUtils.lerp(rightArmBone.rotation.z, Math.PI / 1.5 - Math.sin(animTime * 18) * 0.4, 0.2);
                            rightArmBone.rotation.x = 0;
                        }
                    } else if (isMoving) {
                        // Walking / running swing cycles
                        const swingFreq = 12;
                        const swingAmp = 0.55;
                        const leftArmSwing = Math.sin(animTime * swingFreq) * swingAmp;
                        const rightArmSwing = -Math.sin(animTime * swingFreq) * swingAmp;
                        const leftLegSwing = -Math.sin(animTime * swingFreq) * swingAmp;
                        const rightLegSwing = Math.sin(animTime * swingFreq) * swingAmp;

                        if (leftArmBone) {
                            leftArmBone.rotation.x = THREE.MathUtils.lerp(leftArmBone.rotation.x, leftArmSwing, 0.25);
                            leftArmBone.rotation.z = THREE.MathUtils.lerp(leftArmBone.rotation.z, -0.15, 0.15);
                        }
                        if (rightArmBone) {
                            rightArmBone.rotation.x = THREE.MathUtils.lerp(rightArmBone.rotation.x, rightArmSwing, 0.25);
                            rightArmBone.rotation.z = THREE.MathUtils.lerp(rightArmBone.rotation.z, 0.15, 0.15);
                        }
                        if (leftLegBone) {
                            leftLegBone.rotation.x = THREE.MathUtils.lerp(leftLegBone.rotation.x, leftLegSwing, 0.25);
                        }
                        if (rightLegBone) {
                            rightLegBone.rotation.x = THREE.MathUtils.lerp(rightLegBone.rotation.x, rightLegSwing, 0.25);
                        }
                    } else {
                        // Gentle resting breathing sway
                        if (leftArmBone) {
                            leftArmBone.rotation.x = THREE.MathUtils.lerp(leftArmBone.rotation.x, 0.15 + Math.sin(animTime * 1.5) * 0.05, 0.1);
                            leftArmBone.rotation.z = THREE.MathUtils.lerp(leftArmBone.rotation.z, -0.1, 0.1);
                        }
                        if (rightArmBone) {
                            rightArmBone.rotation.x = THREE.MathUtils.lerp(rightArmBone.rotation.x, 0.15 - Math.sin(animTime * 1.5) * 0.05, 0.1);
                            rightArmBone.rotation.z = THREE.MathUtils.lerp(rightArmBone.rotation.z, 0.1, 0.1);
                        }
                        if (leftLegBone) {
                            leftLegBone.rotation.x = THREE.MathUtils.lerp(leftLegBone.rotation.x, 0, 0.1);
                        }
                        if (rightLegBone) {
                            rightLegBone.rotation.x = THREE.MathUtils.lerp(rightLegBone.rotation.x, 0, 0.1);
                        }
                    }

                    // Eye blink scale overrides
                    if (leftEyeBone) leftEyeBone.scale.y = blinkActive ? 0.05 : 1.0;
                    if (rightEyeBone) rightEyeBone.scale.y = blinkActive ? 0.05 : 1.0;

                    // A. Wander Force or Biometric Eye Contact
                    if (currentGazeData && currentGazeData.faceDetected) {
                        // Apply live 3D bone offsets for cervical (neck) and ocular (eye) bones
                        const lerpFactor = 0.15;
                        const targetRotX = (currentGazeData.pitch * Math.PI) / 180;
                        const targetRotY = (-currentGazeData.yaw * Math.PI) / 180;
                        const targetRotZ = (currentGazeData.roll * Math.PI) / 180;

                        if (headBone) {
                            headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, targetRotX, lerpFactor);
                            headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetRotY, lerpFactor);
                            headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, targetRotZ, lerpFactor);
                        }

                        if (neckBone) {
                            neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, targetRotY * 0.5, lerpFactor);
                        }

                        // Apply to custom ocular bones if available
                        if (leftEyeBone) {
                            const eyeX = (currentGazeData.pupilLeftX - 0.5) * 0.5;
                            const eyeY = (currentGazeData.pupilLeftY - 0.5) * 0.5;
                            leftEyeBone.rotation.y = THREE.MathUtils.lerp(leftEyeBone.rotation.y, eyeX, lerpFactor);
                            leftEyeBone.rotation.x = THREE.MathUtils.lerp(leftEyeBone.rotation.x, eyeY, lerpFactor);
                        }
                        if (rightEyeBone) {
                            const eyeX = (currentGazeData.pupilRightX - 0.5) * 0.5;
                            const eyeY = (currentGazeData.pupilRightY - 0.5) * 0.5;
                            rightEyeBone.rotation.y = THREE.MathUtils.lerp(rightEyeBone.rotation.y, eyeX, lerpFactor);
                            rightEyeBone.rotation.x = THREE.MathUtils.lerp(rightEyeBone.rotation.x, eyeY, lerpFactor);
                        }

                        // Biometric eye-contact attention tracker
                        if (currentGazeData.attentionLost) {
                            attentionTriggerCooldown += delta;
                            if (attentionTriggerCooldown > 2.5) { // trigger warning every 2.5 seconds of distraction
                                faceMaterial = generateFaceTexture("ಠ_ಠ");
                                updateFaceMaterials(faceMaterial);
                                voiceNexus.speak("Pay attention, coder! Focus on your architecture!");
                                // Physically float towards the camera to regain attention
                                position.z = THREE.MathUtils.lerp(position.z, 4, 0.1);
                                attentionTriggerCooldown = 0;
                            }
                        } else {
                            attentionTriggerCooldown = 0;
                            position.z = THREE.MathUtils.lerp(position.z, 0, 0.1);
                        }
                    } else {
                        // Classical mouse tracking fallback
                        const wanderForce = new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0);
                        acceleration.add(wanderForce);

                        const distToMouse = position.distanceTo(mousePos);
                        if (distToMouse < 4.0) {
                            const mouseFlee = new THREE.Vector3().subVectors(position, mousePos).normalize().multiplyScalar(0.02);
                            acceleration.add(mouseFlee);
                        }

                        const domFlee = getDOMRepulsion();
                        acceleration.add(domFlee.multiplyScalar(0.015));

                        velocity.add(acceleration);
                        velocity.clampLength(0, maxSpeed);
                        position.add(velocity);
                        
                        const boundsX = 12; 
                        const boundsY = 8;
                        if (position.x > boundsX || position.x < -boundsX) velocity.x *= -1;
                        if (position.y > boundsY || position.y < -boundsY) velocity.y *= -1;

                        dummyModel.position.copy(position);

                        if (velocity.lengthSq() > 0.001) {
                            const angle = Math.atan2(velocity.x, velocity.y);
                            dummyModel.rotation.y = angle;
                        }

                        acceleration.set(0, 0, 0);
                    }

                    // BROADCAST REAL-TIME TELEMETRY VIA PANOPTICON WEBSOCKET
                    panopticon.broadcastTelemetry(
                        activeCodeValue,
                        { x: dummyModel.position.x, y: dummyModel.position.y, z: dummyModel.position.z },
                        isRewinding ? 'rewind' : 'wander'
                    );

                    // CLOUD GRID TELEMETRY SYNC
                    if (cloudGrid.provider?.shouldConnect) {
                         cloudGrid.updateLocalMascot({
                               id: 'local_mascot_' + Math.random().toString(36).substr(2, 5),
                               x: dummyModel.position.x,
                               y: dummyModel.position.y,
                               z: dummyModel.position.z,
                               rotY: dummyModel.rotation.y,
                               animState: isRewinding ? 'rewind' : 'wander'
                         });
                    }
                }
                
                // VoiceNexus real frequency lip sync
                const openness = voiceNexus.getMouthOpenness();
                if (headBone) {
                    headBone.scale.y = 1 + openness * 0.55;
                    headBone.scale.z = 1 + openness * 0.25; // add phoneme vibration scaling on depth
                }
            }

            if (mixer) mixer.update(delta);
            renderer.render(scene, camera);
        };
        animate();

        // 6. CLEANUP
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('toggle-biometric-gaze', handleToggleGaze as EventListener);
            window.removeEventListener('wasm-compile-start', handleCompileStart);
            window.removeEventListener('wasm-compile-end', handleCompileEnd);
            window.removeEventListener('compilation-failed', handleCompileFail);
            window.removeEventListener('reset-kinetic-dom', handleReassemble);
            if (biometricGaze) {
                biometricGaze.stop();
            }
            if (mountRef.current) mountRef.current.innerHTML = '';
            renderer.dispose();
            astSynthesizer.dispose();
            voiceNexus.dispose();
        };
    }, [isAdmin]);

    const handleGazeHUDToggle = () => {
        const nextActiveState = !isTracking;
        window.dispatchEvent(new CustomEvent('toggle-biometric-gaze', { detail: { active: nextActiveState } }));
    };

    return (
        <>
        <AdminTelemetryPanel />
        <div 
            ref={mountRef} 
            className="fixed inset-0 z-40 pointer-events-none select-none touch-none" 
            style={{ pointerEvents: 'none' }}
        />
             {/* Futuristic Cybernetic HUD Overlay */}
        <div className="hidden md:flex fixed top-16 right-4 z-[9999] pointer-events-auto flex-col gap-2">
            {isHUDMinimized ? (
                <button 
                    onClick={() => setIsHUDMinimized(false)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 rounded-full text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105 transition duration-200 cursor-pointer font-mono text-[9px] uppercase tracking-wider"
                >
                    <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    👁️ Biometric HUD
                </button>
            ) : (
                <div className="bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md rounded-lg p-3 text-xs font-mono text-cyan-400 w-64 shadow-[0_0_20px_rgba(6,182,212,0.15)] select-none">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                        <span className="font-bold tracking-widest text-[10px]">BIOMETRIC GAZE v1.0</span>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-[9px] ${isTracking ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                                {isTracking ? 'ON' : 'OFF'}
                            </span>
                            <button 
                                onClick={() => setIsHUDMinimized(true)}
                                className="text-cyan-500 hover:text-cyan-300 font-bold px-1.5 py-0.5 rounded hover:bg-cyan-500/10 cursor-pointer font-mono text-[10px]"
                                title="Minimize HUD"
                            >
                                —
                            </button>
                        </div>
                    </div>

                    {!isTracking ? (
                        <div className="text-center py-4">
                            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                                Webcam-coupled tracking for spatial eye contact and engagement monitoring.
                            </p>
                            {cameraError && (
                                <div className="text-[9px] text-red-400 bg-red-950/30 border border-red-500/20 p-2 rounded mb-3 text-left leading-relaxed">
                                    ⚠️ <span className="font-bold">Access Blocked:</span> {cameraError}
                                </div>
                            )}
                            <button 
                                onClick={handleGazeHUDToggle}
                                className="w-full py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold tracking-wider text-[10px] rounded transition duration-200 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            >
                                ACTIVATE GAZE SENSOR
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* Interactive schematic face grid simulation */}
                            <div className="relative h-16 bg-cyan-950/30 border border-cyan-500/15 rounded flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:8px_8px] animate-pulse" />
                                <div className="absolute w-10 h-10 border border-dashed border-cyan-500/40 rounded-full animate-spin [animation-duration:10s]" />
                                <div className="absolute w-3 h-3 border-t border-l border-cyan-400 -top-1 -left-1" />
                                <div className="absolute w-3 h-3 border-t border-r border-cyan-400 -top-1 -right-1" />
                                <div className="absolute w-3 h-3 border-b border-l border-cyan-400 -bottom-1 -left-1" />
                                <div className="absolute w-3 h-3 border-b border-r border-cyan-400 -bottom-1 -right-1" />
                                
                                {/* Live centroid tracking indicator */}
                                <div 
                                    className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] transition-all duration-75"
                                    style={{
                                        transform: `translate(${(gazeStats?.faceX ?? 0) * 40}px, ${-(gazeStats?.faceY ?? 0) * 25}px)`
                                    }}
                                />
                                
                                {/* Gaze attention locking line */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line 
                                        x1="50%" 
                                        y1="50%" 
                                        x2={`${50 + (gazeStats?.faceX ?? 0) * 50}%`} 
                                        y2={`${50 - (gazeStats?.faceY ?? 0) * 50}%`} 
                                        stroke="rgba(34, 211, 238, 0.4)" 
                                        strokeWidth="1" 
                                        strokeDasharray="2,2" 
                                    />
                                </svg>
                            </div>

                            {/* Real-time statistics telemetry values */}
                            <div className="text-[10px] space-y-1.5 text-slate-300">
                                <div className="flex justify-between">
                                    <span>HEAD YAW:</span>
                                    <span className={Math.abs(gazeStats?.yaw ?? 0) > 30 ? 'text-red-400 font-bold' : 'text-cyan-300'}>
                                        {(gazeStats?.yaw ?? 0).toFixed(1)}°
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>HEAD PITCH:</span>
                                    <span className={Math.abs(gazeStats?.pitch ?? 0) > 25 ? 'text-red-400 font-bold' : 'text-cyan-300'}>
                                        {(gazeStats?.pitch ?? 0).toFixed(1)}°
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>HEAD ROLL:</span>
                                    <span className="text-cyan-300 font-medium">{(gazeStats?.roll ?? 0).toFixed(1)}°</span>
                                </div>
                                <div className="flex justify-between border-t border-cyan-500/10 pt-1.5 mt-1 font-bold">
                                    <span>ATTENTION:</span>
                                    <span className={gazeStats?.attentionLost ? 'text-red-500 animate-pulse' : 'text-teal-400'}>
                                        {gazeStats?.attentionLost ? 'LOST (SEEKING)' : 'LOCKED'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={handleGazeHUDToggle}
                                className="w-full mt-1.5 py-1 bg-red-950/40 hover:bg-red-950/80 border border-red-500/40 text-red-400 font-bold tracking-wide text-[10px] rounded transition duration-200 cursor-pointer"
                            >
                                DEACTIVATE SENSORS
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
};

