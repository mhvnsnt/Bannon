import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhysicsStore } from '../store/physicsStore';

export const HardCylinder = forwardRef<THREE.Group>((props, ref) => {
  const localRef = useRef<THREE.Group>(null);
  const { viewport, camera, pointer, gl } = useThree();
  const cylinderRadius = usePhysicsStore(s => s.cylinderRadius);
  const setIsDragging = usePhysicsStore(s => s.setIsDragging);
  const registerCylinderRef = usePhysicsStore(s => s.registerCylinderRef);
  const unregisterCylinderRef = usePhysicsStore(s => s.unregisterCylinderRef);
  
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const raycaster = new THREE.Raycaster();
  const targetPos = useRef(new THREE.Vector3(0, 4, 0));
  const targetQuat = useRef(new THREE.Quaternion());
  
  // Mobile VR VR touch tracking state
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastAngle = useRef<number | null>(null);

  useEffect(() => {
    if (localRef.current) {
        registerCylinderRef(localRef.current);
    }
    return () => {
        if (localRef.current) unregisterCylinderRef(localRef.current);
    };
  }, [registerCylinderRef, unregisterCylinderRef]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'grab' : 'crosshair';
    if (active) document.body.style.cursor = 'grabbing';
  }, [hovered, active]);

  useEffect(() => {
    setIsDragging(active);
  }, [active, setIsDragging]);

  // Touch Handlers for Multi-touch VR rotation
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Multi-Touch logic for Quaternion Rotation
      if (pointers.current.size === 2 && active) {
        const pts = Array.from(pointers.current.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const currentAngle = Math.atan2(dy, dx);

        if (lastAngle.current !== null) {
          const deltaAngle = currentAngle - lastAngle.current;
          
          // Vector to rotate around (Camera view axis)
          const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          
          // Apply Delta angle to quaternion VR twist
          const twist = new THREE.Quaternion().setFromAxisAngle(camForward, -deltaAngle * 1.5);
          targetQuat.current.premultiply(twist);
        }
        lastAngle.current = currentAngle;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) {
        lastAngle.current = null; // Reset twist anchor when a finger lifts
      }
    };

    const domElement = gl.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointercancel', handlePointerUp);
    domElement.addEventListener('pointerleave', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointercancel', handlePointerUp);
      domElement.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [active, camera.quaternion, gl.domElement]);

  useFrame((state, delta) => {
    if (active) {
      if (pointers.current.size < 2) {
        // Single touch: Translate
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(dragPlane, targetPos.current);
      } else {
        // 2-touches: keep same target pos just rotate (handled in pointermove)
      }
      if (localRef.current) {
          localRef.current.userData.velocity = new THREE.Vector3();
      }
    } else {
        // Apply Physics
        if (localRef.current) {
            if (!localRef.current.userData.velocity) localRef.current.userData.velocity = new THREE.Vector3();
            const vel = localRef.current.userData.velocity as THREE.Vector3;
            vel.y -= 9.81 * delta; // Gravity
            
            // Apply Velocity to target
            targetPos.current.x += vel.x * delta;
            targetPos.current.y += vel.y * delta;
            targetPos.current.z += vel.z * delta;
            
            // Floor Collision
            const halfLength = 2.0;
            const floorLimit = -1.0 + halfLength; // Floor is at y=-1, cylinder is 4 units long so center is 2
            
            if (targetPos.current.y < floorLimit) {
                targetPos.current.y = floorLimit;
                vel.y *= -0.4; // Bounce
                vel.x *= 0.8; // Friction
                vel.z *= 0.8; 
            }
        }
    }
    
    if (localRef.current) {
      localRef.current.position.lerp(targetPos.current, 0.4);
      localRef.current.quaternion.slerp(targetQuat.current, 0.2);
    }
    
    if (ref && typeof ref !== 'function' && ref.current !== undefined) {
      (ref as React.MutableRefObject<THREE.Group>).current = localRef.current!;
    }
  });

  return (
    <group 
      ref={localRef} 
      position={[0, 4, 0]}
      userData={{ isCylinder: true }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
        setActive(true);
        if (localRef.current) {
           dragPlane.setFromNormalAndCoplanarPoint(
             new THREE.Vector3(0, 0, 1), 
             localRef.current.position
           );
        }
      }}
      onPointerUp={() => setActive(false)}
      onPointerMissed={() => setActive(false)}
    >
      {/* Visual Cylinder */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[cylinderRadius, cylinderRadius, 4, 32]} />
        <meshStandardMaterial 
          color={active ? "#00ffff" : "#333333"} 
          metalness={0.8}
          roughness={0.2}
          emissive={active ? new THREE.Color("#00ffff") : new THREE.Color(0x000000)}
          emissiveIntensity={active ? 0.2 : 0}
        />
      </mesh>
      
      {/* End caps / handle indicators */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[cylinderRadius, 32, 16]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -2, 0]} castShadow>
        <sphereGeometry args={[cylinderRadius, 32, 16]} />
        <meshStandardMaterial color={active ? "#00ffff" : "#222"} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
});
