// The Neural Hive Mind
// Explicitly handles behavioral logic separated from physics and canvas.

let physicsPort: MessagePort | null = null;
let behaviorConfig = {
    willpower: 0.5,
    panicThreshold: 0.5,
    aggression: 0.5,
    reactionSpeed: 0.5
};

self.onmessage = async (e) => {
    if (e.data.type === 'INIT_HIVE') {
        if (e.ports && e.ports.length > 0) {
            physicsPort = e.ports[0];
            physicsPort.onmessage = (msg) => {
                if (msg.data.type === 'PULSE') {
                   processPhysicsPulse(msg.data.payload);
                }
            };
            console.log('Hive Mind logic thread spun up and connected to Physics Engine.');
        } else {
            console.log('Hive Mind initialized without Physics loop.');
        }
    } else if (e.data.type === 'SYNC_BEHAVIOR') {
        behaviorConfig = { ...behaviorConfig, ...e.data.payload };
    } else if (e.data.type === 'PULSE') {
        // Fallback for direct UI messages
        processPhysicsPulse(e.data.payload);
    }
};

function processPhysicsPulse(payload: any) {
    // Calculate Behavioral Logic and send torque/rotations back
    const { id, stress, position } = payload;
    
    // PD motor controllers and flinch reactions based on archetypes
    let struggleFactor = 1.0 - behaviorConfig.willpower;
    let randomPanic = Math.random() * struggleFactor;
    
    // If stress pushes past panic threshold, panic skyrockets
    if (stress > behaviorConfig.panicThreshold) {
        randomPanic *= 5.0;
    }
    
    // Aggression dictates how hard we snap back
    const snapSpeed = Date.now() * 0.001 * behaviorConfig.reactionSpeed;
    
    // Response matrix
    const response = {
        id,
        torque: [
            Math.sin(snapSpeed) * randomPanic * behaviorConfig.aggression,
            Math.cos(snapSpeed) * randomPanic * 2.0 * behaviorConfig.aggression,
            Math.sin(snapSpeed * 1.5) * randomPanic
        ],
        jiggleMultiplier: stress * struggleFactor * 10.0
    };

    if (physicsPort) {
        physicsPort.postMessage({ type: 'HIVE_RESPONSE', payload: response });
    } else {
        self.postMessage({ type: 'HIVE_RESPONSE', payload: response });
    }
}
