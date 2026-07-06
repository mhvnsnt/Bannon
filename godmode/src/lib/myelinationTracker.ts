export interface PathwayState {
    executions: number;
    tensileStrength: number;
    latencyMs: number;
}

class MyelinationRegistry {
    private static instance: MyelinationRegistry;
    private network: Map<string, PathwayState>;

    private constructor() {
        this.network = new Map();
    }

    public static get(): MyelinationRegistry {
        if (!MyelinationRegistry.instance) {
            MyelinationRegistry.instance = new MyelinationRegistry();
        }
        return MyelinationRegistry.instance;
    }

    public registerExecution(intent: string) {
        if (!this.network.has(intent)) {
            this.network.set(intent, {
                executions: 1,
                tensileStrength: 10,  // Base starting capacity
                latencyMs: 15.0       // Unmyelinated slow signal (ms)
            });
            console.log(`[MYELIN] New pathway forged: ${intent}`);
        } else {
            const state = this.network.get(intent)!;
            
            // As executions increase, latency exponentially decays towards zero,
            // and tensile strength linearly scales up.
            state.executions += 1;
            state.tensileStrength += 5.0; 
            state.latencyMs = state.latencyMs * 0.85; // Faster conduction

            console.log(`[MYELIN] Pathway optimized: ${intent}. Tensile: ${state.tensileStrength}, Latency: ${state.latencyMs.toFixed(2)}ms`);
            this.network.set(intent, state);
        }
    }
}

export const trackMyelination = (command: string) => {
    MyelinationRegistry.get().registerExecution(command);
};
