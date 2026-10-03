const fs = require('fs');
let code = fs.readFileSync('/tmp/bannon2/src/components/KineticDOM.tsx', 'utf8');

const importStatement = `import { physicsBridgeClient } from '../utils/PhysicsFFIBridgeClient';\n`;
code = code.replace(/import \* as CANNON from 'cannon-es';/, "import * as CANNON from 'cannon-es';\n" + importStatement);

// Find the physics update loop or click handler to inject the shockwave.
// Let's add a window click listener inside useEffect to trigger a global shockwave.
const shockwaveLogic = `
        const handleGlobalClick = (e: MouseEvent) => {
            if (!threeSceneRef.current) return;
            const origin = new THREE.Vector3(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1,
                0
            );
            // unproject to world space roughly
            origin.z = -5;
            
            threeSceneRef.current.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    physicsBridgeClient.applyShockwave(child, 2.5, origin);
                }
            });
        };
        window.addEventListener('click', handleGlobalClick);
`;

code = code.replace(/const animate = \(\) => \{/, shockwaveLogic + "\n        const animate = () => {");
code = code.replace(/return \(\) => \{/, "window.removeEventListener('click', handleGlobalClick);\n        return () => {");

fs.writeFileSync('/tmp/bannon2/src/components/KineticDOM.tsx', code);
