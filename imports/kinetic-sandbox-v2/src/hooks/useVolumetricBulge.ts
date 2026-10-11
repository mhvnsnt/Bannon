import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../store/physicsStore';

export function useVolumetricBulge(groupRef?: React.RefObject<THREE.Group>) {
    useFrame((state, delta) => {
        if (!groupRef?.current) return;
        
        const store = usePhysicsStore.getState();
        const cylinderRefs = store.cylinderRefs;
        
        let bulges: THREE.Vector4[] = [];
        
        // Convert world cylinder positions to Local Space of THIS group
        const invMatrix = new THREE.Matrix4().copy(groupRef.current.matrixWorld).invert();
        
        // Grab up to 3 cylinders to act as bulges 
        let idx = 0;
        for (const cyl of cylinderRefs.values()) {
            if (idx >= 3) break;
            if (cyl.userData.isCylinder) {
                const pos = new THREE.Vector3();
                cyl.getWorldPosition(pos);
                pos.applyMatrix4(invMatrix); // transform to local space
                
                // Bulge radius based on cylinder radius + distension
                const radius = store.cylinderRadius * 1.5; 
                bulges.push(new THREE.Vector4(pos.x, pos.y, pos.z, radius));
                idx++;
            }
        }
        
        // Pad to 3
        while (bulges.length < 3) {
            bulges.push(new THREE.Vector4(0, 0, 0, 0));
        }
        
        groupRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as any;
                if (mat?.userData?.shader?.uniforms?.bulgeCenters) {
                    for(let i=0; i<3; i++) {
                        mat.userData.shader.uniforms.bulgeCenters.value[i].copy(bulges[i]);
                    }
                }
            }
        });
    });
}

