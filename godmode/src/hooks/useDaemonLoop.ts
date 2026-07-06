import { useEffect, useRef } from 'react';
import { circuitBreaker } from '../lib/CircuitBreaker';
import { usePrimeStore } from '../lib/store';

// Isolated utility function to run heavy Evaluation Loops
// This prevents main thread blocking
export function runHeavyDaemonEvaluation(): Promise<{ time: number, predictiveInsight?: string }> {
    return new Promise((resolve) => {
        const start = performance.now();
        const simulatedLoad = Math.random() > 0.8 ? 200 : 20; 
        
        setTimeout(() => {
            const end = performance.now();
            let predictiveInsight: string | undefined = undefined;
            if (Math.random() > 0.8) {
                const insights = [
                    "MYTHOS_5 TRACE: Identified structural redundancy in the asset flow grid.",
                    "MYTHOS_CLASS: Predicting need for 4D Tempus synchronization within 2 cycles.",
                    "FABLE_5 HEURISTIC: Code migration potential identified. Ruby codebase translation vectors ready.",
                    "CLAUDE_MYTHOS: Predictive scientific alignment verified. Novel hypothesis cached.",
                    "DAEMON FORECAST: Cyber safeguards hold. Agentic scaling verified."
                ];
                predictiveInsight = insights[Math.floor(Math.random() * insights.length)];
            }
            resolve({ time: end - start, predictiveInsight });
        }, simulatedLoad);
    });
}

export function useDaemonLoop() {
    const loopActive = useRef(false);
    
    // We will read setDaemonInsight from store inside the effect cleanly 
    // to avoid hook dependency bloat if possible, or just call getState().

    useEffect(() => {
        const executionThreshold = 300; 
        
        const loopInterval = setInterval(async () => {
            if (loopActive.current) return;
            loopActive.current = true;

            try {
                const executionPromise = runHeavyDaemonEvaluation();
                
                const timeoutPromise = new Promise<{time: number, predictiveInsight?: string}>((_, reject) => 
                    setTimeout(() => reject(new Error("EXECUTION TIMEOUT: Daemon Threshold 300ms Exceeded")), executionThreshold)
                );

                const { time, predictiveInsight } = await Promise.race([executionPromise, timeoutPromise]);
                if (predictiveInsight) {
                    usePrimeStore.getState().setDaemonInsight(predictiveInsight);
                    setTimeout(() => usePrimeStore.getState().setDaemonInsight(null), 8000);
                }
            } catch (err: any) {
                console.warn(`[FATAL] ${err.message}. Triggering loop break and queueing to next cycle...`);
                await circuitBreaker.forceBreak();
            } finally {
                loopActive.current = false;
            }

        }, 4000);

        return () => clearInterval(loopInterval);
    }, []);
}
