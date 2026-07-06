// Hardware detection to check if WebGPU or sufficient capabilities exist for running local models
export const HardwareDetector = {
  async checkCapabilities(): Promise<{ canRunLocalModels: boolean; reason?: string; ram?: number; cores?: number; hasWebGPU: boolean }> {
    const hasWebGPU = 'gpu' in navigator;
    const cores = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 4; // Default to 4 if API not supported

    // WebLLM models require WebGPU and at least 8GB RAM (deviceMemory reports max 8 for privacy reasons)
    // for a smooth, non-crashing in-browser experience.
    if (!hasWebGPU) {
      return {
        canRunLocalModels: false,
        reason: 'WebGPU is not supported or disabled on your browser. WebGPU is required for high-speed local AI.',
        ram: memory,
        cores,
        hasWebGPU: false
      };
    }

    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        return {
          canRunLocalModels: false,
          reason: 'Failed to request WebGPU Adapter. WebGPU acceleration is unavailable.',
          ram: memory,
          cores,
          hasWebGPU: false
        };
      }
    } catch (e) {
      return {
        canRunLocalModels: false,
        reason: `WebGPU initialization failed: ${(e as Error).message}`,
        ram: memory,
        cores,
        hasWebGPU: false
      };
    }

    // Check RAM and CPU core counts
    if (memory < 8) {
      return {
        canRunLocalModels: false,
        reason: `Insufficient device memory (${memory}GB RAM detected, 8GB required) to load local model weights safely.`,
        ram: memory,
        cores,
        hasWebGPU: true
      };
    }

    if (cores < 4) {
      return {
        canRunLocalModels: false,
        reason: `Insufficient processing cores (${cores} CPU cores detected, 4+ required) for concurrent model execution.`,
        ram: memory,
        cores,
        hasWebGPU: true
      };
    }

    return {
      canRunLocalModels: true,
      reason: 'Sufficient WebGPU, CPU, and RAM capabilities detected.',
      ram: memory,
      cores,
      hasWebGPU: true
    };
  }
};

