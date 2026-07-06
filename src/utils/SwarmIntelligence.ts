import * as THREE from 'three';

export class SwarmIntelligence {
    public static spawnMiniAgents(scene: THREE.Scene, count: number, targetPos: THREE.Vector3) {
        console.log(`[Swarm] Spawning ${count} mini-agents targeting ${targetPos.toArray()}`);
        
        for (let i = 0; i < count; i++) {
            // Create a small glowing orb representing a sub-agent
            const geo = new THREE.SphereGeometry(0.1, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00F5D4, transparent: true, opacity: 0.8 });
            const miniAgent = new THREE.Mesh(geo, mat);
            
            // Spawn around the center
            miniAgent.position.set(
                targetPos.x + (Math.random() - 0.5) * 2,
                targetPos.y + (Math.random() - 0.5) * 2,
                targetPos.z + (Math.random() - 0.5) * 2
            );
            
            scene.add(miniAgent);
            
            // Basic swarm flocking behavior (mocked as simple interpolation for visual effect)
            const duration = 2000 + Math.random() * 2000;
            const startTime = Date.now();
            
            const animateSwarm = () => {
                const now = Date.now();
                const progress = (now - startTime) / duration;
                
                if (progress < 1) {
                    // Orbit around target
                    const angle = progress * Math.PI * 4;
                    const radius = 0.5 * (1 - progress); // spiraling in
                    
                    miniAgent.position.x = targetPos.x + Math.cos(angle) * radius;
                    miniAgent.position.y = targetPos.y + Math.sin(angle * 1.5) * radius + Math.sin(progress * Math.PI) * 1;
                    miniAgent.position.z = targetPos.z + Math.sin(angle) * radius;
                    
                    miniAgent.material.opacity = 1 - progress;
                    
                    requestAnimationFrame(animateSwarm);
                } else {
                    scene.remove(miniAgent);
                    geo.dispose();
                    mat.dispose();
                }
            };
            
            animateSwarm();
        }
    }
}
