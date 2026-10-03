import * as THREE from 'three';
import { updateGlobalFormant } from './audio';

export function applyEmotionJSON(
    mesh: THREE.Mesh | THREE.SkinnedMesh, 
    jsonPayload: any, 
    materialToUpdate?: THREE.Material
) {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
        console.warn("Mesh does not have morph targets.");
        return;
    }
    
    // The Asymmetry Engine (The Imperfect Soul)
    // Randomly delays or weakens one side of the face by 5 to 10 percent
    const asymmetryFactor = 0.05 + Math.random() * 0.05; 
    const dominantSide = Math.random() > 0.5 ? 'left' : 'right';

    // Subconscious Leak (Microexpression Engine)
    // Small percentage of the time, inject a raw twitch bypassing the blendshape input
    const isMicroexpression = Math.random() > 0.95;

    // 1. Standard Blendshapes (FACS Matrix)
    const standard = jsonPayload.standard_blendshapes || {};
    
    // Pass jawOpen to global formant filter
    if (standard.jawOpen !== undefined) {
        updateGlobalFormant(Number(standard.jawOpen));
    }

    Object.entries(standard).forEach(([key, value]) => {
        const idx = mesh.morphTargetDictionary![key];
        let finalVal = Number(value);
        
        // Apply asymmetry to the non-dominant side
        const isLeft = key.toLowerCase().includes('left');
        const isRight = key.toLowerCase().includes('right');
        
        if ((isLeft && dominantSide === 'right') || (isRight && dominantSide === 'left')) {
            finalVal *= (1.0 - asymmetryFactor);
        }
        
        if (idx !== undefined) {
             // We can implement smooth interpolation here using lerp in an animation loop, 
             // but for direct command injection we set the target influence.
             mesh.morphTargetInfluences![idx] = finalVal;
        }
    });

    // 2. Custom Extremes (Oral, Tongue, Ocular, Jaw)
    const custom = jsonPayload.custom_extremes || {};
    Object.entries(custom).forEach(([key, value]) => {
        const idx = mesh.morphTargetDictionary![key];
        if (idx !== undefined) {
            mesh.morphTargetInfluences![idx] = Number(value);
        }
    });

    // 3. Vascular & Shader Control (The Face Flush / Sweat)
    if (materialToUpdate && materialToUpdate.userData.shader) {
        const shaderEffects = jsonPayload.shader_effects || {};
        const shader = materialToUpdate.userData.shader;
        
        if (shader.uniforms.skinFlushIntensity) {
            shader.uniforms.skinFlushIntensity.value = Number(shaderEffects.skinFlushIntensity || 0.0);
        }
        if (shader.uniforms.pallorIntensity && shaderEffects.pallorIntensity !== undefined) {
            shader.uniforms.pallorIntensity.value = Number(shaderEffects.pallorIntensity);
        }
        if (shader.uniforms.glossRoughness && shaderEffects.skinGlossRoughness !== undefined) {
            shader.uniforms.glossRoughness.value = Number(shaderEffects.skinGlossRoughness);
        }
    }
}
