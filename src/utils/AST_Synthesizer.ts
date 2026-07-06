import * as THREE from 'three';

export class AST_Synthesizer {
    private scene: THREE.Scene;
    private instancedMesh: THREE.InstancedMesh | null = null;
    private worker: Worker;
    private geometry: THREE.BoxGeometry;
    private material: THREE.MeshBasicMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.worker = new Worker(new URL('../workers/ast-worker.ts', import.meta.url), { type: 'module' });
        
        const maxNodes = 5000;
        this.geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.material = new THREE.MeshBasicMaterial({ color: 0x2EC4B6, wireframe: true });
        
        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, maxNodes);
        this.instancedMesh.position.set(-10, 5, -10); 
        this.scene.add(this.instancedMesh);

        this.worker.onmessage = (e) => {
            if (e.data.status === 'success') {
                this.renderAST(e.data.nodes);
            }
        };
    }

    public updateFromCode(code: string) {
        this.worker.postMessage(code);
    }

    private renderAST(nodes: any[]) {
        if (!this.instancedMesh) return;

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        let i = 0;

        this.instancedMesh.count = Math.min(nodes.length, 5000);

        nodes.slice(0, 5000).forEach((node) => {
            if (node.meshType === 'enclosure') {
                matrix.makeScale(4, 1, 4);
                position.set(0, node.depth, 0);
                this.instancedMesh!.setColorAt(i, new THREE.Color(0xFFB703)); // Yellow for functions
            } else if (node.meshType === 'loop') {
                matrix.makeScale(2, 1, 2);
                position.set(-3, node.depth, 0);
                this.instancedMesh!.setColorAt(i, new THREE.Color(0xF15BB5)); // Pink for loops
            } else if (node.meshType === 'branch') {
                matrix.makeScale(1, 1, 1);
                position.set(Math.random() > 0.5 ? 2 : -2, node.depth, 0);
                this.instancedMesh!.setColorAt(i, new THREE.Color(0x00F5D4)); // Cyan for branches
            } else if (node.meshType === 'variable') {
                matrix.makeScale(0.2, 0.2, 0.2);
                position.set(Math.random() * 2 - 1, node.depth, Math.random() * 2 - 1);
                this.instancedMesh!.setColorAt(i, new THREE.Color(0x8338EC)); // Purple for vars
            } else {
                matrix.makeScale(0.1, 0.1, 0.1);
                position.set(0, node.depth, 0);
                this.instancedMesh!.setColorAt(i, new THREE.Color(0xFFFFFF)); // White for general
            }

            matrix.setPosition(position);
            this.instancedMesh!.setMatrixAt(i, matrix);
            i++;
        });

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
             this.instancedMesh.instanceColor.needsUpdate = true;
        }
    }

    public clear() {
        if (this.instancedMesh) {
            this.instancedMesh.count = 0;
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }

    public dispose() {
        this.worker.terminate();
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh);
            this.instancedMesh.dispose();
        }
        this.geometry.dispose();
        this.material.dispose();
    }
}
