export class MutationEngine {
    private worker: Worker;
    
    constructor(private onMutationComplete: (status: string, code?: string, error?: string) => void) {
        this.worker = new Worker(new URL('../workers/mutation-worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (e) => {
            const data = e.data;
            if (data.status === 'MUTATED') {
                this.onMutationComplete(data.status, data.code);
            } else if (data.status === 'FAILED') {
                this.onMutationComplete(data.status, undefined, data.error);
            } else {
                this.onMutationComplete(data.status);
            }
        };
    }
    
    public ingest(sourceCode: string, optimizationTarget: string, errorContext?: any) {
        this.worker.postMessage({ sourceCode, optimizationTarget, errorContext });
    }
    
    public dispose() {
        this.worker.terminate();
    }
}
