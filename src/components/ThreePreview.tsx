import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreePreview() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Placeholder Character (A basic group representing a humanoid)
    const character = new THREE.Group();

    const torsoGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.5, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4, metalness: 0.1 });
    const torso = new THREE.Mesh(torsoGeo, material);
    torso.position.y = 1.5;
    character.add(torso);

    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdcb1, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.6;
    character.add(head);

    scene.add(character);

    // Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      character.rotation.y += 0.01; // Slow rotation
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }} />;
}
