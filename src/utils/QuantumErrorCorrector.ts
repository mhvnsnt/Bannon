import { RetryOptions, logScraperEngineMessage } from './scraperRetry';

export interface QuantumErrorSnapshot {
  timestamp: number;
  errorMsg: string;
  suggestedAction: string;
}

const failureHistory: QuantumErrorSnapshot[] = [];

export function applyQuantumErrorCorrection(
  errorMsg: string,
  currentOptions: RetryOptions,
  setRetryOptions: (options: RetryOptions) => void
): { success: boolean; correctedOptions: RetryOptions; explanation: string } {
  const lowercaseError = errorMsg.toLowerCase();
  let explanation = '';
  const correctedOptions = { ...currentOptions };

  // Heuristic analysis of failure modes
  if (lowercaseError.includes('limit') || lowercaseError.includes('token') || lowercaseError.includes('overflow')) {
    // Context limit signature
    correctedOptions.factor = Math.min(5, currentOptions.factor + 0.5);
    correctedOptions.baseDelayMs = Math.min(10000, currentOptions.baseDelayMs + 1000);
    correctedOptions.maxRetries = Math.min(10, currentOptions.maxRetries + 1);
    explanation = 'Detected potential Context Window / Token Limit congestion. Applying backoff decompression (increasing backoff factor and delay to stabilize state).';
  } else if (lowercaseError.includes('timeout') || lowercaseError.includes('delay') || lowercaseError.includes('network')) {
    // Network latency / timeout signature
    correctedOptions.baseDelayMs = Math.min(15000, currentOptions.baseDelayMs + 2000);
    correctedOptions.maxRetries = Math.min(12, currentOptions.maxRetries + 2);
    explanation = 'Detected Network Quantum Decoherence (Timeout/Latency). Stretching initial delay and elevating max retries to ensure eventual state convergence.';
  } else {
    // General logical execution failure
    correctedOptions.factor = Math.min(4, currentOptions.factor + 0.2);
    correctedOptions.maxRetries = Math.min(8, currentOptions.maxRetries + 1);
    explanation = 'Detected general logical state collapse. Initiating heuristic subtask re-entanglement by tweaking exponential scaling factors.';
  }

  // Save to history
  failureHistory.push({
    timestamp: Date.now(),
    errorMsg,
    suggestedAction: explanation
  });

  // Apply state update
  setRetryOptions(correctedOptions);

  // Log directly to ScraperEngine virtual console overlay
  logScraperEngineMessage(`⚡ [QuantumErrorCorrector] Failure analyzed: "${errorMsg}"`, 'warn');
  logScraperEngineMessage(`🛡️ [QuantumErrorCorrector] Applying re-entanglement protocol: ${explanation}`, 'success');
  logScraperEngineMessage(`⚙️ [QuantumErrorCorrector] Adjusted params -> Max Retries: ${correctedOptions.maxRetries}, Delay: ${correctedOptions.baseDelayMs}ms, Factor: ${correctedOptions.factor}`, 'info');

  return {
    success: true,
    correctedOptions,
    explanation
  };
}

export function getQuantumErrorHistory(): QuantumErrorSnapshot[] {
  return failureHistory;
}
