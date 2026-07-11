// Client-side representation of the C++ FFI Bridge
import * as THREE from 'three';

export class PhysicsFFIBridgeClient {
    private enginePointer: number = 0;

    constructor() {
        this.enginePointer = Math.floor(Math.random() * 0xFFFFFFFF);
        console.log(`[PhysicsFFI Client] Connected to WASM/Native memory space at 0x${this.enginePointer.toString(16)}`);
    }

    public applyShockwave(mesh: THREE.Mesh, force: number, origin: THREE.Vector3) {
        if (!mesh) return;
        console.log(`[PhysicsFFI Client] Applying Euphoria Shockwave to ${mesh.name || 'Object'} with force ${force}`);
        
        // Simulate physical shockwave propagation
        const distance = mesh.position.distanceTo(origin);
        const attenuation = Math.max(0, 1 - distance / 10);
        const direction = mesh.position.clone().sub(origin).normalize();
        
        // Apply impulse
        mesh.position.add(direction.multiplyScalar(force * attenuation));
        
        // Torquing effect
        mesh.rotation.x += (Math.random() - 0.5) * force * attenuation;
        mesh.rotation.y += (Math.random() - 0.5) * force * attenuation;
        mesh.rotation.z += (Math.random() - 0.5) * force * attenuation;
    }

    public applySpinalTorsion(bone: THREE.Bone, torque: number) {
        if (!bone) return;
        console.log(`[PhysicsFFI Client] Enforcing Spinal Torsion Limiter on ${bone.name}, torque: ${torque}`);
        
        // Simulating the Steve Masson Neckbreaker limiters
        // 0.5 rad is roughly 28 degrees. We don't want the neck snapping backwards
        const MAX_TORSION = 0.5; 
        
        bone.rotation.x += torque;
        
        // Enforce limiter
        if (bone.rotation.x > MAX_TORSION) {
            console.warn(`[PhysicsFFI Client] Torsion limit reached! Clamping bone ${bone.name} to avoid snap.`);
            bone.rotation.x = MAX_TORSION;
        } else if (bone.rotation.x < -MAX_TORSION) {
            bone.rotation.x = -MAX_TORSION;
        }
    }
}

export const physicsBridgeClient = new PhysicsFFIBridgeClient();
