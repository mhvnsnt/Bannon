import * as THREE from 'three';

export class ParticleEmitter {
    particles: THREE.BufferGeometry;
    particleMaterial: THREE.PointsMaterial;
    particleSystem: THREE.Points;
    velocities: THREE.Vector3[] = [];
    lifespans: number[] = [];
    maxParticles = 100;

    constructor(scene: THREE.Scene) {
        this.particles = new THREE.BufferGeometry();
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xFFB703,
            size: 0.2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const positions = new Float32Array(this.maxParticles * 3);
        
        for (let i = 0; i < this.maxParticles; i++) {
            positions[i*3] = 9999;
            positions[i*3+1] = 9999;
            positions[i*3+2] = 9999;
            this.velocities.push(new THREE.Vector3());
            this.lifespans.push(0);
        }
        
        this.particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleSystem = new THREE.Points(this.particles, this.particleMaterial);
        scene.add(this.particleSystem);
    }

    emit(position: THREE.Vector3) {
        const positions = this.particles.attributes.position.array as Float32Array;
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.lifespans[i] <= 0) {
                positions[i*3] = position.x + (Math.random() - 0.5) * 0.5;
                positions[i*3+1] = position.y + (Math.random() - 0.5) * 0.5;
                positions[i*3+2] = position.z + (Math.random() - 0.5) * 0.5;
                
                this.velocities[i].set(
                    (Math.random() - 0.5) * 0.4,
                    (Math.random() * 0.4) + 0.2,
                    (Math.random() - 0.5) * 0.4
                );
                this.lifespans[i] = 1.0; // 1 second lifespan
                break;
            }
        }
    }

    update(delta: number) {
        const positions = this.particles.attributes.position.array as Float32Array;
        let needsUpdate = false;
        
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.lifespans[i] > 0) {
                this.lifespans[i] -= delta * 2; // fade out faster
                
                this.velocities[i].y -= delta * 0.8; // gravity
                
                positions[i*3] += this.velocities[i].x;
                positions[i*3+1] += this.velocities[i].y;
                positions[i*3+2] += this.velocities[i].z;
                
                if (this.lifespans[i] <= 0) {
                    positions[i*3] = 9999;
                }
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            this.particles.attributes.position.needsUpdate = true;
        }
    }
}
