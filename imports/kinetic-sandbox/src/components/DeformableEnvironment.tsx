import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function DeformableEnvironment() {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const planeRef = useRef<THREE.Mesh>(null);
    
    // Shader injection for SDF deformation
    const customUniforms = useMemo(() => ({
        deformNodes: { value: new Array(15).fill(0).map(() => new THREE.Vector4(0, 0, 0, 0)) }, // x, y, z, mass/radius
        deformCount: { value: 0 }
    }), []);

    const onBeforeCompile = (shader: any) => {
        shader.uniforms.deformNodes = customUniforms.deformNodes;
        shader.uniforms.deformCount = customUniforms.deformCount;
        
        shader.vertexShader = `
            uniform vec4 deformNodes[15];
            uniform int deformCount;
            
            // smoothmin for SDF blending
            float smin( float a, float b, float k ) {
                float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
                return mix( b, a, h ) - k*h*(1.0-h);
            }
        ` + shader.vertexShader;
        
        // Pushing vertices DOWN if they are within the sphere SDF
        shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            float surfaceSDF = 0.0;
            
            // Baseline 0
            float fieldDeformation = 0.0;
            
            for(int i=0; i<15; i++){
                if (i >= deformCount) break;
                vec4 node = deformNodes[i];
                // Distance to soft body joint
                float dist = length(worldPos.xyz - node.xyz);
                
                // If within radius (w)
                if (dist < node.w) {
                    float indent = pow(1.0 - (dist / node.w), 2.0) * node.w * 0.4;
                    fieldDeformation = max(fieldDeformation, indent);
                }
            }
            
            // Apply deformation along the normal (which is Z pointing up in planeGeometry)
            transformed.z -= fieldDeformation; 
            `
        );
    };

    useFrame(() => {
        const nodes: THREE.Vector4[] = [];
        const scene = planeRef.current?.parent;
        if (scene) {
            scene.traverse((obj) => {
                if (nodes.length >= 15) return;
                
                if (obj.type === 'Bone' || obj.userData.isCylinder) {
                    const wpos = new THREE.Vector3();
                    obj.getWorldPosition(wpos);
                    // Floor is at y=-1, check proximity. We must compress grass/mattress
                    if (wpos.y < 0.8) {
                        const radius = obj.userData.isCylinder ? obj.scale.x * 3.0 : 0.8;
                        nodes.push(new THREE.Vector4(wpos.x, wpos.y, wpos.z, radius));
                    }
                }
            });
            customUniforms.deformCount.value = nodes.length;
            for(let i=0; i<nodes.length; i++){
                customUniforms.deformNodes.value[i].copy(nodes[i]);
            }
        }
    });

    return (
        <mesh ref={planeRef} position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            {/* Hi-res plane to support vertex manipulation */}
            <planeGeometry args={[50, 50, 128, 128]} />
            <meshStandardMaterial 
                ref={materialRef}
                color="#040404" 
                roughness={0.9} 
                metalness={0.0}
                onBeforeCompile={onBeforeCompile}
            />
        </mesh>
    );
}
