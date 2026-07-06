import * as THREE from 'three';

export class DOMPhysicsEngine {
    private static raycaster = new THREE.Raycaster();
    private static mouse = new THREE.Vector2();

    /**
     * Translates a DOM element's 2D screen coordinates into 3D world space
     */
    public static getDOMElement3DPos(elementId: string, camera: THREE.PerspectiveCamera, zDepth: number = 0): THREE.Vector3 | null {
        const el = document.getElementById(elementId);
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        // Calculate center of the DOM element in normalized device coordinates (NDC)
        const x = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
        const y = -((rect.top + rect.height / 2) / window.innerHeight) * 2 + 1;

        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(camera);

        const dir = vector.sub(camera.position).normalize();
        const distance = (zDepth - camera.position.z) / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        return pos;
    }

    /**
     * Mascot Interaction: "Grabbing" an element
     * Triggers a CSS transform on the target DOM element while the Mascot's IK hand targets its 3D position
     */
    public static mascotGrabDOM(elementId: string, isGrabbing: boolean) {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (isGrabbing) {
            el.style.transform = 'scale(1.05) translateY(-5px) rotateZ(1deg)';
            el.style.boxShadow = '0 10px 25px rgba(241, 91, 181, 0.5)';
            el.style.border = '2px solid #F15BB5';
            el.style.zIndex = '50';
        } else {
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
            el.style.border = 'none';
            el.style.zIndex = 'auto';
        }
    }
}
