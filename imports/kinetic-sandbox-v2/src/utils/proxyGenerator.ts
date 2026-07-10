import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import * as THREE from 'three';

/**
 * Mathematically stretches a low poly skin around high-poly visual vertices
 * to act as the invisible physics cage.
 */
export function generatePhysicsProxy(highPolyMesh: THREE.Object3D): Float32Array {
    const rawVertices: THREE.Vector3[] = [];
    
    // Traverse the high poly model and extract every single vertex coordinate
    highPolyMesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const positions = mesh.geometry.attributes.position;
            if (!positions) return;
            const vector = new THREE.Vector3();
            for (let i = 0; i < positions.count; i++) {
                vector.fromBufferAttribute(positions, i);
                mesh.localToWorld(vector);
                rawVertices.push(vector.clone());
            }
        }
    });

    if (rawVertices.length === 0) {
        // Fallback or empty scenario
        return new Float32Array();
    }

    // Mathematically wrap a tight low poly cage around the raw vertices
    const convexCageGeometry = new ConvexGeometry(rawVertices);
    
    // Extract the optimized array buffer to send to the Ammo js worker
    const optimizedBuffer = convexCageGeometry.attributes.position.array as Float32Array;
    
    return optimizedBuffer;
}
