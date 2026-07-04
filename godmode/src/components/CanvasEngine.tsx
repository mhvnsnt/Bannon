import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCoreBlueprint } from '../store/coreBlueprint';

export const STAGES = [
  {name:"NIGREDO",    sub:"THE BLACKENING",  fog:0.0019, gravity:-1.0, organize:0.00, glow:0.55,
   colA:0x3d0f1e, colB:0x180c24, accent:0x5e1d3a, bg:0x000000},
  {name:"ALBEDO",     sub:"THE WHITENING",   fog:0.0011, gravity:0.10, organize:0.34, glow:1.00,
   colA:0x9aa6ad, colB:0xe6edf2, accent:0xffffff, bg:0x05070b},
  {name:"CITRINITAS", sub:"THE YELLOWING",   fog:0.0008, gravity:0.30, organize:0.62, glow:1.15,
   colA:0xffc94a, colB:0xffe39a, accent:0xfff0b8, bg:0x0a0700},
  {name:"RUBEDO",     sub:"THE REDDENING",   fog:0.0006, gravity:0.55, organize:1.00, glow:1.4,
   colA:0xd11f2a, colB:0xffaa00, accent:0xffd24a, bg:0x0a0000}
];

export default function CanvasEngine() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Engine State
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    
    // Physics variables map
    let stageIndex = useCoreBlueprint.getState().stage;
    let currentStage = STAGES[stageIndex] || STAGES[0];

    const initEngine = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(currentStage.bg);
      scene.fog = new THREE.FogExp2(currentStage.bg, currentStage.fog);

      camera = new THREE.PerspectiveCamera(75, mountRef.current!.clientWidth / mountRef.current!.clientHeight, 0.1, 1000);
      camera.position.z = 50;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current!.appendChild(renderer.domElement);

      const light = new THREE.DirectionalLight(currentStage.accent, currentStage.glow);
      light.position.set(0, 10, 10);
      scene.add(light);
      scene.add(new THREE.AmbientLight(currentStage.colB, 0.5));

      // Just a placeholder particle system to represent the "Myth Engine"
      const geometry = new THREE.BufferGeometry();
      const count = 5000;
      const positions = new Float32Array(count * 3);
      for(let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ 
        color: currentStage.colA, 
        size: 0.5, 
        transparent: true,
        opacity: 0.8
      });
      const particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);
      
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        
        // Sync minimal stuff from global store if needed without React re-renders
        const state = useCoreBlueprint.getState();
        particleSystem.rotation.y += state.turb * 0.01;
        particleSystem.rotation.x += state.turb * 0.005;
        
        renderer.render(scene, camera);
      };
      animate();
    };

    initEngine();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Teardown Protocol
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (renderer && renderer.domElement && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      if (scene) {
        scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
      
      if (renderer) {
         renderer.dispose();
      }
    };
  }, []);

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        if (!evt.target?.result) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(evt.target.result.toString(), "image/svg+xml");
        const paths = Array.from(doc.querySelectorAll('path'));
        if(paths.length === 0) return;

        const svgContainer = document.createElement('div');
        svgContainer.style.display = 'none';
        document.body.appendChild(svgContainer);

        const pathData: any[] = [];
        let totalLen = 0;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        paths.forEach(function(p) {
            const clone = p.cloneNode() as SVGPathElement;
            const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgEl.appendChild(clone);
            svgContainer.appendChild(svgEl);
            
            const len = clone.getTotalLength();
            if(len > 0) {
                pathData.push({el: clone, len: len});
                totalLen += len;
            }
        });

        const customSigilPoints = [];
        const MAX = 5000;
        for(let i=0; i<MAX; i++) {
            const tLen = Math.random() * totalLen;
            let cur = 0, chosen = pathData[0];
            for(let j=0; j<pathData.length; j++) {
                cur += pathData[j].len;
                if(tLen <= cur) { chosen = pathData[j]; break; }
            }
            const pt = chosen.el.getPointAtLength(Math.random() * chosen.len);
            customSigilPoints.push({x: pt.x, y: -pt.y});
            
            if(pt.x < minX) minX = pt.x;
            if(pt.x > maxX) maxX = pt.x;
            if(-pt.y < minY) minY = -pt.y;
            if(-pt.y > maxY) maxY = -pt.y;
        }
        document.body.removeChild(svgContainer);

        const w = maxX - minX;
        const h = maxY - minY;
        const scaleFactor = 60 / Math.max(w, h);
        const cx = (maxX + minX) / 2;
        const cy = (maxY + minY) / 2;

        for(let i=0; i<MAX; i++) {
            customSigilPoints[i].x = (customSigilPoints[i].x - cx) * scaleFactor;
            customSigilPoints[i].y = (customSigilPoints[i].y - cy) * scaleFactor + 18;
        }

        useCoreBlueprint.getState().setCustomSigilPoints(customSigilPoints);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
         ref={mountRef} 
         style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} 
      />
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
         <label className="cursor-pointer bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-emerald-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors">
            INJECT SIGIL MATRIX (SVG)
            <input type="file" id="svg-upload" accept=".svg" onChange={handleSvgUpload} style={{ display: 'none' }} />
         </label>
      </div>
    </div>
  );
}
