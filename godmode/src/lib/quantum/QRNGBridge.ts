export class QRNGBridge {
  /**
   * Fetches true quantum random numbers from the ANU Quantum Numbers API.
   * If the API fails, falls back to secure crypto randomness to avoid blocking.
   */
  static async getTrueEntropy(length: number = 1): Promise<number[]> {
    try {
      const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.data) {
           console.log(`[QRNG] Successfully retrieved ${length} bytes of true vacuum entropy.`);
           return data.data;
        }
      }
    } catch (e) {
      console.warn("[QRNG] ANU QRNG API unavailable. Falling back to crypto pseudo-randomness.");
    }
    
    // Fallback
    const fallback = new Uint8Array(length);
    crypto.getRandomValues(fallback);
    return Array.from(fallback);
  }
}
