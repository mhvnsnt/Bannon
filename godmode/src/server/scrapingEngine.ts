import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

puppeteer.use(StealthPlugin());

// Pinecone initialization must be guarded or mock for demo, but we'll try to use it if KEY exists
let pc: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
   pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
   // Use GenAI
   ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// High-leverage structured target arrays
const targetMatrices = [
  { name: 'Gov_Surplus_Bulk', url: 'https://gsaauctions.gov' }, // Adjust URL as necessary for mock
  { name: 'Distressed_Digital_Assets', url: 'https://expireddomains.net' },
  { name: 'Wholesale_Commodity_Logs', url: 'https://importinfo.com/latest' }
];

export async function runScrapeAndEmbedMatrix() {
  if (!pc || !ai) {
    console.log('[HARVESTING]: Mocking harvest run, credentials not injected.');
    return;
  }
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
  try {
    const page = await browser.newPage();

    // Residential Spoofing Injection and Master Key Isolation
    // 1. Force the page to block access to local storage/session storage to prevent scraping targets
    // from injecting trackers into your local node.
    // 2. We use a mocked randomized user agent via Stealth plugin.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.localStorage.clear();
        window.sessionStorage.clear();
    });

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });
    // Dynamically randomize user agent for each request if needed
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    const indexName = process.env.PINECONE_INDEX_NAME || 'default';
    const index = pc.index(indexName);

    // Ensure request interception is setup to block mixed resources that could link to the main server
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.isInterceptResolutionHandled()) return;
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort().catch(() => {});
        } else {
            req.continue().catch(() => {});
        }
    });

    for (const target of targetMatrices) {
      try {
        console.log(`[HARVESTING]: Querying ${target.name}...`);
        
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const pagePayload = await page.evaluate(() => document.body.innerText);
        const cleanText = pagePayload.replace(/\s+/g, ' ').trim().slice(0, 8000);

        // Convert unstructured scraped text into a 768-dimension vector array
        const embeddingResponse = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: cleanText || "no content"
        });

        const vectorCoordinates = embeddingResponse.embeddings?.[0]?.values || (embeddingResponse as any).embedding?.values || (embeddingResponse as any)?.values;
        if (!vectorCoordinates || vectorCoordinates.length === 0) {
           console.log("No vectors found", Object.keys(embeddingResponse));
           continue;
        }

        // Upsert into your Pinecone permanent memory vault
        const record = {
          id: `${target.name}_${Date.now()}`,
          values: Array.from(vectorCoordinates).slice(0, 768) as number[],
          metadata: { source: target.name, text: cleanText.slice(0, 1000), timestamp: new Date().toISOString() }
        };
        console.log("Upserting record:", Object.keys(record), "Values type:", typeof record.values, "Values array:", Array.isArray(record.values), "length:", record.values.length);
        
        try {
           await index.upsert([record]);
        } catch(e) {
           console.log("Error directly inside upsert", e);
           throw e;
        }

        console.log(`[MEMORY SECURED]: ${target.name} vectorized cleanly.`);
      } catch (err) {
        console.error(`[HARVESTING FAULT] on ${target.name}:`, err);
      }
    }
  } finally {
    await browser.close();
  }
}

const residentialHeaders = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
];

export async function fetchLiveMarketData(targetUrl: string) {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  // Rotate a random user-agent signature on every single request loop
  const randomUserAgent = residentialHeaders[Math.floor(Math.random() * residentialHeaders.length)];
  await page.setUserAgent(randomUserAgent);
  
  // Emulate standard device dimensions so the viewport doesn't signal a bot footprint
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Extract the raw text payloads from the target page
    const dataPayload = await page.evaluate(() => document.body.innerText);
    return dataPayload;
  } catch (err) {
    console.error(`[FETCH ERROR] Failed to hit target ${targetUrl}:`, err);
    return JSON.stringify([]); // return empty array structure for safety
  } finally {
    await browser.close();
  }
}

export class ScrapingEngine {
  static async harvest() {
     // Re-route to the new matrix logic
     await runScrapeAndEmbedMatrix();
     return [];
  }
}
