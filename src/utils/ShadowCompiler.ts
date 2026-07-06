export class ShadowCompiler {
    private worker: Worker;
    private timer: ReturnType<typeof setTimeout> | null = null;
    
    constructor(private onTelemetry: (status: string, details?: any) => void) {
        this.worker = new Worker(new URL('../workers/shadow-worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (e) => {
            if (e.data.status === 'error') {
                this.onTelemetry('CRITICAL', e.data.error);
                window.dispatchEvent(new CustomEvent('wasm-crash'));
            } else {
                this.onTelemetry('STABLE');
            }
        };
    }
    
    public ingest(code: string) {
        if (this.timer) clearTimeout(this.timer);
        
        this.timer = setTimeout(() => {
            this.worker.postMessage(code);
        }, 1200); // 1200ms debounce
    }
    
    public dispose() {
        if (this.timer) clearTimeout(this.timer);
        this.worker.terminate();
    }
}
