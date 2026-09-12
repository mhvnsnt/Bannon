import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, Environment, ContactShadows, Float, MeshDistortMaterial, 
  Edges, TransformControls, GizmoHelper, GizmoViewport, Grid
} from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  isGenerating: boolean;
  isComplete: boolean;
  isWireframe: boolean;
  cameraAngle: string;
  transformMode?: 'translate' | 'rotate' | 'scale';
}

const ProceduralMesh = ({ isWireframe, isComplete, transformMode = 'translate' }: { isWireframe: boolean; isComplete: boolean; transformMode?: 'translate' | 'rotate' | 'scale' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (!isComplete) {
        meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      }
    }
  });

  return (
    <>
      {isComplete && active && (
        <TransformControls object={meshRef} mode={transformMode} />
      )}
      <Float speed={isComplete ? 0 : 2} rotationIntensity={isComplete ? 0 : 0.5} floatIntensity={isComplete ? 0 : 1}>
        <mesh 
          ref={meshRef} 
          castShadow 
          receiveShadow 
          onClick={() => isComplete && setActive(!active)}
          onPointerOver={() => {
            if (isComplete) document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            if (isComplete) document.body.style.cursor = 'auto';
          }}
        >
          <torusKnotGeometry args={[1, 0.3, 200, 32]} />
          {isComplete ? (
            <meshStandardMaterial 
              color={active ? "#0ea5e9" : "#06b6d4"} 
              roughness={0.2} 
              metalness={0.7} 
              wireframe={isWireframe}
              envMapIntensity={2}
            />
          ) : (
            <MeshDistortMaterial 
              ref={materialRef}
              color="#f43f5e" 
              roughness={0.4} 
              metalness={0.5}
              distort={0.6}
              speed={4}
              wireframe={isWireframe}
            />
          )}
          {isWireframe && !isComplete && (
            <Edges scale={1.1} threshold={15} color="cyan" />
          )}
          {active && isComplete && (
            <Edges scale={1.02} threshold={15} color="#38bdf8" />
          )}
        </mesh>
      </Float>
    </>
  );
};

const SetupCamera = ({ cameraAngle }: { cameraAngle: string }) => {
  useFrame(({ camera }) => {
    const target = new THREE.Vector3();
    if (cameraAngle === 'Top-Down') target.set(0, 8, 0);
    else if (cameraAngle === 'Front-View') target.set(0, 0, 8);
    else if (cameraAngle === 'Side-Profile') target.set(8, 0, 0);
    else if (cameraAngle === 'Isometric') target.set(5, 5, 5);
    else return; // Don't snap if free cam, let user orbit

    camera.position.lerp(target, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

export default function ModelViewer({ isGenerating, isComplete, isWireframe, cameraAngle, transformMode = 'translate' }: ModelViewerProps) {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas shadows camera={{ position: [0, 3, 6], fov: 45 }}>
        <color attach="background" args={['#09090b']} />
        
        {/* Advanced Grid from Drei */}
        <Grid 
          renderOrder={-1}
          position={[0, -2, 0]} 
          infiniteGrid 
          fadeDistance={30}
          cellSize={1} 
          sectionSize={5} 
          cellColor="#27272a" 
          sectionColor="#3f3f46" 
        />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Environment */}
        <Environment preset="city" />
        <ContactShadows position={[0, -1.99, 0]} opacity={0.5} scale={20} blur={1.5} far={4} />

        <SetupCamera cameraAngle={cameraAngle} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} enablePan={true} />

        {/* 3D Gizmo from Drei */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="white" />
        </GizmoHelper>

        {/* Model */}
        {(isComplete || isGenerating) && (
          <ProceduralMesh isWireframe={isWireframe} isComplete={isComplete} transformMode={transformMode} />
        )}
      </Canvas>
    </div>
  );
}
