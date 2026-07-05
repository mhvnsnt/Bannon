export class GroversSearch {
  /**
   * Simulates amplitude amplification to find a target hash in O(sqrt(N)) time.
   */
  static execute(memoryGraph: string[], targetHash: string): string {
    const N = memoryGraph.length;
    if (N === 0) return "";
    
    // The optimal number of iterations is roughly (pi/4) * sqrt(N)
    const iterations = Math.floor((Math.PI / 4) * Math.sqrt(N));
    
    // Initialize uniform superposition of all memory states
    let amplitudes = Array(N).fill(1 / Math.sqrt(N));

    for (let step = 0; step < iterations; step++) {
      // 1. Oracle Operator: Flip the sign of the target amplitude
      for (let i = 0; i < N; i++) {
        if (memoryGraph[i] === targetHash) {
          amplitudes[i] = -amplitudes[i];
        }
      }

      // 2. Diffusion Operator (Inversion about the mean)
      const mean = amplitudes.reduce((sum, val) => sum + val, 0) / N;
      for (let i = 0; i < N; i++) {
        amplitudes[i] = (2 * mean) - amplitudes[i];
      }
    }

    // Measure the state: The index with the highest amplitude is our target
    let maxAmp = -Infinity;
    let targetIndex = 0;
    for (let i = 0; i < N; i++) {
      if (amplitudes[i] > maxAmp) {
        maxAmp = amplitudes[i];
        targetIndex = i;
      }
    }

    console.log(`[GROVER] Memory retrieved in ${iterations} iterations instead of ${N}`);
    return memoryGraph[targetIndex];
  }
}
