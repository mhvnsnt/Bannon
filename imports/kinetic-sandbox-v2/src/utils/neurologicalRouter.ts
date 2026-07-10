import * as THREE from 'three';
import { usePhysicsStore } from '../store/physicsStore';

interface NerveSignal {
    type: 'NOCICEPTIVE' | 'PROPRIOCEPTIVE' | 'THERMAL' | 'EROGENOUS';
    intensity: number;
    origin: THREE.Vector3;
    timestamp: number;
    delayMs: number;
    processed: boolean;
}

class NeurologicalRouter {
    private signals: NerveSignal[] = [];
    private readonly SIGNAL_SPEED = 50.0; // m/s, approximate C-fiber/A-delta fiber average
    public CNS_ORIGIN = new THREE.Vector3(0, 1.6, 0); // Head/Brain location

    public sendSignal(type: NerveSignal['type'], intensity: number, worldPos: THREE.Vector3) {
        const dist = worldPos.distanceTo(this.CNS_ORIGIN);
        // Delay in ms = (Distance / Speed) * 1000
        const delayMs = (dist / this.SIGNAL_SPEED) * 1000.0;

        this.signals.push({
            type,
            intensity,
            origin: worldPos.clone(),
            timestamp: performance.now(),
            delayMs,
            processed: false
        });
    }

    public processNerveQueue() {
        const now = performance.now();
        let painSum = 0;
        let pleasureSum = 0;

        this.signals = this.signals.filter(sig => {
            if (!sig.processed && now - sig.timestamp >= sig.delayMs) {
                sig.processed = true;
                // Deliver to CNS
                if (sig.type === 'NOCICEPTIVE') {
                    painSum += sig.intensity;
                }
                if (sig.type === 'EROGENOUS') {
                    pleasureSum += sig.intensity;
                }
                return false; // Remove
            }
            return true; // Keep pending
        });

        // Trigger autonomous responses physically
        if (painSum > 0) {
             const state = usePhysicsStore.getState();
             state.setTissueTrauma(Math.min(1.0, state.tissueTrauma + painSum * 0.05));
             state.setCurrentStrain(Math.min(1.0, state.currentStrain + painSum * 0.1));
        }
    }
}

export const neuroRouter = new NeurologicalRouter();
