const fs = require('fs');
let code = fs.readFileSync('src/physics/Character.tsx', 'utf8');

// 1. Add grapple state
code = code.replace(
  "const stumbleOscillator = useRef(0);",
  "const stumbleOscillator = useRef(0);\n  const isGrappling = useRef(false);\n  const grappleTarget = useRef<THREE.Vector3 | null>(null);\n  const grappleWeight = useRef(0);"
);

// 2. Increase stiffness for heavy impacts
code = code.replace(
  "const jointStiffness = useRef(5.0); // Baseline lerp speed",
  "const jointStiffness = useRef(15.0); // Baseline lerp speed (Heavily upscaled for anatomical mass)"
);

code = code.replace(
  "let freq = 14 * stiffnessMult;",
  "let freq = 28 * stiffnessMult; // 2x frequency for heavy anatomical rig"
);
code = code.replace(
  "let damp = 0.65;",
  "let damp = 0.85; // Heavier damping to absorb combat impacts"
);

code = code.replace(
  "playerApi.angularDamping.set(0.8);",
  "playerApi.angularDamping.set(0.92); // Tighter combat core stability"
);

// 3. Add Grapple IK logic
const ikStr = `    // Apply IK override for Bracing
    if (l_hand_ik_weight.current > 0.01) {`;

const grappleIk = `    // --- TWO-BODY KINEMATIC ENTANGLEMENT (GRAPPLE) ---
    grappleWeight.current = THREE.MathUtils.lerp(grappleWeight.current, isGrappling.current ? 1.0 : 0.0, safeDelta * 8);
    if (grappleWeight.current > 0.01) {
        // Force arms forward into a collar tie-up position
        lST.x = THREE.MathUtils.lerp(lST.x, -1.2, grappleWeight.current);
        lST.z = THREE.MathUtils.lerp(lST.z, 0.4, grappleWeight.current);
        rST.x = THREE.MathUtils.lerp(rST.x, -1.2, grappleWeight.current);
        rST.z = THREE.MathUtils.lerp(rST.z, -0.4, grappleWeight.current);
        lET.y = THREE.MathUtils.lerp(lET.y, 0.8, grappleWeight.current);
        rET.y = THREE.MathUtils.lerp(rET.y, -0.8, grappleWeight.current);
    }
    
    // Apply IK override for Bracing
    if (l_hand_ik_weight.current > 0.01) {`;

code = code.replace(ikStr, grappleIk);

fs.writeFileSync('src/physics/Character.tsx', code);
console.log('Character.tsx updated for AAA Combat Physics.');
