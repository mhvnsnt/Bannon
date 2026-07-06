import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  UserPlus, 
  Settings, 
  RefreshCw, 
  BookOpen, 
  Flame, 
  Dumbbell, 
  Cpu, 
  Layers, 
  Plus, 
  X, 
  Info,
  ChevronRight
} from 'lucide-react';
import rosterData from '../data/roster.json';

// Define the Slot Interface
interface SlotConfig {
  id: number;
  type: 'Player' | 'CPU' | 'Empty';
  characterId: string | null;
  attireId: string | null;
  payback: string | null;
  managerId: string | null;
}

export const BannonSandbox: React.FC = () => {
  // --- 1. STATE VARIABLES ---
  const [slots, setSlots] = useState<SlotConfig[]>(
    Array.from({ length: 8 }).map((_, idx) => ({
      id: idx + 1,
      type: idx === 0 ? 'Player' : idx === 1 ? 'CPU' : 'Empty',
      characterId: idx === 0 ? 'bannon' : idx === 1 ? 'training_dummy' : null,
      attireId: idx === 0 ? 'classic' : idx === 1 ? 'default' : null,
      payback: idx === 0 ? 'Beast Mode' : idx === 1 ? 'None' : null,
      managerId: null,
    }))
  );

  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [poise, setPoise] = useState<number>(90); // 0 to 100
  const [dampingActive, setDampingActive] = useState<boolean>(false);
  const [maxVelocityMet, setMaxVelocityMet] = useState<number>(0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [showManifesto, setShowManifesto] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'arena' | 'roster' | 'manifesto'>('arena');

  // Three & Cannon Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const worldRef = useRef<CANNON.World | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Ragdoll bodies & joints ref for physical interactions
  const ragdollParts = useRef<{ mesh: THREE.Mesh; body: CANNON.Body; name: string }[]>([]);
  const ragdollConstraints = useRef<{ joint: CANNON.ConeTwistConstraint; targetRot: CANNON.Quaternion; initialLocalRot: CANNON.Quaternion }[]>([]);

  // Sound generator (custom synthesized sound on hits)
  const playSynthesizedHitSound = (freq: number, type: 'triangle' | 'sine' | 'sawtooth' = 'triangle') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Decay profile for heavy wrestling hit
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  // --- 2. THREE & CANNON INITIALIZATION ---
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // A. Three.js Scene Setup
    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617'); // Dark slate slate-950
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // B. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 15, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const ringSpotlight = new THREE.SpotLight(0x38bdf8, 3, 30, Math.PI / 4, 0.5, 1); // Cyber Cyan Spotlight
    ringSpotlight.position.set(0, 10, 0);
    ringSpotlight.target.position.set(0, 0, 0);
    scene.add(ringSpotlight);

    // C. Cannon.js World Setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.81, 0); // Real world gravity
    worldRef.current = world;

    // Ground Canvas Ring Mat
    const ringMatSize = 10;
    const ringGeo = new THREE.BoxGeometry(ringMatSize, 0.5, ringMatSize);
    const ringMat = new THREE.MeshStandardMaterial({ 
      color: '#1e293b', // slate-800
      roughness: 0.6,
      metalness: 0.1
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -0.25;
    ringMesh.receiveShadow = true;
    scene.add(ringMesh);

    // Physical mat body
    const groundBody = new CANNON.Body({
      mass: 0, // static
      shape: new CANNON.Box(new CANNON.Vec3(ringMatSize / 2, 0.25, ringMatSize / 2)),
      position: new CANNON.Vec3(0, -0.25, 0)
    });
    world.addBody(groundBody);

    // Ring Apron Canvas & Ropes
    const apronGeo = new THREE.BoxGeometry(ringMatSize + 0.8, 0.2, ringMatSize + 0.8);
    const apronMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.y = -0.36;
    scene.add(apronMesh);

    // Ring Posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8);
    const postMat = new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.8, roughness: 0.2 });
    const postsCoords = [
      [-5, 1.15, -5],
      [5, 1.15, -5],
      [-5, 1.15, 5],
      [5, 1.15, 5]
    ];
    postsCoords.forEach(([px, py, pz]) => {
      const pMesh = new THREE.Mesh(postGeo, postMat);
      pMesh.position.set(px, py, pz);
      scene.add(pMesh);
    });

    // Ring Ropes (cyan neon ropes)
    const ropeMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
    const ropeHeights = [0.6, 1.3, 2.0];
    ropeHeights.forEach(h => {
      const ropeGeoX = new THREE.CylinderGeometry(0.02, 0.02, 10);
      const rx1 = new THREE.Mesh(ropeGeoX, ropeMat);
      rx1.rotation.z = Math.PI / 2;
      rx1.position.set(0, h, -5);
      scene.add(rx1);

      const rx2 = new THREE.Mesh(ropeGeoX, ropeMat);
      rx2.rotation.z = Math.PI / 2;
      rx2.position.set(0, h, 5);
      scene.add(rx2);

      const ropeGeoZ = new THREE.CylinderGeometry(0.02, 0.02, 10);
      const rz1 = new THREE.Mesh(ropeGeoZ, ropeMat);
      rz1.rotation.x = Math.PI / 2;
      rz1.position.set(-5, h, 0);
      scene.add(rz1);

      const rz2 = new THREE.Mesh(ropeGeoZ, ropeMat);
      rz2.rotation.x = Math.PI / 2;
      rz2.position.set(5, h, 0);
      scene.add(rz2);
    });

    // D. BUILD PHYSICAL WRESTLING RAGDOLL
    buildPhysicalWrestler(world, scene);

    // Camera LookAt
    camera.lookAt(0, 1.5, 0);

    // E. GAME LOOP WITH PHYSICS STEPPING & HARD VELOCITY CAP
    let lastTime = performance.now();
    let localMaxVel = 0;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1) * simulationSpeed;
      lastTime = now;

      // 1. Step the Cannon.js World
      world.step(1 / 60, dt, 3);

      // 2. HARD CAP ENFORCEMENT & ACTIVE DAMPING ADJUSTMENT & POISE MOTOR SIMULATION
      const MAX_BODY_VEL = 3.8; // The immutable core law of Bannon
      const MAX_ANGULAR_VEL = 4.5; // Rotational cap to suppress hyper-speed limb rotations
      let currentMax = 0;

      // Determine if any part is impacting the ground (top of floor mat is at Y = 0)
      let groundImpactActive = false;
      ragdollParts.current.forEach(({ body }) => {
        if (body.position.y <= 0.25) {
          groundImpactActive = true;
        }
      });

      ragdollParts.current.forEach(({ body, mesh, name }) => {
        // Dynamic impact damping trigger (0.7 angular / 0.5 linear on impact or strike spike)
        if (groundImpactActive || dampingActive) {
          body.angularDamping = 0.7;
          body.linearDamping = 0.5;
        } else {
          body.angularDamping = 0.1;
          body.linearDamping = 0.1;
        }

        // Fetch current velocity vector
        const vel = body.velocity;
        const speed = vel.length();

        if (speed > currentMax) {
          currentMax = speed;
        }

        // Apply Hard Cap Enforcement directly onto every individual rigid body in the chain!
        if (speed > MAX_BODY_VEL) {
          body.velocity.normalize();
          body.velocity.scale(MAX_BODY_VEL, body.velocity);
        }

        // Clamp extreme rotational speeds to prevent joint tearing and visual twisting
        const rotSpeed = body.angularVelocity.length();
        if (rotSpeed > MAX_ANGULAR_VEL) {
          body.angularVelocity.normalize();
          body.angularVelocity.scale(MAX_ANGULAR_VEL, body.angularVelocity);
        }

        // Synchronize Three Mesh visual with Cannon body coordinate
        mesh.position.copy(body.position as any);
        mesh.quaternion.copy(body.quaternion as any);
      });

      // Update max velocity telemetry indicator
      if (currentMax > localMaxVel) {
        localMaxVel = currentMax;
        setMaxVelocityMet(Math.round(currentMax * 100) / 100);
      }

      // 3. Poise-Driven Motor Emulation
      // Apply torque towards target neutral orientation, scaled directly by the poise state!
      const poiseMultiplier = poise / 100;
      ragdollConstraints.current.forEach(({ joint, targetRot, initialLocalRot }) => {
        const bodyA = joint.bodyA;
        const bodyB = joint.bodyB;

        // Apply proportional rotational correction torque with ACTIVE DAMPING (simulating rigid/firm muscle fibers)
        if (poiseMultiplier > 0.05) {
          const currentRelRot = bodyB.quaternion.mult(bodyA.quaternion.conjugate());
          const diffRot = targetRot.mult(currentRelRot.conjugate());
          
          // Apply feedback spring force based on muscle poise motors
          const stiffness = 8.5 * poiseMultiplier;
          
          // Rotational damping to dissipate oscillation kinetic energy and stop jiggly flailing
          const diffAngVel = bodyB.angularVelocity.vsub(bodyA.angularVelocity);
          const motorDamping = 1.8 * poiseMultiplier;
          
          const correctionTorque = new CANNON.Vec3(
            diffRot.x * stiffness - diffAngVel.x * motorDamping,
            diffRot.y * stiffness - diffAngVel.y * motorDamping,
            diffRot.z * stiffness - diffAngVel.z * motorDamping
          );
          
          bodyB.angularVelocity.vadd(correctionTorque, bodyB.angularVelocity);
          bodyA.angularVelocity.vsub(correctionTorque, bodyA.angularVelocity);
        }
      });

      // Render Scene
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    // F. Handle Resize
    const handleResize = () => {
      if (!canvasContainerRef.current || !renderer || !camera) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [poise, simulationSpeed]);

  // --- 3. PHYSICAL ASSEMBLY OF THE WRESTLER ---
  const buildPhysicalWrestler = (world: CANNON.World, scene: THREE.Scene) => {
    // Clean old parts
    ragdollParts.current.forEach(({ mesh }) => scene.remove(mesh));
    ragdollParts.current = [];
    ragdollConstraints.current = [];

    // Get active character skin colors from Slot 1 (Primary Player)
    const primarySlot = slots.find(s => s.id === 1);
    const character = rosterData.find(r => r.id === (primarySlot?.characterId || 'bannon'));
    const attire = character?.attires.find(a => a.id === (primarySlot?.attireId || 'classic'));
    const skinHexColor = attire?.color || '#000000';
    const accentHexColor = attire?.accent || '#f59e0b';

    // Materials
    const muscleMat = new THREE.MeshStandardMaterial({ 
      color: skinHexColor, 
      roughness: 0.3,
      metalness: 0.1
    });
    const gloveMat = new THREE.MeshStandardMaterial({ 
      color: accentHexColor, 
      roughness: 0.5,
      metalness: 0.3
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24', // golden yellow face plate
      roughness: 0.4
    });

    // Bone densities / dimensions
    const scale = character?.physicsScale || 1.1;

    // Helper to create bone
    const createBonePart = (
      name: string, 
      width: number, height: number, depth: number, 
      mass: number, 
      posX: number, posY: number, posZ: number,
      material: THREE.Material
    ) => {
      // Three Mesh
      const geo = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Cannon body
      const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
      const body = new CANNON.Body({
        mass: mass,
        shape: shape,
        position: new CANNON.Vec3(posX, posY, posZ),
        linearDamping: 0.1,
        angularDamping: 0.1
      });
      world.addBody(body);

      ragdollParts.current.push({ mesh, body, name });
      return body;
    };

    // 1. Torso
    const torso = createBonePart('Torso', 0.8 * scale, 1.4 * scale, 0.4 * scale, 35, 0, 3.5, 0, muscleMat);

    // 2. Head
    const head = createBonePart('Head', 0.45 * scale, 0.45 * scale, 0.45 * scale, 5, 0, 4.6 * scale, 0, headMat);

    // 3. Upper Arms
    const lUpperArm = createBonePart('LeftUpperArm', 0.25 * scale, 0.7 * scale, 0.25 * scale, 5, -0.65 * scale, 3.5, 0, muscleMat);
    const rUpperArm = createBonePart('RightUpperArm', 0.25 * scale, 0.7 * scale, 0.25 * scale, 5, 0.65 * scale, 3.5, 0, muscleMat);

    // 4. Lower Arms (Gloves)
    const lLowerArm = createBonePart('LeftForeArm', 0.22 * scale, 0.6 * scale, 0.22 * scale, 4, -0.65 * scale, 2.7, 0, gloveMat);
    const rLowerArm = createBonePart('RightForeArm', 0.22 * scale, 0.6 * scale, 0.22 * scale, 4, 0.65 * scale, 2.7, 0, gloveMat);

    // 5. Thighs
    const lThigh = createBonePart('LeftThigh', 0.3 * scale, 0.9 * scale, 0.3 * scale, 12, -0.35 * scale, 2.1, 0, muscleMat);
    const rThigh = createBonePart('RightThigh', 0.3 * scale, 0.9 * scale, 0.3 * scale, 12, 0.35 * scale, 2.1, 0, muscleMat);

    // 6. Calves
    const lCalf = createBonePart('LeftCalf', 0.26 * scale, 0.8 * scale, 0.26 * scale, 8, -0.35 * scale, 1.1, 0, gloveMat);
    const rCalf = createBonePart('RightCalf', 0.26 * scale, 0.8 * scale, 0.26 * scale, 8, 0.35 * scale, 1.1, 0, gloveMat);

    // --- CONSTRAINTS (ConeTwist hinges mapping bones to joints) ---
    const addJointConstraint = (
      bodyA: CANNON.Body, bodyB: CANNON.Body,
      pivotA: CANNON.Vec3, pivotB: CANNON.Vec3,
      axisA: CANNON.Vec3, axisB: CANNON.Vec3,
      angle: number
    ) => {
      const constraint = new CANNON.ConeTwistConstraint(bodyA, bodyB, {
        pivotA, pivotB,
        axisA, axisB,
        angle: angle,
        collideConnected: false // Strictly exclude parent-child colliders to prevent jitter
      });
      world.addConstraint(constraint);
      
      ragdollConstraints.current.push({
        joint: constraint,
        targetRot: new CANNON.Quaternion(),
        initialLocalRot: bodyB.quaternion.mult(bodyA.quaternion.conjugate())
      });
    };

    // Head to Torso
    addJointConstraint(torso, head, 
      new CANNON.Vec3(0, 0.7 * scale, 0), new CANNON.Vec3(0, -0.22 * scale, 0),
      CANNON.Vec3.UNIT_Y, CANNON.Vec3.UNIT_Y,
      Math.PI / 6
    );

    // Left Arm to Torso
    addJointConstraint(torso, lUpperArm,
      new CANNON.Vec3(-0.45 * scale, 0.6 * scale, 0), new CANNON.Vec3(0, 0.35 * scale, 0),
      CANNON.Vec3.UNIT_X, CANNON.Vec3.UNIT_X,
      Math.PI / 3
    );

    // Right Arm to Torso
    addJointConstraint(torso, rUpperArm,
      new CANNON.Vec3(0.45 * scale, 0.6 * scale, 0), new CANNON.Vec3(0, 0.35 * scale, 0),
      CANNON.Vec3.UNIT_X, CANNON.Vec3.UNIT_X,
      Math.PI / 3
    );

    // Left Forearm to Upperarm
    addJointConstraint(lUpperArm, lLowerArm,
      new CANNON.Vec3(0, -0.35 * scale, 0), new CANNON.Vec3(0, 0.3 * scale, 0),
      CANNON.Vec3.UNIT_Y, CANNON.Vec3.UNIT_Y,
      Math.PI / 2
    );

    // Right Forearm to Upperarm
    addJointConstraint(rUpperArm, rLowerArm,
      new CANNON.Vec3(0, -0.35 * scale, 0), new CANNON.Vec3(0, 0.3 * scale, 0),
      CANNON.Vec3.UNIT_Y, CANNON.Vec3.UNIT_Y,
      Math.PI / 2
    );

    // Left Thigh to Torso
    addJointConstraint(torso, lThigh,
      new CANNON.Vec3(-0.3 * scale, -0.7 * scale, 0), new CANNON.Vec3(0, 0.45 * scale, 0),
      CANNON.Vec3.UNIT_Y, CANNON.Vec3.UNIT_Y,
      Math.PI / 4
    );

    // Right Thigh to Torso
    addJointConstraint(torso, rThigh,
      new CANNON.Vec3(0.3 * scale, -0.7 * scale, 0), new CANNON.Vec3(0, 0.45 * scale, 0),
      CANNON.Vec3.UNIT_Y, CANNON.Vec3.UNIT_Y,
      Math.PI / 4
    );

    // Left Calf to Thigh
    addJointConstraint(lThigh, lCalf,
      new CANNON.Vec3(0, -0.45 * scale, 0), new CANNON.Vec3(0, 0.4 * scale, 0),
      CANNON.Vec3.UNIT_X, CANNON.Vec3.UNIT_X,
      Math.PI / 2
    );

    // Right Calf to Thigh
    addJointConstraint(rThigh, rCalf,
      new CANNON.Vec3(0, -0.45 * scale, 0), new CANNON.Vec3(0, 0.4 * scale, 0),
      CANNON.Vec3.UNIT_X, CANNON.Vec3.UNIT_X,
      Math.PI / 2
    );
  };

  // --- 4. DEEPENING PHYSICS: HEAVY IMPACT TRIGGERS ---
  const applyHeavyStrikeImpact = (impactType: 'HOOK' | 'SUPLEX' | 'SLAM' | 'TURNBUCKLE') => {
    if (ragdollParts.current.length === 0) return;

    // A. Trigger Sound Effect based on impact
    if (impactType === 'HOOK') {
      playSynthesizedHitSound(90, 'sawtooth');
    } else if (impactType === 'SUPLEX') {
      playSynthesizedHitSound(65, 'triangle');
    } else if (impactType === 'SLAM') {
      playSynthesizedHitSound(50, 'triangle');
    } else {
      playSynthesizedHitSound(120, 'sine');
    }

    // B. APPLY AGGRESSIVE DAMPING (Damping spike state)
    // "Aggressive Damping": Triggered on all strike impacts to resolve anti-gravity flailing
    setDampingActive(true);
    ragdollParts.current.forEach(({ body }) => {
      body.angularDamping = 0.7;
      body.linearDamping = 0.5;
      
      // Immediate 3.8 m/s velocity clamp to suppress hyper-speed impact impulse flailing
      const speed = body.velocity.length();
      if (speed > 3.8) {
        body.velocity.normalize();
        body.velocity.scale(3.8, body.velocity);
      }
    });

    // Reset damping back to baseline (0.1) after exactly 500ms (0.5s)
    setTimeout(() => {
      setDampingActive(false);
      ragdollParts.current.forEach(({ body }) => {
        body.angularDamping = 0.1;
        body.linearDamping = 0.1;
      });
    }, 500);

    // C. APPLY DIRECT VELOCITY IMPULSES (with physical force logic)
    // Find Target bones
    const torsoPart = ragdollParts.current.find(p => p.name === 'Torso')?.body;
    const headPart = ragdollParts.current.find(p => p.name === 'Head')?.body;
    const calfLPart = ragdollParts.current.find(p => p.name === 'LeftCalf')?.body;

    if (!torsoPart) return;

    if (impactType === 'HOOK') {
      // Heavy smack to the head
      if (headPart) {
        headPart.applyImpulse(new CANNON.Vec3(5, 1, 3), new CANNON.Vec3(0, 0, 0));
        torsoPart.applyImpulse(new CANNON.Vec3(3, 0, 1), new CANNON.Vec3(0, 0, 0));
      }
    } else if (impactType === 'SUPLEX') {
      // Shifting the ENTIRE ragdoll body synchronously to prevent limb tearing
      const offset = new CANNON.Vec3(0, 1.5, 0);
      ragdollParts.current.forEach(({ body }) => {
        body.position.vadd(offset, body.position);
      });
      torsoPart.velocity.set(0, 4, -4.5);
      if (calfLPart) {
        calfLPart.velocity.set(0, 5, -3);
      }
    } else if (impactType === 'SLAM') {
      // Translate the ENTIRE ragdoll body up first, then throw downward
      const offset = new CANNON.Vec3(0, 2.0, 0);
      ragdollParts.current.forEach(({ body }) => {
        body.position.vadd(offset, body.position);
      });
      torsoPart.velocity.set(0.5, -6.5, 0);
    } else if (impactType === 'TURNBUCKLE') {
      // Leap Apex off the turnbuckle post: offset-shift the whole ragdoll
      const currentTorso = torsoPart.position.clone();
      const targetTorso = new CANNON.Vec3(-3.5, 3.2, -3.5);
      const offset = targetTorso.vsub(currentTorso);
      ragdollParts.current.forEach(({ body }) => {
        body.position.vadd(offset, body.position);
      });
      torsoPart.velocity.set(5.5, -2, 5.5);
    }
  };

  const resetRagdollToStance = () => {
    ragdollParts.current.forEach(({ body, name }, index) => {
      // Set to T-Pose upright position
      body.angularVelocity.set(0, 0, 0);
      body.velocity.set(0, 0, 0);

      const scale = 1.1;
      if (name === 'Torso') body.position.set(0, 3.5, 0);
      else if (name === 'Head') body.position.set(0, 4.6 * scale, 0);
      else if (name === 'LeftUpperArm') body.position.set(-0.65 * scale, 3.5, 0);
      else if (name === 'RightUpperArm') body.position.set(0.65 * scale, 3.5, 0);
      else if (name === 'LeftForeArm') body.position.set(-0.65 * scale, 2.7, 0);
      else if (name === 'RightForeArm') body.position.set(0.65 * scale, 2.7, 0);
      else if (name === 'LeftThigh') body.position.set(-0.35 * scale, 2.1, 0);
      else if (name === 'RightThigh') body.position.set(0.35 * scale, 2.1, 0);
      else if (name === 'LeftCalf') body.position.set(-0.35 * scale, 1.1, 0);
      else if (name === 'RightCalf') body.position.set(0.35 * scale, 1.1, 0);

      body.quaternion.set(0, 0, 0, 1);
    });
    setMaxVelocityMet(0);
    playSynthesizedHitSound(300, 'sine');
  };

  // --- 5. RENDER CHANNELS & SLOTS VIEW ---
  const selectSlotCharacter = (slotId: number, charId: string) => {
    const character = rosterData.find(r => r.id === charId);
    if (!character) return;

    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          characterId: charId,
          attireId: character.attires[0]?.id || null,
          payback: character.payback !== 'None' ? character.payback : null,
          type: s.type === 'Empty' ? 'Player' : s.type
        };
      }
      return s;
    }));
  };

  const selectSlotAttire = (slotId: number, attireId: string) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, attireId };
      }
      return s;
    }));
  };

  const selectSlotPayback = (slotId: number, payback: string) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, payback };
      }
      return s;
    }));
  };

  const selectSlotManager = (slotId: number, managerId: string | null) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, managerId };
      }
      return s;
    }));
  };

  const toggleSlotType = (slotId: number) => {
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        const types: ('Player' | 'CPU' | 'Empty')[] = ['Player', 'CPU', 'Empty'];
        const nextIdx = (types.indexOf(s.type) + 1) % types.length;
        const nextType = types[nextIdx];
        
        return {
          ...s,
          type: nextType,
          characterId: nextType === 'Empty' ? null : s.characterId || 'training_dummy',
          attireId: nextType === 'Empty' ? null : s.attireId || 'default',
          payback: nextType === 'Empty' ? null : s.payback || 'None',
          managerId: null
        };
      }
      return s;
    }));
  };

  const activeSlotConfig = slots.find(s => s.id === activeSlotId);
  const activeChar = rosterData.find(r => r.id === activeSlotConfig?.characterId);

  return (
    <div id="bannon-container" className="flex flex-col w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-sans">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold">BANNON WRESTLING ENGINE</span>
            <span className="text-sm font-black text-white tracking-tight uppercase">Living Nexus Rig Sandbox</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentTab('arena')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${currentTab === 'arena' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            3D Arena
          </button>
          <button 
            onClick={() => setCurrentTab('roster')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${currentTab === 'roster' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Roster Book
          </button>
          <button 
            onClick={() => setCurrentTab('manifesto')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${currentTab === 'manifesto' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Manifesto
          </button>
        </div>
      </div>

      {currentTab === 'arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 p-2">
          {/* LEFT PANEL: 3D PHYSICS VIEWPORT */}
          <div className="lg:col-span-8 flex flex-col gap-2">
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <div ref={canvasContainerRef} className="w-full h-[400px] cursor-grab active:cursor-grabbing" />

              {/* TELEMETRY READOUTS IN MARGINS */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none font-mono">
                <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-slate-400">PHYSICS ACTIVE</span>
                </div>
                
                <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg flex flex-col">
                  <span className="text-[8px] text-slate-500">MAX_BODY_VEL</span>
                  <span className={`text-xs font-bold ${maxVelocityMet >= 3.8 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {maxVelocityMet} m/s <span className="text-[9px] text-slate-500">/ cap 3.8</span>
                  </span>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg flex flex-col">
                  <span className="text-[8px] text-slate-500">DAMPING STATUS</span>
                  <span className={`text-xs font-bold ${dampingActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}>
                    {dampingActive ? 'SPIKED (0.7 / 0.5)' : 'NORMAL (0.1)'}
                  </span>
                </div>
              </div>

              {/* CONTROLS IN VIEWPORT BOTTOM */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-between items-center pointer-events-auto bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 backdrop-blur">
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => applyHeavyStrikeImpact('HOOK')}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Smack Head
                  </button>
                  <button 
                    onClick={() => applyHeavyStrikeImpact('SUPLEX')}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Suplex Lift
                  </button>
                  <button 
                    onClick={() => applyHeavyStrikeImpact('SLAM')}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Mat Slam
                  </button>
                  <button 
                    onClick={() => applyHeavyStrikeImpact('TURNBUCKLE')}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Leap Apex
                  </button>
                </div>

                <button 
                  onClick={resetRagdollToStance}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-Stance
                </button>
              </div>
            </div>

            {/* LIVE ADJUSTMENT CRADLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* POISE MOTOR SLIDER */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white uppercase">Muscle Poise Motors</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{poise}% POISE</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={poise}
                  onChange={(e) => setPoise(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 leading-normal">
                  Stiffness = {poise}%. At 0% poise, muscular joints go completely limp (Crumple state). At 100% stiffness, muscle fibers lock into perfect alignment.
                </span>
              </div>

              {/* RIG DYNAMIC SIM SPEED */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black text-white uppercase">Simulation Speed</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">{simulationSpeed}x Speed</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 leading-normal">
                  Speed scaler for precision analysis. Slow down physics to analyze impact damping and cap clamping frame-by-frame.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: WWE 2K / MDICKIE INDEPENDENT SLOT CONTROLLERS */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[580px] h-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Independent Slot Controllers</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">8 MATCH SLOTS</span>
              </div>

              {/* 8 SLOTS GRID */}
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {slots.map(slot => {
                  const char = rosterData.find(r => r.id === slot.characterId);
                  const attire = char?.attires.find(a => a.id === slot.attireId);
                  const isActive = activeSlotId === slot.id;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => setActiveSlotId(slot.id)}
                      className={`text-left p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${isActive ? 'bg-slate-850 border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black">SLOT #{slot.id}</span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSlotType(slot.id);
                          }}
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all ${slot.type === 'Player' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : slot.type === 'CPU' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                        >
                          {slot.type}
                        </span>
                      </div>

                      {slot.type !== 'Empty' && char ? (
                        <div className="flex flex-col mt-1">
                          <span className="text-xs font-black text-white uppercase truncate">{char.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 truncate mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: attire?.color || '#ccc' }} />
                            {attire?.name || 'Default'}
                          </span>
                          {slot.managerId && (
                            <span className="text-[8px] font-bold text-cyan-400 mt-0.5 uppercase flex items-center gap-0.5">
                              👔 {rosterData.find(r => r.id === slot.managerId)?.name || 'Manager'}
                            </span>
                          )}
                          {slot.payback && slot.payback !== 'None' && (
                            <span className="text-[8px] font-bold text-amber-500 mt-1 uppercase">⚡ {slot.payback}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3 text-slate-600">
                          <Plus className="w-4 h-4 mb-1" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">TAP TO CONFIGURE</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* INDEPENDENT CONTEXT BOX (Opens when a slot is clicked) */}
              {activeSlotId !== null && activeSlotConfig && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mt-3 animate-in slide-in-from-bottom duration-200 flex-1 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-white uppercase">Slot #{activeSlotConfig.id} Setup</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono font-black uppercase">
                        {activeSlotConfig.type}
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveSlotId(null)}
                      className="text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Character Selection Grid */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-mono text-slate-500 uppercase font-black">1. Select Competitor</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {rosterData.map(c => {
                        const isSelected = activeSlotConfig.characterId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => selectSlotCharacter(activeSlotConfig.id, c.id)}
                            className={`p-2 rounded-lg border text-left flex flex-col cursor-pointer transition-all ${isSelected ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                          >
                            <span className="text-[10px] font-black uppercase truncate">{c.name}</span>
                            <span className="text-[8px] font-mono opacity-60 uppercase">{c.role}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeChar && (
                    <div className="flex flex-col gap-3 mt-1 border-t border-slate-850 pt-2.5">
                      {/* WWE 2K Stat Console */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                            <span>Muscle Poise</span>
                            <span className="text-cyan-400 font-black">{activeChar.poise}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div className="bg-cyan-500 h-1 rounded-full transition-all duration-500" style={{ width: `${activeChar.poise}%` }} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                            <span>Strike HP</span>
                            <span className="text-red-400 font-black">{activeChar.hp}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div className="bg-red-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min(activeChar.hp / 100, 100)}%` }} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                            <span>Dexterity</span>
                            <span className="text-emerald-400 font-black">{activeChar.speed}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div className="bg-emerald-500 h-1 rounded-full transition-all duration-500" style={{ width: `${activeChar.speed}%` }} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-slate-400">
                            <span>Raw Power</span>
                            <span className="text-amber-400 font-black">{activeChar.strength}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div className="bg-amber-500 h-1 rounded-full transition-all duration-500" style={{ width: `${activeChar.strength}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Bio summary */}
                      <p className="text-[9px] text-slate-400 italic leading-snug px-1">
                        "{activeChar.bio}"
                      </p>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-2.5">
                        {/* Attire selection */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] font-mono text-slate-500 uppercase font-black">2. Choose Attire</label>
                          <div className="flex flex-wrap gap-1.5">
                            {activeChar.attires.map(a => {
                              const isSelectedAttire = activeSlotConfig.attireId === a.id;
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => selectSlotAttire(activeSlotConfig.id, a.id)}
                                  className={`px-2 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1 mt-0.5 ${isSelectedAttire ? 'bg-slate-850 border-cyan-500 text-white ring-2 ring-cyan-500/10' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                >
                                  <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: a.color }} />
                                  {a.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payback selection */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] font-mono text-slate-500 uppercase font-black">3. Active Payback</label>
                          <div className="flex flex-wrap gap-1">
                            {['None', 'Beast Mode', 'Teleport Strike', 'Low Blow', 'Code Crash', 'Instant Pin'].map(p => {
                              const isSelectedPayback = (activeSlotConfig.payback || 'None') === p;
                              return (
                                <button
                                  key={p}
                                  onClick={() => selectSlotPayback(activeSlotConfig.id, p)}
                                  className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-lg border cursor-pointer transition-all ${isSelectedPayback ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
                                >
                                  {p === 'None' ? 'None' : `⚡ ${p.toUpperCase()}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Ringside Manager selection */}
                      <div className="flex flex-col gap-1.5 border-t border-slate-850 pt-2.5">
                        <label className="text-[8px] font-mono text-slate-500 uppercase font-black">4. Ringside Manager</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => selectSlotManager(activeSlotConfig.id, null)}
                            className={`px-2 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${!activeSlotConfig.managerId ? 'bg-slate-850 border-cyan-500 text-white ring-2 ring-cyan-500/10' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                          >
                            None
                          </button>
                          {rosterData.filter(r => r.id !== activeSlotConfig.characterId).map(m => {
                            const isSelectedManager = activeSlotConfig.managerId === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => selectSlotManager(activeSlotConfig.id, m.id)}
                                className={`px-2 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1 ${isSelectedManager ? 'bg-slate-850 border-cyan-500 text-white ring-2 ring-cyan-500/10' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                              >
                                <span className="text-[9px] opacity-60">👔</span>
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'roster' && (
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[600px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Canon Wrestler Lore Book</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rosterData.map(char => (
              <div key={char.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase">{char.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{char.dna}</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    {char.role}
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-normal italic">
                  "{char.bio}"
                </p>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-[10px] font-mono">
                  <div className="flex flex-col">
                    <span className="text-slate-500">POISE MOTOR</span>
                    <span className="text-white font-bold">{char.poise}% max</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">MAX_HP</span>
                    <span className="text-white font-bold">{char.hp}</span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-slate-500">SPEED FORCE</span>
                    <span className="text-white font-bold">{char.speed}</span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-slate-500">PHYSICS SIZE</span>
                    <span className="text-white font-bold">{char.physicsScale}x multiplier</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black block mb-1">AVAILABLE ATTIRE VARIATIONS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {char.attires.map(att => (
                      <span key={att.id} className="text-[9px] font-bold bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: att.color }} />
                        {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'manifesto' && (
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[600px] leading-relaxed text-slate-300 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">The Immutable Laws of Bannon</h3>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-3">
            <h4 className="text-white font-bold text-sm uppercase flex items-center gap-1.5">
              <span className="text-orange-500">■</span> Core Constant Values
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[10px] mt-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[8px] mb-1">MAX BODY HP</span>
                <span className="text-white font-black text-sm">10,000 HP</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[8px] mb-1">DAMAGE SCALER</span>
                <span className="text-white font-black text-sm">8.0x Modifier</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-slate-500 block uppercase font-bold text-[8px] mb-1">MAX VELOCITY CAP</span>
                <span className="text-white font-black text-sm">3.8 m/s</span>
              </div>
            </div>

            <h4 className="text-white font-bold text-sm uppercase mt-4 flex items-center gap-1.5">
              <span className="text-cyan-400">■</span> Antigravity Flailing Mitigation Architecture
            </h4>
            <ul className="list-disc pl-5 flex flex-col gap-2 mt-1">
              <li>
                <strong>Individual Rigid Body Clamping:</strong> We do not just apply velocity dampening onto the main root capsule. Instead, we apply a hard mathematical clamp of 3.8 m/s onto <em>every single joint and limb body</em> in the physical ragdoll chain inside the high-frequency physics step.
              </li>
              <li>
                <strong>Impact Joint Damping Spikes:</strong> On physical strike impacts (Heavy Hooks, Slams), we immediately trigger an <strong>Aggressive Damping</strong> state. The bones' `angularDamping` and `linearDamping` spike to 0.7 and 0.5 respectively for half a second to bleed off excessive kinetic energy, then smoothly cool back down.
              </li>
              <li>
                <strong>Poise-Driven Muscles:</strong> Stamina depletion translates to muscular joint limpness. In full stance, restorative motors apply postural corrective torque. As Poise decays to 0%, joint motor stiffness drops to 0, resulting in heavy, crumpling impacts on the mat.
              </li>
            </ul>

            <h4 className="text-white font-bold text-sm uppercase mt-4 flex items-center gap-1.5">
              <span className="text-amber-500">■</span> 24/7 Autonomous Dev Agent Integrations
            </h4>
            <p className="mt-1">
              The CODEDUMMY system is fully locked for continuous, non-stop 24/7 operation. Commanded via Telegram remote phone vectors, the daemon ingests user prompts, analyzes local structures, reads documentation libraries, and commits precise improvements back to GitHub autonomously.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
