import { GoogleGenAI as OriginalGoogleGenAI } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let globalBackoffUntil = 0;

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 10, delay = 2000): Promise<T> {
  if (Date.now() < globalBackoffUntil) {
    // If we have a short global backoff, wait for it or yield
    const msToWait = globalBackoffUntil - Date.now();
    if (msToWait > 0 && msToWait <= 10000) {
      await sleep(msToWait);
    } else {
      throw new Error(`[Gemini] Rate limit backoff active — pausing for ${Math.ceil(msToWait / 1000)}s`);
    }
  }

  try {
    return await fn();
  } catch (error: any) {
    if ((error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) && retries > 0) {
      let retryDelay = delay;
      // Try to extract retry delay from the error object if it exists
      try {
        const details = error.details || [];
        const retryInfo = details.find((d: any) => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          const delayStr = retryInfo.retryDelay; // format like "14s"
          if (typeof delayStr === 'string' && delayStr.endsWith('s')) {
            retryDelay = parseInt(delayStr) * 1000;
          } else if (typeof delayStr === 'number') {
            retryDelay = delayStr * 1000;
          }
          console.log(`[GoogleGenAI Proxy] Extracted retry delay from Google API error: ${retryDelay}ms`);
        }
      } catch (e) {
        console.warn(`[GoogleGenAI Proxy] Failed to extract retry delay from error`, e);
      }
      
      // Ensure we don't delay less than 2 seconds, but back off progressively with random jitter
      const jitter = Math.random() * 1000;
      retryDelay = Math.max(retryDelay, 2000) + jitter;

      if (retries <= 3) {
        // Only trigger a very short 4-second global pause if we are truly running out of retries
        globalBackoffUntil = Date.now() + 4000;
        console.error("[Gemini] Severe rate limits detected. Setting short global pause of 4 seconds.");
      }

      console.warn(`[GoogleGenAI Proxy] Rate limit hit (429/RESOURCE_EXHAUSTED), retrying in ${Math.round(retryDelay)}ms... (Retries left: ${retries})`);
      await sleep(retryDelay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export class GoogleGenAI extends OriginalGoogleGenAI {
  constructor(config: any) {
    super(config);
    if ((this as any).models) {
      const origGenerateContent = (this as any).models.generateContent.bind((this as any).models);
      (this as any).models.generateContent = async (params: any, ...args: any[]) => {
        if (params && params.model) {
          if (params.model === 'gemini-1.5-flash' || params.model === 'gemini-2.0-flash' || params.model === 'gemini-2.0-flash-thinking' || params.model === 'gemini-1.5-flash') {
            console.log(`[GoogleGenAI Proxy] Mapping model ${params.model} -> gemini-1.5-flash`);
            params.model = 'gemini-1.5-flash';
          } else if (params.model === 'gemini-1.5-pro' || params.model === 'gemini-2.0-pro' || params.model === 'gemini-pro-1.5' || params.pro === 'gemini-pro' || params.model === 'gemini-3.1-pro-preview') {
            console.log(`[GoogleGenAI Proxy] Mapping model ${params.model} -> gemini-3.1-pro-preview`);
            params.model = 'gemini-3.1-pro-preview';
          }
        }
        return retryWithBackoff(() => origGenerateContent(params, ...args));
      };

      const origGenerateContentStream = (this as any).models.generateContentStream.bind((this as any).models);
      (this as any).models.generateContentStream = async (params: any, ...args: any[]) => {
        if (params && params.model) {
          if (params.model === 'gemini-1.5-flash' || params.model === 'gemini-2.0-flash' || params.model === 'gemini-2.0-flash-thinking' || params.model === 'gemini-1.5-flash') {
            console.log(`[GoogleGenAI Proxy] Mapping stream model ${params.model} -> gemini-1.5-flash`);
            params.model = 'gemini-1.5-flash';
          } else if (params.model === 'gemini-1.5-pro' || params.model === 'gemini-2.0-pro' || params.model === 'gemini-pro-1.5' || params.pro === 'gemini-pro' || params.model === 'gemini-3.1-pro-preview') {
            console.log(`[GoogleGenAI Proxy] Mapping stream model ${params.model} -> gemini-3.1-pro-preview`);
            params.model = 'gemini-3.1-pro-preview';
          }
        }
        return retryWithBackoff(() => origGenerateContentStream(params, ...args));
      };
    }
  }
}
