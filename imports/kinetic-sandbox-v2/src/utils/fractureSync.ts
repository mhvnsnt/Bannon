import * as THREE from 'three';

export function splitVerticesOnTear(
    geometry: THREE.BufferGeometry, 
    vertexIndexA: number, 
    vertexIndexB: number
) {
    // Standard BufferGeometry usually comes indexed or non-indexed.
    // If it's indexed, tearing would require duplicating the shared vertex in the buffer
    // and updating the index array to point one triangle to the new vertex.
    
    // Convert to non-indexed if it's indexed (makes tearing easier)
    if (geometry.index) {
        geometry = geometry.toNonIndexed();
    }
    
    const position = geometry.attributes.position as THREE.BufferAttribute;
    
    // In a real fracture, Ammo.js tells us node A and node B separated.
    // We would find triangles sharing those nodes, and physically separate their vertices.
    // Given the JS constraint, we simulate the visual gap by moving the vertices slightly apart.
    
    if (position.count > vertexIndexA && position.count > vertexIndexB) {
        // Just as an architectural proxy: we shift the vertices mathematically to show a rip
        position.setXYZ(vertexIndexA, 
            position.getX(vertexIndexA) + 0.1,
            position.getY(vertexIndexA),
            position.getZ(vertexIndexA) + 0.1
        );
        
        position.setXYZ(vertexIndexB, 
            position.getX(vertexIndexB) - 0.1,
            position.getY(vertexIndexB),
            position.getZ(vertexIndexB) - 0.1
        );
        
        position.needsUpdate = true;
        geometry.computeVertexNormals();
    }
    
    return geometry;
}
