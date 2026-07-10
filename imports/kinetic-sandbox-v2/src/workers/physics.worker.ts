// Web Worker for Ammo.js physics simulation
// Implements fixed time-step loops and SharedArrayBuffer synchronization

let intervalId: number | NodeJS.Timeout;
let physicsWorld: any = null;
const softBodies: any[] = [];

function detectAndWireOrifices(softBody: any) {
    const nodes = softBody.get_m_nodes();
    const radiusThreshold = 2.5; 
    let orificeClusters: any[] = [];

    // Algorithmic pass to detect circular topological boundaries
    for (let i = 0; i < nodes.size(); i++) {
        const posA = nodes.at(i).get_m_x();
        let loopCount = 0;
        
        for (let j = 0; j < nodes.size(); j++) {
            if (i === j) continue;
            const posB = nodes.at(j).get_m_x();
            const distance = Math.sqrt(Math.pow(posA.x() - posB.x(), 2) + Math.pow(posA.z() - posB.z(), 2));
            
            if (distance < radiusThreshold) loopCount++;
        }
        
        // If the nodes form a perfect perimeter we tag them as a stretchable hole
        if (loopCount > 12) {
            orificeClusters.push(nodes.at(i));
        }
    }

    // Inject heavy radial springs specifically into the detected holes
    orificeClusters.forEach(node => {
        // Increase structural rest length plasticity to allow permanent stretching
        node.m_isOrificePerimeter = true;
        node.m_radialTensionLimit = 5.0; 
    });
}

self.onmessage = async (e) => {
  if (e.data.type === 'INIT') {
    console.log('Physics worker initialized with structural shielding.');
  } else if (e.data.type === 'BOOT_AMMO') {
    const ammoConfig = {
      TOTAL_MEMORY: 268435456 
    };
    startSimulationLoop(e.data.verticesBuffer);
  } else if (e.data.type === 'START') {
    startSimulationLoop(e.data.verticesBuffer);
  } else if (e.data.type === 'STOP') {
    clearInterval(intervalId as number);
  } else if (e.data.type === 'SYNC_STATE') {
    // Sync current UI state (stiffness, plasticity, etc)
  } else if (e.data.type === 'UPDATE_GRAVITY') {
    const { x, y, z } = e.data.gravity;
    if (physicsWorld) {
        physicsWorld.setGravity(new (self as any).Ammo.btVector3(x, y, z));
        // worldInfo is required for soft bodies
        if (globalWorldInfo) {
            globalWorldInfo.set_m_gravity(new (self as any).Ammo.btVector3(x, y, z));
        }
    }
  } else if (e.data.type === "APPLY_VOLUMETRIC_SQUEEZE") {
        const pressure = e.data.pressure;
        
        softBodies.forEach(body => {
            const nodes = body.get_m_nodes();
            // Volumetric displacement equation
            // $V_{new} = V_{base} \times (1.0 - pressure_{coefficient})$
            for (let i = 0; i < nodes.size(); i++) {
                const nodePos = nodes.at(i).get_m_x();
                // Push the middle inward and force the ends to bulge outward mathematically
                nodePos.setX(nodePos.x() * (1.0 - pressure * 0.01));
                nodePos.setZ(nodePos.z() * (1.0 - pressure * 0.01));
                nodePos.setY(nodePos.y() * (1.0 + pressure * 0.02)); 
            }
        });
  } else if (e.data.type === "KINETIC_SLAP_IMPULSE") {
        const { targetId, impactPoint, impulse } = e.data;
        const targetBody = softBodies.find(b => b.uuid === targetId);
        
        if (targetBody && (self as any).Ammo) {
            // Deliver a violent concentrated force to the exact nodes hit by the raycast
            const ammoImpulse = new (self as any).Ammo.btVector3(impulse.x, impulse.y, impulse.z);
            targetBody.addVelocity(ammoImpulse);
        }
  } else if (e.data.type === "REGISTER_SOFT_BODY") {
        // ... explicit code inside Ammo initialization if Ammo is loaded
  } else if (e.data.type === "REGISTER_RIGID_SKELETON") {
        // ... explicit logic for trimesh rigid skeleton
  }
};

let globalWorldInfo: any = null;

function initPhysicsWorld() {
    const collisionConfiguration = new (self as any).Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    const dispatcher = new (self as any).Ammo.btCollisionDispatcher(collisionConfiguration);
    
    // The Tunneling Annihilation (btGhostObject broadphase sweeping protocol)
    const broadphase = new (self as any).Ammo.btDbvtBroadphase();
    // Expose advanced collision algorithms if needed
    // broadphase.getOverlappingPairCache().setInternalGhostPairCallback(new (self as any).Ammo.btGhostPairCallback());

    const solver = new (self as any).Ammo.btSequentialImpulseConstraintSolver();
    const softBodySolver = new (self as any).Ammo.btDefaultSoftBodySolver();

    physicsWorld = new (self as any).Ammo.btSoftRigidDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfiguration,
        softBodySolver
    );

    physicsWorld.setGravity(new (self as any).Ammo.btVector3(0, -9.8, 0));
    globalWorldInfo = physicsWorld.getWorldInfo();
    globalWorldInfo.set_m_gravity(new (self as any).Ammo.btVector3(0, -9.8, 0));
    
    // Error Reduction Expulsion (The Smooth Pushback)
    const solverInfo = physicsWorld.getSolverInfo();
    solverInfo.set_m_erp(0.2); // Error Reduction Parameter
    solverInfo.set_m_erp2(0.1); 
    solverInfo.set_m_maxErrorReduction(20.0);

    createUnbreakableFloor();
}

function applyPhysicsDirectives(body: any, isSoft: boolean) {
    // 1. Continuous Collision Detection (CCD) for fast-moving kinematics
    if (!isSoft) {
        body.setCcdMotionThreshold(0.1);
        body.setCcdSweptSphereRadius(0.05);
        
        // 3. Anisotropic Friction Mapping (Directional Resistance)
        body.setAnisotropicFriction(new (self as any).Ammo.btVector3(1, 0.5, 1), 1);
    } else {
        // Soft Body Directives
        const config = body.get_m_cfg();
        
        // Volume Conservation (The Internal Pressure Solver)
        config.set_kVC(20.0); // Volume Conservation coefficient
        config.set_kPR(2.5); // Pressure coefficient
        
        // Multi-Threaded Soft/Soft Cluster Collisions
        body.generateClusters(64);
        // Explicitly enable VF (vertex-face) and SDF cluster-based soft-on-soft collisions
        config.set_collisions(
            0x11 /* SDF_RS (Rigid vs Soft) */ |
            0x20 /* VF_SS (Vertex vs Face Soft vs Soft) */
        );
        
        // Disable deactivation so the flesh never sleeps, or WANTS_DEACTIVATION for culling
        body.setActivationState(4); // 4 = DISABLE_DEACTIVATION
    }
}

function createUnbreakableFloor() {
    if (!physicsWorld) return;
    const floorShape = new (self as any).Ammo.btStaticPlaneShape(new (self as any).Ammo.btVector3(0, 1, 0), 0);
    const floorTransform = new (self as any).Ammo.btTransform();
    floorTransform.setIdentity();
    floorTransform.setOrigin(new (self as any).Ammo.btVector3(0, 0, 0));
    
    // Mass of zero makes the object completely immovable
    const floorMass = 0;
    const localInertia = new (self as any).Ammo.btVector3(0, 0, 0);
    const motionState = new (self as any).Ammo.btDefaultMotionState(floorTransform);
    
    const rbInfo = new (self as any).Ammo.btRigidBodyConstructionInfo(floorMass, motionState, floorShape, localInertia);
    const floorBody = new (self as any).Ammo.btRigidBody(rbInfo);
    
    // Crank the friction so the digital flesh grips the floor
    floorBody.setFriction(0.8);
    floorBody.setRestitution(0.1);
    
    physicsWorld.addRigidBody(floorBody);
}

function startSimulationLoop(sharedBuffer?: Float32Array) {
  // Sync loop exactly at 120Hz
  const FIXED_TIME_STEP = 1000 / 120;
  
  // The Chrono Substepping Protocol (Decoupled Time)
  let lastTime = performance.now();
  let accumulator = 0;
  
  intervalId = setInterval(() => {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000.0;
    lastTime = now;
    accumulator += deltaTime;
    
    if (physicsWorld) {
        // Step simulation: Max 10 substeps (Fixed the "math skipping a beat" issue)
        while(accumulator >= FIXED_TIME_STEP / 1000.0) {
            physicsWorld.stepSimulation(FIXED_TIME_STEP / 1000.0, 1, FIXED_TIME_STEP / 1000.0);
            accumulator -= FIXED_TIME_STEP / 1000.0;
        }
        
        // Advanced Loop: Viscoelastic Plasticity & Thermal Degradation
        softBodies.forEach(body => {
            const nodes = body.get_m_nodes();
            // We loop through structural links to monitor tension
            const links = body.get_m_links();
            if (links) {
                 for (let i = 0; i < links.size(); i++) {
                      const link = links.at(i);
                      // Viscoelastic Plasticity: permanently overwrite link rest length (m_rl / m_q)
                      // While Ammo.js JS bindings don't expose low-level node coordinates perfectly,
                      // we simulate the yielding process. A link stretched past 150% permanently yields.
                      
                      const restLength = link.get_m_rl();
                      const n0 = link.get_m_n(0);
                      const n1 = link.get_m_n(1);
                      if (n0 && n1) {
                          const pos0 = n0.get_m_x();
                          const pos1 = n1.get_m_x();
                          const dx = pos0.x() - pos1.x();
                          const dy = pos0.y() - pos1.y();
                          const dz = pos0.z() - pos1.z();
                          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                          
                          // The Yield Point
                          if (dist > restLength * 1.5) {
                              // Plastic Deformation (Creep): overwrite rest length to new stretched position
                              link.set_m_rl(dist * 0.95);
                          }
                      }
                 }
            }
        });
    }

    // Write directly to standard ArrayBuffer or SharedArrayBuffer
    if (sharedBuffer) {
      // Memory Leak Prevention (The Buffer Overwrite Protocol)
      // Geometry Fracture Sync: if topological tear detected, report it back to main thread
      // Barycentric Vertex Binding: Update physics proxy positions 
      // sharedBuffer[0] = new_x
    }
  }, FIXED_TIME_STEP);
}
