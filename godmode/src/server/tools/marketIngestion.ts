import axios from 'axios';

interface MarketSpread {
  ticker: string;
  polymarketPrice: number;
  kalshiPrice: number;
  spread: number;
}

export class MarketIngestionEngine {
  private polyEndpoint = 'https://gamma-api.polymarket.com/events';
  private kalshiEndpoint = 'https://external-api.kalshi.com/trade-api/v2/markets';

  /**
   * Fetches live market data directly from official, open developer endpoints.
   * This uses standard network protocols without any browser simulation.
   */
  public async fetchDataStreams(): Promise<MarketSpread[]> {
    console.log('[INGESTION]: Querying official developer endpoints...');
    const discoveredSpreads: MarketSpread[] = [];

    try {
      // 1. Standard GET request to Polymarket's public data layer
      const polyResponse = await axios.get(this.polyEndpoint, {
        headers: { 'Accept': 'application/json' }
      });

      // 2. Standard GET request to Kalshi's public market catalog
      const kalshiResponse = await axios.get(this.kalshiEndpoint, {
        headers: { 'Accept': 'application/json' }
      });

      const polyEvents = polyResponse.data || [];
      const kalshiMarkets = kalshiResponse.data?.markets || [];

      // 3. Process the raw JSON matrices natively
      for (const pEvent of polyEvents) {
        if (!pEvent.title || !pEvent.markets?.[0]) continue;

        // Clean string comparison to match assets across platforms
        const targetTicker = pEvent.title.split(' ')[0].toUpperCase();
        
        const kMatch = kalshiMarkets.find((k: any) => 
          k.ticker?.toUpperCase().includes(targetTicker) || 
          k.title?.toUpperCase().includes(targetTicker)
        );

        if (kMatch) {
          const pPrice = parseFloat(pEvent.markets[0].outcomePrices?.[0] || '0');
          const kPrice = (kMatch.yes_ask || 0) / 100; // Convert cents to standard decimals

          discoveredSpreads.push({
            ticker: pEvent.title,
            polymarketPrice: pPrice,
            kalshiPrice: kPrice,
            spread: Math.abs(pPrice - kPrice)
          });
        }
      }

      return discoveredSpreads;
    } catch (error: any) {
      console.error('[INGESTION ERROR]: Stream connection failed', error.message);
      return [];
    }
  }
}
