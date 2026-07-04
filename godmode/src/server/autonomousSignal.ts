import { WebSocketServer, WebSocket } from 'ws';
import { ScrapingEngine, runScrapeAndEmbedMatrix, fetchLiveMarketData } from './scrapingEngine';
import { auditMarketAsymmetry } from './marginOptimizer';
import { analyzeMarketAsymmetry } from './intelligence/marketAnalyzer';
import { sendPushAlert } from './notifications/pushService';
import { processSystemSelfEvolution } from './evolutionEngine';
import { runPredictModeEngine } from './predictMode';
import cron from 'node-cron';
import { logSecurityEvent } from './securityVaultManager';
import { harvestAcademicAsymmetry } from './intelligenceNexus';
import { scanPredictionSpreads, scanDFSArbitrage } from './predictionMarkets';
import { executeArbitrageAutopsy } from './RSI/rsiEngine';
import { masterAgentOrchestrator } from './agents/orchestrator';

// The Autonomous Engine Cycle — runs 24/7 independently
export async function startAutonomousBrainLoop(wss: WebSocketServer) {
  // Push an initial deployment message to confirm everything works
  await sendPushAlert(`🚨 <b>[GOD MODE OS - DEPLOYED]</b> 🚨\n\nNeural Bridge Online. Market Swarm Initializing.`);
  logSecurityEvent('AUTONOMOUS SWARM ONLINE', 'Neural bridge initialized. Market swarm standing by.', '0.0.0.0', 'SECURE');

  // Triggered continually in short intervals
  const runRapidMarketSweep = async () => {
    try {
        console.log('[AUTONOMOUS RUN]: Rapid Swarm awakening (DFS & Prediction Arbitrage)...');
        await scanPredictionSpreads();
        await scanDFSArbitrage();
        
        // Feed into the Orchestrator
        await masterAgentOrchestrator({ type: 'market_data', payload: { timestamp: Date.now() }});
        
        // Run RSI validation autopsy asynchronously
        setTimeout(() => executeArbitrageAutopsy(), 10000); // 10 seconds later
    } catch (e: any) {
        console.error("Rapid sweep fault:", e);
    }
  };

  const runSweep = async () => {
    try {
      console.log('[AUTONOMOUS RUN]: Swarm awakening to analyze market spreads and harvest nexus data...');
      logSecurityEvent('MARKET SWEEP INITIATED', 'Swarm activating to probe global targets.', '0.0.0.0', 'MONITORED');
      
      try {
        // Run deep intelligence nexus harvest (arXiv, pubMed representations)
        await harvestAcademicAsymmetry();
      } catch (err: any) {
        console.error('[NEXUS FAULT]', err?.message);
        logSecurityEvent('INTELLIGENCE NEXUS ERROR', `Harvest failed: ${err?.message || err}`, '0.0.0.0', 'ERROR');
      }

      try {
        // Fetch live payloads from your chosen target platforms
        const platformAData = await fetchLiveMarketData('https://google.com'); // Mocking with a neutral site
        const platformBData = await fetchLiveMarketData('https://example.com'); // Mocking with a neutral site
        
        let parsedA = [];
        let parsedB = [];
        try { parsedA = JSON.parse(platformAData); } catch(e) {}
        try { parsedB = JSON.parse(platformBData); } catch(e) {}

        await auditMarketAsymmetry(parsedA, parsedB);
      } catch (error: any) {
        console.error('[SWARM EXCEPTION]: Core loop tracking failure', error);
        logSecurityEvent('SWARM EXCEPTION', `Core loop tracking failure: ${error?.message || error}`, '0.0.0.0', 'ERROR');
      }

      // 1. Scraping and Market Target Audits via Pinecone Vectoring
      await runScrapeAndEmbedMatrix();
      const rawScrapedData = await ScrapingEngine.harvest(); 
      
      // 2. Intelligence processing for high-leverage assets
      const highValueInsight = await analyzeMarketAsymmetry(rawScrapedData);   
      
      if (highValueInsight) {
          logSecurityEvent('ASYMMETRY DETECTED', `High leverage insight generated: ${highValueInsight.actionableBrief.substring(0, 50)}...`, '0.0.0.0', 'SECURE');
          const alertMessage = highValueInsight.actionableBrief;
          
          wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                 client.send(JSON.stringify({
                    type: 'PROACTIVE_ALERT',
                    panel: 'agentic_swarm',
                    message: alertMessage,
                    timestamp: new Date().toISOString()
                 }));
              }
          });
          
          await sendPushAlert(`🚨 <b>[AUTONOMOUS INITIATIVE]</b> 🚨\n\n${alertMessage}`);
      }
      
      // 3. Trigger predict mode to analyze new Pinecone vectors for async arbitrage
      await runPredictModeEngine();
      
      // 4. Trigger the self-evolution compilation task
      await processSystemSelfEvolution();

    } catch (error: any) {
      console.error('Error in autonomous cycle:', error);
      logSecurityEvent('CYCLE ERROR', `Autonomous sweep failed: ${error?.message || error}`, '0.0.0.0', 'CRITICAL');
    }
  };

  // Run immediately on boot
  runRapidMarketSweep();
  runSweep();

  // Run DFS / Arbitrage sweeps frequently (every 5 mins)
  cron.schedule('*/5 * * * *', () => {
    runRapidMarketSweep();
  });

  // Then schedule the primary intelligence and network sweep to run daily or hourly
  cron.schedule('0 2 * * *', () => { // Run at 2 AM
      console.log('[SYSTEM EVENT]: Initializing Global Deep Intelligence Scan Sequence...');
      runSweep();
  });
}
