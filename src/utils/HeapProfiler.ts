import * as THREE from 'three';

export interface MemorySample {
    address: number;
    size: number;
    timestamp: number;
    depth: number;
    retained: boolean;
}

export class HeapProfiler {
    private scene: THREE.Scene;
    private instancedMesh: THREE.InstancedMesh | null = null;
    private maxSamples = 10000;
    private sampleCount = 0;
    private geometry: THREE.BoxGeometry;
    private material: THREE.MeshBasicMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        this.geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 });
        
        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxSamples);
        this.instancedMesh.position.set(10, 5, -10); // Offset in scene
        this.scene.add(this.instancedMesh);
    }

    public ingestSample(sample: MemorySample) {
        if (!this.instancedMesh || this.sampleCount >= this.maxSamples) {
            // Circular buffer reset
            this.sampleCount = 0; 
        }

        const x = (sample.address % 100) * 0.4 - 20;
        const y = (sample.depth) * 0.4;
        const z = ((sample.timestamp % 10000) / 100) * 0.4 - 20;

        const matrix = new THREE.Matrix4();
        matrix.setPosition(x, y, z);
        
        // Scale based on size allocation
        const scale = Math.max(0.1, Math.min(sample.size / 1024, 2.0));
        matrix.scale(new THREE.Vector3(scale, scale, scale));

        this.instancedMesh.setMatrixAt(this.sampleCount, matrix);
        
        const color = sample.retained ? new THREE.Color(0xFF3333) : new THREE.Color(0x2EC4B6);
        this.instancedMesh.setColorAt(this.sampleCount, color);
        
        this.sampleCount++;
        
        this.instancedMesh.count = this.sampleCount;
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
             this.instancedMesh.instanceColor.needsUpdate = true;
        }
    }

    public clear() {
        if (this.instancedMesh) {
            this.sampleCount = 0;
            this.instancedMesh.count = 0;
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }
    
    public dispose() {
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh);
            this.instancedMesh.dispose();
        }
        this.geometry.dispose();
        this.material.dispose();
    }
}
