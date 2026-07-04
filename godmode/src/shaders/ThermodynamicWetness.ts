// File: src/shaders/ThermodynamicWetness.ts

export const thermodynamicWetnessShaderFrag = `
uniform vec3 baseColor;
uniform float systemSaturation;
uniform float metabolicHeat;
uniform sampler2D alphaNoiseMap;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    // Evaluate metabolic threshold: f(H_t) = clamp((H_t - 37.0) / 3.0, 0.0, 1.0)
    float metabolicThreshold = clamp((metabolicHeat - 37.0) / 3.0, 0.0, 1.0);
    float wetnessFactor = systemSaturation * metabolicThreshold;

    // Interpolate roughness parameters dynamically
    // High sweat lowers roughness toward 0.02 (highly specular specular layer)
    float baseRoughness = 0.6;
    float wetRoughness = 0.02;
    float finalRoughness = mix(baseRoughness, wetRoughness, wetnessFactor);

    // Simulate subsurface structural tearing if tension yields past critical threshold (0.45)
    float alphaOutput = 1.0;
    if (systemSaturation > 0.45) {
        vec4 noiseColor = texture2D(alphaNoiseMap, vUv * 50.0);
        float tearFactor = (systemSaturation - 0.45) * 5.0;
        alphaOutput = 1.0 - (noiseColor.r * tearFactor);
    }

    // Output raw fragment vector straight to WebGL viewport
    gl_FragColor = vec4(baseColor * (1.0 - finalRoughness), clamp(alphaOutput, 0.0, 1.0));
}
`;
