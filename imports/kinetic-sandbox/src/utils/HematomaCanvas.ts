import * as THREE from 'three';

// Dynamic UV-space texture canvas for subdermal hematoma propagation
// Uses fluid diffusion math to accumulate bruising over time

export class HematomaCanvas {
    public renderTarget: THREE.WebGLRenderTarget;
    public material: THREE.ShaderMaterial;
    public scene: THREE.Scene;
    public camera: THREE.OrthographicCamera;
    public mesh: THREE.Mesh;
    private canvasSize = 1024;

    constructor() {
        this.renderTarget = new THREE.WebGLRenderTarget(this.canvasSize, this.canvasSize, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uPrevTex: { value: null },
                uTime: { value: 0 },
                uDelta: { value: 0 },
                uImpacts: { value: new Array(5).fill(new THREE.Vector4(0, 0, 0, 0)) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uPrevTex;
                uniform float uTime;
                uniform float uDelta;
                uniform vec4 uImpacts[5]; // x, y (UV space), z (intensity), w (time)
                varying vec2 vUv;
                
                void main() {
                    vec4 prev = texture2D(uPrevTex, vUv);
                    
                    // Fluid diffusion: blur and spread
                    vec2 texel = vec2(1.0 / 1024.0);
                    vec4 neighborSum = texture2D(uPrevTex, vUv + vec2(texel.x, 0.0)) +
                                       texture2D(uPrevTex, vUv - vec2(texel.x, 0.0)) +
                                       texture2D(uPrevTex, vUv + vec2(0.0, texel.y)) +
                                       texture2D(uPrevTex, vUv - vec2(0.0, texel.y));
                    
                    vec4 diffused = mix(prev, neighborSum * 0.25, uDelta * 2.0); // Spread rate
                    
                    // Apply new impacts
                    float incomingBruise = 0.0;
                    for(int i=0; i<5; i++){
                        if (uImpacts[i].z > 0.0) {
                            float d = length(vUv - uImpacts[i].xy);
                            float impactVolume = smoothstep(0.05, 0.0, d) * uImpacts[i].z;
                            incomingBruise += impactVolume;
                        }
                    }
                    
                    // x maps to accumulated bruise intensity
                    // y maps to age (time since bruising started)
                    float newIntensity = min(1.0, diffused.x + incomingBruise * uDelta * 10.0);
                    float newAge = prev.y;
                    
                    if (newIntensity > 0.01) {
                        newAge += uDelta;
                    } else {
                        newAge = 0.0;
                    }
                    
                    // Fade bruising very slowly over time (healing)
                    newIntensity = max(0.0, newIntensity - uDelta * 0.01);
                    
                    gl_FragColor = vec4(newIntensity, newAge, 0.0, 1.0);
                }
            `
        });
        
        const geo = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geo, this.material);
        this.scene.add(this.mesh);
    }
    
    public update(renderer: THREE.WebGLRenderer, dt: number, time: number) {
        this.material.uniforms.uDelta.value = dt;
        this.material.uniforms.uTime.value = time;
        
        // Ping-pong render
        const tempTarget = new THREE.WebGLRenderTarget(this.canvasSize, this.canvasSize, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        this.material.uniforms.uPrevTex.value = this.renderTarget.texture;
        
        renderer.setRenderTarget(tempTarget);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
        
        const oldTarget = this.renderTarget;
        this.renderTarget = tempTarget;
        oldTarget.dispose();
    }
    
    public getTexture(): THREE.Texture {
        return this.renderTarget.texture;
    }
}
