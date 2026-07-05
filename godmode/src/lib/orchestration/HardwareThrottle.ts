export class HardwareThrottle {
  private static queue: (() => Promise<any>)[] = [];
  private static activeRequests = 0;
  // Adjust based on your available VRAM (1 for strict sequential local inference)
  private static MAX_CONCURRENT_INFERENCE = 1; 

  /**
   * Enqueues an agent's inference request to protect the local GPU from crashing.
   */
  static async enqueueInference<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.activeRequests++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processNext();
        }
      };

      this.queue.push(execute);
      this.processNext();
    });
  }

  private static processNext() {
    if (this.activeRequests >= this.MAX_CONCURRENT_INFERENCE) return;
    const nextTask = this.queue.shift();
    if (nextTask) {
      nextTask();
    }
  }
}
