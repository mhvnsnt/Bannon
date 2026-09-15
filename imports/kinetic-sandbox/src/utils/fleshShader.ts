import * as THREE from 'three';

export function applyProceduralSkinShader(material: THREE.MeshPhysicalMaterial, uniformsData: any) {
    // Hard-enable clearcoat for wet physics
    material.clearcoat = 1.0;
    material.clearcoatRoughness = 0.5;

    material.onBeforeCompile = (shader) => {
        // Inject custom uniforms
        shader.uniforms.skinFlushIntensity = { value: uniformsData.skinFlushIntensity || 0.0 };
        shader.uniforms.pallorIntensity = { value: uniformsData.pallorIntensity || 0.0 };
        shader.uniforms.glossRoughness = { value: uniformsData.glossRoughness || 0.5 };
        shader.uniforms.hydrationLevel = { value: uniformsData.hydrationLevel || 0.0 };
        shader.uniforms.goosebumps = { value: uniformsData.goosebumps || 0.0 };
        shader.uniforms.cyanosis = { value: uniformsData.cyanosis || 0.0 };
        shader.uniforms.perspirationLevel = { value: uniformsData.perspirationLevel || 0.0 };
        shader.uniforms.systemSaturation = { value: 0.0 };
        shader.uniforms.bloodPressure = { value: 1.0 };
        shader.uniforms.tissueTrauma = { value: 0.0 };
        shader.uniforms.forceFieldPos = { value: new THREE.Vector3(0,0,0) };
        shader.uniforms.forceFieldIntensity = { value: 0.0 };
        shader.uniforms.time = { value: 0 };
        shader.uniforms.physicsTime = { value: 0 };
        shader.uniforms.bpm = { value: 60.0 };
        shader.uniforms.bulgeCenters = { value: [new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0)] }; // xyz = pos, w = radius
        shader.uniforms.ripplePositions = { value: [new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0)] }; // xyz = pos, w = intensity
        shader.uniforms.rippleTimes = { value: [0, 0, 0, 0, 0] }; // time of impact
        shader.uniforms.smearPositions = { value: [new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0), new THREE.Vector4(0,0,0,0)] }; // xyz = pos, w = wetness

        // Inject vertex shader variables
        shader.vertexShader = `
            varying float vLocalStress;
            varying vec3 vWorldPos;
            uniform float time;
            uniform float physicsTime;
            uniform float goosebumps;
            uniform vec4 bulgeCenters[3];
            uniform vec4 ripplePositions[5];
            uniform float rippleTimes[5];
            uniform vec3 forceFieldPos;
            uniform float forceFieldIntensity;
            ${shader.vertexShader}
        `;

        // Inject vertex displacement
        shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
             // Subcutaneous Cylinder Deflection (Hydrostatic Volume Preservation)
             vec4 worldPos = modelMatrix * vec4(position, 1.0);
             vec3 totalOffset = vec3(0.0);
             
             for(int i=0; i<3; i++) {
                 float rad = bulgeCenters[i].w;
                 if(rad > 0.0) {
                     vec3 dir = worldPos.xyz - bulgeCenters[i].xyz;
                     float dist = length(dir);
                     float influence = 1.0 - smoothstep(0.0, rad, dist);
                     if (influence > 0.0) {
                         // Hydrostatic Deformation: Impact zone caves in, surrounding tissue bulges outward
                         float caveIn = pow(influence, 2.0); // Sharp dip at center
                         float bulgeOut = sin(influence * 3.14159) * 0.5; // Smooth wave pushing outwards
                         
                         // normal direction calculation for volume displacement
                         totalOffset += normal * (-caveIn * rad * 0.8 + bulgeOut * rad * 0.4); 
                     }
                 }
             }
             
             // High Weber Number Fluid Splatter Ripples
             for(int i=0; i<5; i++) {
                 float intensity = ripplePositions[i].w;
                 if (intensity > 0.0) {
                     float tDiff = max(0.0, physicsTime - rippleTimes[i]);
                     // Ripple wave expands outward over time
                     vec3 dir = worldPos.xyz - ripplePositions[i].xyz;
                     float dist = length(dir);
                     
                     // Speed of ripple = 2.0 units per second, freq = 20
                     float waveRadius = tDiff * 3.0;
                     float waveWidth = 0.5;
                     float distFromWave = abs(dist - waveRadius);
                     
                     if (distFromWave < waveWidth && tDiff < 1.0) {
                         float waveEnvelope = 1.0 - (distFromWave / waveWidth);
                         float fade = 1.0 - tDiff;
                         // Ripple oscillation
                         float oscillation = sin((dist - waveRadius) * 20.0) * waveEnvelope * fade * intensity * 0.05;
                         totalOffset += normal * oscillation;
                     }
                 }
             }
             
             // Touch-driven Force Field (Attract/Repel Soft Body Vertices)
             if (abs(forceFieldIntensity) > 0.01) {
                 vec3 dirToField = worldPos.xyz - forceFieldPos;
                 float distToField = length(dirToField);
                 if (distToField > 0.001 && distToField < 5.0) { // Field radius limit
                     float fieldStrength = (5.0 - distToField) / 5.0; // Falloff and Intensity
                     // Push vertices smoothly, modified by mass-spring-like natural vertex oscillation over time based on physicsTime
                     float oscillationPattern = sin(distToField * 15.0 - physicsTime * 10.0) * 0.1;
                     
                     // Force field offsets the vertex along the normal and radially
                     vec3 fieldDir = normalize(dirToField);
                     // If forceFieldIntensity is positive, repels vertices away and bulges outwards.
                     // If negative, pulls vertices in.
                     totalOffset += (fieldDir + normal * 0.5) * fieldStrength * forceFieldIntensity * (1.0 + oscillationPattern) * 0.2;
                 }
             }

             // Autonomous Goosebumps (Piloerection vertex displacement)
             if (goosebumps > 0.0) {
                 float gbFreq = 200.0;
                 float gb1 = sin(position.x * gbFreq) * sin(position.y * gbFreq) * cos(position.z * gbFreq);
                 float gb2 = sin((position.x + position.y) * 150.0) * cos(position.z * 150.0);
                 float gbNoise = max(0.0, gb1 * gb2);
                 totalOffset += normal * (gbNoise * goosebumps * 0.008);
             }

             transformed += totalOffset;
             vWorldPos = worldPos.xyz + totalOffset;
             
             // Calculate local shear stress from deformation
             float displacementMag = length(totalOffset);
             vLocalStress = smoothstep(0.05, 0.4, displacementMag);
            `
        );

        // Inject the variable declarations
        shader.fragmentShader = `
            varying float vLocalStress;
            varying vec3 vWorldPos;
            uniform float skinFlushIntensity;
            uniform float pallorIntensity;
            uniform float glossRoughness;
            uniform float hydrationLevel;
            uniform float goosebumps;
            uniform float cyanosis;
            uniform float bloodPressure;
            uniform float tissueTrauma;
            uniform float time;
            uniform float bpm;
            uniform float thermalVision;
            uniform float perspirationLevel;
            uniform float systemSaturation;
            uniform vec4 smearPositions[10];
            uniform vec4 ripplePositions[5];
            uniform float rippleTimes[5];
            ${shader.fragmentShader}
        `;

        // We override the color fragment to mix flush and pallor
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
             
             // The Blush Engine: rich crimson hue for pleasure/embarrassment
             vec3 flushColor = vec3(0.9, 0.2, 0.3);
             
             // The Pallor Engine: ashen desaturated green/blue for pain/shock
             vec3 pallorColor = vec3(0.4, 0.5, 0.45);

             // Tissue Trauma: Deep crimson for micro-tears / fractures
             vec3 traumaColor = vec3(0.5, 0.0, 0.05);

             // Pure white for extreme tension blanching
             vec3 blanchColor = vec3(0.98, 0.95, 0.90);
             
             diffuseColor.rgb = mix(diffuseColor.rgb, flushColor, skinFlushIntensity * 0.6);
             diffuseColor.rgb = mix(diffuseColor.rgb, pallorColor, pallorIntensity * 0.7);
             
             // Dynamic Mesh Deformation triggers localized red shading AND Blanching
             // Medium stretch brings blood to the surface (red)
             // Extreme stretch squeezes the capillaries and forces the blood out (blanching)
             float redStretch = smoothstep(0.0, 0.5, vLocalStress) - smoothstep(0.6, 1.0, vLocalStress);
             float whiteStretch = smoothstep(0.7, 1.0, vLocalStress);
             
             float totalTrauma = clamp(tissueTrauma + (redStretch * 0.8), 0.0, 1.0);
             diffuseColor.rgb = mix(diffuseColor.rgb, traumaColor, totalTrauma);
             
             // Apply Blanching at peaks of tension
             diffuseColor.rgb = mix(diffuseColor.rgb, blanchColor, whiteStretch * 0.9);

             // Cyanosis Engine: bluish tint for hypoxia / extreme cold
             vec3 cyanColor = vec3(0.2, 0.3, 0.6);
             diffuseColor.rgb = mix(diffuseColor.rgb, cyanColor, cyanosis * 0.8);
             
             // --- SUBDERMAL HEMATOMA CANVAS (Chronological Bruising) ---
             vec3 bruiseColorAcc = diffuseColor.rgb;
             float maxBruiseOp = 0.0;
             for(int i=0; i<5; i++){
                 float impactInt = ripplePositions[i].w;
                 if (impactInt > 0.0) {
                     float distToImpact = length(vWorldPos - ripplePositions[i].xyz);
                     // Calculate fluid diffusion mapping
                     float bruiseVolume = smoothstep(0.4, 0.0, distToImpact) * (impactInt * 2.0);
                     if (bruiseVolume > 0.0) {
                         float timeSinceImpact = time - rippleTimes[i];
                         // Compressed chronological stages: Crimson -> Purple -> Yellow/Green
                         float stage1 = 1.0 - smoothstep(2.0, 8.0, timeSinceImpact); // 0-8s: Crimson
                         float stage2 = smoothstep(2.0, 8.0, timeSinceImpact) - smoothstep(15.0, 25.0, timeSinceImpact); // 2-25s: Purple
                         float stage3 = smoothstep(15.0, 25.0, timeSinceImpact) - smoothstep(40.0, 60.0, timeSinceImpact); // 15-60s: Yellow-Green
                         
                         vec3 stage1Col = vec3(0.5, 0.0, 0.05); // Crimson
                         vec3 stage2Col = vec3(0.2, 0.0, 0.3); // Deep Purple
                         vec3 stage3Col = vec3(0.6, 0.6, 0.1); // Yellow-Green
                         
                         vec3 localBruise = mix(diffuseColor.rgb, stage1Col, stage1 * 0.9);
                         localBruise = mix(localBruise, stage2Col, stage2 * 0.9);
                         localBruise = mix(localBruise, stage3Col, stage3 * 0.8);
                         
                         float currentOp = bruiseVolume * clamp(stage1 + stage2 + stage3, 0.0, 1.0);
                         bruiseColorAcc = mix(bruiseColorAcc, localBruise, currentOp);
                         maxBruiseOp = max(maxBruiseOp, currentOp);
                     }
                 }
             }
             diffuseColor.rgb = mix(diffuseColor.rgb, bruiseColorAcc, maxBruiseOp);

             // Screen-space Goosebumps (visual micro-shading)
             // Create a grid-like bump pattern
             float gb1 = sin(gl_FragCoord.x * 2.0) * sin(gl_FragCoord.y * 2.0);
             float gb2 = sin((gl_FragCoord.x + gl_FragCoord.y) * 1.5);
             float gooseBumpPattern = clamp((gb1 * gb2) * 5.0, 0.0, 1.0);
             float gb = gooseBumpPattern * goosebumps;
             diffuseColor.rgb -= gb * 0.08; // tiny micro-shadows

             // Microvascular Sweat Beading (Procedural Droplets)
             float sweatThreshold = 0.5;
             if (perspirationLevel > sweatThreshold) {
                 float dropletFreq = 80.0;
                 // Creates localized beaded droplets that trail downward
                 float gravityFlow = time * 0.5;
                 float dropPattern = sin((vWorldPos.x * dropletFreq) + sin(vWorldPos.y * dropletFreq * 0.5)) * 
                                     cos((vWorldPos.y + gravityFlow) * dropletFreq) * 
                                     sin(vWorldPos.z * dropletFreq);
                 
                 float dropIntensity = smoothstep(0.8, 1.0, dropPattern) * ((perspirationLevel - sweatThreshold) * 2.0);
                 
                 // Render droplets as highly specular white highlights
                 diffuseColor.rgb += dropIntensity * 0.5; 
                 // Note: we also will handle roughness in roughness map
             }

             // Reverse Photoplethysmography (vPPG)
             // Microscopic color shifts based on a dynamic heart rate (BPM)
             float pulseFreq = (bpm / 60.0) * 3.14159 * 2.0;
             float ppgWave = sin(time * pulseFreq);
             // We inject a tiny hemoglobin pulse to the red channel
             // Blood pressure controls the amplitude of the pulse!
             diffuseColor.r += ppgWave * 0.02 * skinFlushIntensity * bloodPressure;
             
             // --- THERMAL HEATMAP ENGINE ---
             if (thermalVision > 0.5) {
                 // Convert current color to intensity proxy for heat
                 float heat = ((skinFlushIntensity * 0.8) + (totalTrauma * 1.5) + (bloodPressure * 0.3)) - (cyanosis * 0.5) + (ppgWave * 0.05);
                 heat = clamp(heat, 0.0, 1.0);
                 
                 // Cool blue -> Yellow -> Red Hot -> White Hot
                 vec3 thermColor = vec3(0.0);
                 if (heat < 0.25) {
                     thermColor = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), heat * 4.0);
                 } else if (heat < 0.5) {
                     thermColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 1.0, 0.0), (heat - 0.25) * 4.0);
                 } else if (heat < 0.75) {
                     thermColor = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (heat - 0.5) * 4.0);
                 } else {
                     thermColor = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), (heat - 0.75) * 4.0);
                 }
                 
                 // Apply cooling effect if sweating
                 thermColor = mix(thermColor, vec3(0.0, 0.2, 0.8), perspirationLevel * 0.5);
                 
                 diffuseColor.rgb = mix(diffuseColor.rgb, thermColor, thermalVision);
             }
            `
        );
        
        // Setup roughness override for diaphoresis (sweat/hydration) and Viscous Smears
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <roughnessmap_fragment>`,
            `#include <roughnessmap_fragment>
             
             // Smear/Wetmap Distance Calculation
             float smearInfluence = 0.0;
             for(int i=0; i<10; i++){
                 float smearInt = smearPositions[i].w;
                 if (smearInt > 0.0) {
                     float distToSmear = length(vWorldPos - smearPositions[i].xyz);
                     // Smears cover roughly a 0.5 unit radius fading out
                     float localInf = smoothstep(0.5, 0.0, distToSmear) * smearInt;
                     smearInfluence = max(smearInfluence, localInf);
                 }
             }
             
             // Dynamically alter roughness based on sweat/gloss, hydration, and smears
             float baseSweat = perspirationLevel + (systemSaturation * 0.8);
             float wetness = clamp(hydrationLevel + baseSweat + smearInfluence, 0.0, 1.0);
             float finalRoughness = mix(roughnessFactor, glossRoughness, skinFlushIntensity);
             
             // Goosebump pattern calculation for roughness
             float gb1R = sin(gl_FragCoord.x * 2.0) * gl_FragCoord.y * 2.0;
             float gb2R = sin((gl_FragCoord.x + gl_FragCoord.y) * 1.5);
             float gbPattern = clamp((gb1R * gb2R) * 5.0, 0.0, 1.0) * goosebumps;
             
             finalRoughness = mix(finalRoughness, 1.0, gbPattern * 0.8); // Goosebumps make it matte rough and bumpy
             
             // Sweat droplet specular spots
             float sweatThresholdR = 0.5;
             if (perspirationLevel > sweatThresholdR) {
                 float dropletFreq = 80.0;
                 float gravityFlow = time * 0.5;
                 float dropPattern = sin((vWorldPos.x * dropletFreq) + sin(vWorldPos.y * dropletFreq * 0.5)) * 
                                     cos((vWorldPos.y + gravityFlow) * dropletFreq) * 
                                     sin(vWorldPos.z * dropletFreq);
                 float dropIntensity = smoothstep(0.8, 1.0, dropPattern) * ((perspirationLevel - sweatThresholdR) * 2.0);
                 finalRoughness = mix(finalRoughness, 0.0, dropIntensity); // Perfect glass-like mirror specular points
             }
             
             finalRoughness = mix(finalRoughness, 0.02, wetness * 0.95); // Extremely glossy/varnished where fluid smeared
             roughnessFactor = finalRoughness;
            `
        );

        // Store a reference to the shader uniforms so we can update them securely
        material.userData.shader = shader;
    };
}
