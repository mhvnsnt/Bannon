// =========================================================================
// BRICK 1: ANATOMICAL WEIGHT CLAMPS KEYBOARD LISTENER
// =========================================================================
(function() {
    console.log("[BANNON ENGINE] Injecting Anatomical Weight Clamps Listener...");
    
    // Ensure global state exists
    window.BANNON_STATE = window.BANNON_STATE || {};
    window.BANNON_STATE.weightClampsEnabled = false;

    window.addEventListener('keydown', function(e) {
        // Toggle on 'W' or 'w' key
        if (e.key === 'W' || e.key === 'w') {
            window.BANNON_STATE.weightClampsEnabled = !window.BANNON_STATE.weightClampsEnabled;
            
            const status = window.BANNON_STATE.weightClampsEnabled ? "ENABLED" : "DISABLED";
            console.log(`[BANNON ENGINE] Anatomical Weight Clamps: ${status}`);
            
            // Trigger visual update or recalculation if hook exists
            if (typeof window.BANNON_UI !== 'undefined' && typeof window.BANNON_UI.showToast === 'function') {
                window.BANNON_UI.showToast(`Weight Clamps: ${status}`);
            }

            // Force rig update if the engine loop is accessible
            if (typeof updateRigWeights === 'function') {
                updateRigWeights(window.BANNON_STATE.weightClampsEnabled);
            }
        }
    });
})();

// =========================================================================
// BRICK 2: CUSTOM GLSL SHADER ("REALITY CHECK" FILTER)
// =========================================================================
(function() {
    console.log("[BANNON ENGINE] Injecting Reality Check GLSL Shader...");

    const realityCheckVert = `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // A glitch/chromatic aberration effect for the "Reality Check" hook
    const realityCheckFrag = `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        void main() {
            vec2 p = vUv;
            
            // Chromatic aberration / glitch offsets based on time
            float offset = intensity * (sin(time * 10.0) * 0.01);
            
            vec4 r = texture2D(tDiffuse, vec2(p.x + offset, p.y));
            vec4 g = texture2D(tDiffuse, p);
            vec4 b = texture2D(tDiffuse, vec2(p.x - offset, p.y));
            
            // High contrast, slightly desaturated overlay
            vec3 color = vec3(r.r, g.g, b.b);
            float luminance = dot(color, vec3(0.299, 0.587, 0.114));
            vec3 finalColor = mix(color, vec3(luminance), 0.3) * 1.1;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    window.BANNON_SHADERS = window.BANNON_SHADERS || {};
    window.BANNON_SHADERS.RealityCheck = {
        uniforms: {
            tDiffuse: { value: null },
            time: { value: 0.0 },
            intensity: { value: 0.0 } // 0 = off, 1 = max reality check
        },
        vertexShader: realityCheckVert,
        fragmentShader: realityCheckFrag
    };
    
    // API hook for The Anchor (Queen Tyneshia)
    window.triggerRealityCheck = function(intensityVal = 1.0) {
        if(window.BANNON_SHADERS.RealityCheck) {
             window.BANNON_SHADERS.RealityCheck.uniforms.intensity.value = intensityVal;
             console.log(`[BANNON ENGINE] Reality Check Triggered. Intensity: ${intensityVal}`);
        }
    };
})();

// =========================================================================
// BRICK 3: CCD INVERSE KINEMATICS (IK) SOLVER
// =========================================================================
(function() {
    console.log("[BANNON ENGINE] Injecting CCD IK Solver...");

    /**
     * Basic Cyclic Coordinate Descent (CCD) solver for strike physics
     * @param {Array} chain - Array of bone objects { position: Vector3, rotation: Quaternion, length: Number }
     * @param {Object} target - Target { position: Vector3 }
     * @param {Number} iterations - Number of solver passes (default: 15)
     * @param {Number} tolerance - Distance tolerance to stop early
     */
    function solveCCDIK(chain, target, iterations = 15, tolerance = 0.01) {
        if (!chain || chain.length === 0) return;

        const endEffector = chain[chain.length - 1];
        
        for (let iter = 0; iter < iterations; iter++) {
            // Check distance from end effector to target
            let distSq = distanceSquared(endEffector.position, target.position);
            if (distSq < tolerance * tolerance) {
                break; // Target reached
            }

            // Iterate backwards through the chain
            for (let i = chain.length - 2; i >= 0; i--) {
                const bone = chain[i];
                
                // Vector from current bone to end effector
                const toEnd = subtractVectors(endEffector.position, bone.position);
                // Vector from current bone to target
                const toTarget = subtractVectors(target.position, bone.position);
                
                normalize(toEnd);
                normalize(toTarget);
                
                // Calculate rotation angle and axis
                const cosTheta = dotProduct(toEnd, toTarget);
                if (cosTheta < 0.9999) { // Avoid division by zero / colinearity
                    const axis = crossProduct(toEnd, toTarget);
                    normalize(axis);
                    
                    const angle = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
                    
                    // Apply rotation to bone (Requires integration with your math library, e.g., Three.js)
                    // bone.rotateOnAxis(axis, angle);
                    
                    // Note: After rotating, you must update the positions of all child bones 
                    // in the chain to reflect this bone's new rotation.
                    updateForwardKinematics(chain, i);
                }
            }
        }
    }

    // --- Vector Math Helpers (Replace with your engine's math library e.g., glMatrix / THREE) ---
    function distanceSquared(v1, v2) {
        let dx = v1.x - v2.x, dy = v1.y - v2.y, dz = v1.z - v2.z;
        return dx*dx + dy*dy + dz*dz;
    }
    function subtractVectors(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }; }
    function dotProduct(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    function crossProduct(v1, v2) {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };
    }
    function normalize(v) {
        let len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        if (len > 0) { v.x /= len; v.y /= len; v.z /= len; }
    }
    function updateForwardKinematics(chain, startIndex) {
        // Placeholder for recalculating bone positions down the chain
        // In a real engine, this happens via matrix multiplication (Local -> World)
    }

    // Attach to global engine state
    window.BANNON_PHYSICS = window.BANNON_PHYSICS || {};
    window.BANNON_PHYSICS.solveCCDIK = solveCCDIK;

})();
