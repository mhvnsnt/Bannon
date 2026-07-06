self.onmessage = function(e) {
    const code = e.data;
    
    const startTime = performance.now();
    try {
        // Construct a sterile environment
        // Mock DOM for execution testing
        const sandboxEnv = `
            const window = {};
            const document = { createElement: () => ({}), querySelector: () => null };
            const console = { log: () => {}, error: () => {}, warn: () => {} };
            ${code}
        `;
        
        // Use Function constructor for isolated execution
        const executor = new Function(sandboxEnv);
        executor();
        
        const executionTime = performance.now() - startTime;
        self.postMessage({ status: 'success', time: executionTime });
    } catch (err: any) {
        const executionTime = performance.now() - startTime;
        self.postMessage({ status: 'error', error: err.message, time: executionTime });
    }
};
