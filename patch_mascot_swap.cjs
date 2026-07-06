const fs = require('fs');
let content = fs.readFileSync('src/components/AutonomousMascot.tsx', 'utf-8');

if (!content.includes('import { PolymorphicRig }')) {
    content = content.replace(
        "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';",
        "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';\nimport { PolymorphicRig } from '../utils/PolymorphicRig';"
    );
}

const swapLogic = `
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
                
                // We would normally rebuild the Skeleton/IK logic here,
                // calling PolymorphicRig.mapBones(skeleton) and updating the FABRIK solver.
                
                console.log("[AutonomousMascot] Model swapped successfully.");
            });
        }) as EventListener);
`;

if (!content.includes('mascot-model-uploaded')) {
    content = content.replace(/\/\/ 5\. MAIN INTEGRATION LOOP/, swapLogic + "\n        // 5. MAIN INTEGRATION LOOP");
    fs.writeFileSync('src/components/AutonomousMascot.tsx', content);
}
