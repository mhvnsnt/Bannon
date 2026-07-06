// @ts-nocheck
import React, { useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';

// Blast Shield implementation
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class SandboxErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false, error: null };
    constructor(props: {children: ReactNode}) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Blast Shield Activated. Code entropy caught:", error, errorInfo);
        // Here we could hypothetically stream back to the AI loop.
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ width: '100%', height: '400px', border: '1px solid #ff0033', borderRadius: '8px', padding: '16px', marginTop: '15px', backgroundColor: '#330000', color: '#ffaaaa', fontFamily: 'monospace' }}>
                    <h3>⚠️ BLAST SHIELD ACTIVATED</h3>
                    <p>Execution halted to prevent system crash.</p>
                    <pre style={{ overflowX: 'auto', fontSize: '12px' }}>{this.state.error?.toString()}</pre>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null })} 
                        style={{marginTop: '10px', padding: '8px 16px', background: '#ff0033', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                    >
                        REINITIALIZE
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function SpatialSandbox({ codePayload }: { codePayload: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!iframeRef.current) return;

        // The absolute injection template that bridges graphics and physics
        const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; overflow: hidden; background-color: #0a0a0a; }
                    canvas { display: block; }
                </style>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
            </head>
            <body>
                <script>
                    // 1. Initialize Three js Visual World
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    document.body.appendChild(renderer.domElement);

                    // Add lights and grid for visibility
                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                    scene.add(ambientLight);
                    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    dirLight.position.set(5, 10, 5);
                    scene.add(dirLight);
                    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
                    scene.add(gridHelper);
                    camera.position.set(0, 3, 5);
                    camera.lookAt(0, 1, 0);

                    // 2. Initialize Cannon js Physics World
                    const world = new CANNON.World();
                    world.gravity.set(0, -9.82, 0);
                    
                    // Arrays to sync physics bodies to visual meshes
                    const syncPairs = [];

                    // 3. Inject the God Mode OS generated code here
                    try {
                        ${codePayload}
                        
                        // Autonomous Visual Sync mapping Cannon bodies to Three meshes
                        world.bodies.forEach(body => {
                            if (body.shape instanceof CANNON.Box) {
                                const geometry = new THREE.BoxGeometry(
                                    body.shape.halfExtents.x * 2,
                                    body.shape.halfExtents.y * 2,
                                    body.shape.halfExtents.z * 2
                                );
                                const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, wireframe: true });
                                const mesh = new THREE.Mesh(geometry, material);
                                scene.add(mesh);
                                syncPairs.push({ mesh, body });
                            }
                        });
                    } catch (err) {
                        console.error("Execution Entropy Detected: ", err);
                    }

                    // 4. The Kinetic Render Loop
                    const timeStep = 1 / 60;
                    function animate() {
                        requestAnimationFrame(animate);
                        world.step(timeStep);
                        
                        // Sync graphics to physics
                        syncPairs.forEach(pair => {
                            pair.mesh.position.copy(pair.body.position);
                            pair.mesh.quaternion.copy(pair.body.quaternion);
                        });
                        
                        renderer.render(scene, camera);
                    }
                    animate();
                </script>
            </body>
            </html>
        `;

        iframeRef.current.srcdoc = htmlTemplate;
    }, [codePayload]);

    return (
        <div style={{ width: '100%', height: '400px', border: '1px solid #00ffcc', borderRadius: '8px', overflow: 'hidden', marginTop: '15px', position: 'relative', zIndex: 10 }}>
            <iframe 
                ref={iframeRef} 
                title="Spatial Sandbox"
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none',
                    pointerEvents: 'auto',
                    touchAction: 'none'
                }}
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            />
        </div>
    );
}
