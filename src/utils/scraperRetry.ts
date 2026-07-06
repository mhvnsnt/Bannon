export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  factor: number;
  useJitter: boolean;
  retryOn429: boolean;
  retryOn5xx: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  factor: 2,
  useJitter: true,
  retryOn429: true,
  retryOn5xx: true
};

export interface ScraperMetric {
  timestamp: string;
  url: string;
  status: number;
  latencyMs: number;
  attempt: number;
  success: boolean;
}

// Global hook to broadcast logs to our virtual console log overlay
let onLogListener: ((log: { type: 'info' | 'warn' | 'error' | 'success' | 'reasoning'; text: string }) => void) | null = null;
let onMetricListener: ((latency: number, memoryMb: number) => void) | null = null;

export function registerScraperLogger(listener: typeof onLogListener) {
  onLogListener = listener;
}

export function registerMetricListener(listener: typeof onMetricListener) {
  onMetricListener = listener;
}

export function logScraperEngineMessage(text: string, type: 'info' | 'warn' | 'error' | 'success' | 'reasoning' = 'info') {
  if (onLogListener) {
    onLogListener({ type, text: `[ScraperEngine] ${text}` });
  }
}

function logToConsole(type: 'info' | 'warn' | 'error' | 'success' | 'reasoning', text: string) {
  logScraperEngineMessage(text, type);
  console.log(`[ScraperEngine] [${type.toUpperCase()}] ${text}`);
}

function updateMetrics(latency: number, memoryMb: number) {
  if (onMetricListener) {
    onMetricListener(latency, memoryMb);
  }
}

/**
 * Executes a simulated web scrape or HTTP request with exponential backoff retry.
 */
export async function fetchWithBackoff(
  url: string,
  fetchFn: () => Promise<{ status: number; text: string; data?: any }>,
  options: Partial<RetryOptions> = {}
): Promise<{ status: number; text: string; data?: any; attempts: number }> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  
  logToConsole('info', `Initiating request to ${url} with maximum ${opts.maxRetries} retries...`);

  while (attempt <= opts.maxRetries) {
    const startTime = performance.now();
    try {
      attempt++;
      logToConsole('info', `Attempt ${attempt}/${opts.maxRetries + 1} starting...`);
      
      const response = await fetchFn();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      // Simulate memory usage spike
      const mockMemory = Math.round(40 + Math.random() * 80 + (attempt * 15));
      updateMetrics(latency, mockMemory);

      logToConsole('success', `Completed request with status ${response.status} in ${latency}ms`);

      if (response.status === 200) {
        return { ...response, attempts: attempt };
      }

      const is429 = response.status === 429;
      const is5xx = response.status >= 500 && response.status < 600;
      const shouldRetry = (is429 && opts.retryOn429) || (is5xx && opts.retryOn5xx);

      if (shouldRetry && attempt <= opts.maxRetries) {
        let delay = opts.baseDelayMs * Math.pow(opts.factor, attempt - 1);
        if (opts.useJitter) {
          // Add 0-30% random jitter
          delay = delay * (1 + Math.random() * 0.3);
        }
        delay = Math.round(delay);
        
        logToConsole('warn', `Received status ${response.status}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (!shouldRetry) {
          logToConsole('error', `Status ${response.status} is non-retryable. Exiting.`);
        } else {
          logToConsole('error', `Maximum retry limit reached. Request failed.`);
        }
        return { ...response, attempts: attempt };
      }
    } catch (err: any) {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const mockMemory = Math.round(30 + Math.random() * 50);
      updateMetrics(latency, mockMemory);

      logToConsole('error', `Network error during attempt ${attempt}: ${err.message || err}`);
      
      if (attempt <= opts.maxRetries) {
        let delay = opts.baseDelayMs * Math.pow(opts.factor, attempt - 1);
        if (opts.useJitter) {
          delay = delay * (1 + Math.random() * 0.3);
        }
        delay = Math.round(delay);
        logToConsole('warn', `Retrying network failure in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logToConsole('error', `Maximum retry limit reached after network errors.`);
        throw err;
      }
    }
  }

  throw new Error('Scraper retry backoff exited unexpectedly without completing.');
}
