const fs = require('fs');
let content = fs.readFileSync('src/components/AutonomousMascot.tsx', 'utf-8');

const syncLogic = `
                    // CLOUD GRID TELEMETRY SYNC
                    if (cloudGrid.provider?.shouldConnect) {
                         cloudGrid.updateLocalMascot({
                              id: 'local_mascot_' + Math.random().toString(36).substr(2, 5), // Normally use a UUID
                              x: dummyModel.position.x,
                              y: dummyModel.position.y,
                              z: dummyModel.position.z,
                              rotY: dummyModel.rotation.y,
                              animState: isRewinding ? 'rewind' : 'wander'
                         });
                    }
                    
                    // Render remote peers
                    const peers = cloudGrid.getRemoteMascots();
                    // Here we would iterate peers and update phantom meshes.
                    // (Mocking the render loop hook for peers without bloating the core loop)
`;

// Inject into the animation loop right after `dummyModel.position.copy(position);`
if (!content.includes('CLOUD GRID TELEMETRY SYNC')) {
    content = content.replace("dummyModel.position.copy(position);", "dummyModel.position.copy(position);\n" + syncLogic);
    fs.writeFileSync('src/components/AutonomousMascot.tsx', content);
}
