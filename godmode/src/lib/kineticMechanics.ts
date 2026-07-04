import { useGodModeStore } from '../store/useGodModeStore';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const CANNON = {
  Vec3: class implements Vec3 {
    x: number; y: number; z: number;
    constructor(x: number, y: number, z: number) {
      this.x = x; this.y = y; this.z = z;
    }
  }
};

export function executeAbsoluteOcclusion(gripLock: any, targetJoint: any) {
    // Break the deadlock. Set structural occlusion limits so they can't vibrate out of it.
    console.log('[MYTH ENGINE] Initializing Absolute Occlusion Sequence...');
    
    // We mathematically define exactly how stifff the joint is. 
    // Infinity represents absolute rigidity of the Atum frame.
    const OCCLUSION_STIFFNESS = Infinity;
    const OCCLUSION_DAMPING = 999999;
    const ZERO_DEGREE_LIMIT = 0; // The threshold where interaction goes to absolute shutdown

    if (gripLock && targetJoint) {
        targetJoint.equationStiffness = OCCLUSION_STIFFNESS;
        targetJoint.equationRelaxation = OCCLUSION_DAMPING;

        // Force the zero-degree constraints
        targetJoint.lowerLimit = ZERO_DEGREE_LIMIT;
        targetJoint.upperLimit = ZERO_DEGREE_LIMIT;

        // Apply thermodynamic lockdown to bleed free energy from target to 0
        targetJoint.setMotorSpeed(0);
        targetJoint.enableMotor();

        console.log('[MYTH ENGINE] Target constraint locked. Residual noise damped to 0.');
    }
}

export function executeVerticalChokeslam(attackerBody: any, defenderBody: any) {
    // 1 Handed Chokeslam IK Delivery Vector
    const verticalForce = new CANNON.Vec3(0, -900, 0); 
    defenderBody.applyImpulse(verticalForce, defenderBody.position);

    defenderBody.addEventListener("collide", function(e: any) {
        // Calculate the raw kinetic energy of the impact against the mat
        const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
        
        if (Math.abs(relativeVelocity) > 15) {
            // Send the massive velocity spike directly to the global React OS
            // This forces the visualizer to immediately transition to Rubedo
            useGodModeStore.getState().setKineticImpact(relativeVelocity);
            
            // Log the kinetic event to the SQLite vault
            fetch('/api/vault/kinetic-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                   session_id: 'chokeslam-session', 
                   stage_transition: 'RUBEDO',
                   bass_sensitivity: relativeVelocity, 
                   turbulence: relativeVelocity * 0.5 
                })
            });
        }
    });
}
